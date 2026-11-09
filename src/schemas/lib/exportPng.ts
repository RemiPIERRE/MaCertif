import type { ReactFlowInstance } from "@xyflow/react";
import { toPng } from "html-to-image";

/** Fond de l'image exportée. « transparent » laisse le fond du PNG vide. */
export type FondExport = "blanc" | "sombre" | "transparent";

export interface OptionsExport {
  fond: FondExport;
  /** Facteur de résolution : 1 = taille écran, 2 = haute qualité, 3 = impression. */
  echelle: number;
}

export const OPTIONS_EXPORT_DEFAUT: OptionsExport = {
  fond: "blanc",
  echelle: 2,
};

export interface ImageExportee {
  dataUrl: string;
  /** Taille du schéma en pixels « écran » (avant facteur de résolution). */
  largeur: number;
  hauteur: number;
  /** Facteur réellement appliqué (plafonné pour les très grands schémas). */
  echelle: number;
}

/** Marge autour du contenu, en pixels écran. */
const MARGE = 12;

/** Un canvas dépasse rarement ~16 000 px de côté selon les navigateurs. */
const COTE_MAX = 16000;

const COULEURS_FOND: Record<FondExport, string> = {
  blanc: "#ffffff",
  sombre: "#14173a",
  transparent: "#ffffff", // sert seulement à masquer le trait derrière le « zéro » des pattes d'oie
};

/** Éléments d'édition qui n'ont rien à faire sur l'image : poignées, redimensionnement, barre « Dupliquer ». */
function aGarder(node: HTMLElement): boolean {
  const classes = node.classList;
  if (!classes) return true; // nœud texte
  return !(
    classes.contains("react-flow__handle") ||
    classes.contains("react-flow__resize-control") ||
    classes.contains("react-flow__viewport-portal") ||
    classes.contains("me-dupliquer")
  );
}

/**
 * Les exports sont destinés à un document (fond blanc) : le thème clair est forcé le temps de la
 * capture, sinon texte et traits clairs du thème sombre deviennent illisibles. Le bref retour
 * visuel au thème clair est accepté ici (DOM réel, pas un clone) — réservé aux exports explicites
 * (séquence) : l'aperçu des schémas, régénéré en continu, ne touche pas au thème de la page.
 */
function forcerThemeClairPendant<T>(action: () => Promise<T>): Promise<T> {
  const racine = document.documentElement;
  const themeOriginal = racine.getAttribute("data-theme");
  racine.setAttribute("data-theme", "light");
  return action().finally(() => {
    if (null === themeOriginal) racine.removeAttribute("data-theme");
    else racine.setAttribute("data-theme", themeOriginal);
  });
}

const PROPRIETES_SVG = [
  "stroke",
  "fill",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
] as const;

/**
 * html-to-image ne copie pas toujours fiablement les styles calculés dans les éléments SVG
 * (traits de liens invisibles, marqueurs noirs). Palliatif : figer ces styles en attributs `style`
 * avant la capture, puis les retirer. La fonction retournée restaure l'état d'origine.
 */
function figerStylesSvg(racine: ParentNode): () => void {
  const elements = racine.querySelectorAll(
    "line, path, circle, rect, ellipse, polygon, polyline",
  );
  const restaurations: Array<() => void> = [];

  elements.forEach((el) => {
    if (!(el instanceof SVGElement)) return;
    const calcule = getComputedStyle(el);
    const styleOriginal = el.getAttribute("style");
    for (const prop of PROPRIETES_SVG)
      el.style.setProperty(prop, calcule.getPropertyValue(prop));
    restaurations.push(() => {
      if (null === styleOriginal) el.removeAttribute("style");
      else el.setAttribute("style", styleOriginal);
    });
  });

  return () => restaurations.forEach((restaurer) => restaurer());
}

/**
 * Prépare le DOM pour la capture et renvoie la fonction qui le remet en état :
 *  - les marqueurs (pattes d'oie, flèches) sont définis dans un <svg> à part, hors de la zone
 *    capturée : on en place une copie dans la zone, sinon les extrémités des traits disparaissent ;
 *  - le fond du « zéro » des pattes d'oie suit le fond choisi ;
 *  - sur fond clair, les liens et leurs étiquettes passent en sombre (classe `schema-export-clair`) ;
 *  - l'aspect « sélectionné » (liens surlignés…) n'a pas sa place sur une image ;
 *  - les styles SVG sont figés en dernier, une fois le rendu final en place.
 */
