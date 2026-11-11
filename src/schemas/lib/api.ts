import { generateId } from "../../lib/id";
import { STORAGE_KEYS } from "../../types/storage";
import type {
  Diagramme,
  DiagrammeContenu,
  FlowContenu,
  FlowKind,
  SequenceContenu,
} from "../types";
import { contenuVide } from "../types";
import { migrerAretes, migrerNoeuds } from "./migration";

const FLOW_KINDS_CONNUS = new Set<string>([
  "mcd",
  "mld",
  "mpd",
  "classe",
  "casUtilisation",
  "activite",
]);

/** Les diagrammes enregistrés avant la séparation MCD / MLD / MPD ('umlMerise', 'flow', ou
 * sans `kind`) deviennent des MPD ; leur contenu est converti par lib/migration.ts. */
function normaliserContenu(contenu: unknown): DiagrammeContenu {
  if (!contenu || "object" !== typeof contenu) return contenuVide();

  if ("sequence" === (contenu as { kind?: unknown }).kind) {
    const c = contenu as Partial<SequenceContenu>;
    return {
      kind: "sequence",
      participants: Array.isArray(c.participants) ? c.participants : [],
      messages: Array.isArray(c.messages) ? c.messages : [],
      fragments: Array.isArray(c.fragments) ? c.fragments : [],
      notes: Array.isArray(c.notes) ? c.notes : [],
      activationsAuto: false === c.activationsAuto ? false : undefined,
      cadre:
        c.cadre && "object" === typeof c.cadre
          ? { nom: String(c.cadre.nom ?? "") }
          : undefined,
      numerotation:
        "simple" === c.numerotation || "hierarchique" === c.numerotation
          ? c.numerotation
          : undefined,
    };
  }

  const c = contenu as Partial<FlowContenu>;
  const kind: FlowKind = FLOW_KINDS_CONNUS.has(String(c.kind))
    ? (c.kind as FlowKind)
    : "mpd";
  const nodes = migrerNoeuds(c.nodes, kind);
  return {
    kind,
    nodes,
    edges: migrerAretes(c.edges, nodes, kind),
    viewport: c.viewport,
  };
}

/** Forme stockée en localStorage (voir STORAGE_KEYS.diagrammes) : un tableau de ces entrées. */
interface DiagrammeStocke {
  id: string;
  nom: string;
  contenu: unknown;
  creeLe: string;
  modifieLe: string;
}

function lireTous(): DiagrammeStocke[] {
  try {
    const brut = window.localStorage.getItem(STORAGE_KEYS.diagrammes);
    if (!brut) return [];
    const parsed = JSON.parse(brut);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ecrireTous(diagrammes: DiagrammeStocke[]): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.diagrammes,
      JSON.stringify(diagrammes),
    );
    window.dispatchEvent(
      new CustomEvent("macertif:storage", {
        detail: { key: STORAGE_KEYS.diagrammes },
      }),
    );
  } catch {
    // stockage indisponible (navigation privée, quota) : rien de plus à faire ici
  }
}

function depuisStocke(d: DiagrammeStocke): Diagramme {
  return {
    id: d.id,
    nom: d.nom,
    contenu: normaliserContenu(d.contenu),
    creeLe: d.creeLe,
    modifieLe: d.modifieLe,
  };
}

export async function listerDiagrammes(): Promise<Diagramme[]> {
  return lireTous().map(depuisStocke);
}

export async function creerDiagramme(
  nom: string,
  contenu: DiagrammeContenu,
): Promise<Diagramme> {
  const maintenant = new Date().toISOString();
  const nouveau: DiagrammeStocke = {
    id: generateId(),
    nom,
    contenu,
    creeLe: maintenant,
    modifieLe: maintenant,
  };
  ecrireTous([...lireTous(), nouveau]);
  return depuisStocke(nouveau);
}

export async function majDiagramme(
  id: string,
  nom: string,
  contenu: DiagrammeContenu,
): Promise<Diagramme> {
  const maintenant = new Date().toISOString();
  let maj: DiagrammeStocke | undefined;
  ecrireTous(
    lireTous().map((d) => {
      if (d.id !== id) return d;
      maj = { ...d, nom, contenu, modifieLe: maintenant };
      return maj;
    }),
  );
  if (!maj) throw new Error(`Schéma ${id} introuvable`);
  return depuisStocke(maj);
}

export async function supprimerDiagramme(id: string): Promise<void> {
  ecrireTous(lireTous().filter((d) => d.id !== id));
}