function preparerCapture(viewport: HTMLElement, fond: FondExport): () => void {
  const annulations: Array<() => void> = [];

  const marqueurs = viewport.ownerDocument
    .getElementById("schema-marker-fleche")
    ?.closest("svg");
  if (marqueurs) {
    const copie = marqueurs.cloneNode(true) as SVGSVGElement;
    viewport.appendChild(copie);
    annulations.push(() => copie.remove());
  }

  const ancienFond = viewport.style.getPropertyValue("--schema-canvas-fond");
  viewport.style.setProperty("--schema-canvas-fond", COULEURS_FOND[fond]);
  annulations.push(() => {
    if (ancienFond)
      viewport.style.setProperty("--schema-canvas-fond", ancienFond);
    else viewport.style.removeProperty("--schema-canvas-fond");
  });

  // Sur fond clair, liens et étiquettes passent en sombre : ceux du canevas (thème sombre) y seraient invisibles.
  if (fond !== "sombre") {
    viewport.classList.add("schema-export-clair");
    annulations.push(() => viewport.classList.remove("schema-export-clair"));
  }

  viewport
    .querySelectorAll<HTMLElement | SVGElement>(".selected")
    .forEach((el) => {
      el.classList.remove("selected");
      annulations.push(() => el.classList.add("selected"));
    });

  // En dernier : les styles figés doivent être ceux du rendu final (classe claire appliquée).
  annulations.push(figerStylesSvg(viewport));

  return () => annulations.reverse().forEach((annuler) => annuler());
}

/**
 * Rectangle exact du contenu (coordonnées du schéma) : les éléments, plus ce qui peut dépasser
 * (tracé des liens, étiquettes de cardinalité). L'image est rognée dessus, avec une petite marge.
 */
function limitesDuContenu(instance: ReactFlowInstance, viewport: HTMLElement) {
  const base = instance.getNodesBounds(instance.getNodes());
  let x1 = base.x;
  let y1 = base.y;
  let x2 = base.x + base.width;
  let y2 = base.y + base.height;

  const zoom = instance.getViewport().zoom || 1;
  const origine = viewport.getBoundingClientRect();
  viewport
    .querySelectorAll(
      ".react-flow__edge-path, .schema-edge-cardinalite, .schema-edge-label",
    )
    .forEach((el) => {
      const r = el.getBoundingClientRect();
      if (0 === r.width && 0 === r.height) return;
      x1 = Math.min(x1, (r.left - origine.left) / zoom);
      y1 = Math.min(y1, (r.top - origine.top) / zoom);
      x2 = Math.max(x2, (r.right - origine.left) / zoom);
      y2 = Math.max(y2, (r.bottom - origine.top) / zoom);
    });

  return { x: x1, y: y1, largeur: x2 - x1, hauteur: y2 - y1 };
}

/**
 * Génère le PNG du schéma entier (et non de la partie visible) : cadrage sur l'ensemble du
 * contenu, quelle que soit la position ou le zoom du canevas. `racine` est le conteneur du canevas.
 */
export async function genererPng(
  instance: ReactFlowInstance,
  racine: HTMLElement,
  options: OptionsExport = OPTIONS_EXPORT_DEFAUT,
): Promise<ImageExportee> {
  const noeuds = instance.getNodes();
  if (noeuds.length === 0)
    throw new Error("Le schéma est vide : il n’y a rien à exporter.");

  const viewport = racine.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewport) throw new Error("Canevas introuvable.");

  const limites = limitesDuContenu(instance, viewport);
  const largeur = Math.ceil(limites.largeur + MARGE * 2);
  const hauteur = Math.ceil(limites.hauteur + MARGE * 2);
  const echelle = Math.max(
    0.1,
    Math.min(options.echelle, COTE_MAX / Math.max(largeur, hauteur)),
  );

  const restaurer = preparerCapture(viewport, options.fond);
  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor:
        options.fond === "transparent"
          ? undefined
          : COULEURS_FOND[options.fond],
      width: largeur,
      height: hauteur,
      pixelRatio: echelle,
      filter: aGarder,
      style: {
        width: `${largeur}px`,
        height: `${hauteur}px`,
        transform: `translate(${MARGE - limites.x}px, ${MARGE - limites.y}px) scale(1)`,
      },
    });
    return { dataUrl, largeur, hauteur, echelle };
  } finally {
    restaurer();
  }
}

/** Nom de fichier sûr : sans caractères interdits, avec l'extension .png. */
function nomDeFichier(nom: string): string {
  const propre = nom.replace(/[\\/:*?"<>|]+/g, "-").trim() || "schema";
  return propre.toLowerCase().endsWith(".png") ? propre : `${propre}.png`;
}

export function telechargerPng(dataUrl: string, nom: string): void {
  const lien = document.createElement("a");
  lien.download = nomDeFichier(nom);
  lien.href = dataUrl;
  lien.click();
}

/** Génère puis télécharge l'image. */
export async function exporterSchemaEnPng(
  instance: ReactFlowInstance,
  racine: HTMLElement,
  nom: string,
  options: OptionsExport = OPTIONS_EXPORT_DEFAUT,
): Promise<void> {
  const image = await genererPng(instance, racine, options);
  telechargerPng(image.dataUrl, nom);
}

/** Export générique d'un élément DOM en PNG — utilisé par le diagramme de séquence
 * (un simple conteneur de taille fixe, pas de viewport à recadrer comme pour le canevas React Flow). */
export async function exporterElementEnPng(
  el: HTMLElement,
  nomFichier: string,
): Promise<void> {
  await forcerThemeClairPendant(async () => {
    const restaurerStyles = figerStylesSvg(el);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: "#ffffff",
        // Les contrôles d'édition (ex. le « × » de suppression d'un participant) n'ont
        // rien à faire dans l'image exportée.
        filter: (node) =>
          !node.classList?.contains("sequence-participant-suppr"),
      });
      telechargerPng(dataUrl, nomFichier);
    } finally {
      restaurerStyles();
    }
  });
}

/** Variables de thème posées sur la coque de capture : l'image ne dépend pas du thème de la page. */
const VARIABLES_CAPTURE: Record<"clair" | "sombre", Record<string, string>> = {
  clair: {
    "--ink": "#1e293b",
    "--ink-soft": "#64748b",
    "--line": "#e2e8f0",
    "--line-strong": "#94a3b8",
    "--surface": "#ffffff",
  },
  sombre: {
    "--ink": "#e2e8f0",
    "--ink-soft": "#94a3b8",
    "--line": "#2d3368",
    "--line-strong": "#475569",
    "--surface": "#14173a",
  },
};

/**
 * PNG du diagramme de séquence. On capture une COPIE de l'élément posée dans une coque hors
 * écran : la copie est à sa taille réelle (indépendante du zoom / du panoramique du canevas),
 * débarrassée de l'aspect « sélectionné », et rendue avec les variables du thème choisi — sans
 * toucher au DOM visible ni au thème de la page (l'aperçu peut donc être régénéré à volonté).
 */
export async function genererPngSequence(
  element: HTMLElement,
  options: OptionsExport = OPTIONS_EXPORT_DEFAUT,
): Promise<ImageExportee> {
  const largeur = Math.ceil(element.offsetWidth);
  const hauteur = Math.ceil(element.offsetHeight);
  if (0 === largeur || 0 === hauteur)
    throw new Error("Le diagramme est vide : il n’y a rien à exporter.");
  const echelle = Math.max(
    0.1,
    Math.min(options.echelle, COTE_MAX / Math.max(largeur, hauteur)),
  );

  const coque = document.createElement("div");
  coque.style.cssText =
    "position:fixed;left:-100000px;top:0;pointer-events:none;";
  const theme =
    VARIABLES_CAPTURE["sombre" === options.fond ? "sombre" : "clair"];
  Object.entries(theme).forEach(([cle, valeur]) =>
    coque.style.setProperty(cle, valeur),
  );
  coque.style.color = theme["--ink"];

  const copie = element.cloneNode(true) as HTMLElement;
  copie
    .querySelectorAll(".is-selected")
    .forEach((el) => el.classList.remove("is-selected"));
  copie
    .querySelectorAll(".sequence-selection-halo")
    .forEach((el) => el.remove());
  copie.style.background = "transparent";
  coque.appendChild(copie);
  document.body.appendChild(coque);

  try {
    figerStylesSvg(copie);
    const dataUrl = await toPng(copie, {
      backgroundColor:
        options.fond === "transparent"
          ? undefined
          : COULEURS_FOND[options.fond],
      width: largeur,
      height: hauteur,
      pixelRatio: echelle,
    });
    return { dataUrl, largeur, hauteur, echelle };
  } finally {
    coque.remove();
  }
}
