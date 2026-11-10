import {
  SEQUENCE_PERDU,
  SEQUENCE_TROUVE,
  type SequenceFragment,
  type SequenceMessage,
  type SequenceNote,
  type SequenceParticipant,
} from "../types";

/* ═════════ Géométrie du diagramme de séquence (un seul endroit à modifier) ═════════ */

export const COLONNE_LARGEUR = 160;
/** Hauteur minimale d'une ligne de message. */
export const LIGNE_BASE = 56;
export const HAUTEUR_ENTETE = 70;
/** Marge blanche autour du diagramme (incluse dans l'image exportée). */
export const MARGE_CONTENU = 16;
export const BOUCLE_LARGEUR = 46;
/** Interligne d'un libellé sur plusieurs lignes. */
export const INTERLIGNE = 14;
/** Participant créé en cours de route : boîte dessinée au niveau du message de création. */
export const BOITE_CREE_LARGEUR = 120;
const BOITE_CREE_HAUTEUR_OBJET = 34;
const BOITE_CREE_HAUTEUR_ACTEUR = 56;
/** Distance entre la ligne de vie et le point plein d'un message trouvé / perdu. */
export const DISTANCE_POINT = 56;
/** Place prise par le cadre englobant `sd` autour du diagramme (étiquette en haut). */
export const SD_PAD_X = 14;
export const SD_HAUT = 32;
export const SD_PAD_BAS = 12;
export const SD_ETIQUETTE_HAUTEUR = 20;
/** Croix de destruction : demi-côté. */
export const CROIX_DEMI = 9;

const HAUT_CORPS = 10;
const BAS_CORPS = 10;
/** Place réservée au-dessus des messages pour l'étiquette d'un fragment. */
const BANDEAU_FRAGMENT = 24;
/** Place réservée pour la garde d'un opérande (« else ») sous sa ligne de séparation. */
const BANDEAU_OPERANDE = 20;
const BAS_FRAGMENT = 10;
const MARGE_X_FRAGMENT = 40;
const NOTE_MARGE = 8;
const NOTE_ECART = 12;
const LARGEUR_CARACTERE = 6.6;
const HAUTEUR_ETIQUETTE = 18;

/* ═════════ Résultat ═════════ */

/** Barre d'activation (fine barre verticale sur la ligne de vie, pendant qu'un participant traite un appel). */
export interface BarreActivation {
  participantId: string;
  /** Abscisse du centre : la ligne de vie, décalée vers la droite pour les barres imbriquées. */
  x: number;
  top: number;
  bottom: number;
  depth: number;
}

export const BARRE_LARGEUR = 10;
const BARRE_DECALAGE = 5;

export interface LigneMessage {
  message: SequenceMessage;
  /** Abscisses de départ / d'arrivée de la flèche, ramenées au bord des barres d'activation. */
  xDepart: number;
  xArrivee: number;
  /** Lignes du libellé (numéro et stéréotype inclus ; coupé aux retours à la ligne). */
  lignes: string[];
  /** Abscisses des lignes de vie ; pour un message trouvé / perdu, celle du point plein. */
  xDe: number | null;
  xVers: number | null;
  /** Ordonnée de la flèche (repère du corps du diagramme). */
  y: number;
  auto: boolean;
  /** Émetteur ET destinataire choisis : la flèche peut être tracée. */
  complet: boolean;
  /** Message trouvé (point plein au départ) / perdu (point plein à l'arrivée). */
  trouve: boolean;
  perdu: boolean;
  /** Ce message crée son destinataire (la flèche aboutit à la boîte du participant). */
  creation: boolean;
  /** Position de la croix quand ce message détruit son destinataire. */
  destruction: { x: number; y: number } | null;
}

export interface SeparateurCadre {
  operandeId: string;
  y: number;
  /** Garde affichée (avec crochets), vide si aucune. */
  garde: string;
}

export interface CadreFragment {
  fragment: SequenceFragment;
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  /** Profondeur d'imbrication : 0 = cadre le plus extérieur. */
  profondeur: number;
  /** Texte de l'étiquette : `alt`, `loop(1,5)`, `ignore {a, b}`… */
  etiquette: string;
  etiquetteLargeur: number;
  etiquetteHauteur: number;
  /** Garde du premier opérande, avec crochets, vide si aucune. */
  garde: string;
  separateurs: SeparateurCadre[];
}

export interface NoteMiseEnPage {
  note: SequenceNote;
  lignes: string[];
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  /** Index du message après lequel elle est posée (-1 = tout en haut). */
  apresIndex: number;
  /** Pointillé vers la ligne de vie (notes « à gauche / à droite »). */
  lien: { x1: number; x2: number; y: number } | null;
}

/** Contrainte de durée : double flèche verticale le long d'une ligne de vie, libellé à droite. */
export interface DureeMiseEnPage {
  note: SequenceNote;
  lignes: string[];
  x: number;
  y1: number;
  y2: number;
}

/** Boîte d'un participant créé en cours de route. */
export interface CreationParticipant {
  participantId: string;
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Étendue verticale d'une ligne de vie (créée plus bas ? détruite avant la fin ?). */
export interface VieLigne {
  participantId: string;
  haut: number;
  bas: number;
}

export interface Disposition {
  /** Largeur / hauteur du diagramme SANS la marge ni le cadre `sd`. */
  largeur: number;
  hauteur: number;
  /** Hauteur du corps (sous les en-têtes de participants). */
  hauteurCorps: number;
  /** Taille extérieure complète : diagramme + marge + cadre `sd` éventuel. */
  largeurTotale: number;
  hauteurTotale: number;
  /** Espace ajouté par le cadre `sd` de chaque côté (0 sans cadre). */
  extra: { gauche: number; haut: number; droite: number; bas: number };
  sd: { nom: string; etiquetteLargeur: number } | null;
  lignes: LigneMessage[];
  cadres: CadreFragment[];
  notes: NoteMiseEnPage[];
  durees: DureeMiseEnPage[];
  creations: CreationParticipant[];
  vies: VieLigne[];
  barres: BarreActivation[];
  xLigneDeVie: (participantId: string) => number | null;
  /** Largeur réelle de la colonne d'un participant (voir largeurColonneParticipant) — toujours >= COLONNE_LARGEUR. */
  largeurColonne: (participantId: string) => number;
  /** Abscisse de départ (bord gauche) de chaque colonne, dans l'ordre des participants — pour le glisser-déposer des en-têtes. */
  offsetsColonnes: number[];
}

export interface OptionsDisposition {
  numerotation?: "simple" | "hierarchique";
  /** Présent = cadre englobant `sd nom`. */
  cadre?: { nom: string };
}

/** Libellé d'un participant : « nom : Classe » (notation UML) quand une classe est renseignée. */
export function etiquetteParticipant(
  p: Pick<SequenceParticipant, "nom" | "classe">,
): string {
  const classe = (p.classe ?? "").trim();
  if ("" === classe) return p.nom;
  return `${p.nom} : ${classe}`;
}

/** Garde avec crochets ; les crochets saisis par l'utilisateur ne sont pas doublés. */
export function formaterGarde(garde: string): string {
  const g = garde.trim();
  if ("" === g) return "";
  return g.startsWith("[") ? g : `[${g}]`;
}

/** Texte de l'étiquette d'un fragment : `loop(1,5)`, `ignore {a, b}`, sinon l'opérateur seul. */
export function etiquetteFragment(
  f: Pick<SequenceFragment, "operateur" | "min" | "max" | "liste">,
): string {
  if ("loop" === f.operateur) {
    const mini = (f.min ?? "").trim();
    const maxi = (f.max ?? "").trim();
    if ("" === mini && "" === maxi) return "loop";
    return `loop(${"" === mini ? "0" : mini},${"" === maxi ? "*" : maxi})`;
  }
  if ("ignore" === f.operateur || "consider" === f.operateur) {
    const liste = (f.liste ?? "").trim();
    return "" === liste ? f.operateur : `${f.operateur} {${liste}}`;
  }
  return f.operateur;
}

function largeurTexte(lignes: string[]): number {
  return Math.max(0, ...lignes.map((l) => l.length)) * LARGEUR_CARACTERE;
}

/** Police effective de .sequence-participant-boite (sequence.css) : même famille que le reste
 * de l'appli (voir --font-sans dans index.css), même taille/graisse que la règle CSS. */
const POLICE_PARTICIPANT = "600 13.12px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
let canvasMesure: HTMLCanvasElement | null = null;

/**
 * Largeur réelle du texte le plus long (Canvas 2D, police ci-dessus) — plus fiable qu'une
 * estimation au nombre de caractères pour un texte en casse mixte (une majuscule n'a pas la
 * même largeur qu'un « i »). Dégrade sur `largeurTexte` si Canvas est indisponible (tests).
 */
function mesurerLargeurMax(lignes: string[]): number {
  try {
    canvasMesure ??= document.createElement("canvas");
    const ctx = canvasMesure.getContext("2d");
    if (!ctx) return largeurTexte(lignes);
    ctx.font = POLICE_PARTICIPANT;
    const largeur = Math.max(0, ...lignes.map((l) => ctx.measureText(l).width));
    return largeur > 0 ? largeur : largeurTexte(lignes);
  } catch {
    return largeurTexte(lignes);
  }
}

/**
 * Marge ajoutée à la largeur de texte mesurée pour obtenir la largeur de colonne : le padding
 * horizontal de .sequence-participant (0.6rem × 2 = 19.2px, schemas.css) + celui de
 * .sequence-participant-boite (0.5rem × 2 = 16px) + sa bordure (1.5px × 2 = 3px, sequence.css),
 * plus une petite marge de sécurité. Un seul endroit à ajuster si ce CSS change.
 */
const MARGE_COLONNE_PARTICIPANT = 19.2 + 16 + 3 + 4;

/**
 * Largeur de la colonne d'un participant : assez large pour que son étiquette tienne sur une
 * seule ligne par retour-à-la-ligne manuel (Entrée), sans jamais couper un mot au milieu. Ne
 * descend jamais sous COLONNE_LARGEUR (étiquettes courtes : comportement inchangé).
 */
function largeurColonneParticipant(p: SequenceParticipant): number {
  const lignes = etiquetteParticipant(p).split("\n");
  return Math.max(COLONNE_LARGEUR, mesurerLargeurMax(lignes) + MARGE_COLONNE_PARTICIPANT);
}

function hauteurBoiteCreee(p: SequenceParticipant | undefined): number {
  return "acteur" === p?.forme
    ? BOITE_CREE_HAUTEUR_ACTEUR
    : BOITE_CREE_HAUTEUR_OBJET;
}

/**
 * Numéro de chaque message. « simple » : 1, 2, 3… (les retours ne sont pas numérotés).
 * « hierarchique » : un appel synchrone ouvre un niveau jusqu'à sa réponse, les messages émis
 * par son destinataire entre-temps en deviennent les sous-numéros (1, 1.1, 1.2, 2…).
 */
export function numeroterMessages(
  messages: SequenceMessage[],
  mode: OptionsDisposition["numerotation"],
): string[] {
  const resultat = messages.map(() => "");
  if (!mode) return resultat;
  if ("simple" === mode) {
    let n = 0;
    messages.forEach((m, i) => {
      if ("retour" !== m.type) resultat[i] = String(++n);
    });
    return resultat;
  }
  interface Niveau {
    porteur: string;
    appelant: string;
    numero: string;
    compteur: number;
  }
  const racine: Niveau = { porteur: "", appelant: "", numero: "", compteur: 0 };
  const pile: Niveau[] = [];
  messages.forEach((m, i) => {
    if ("retour" === m.type) {
      for (let k = pile.length - 1; k >= 0; k--) {
        if (pile[k].porteur === m.deId && pile[k].appelant === m.versId) {
          pile.splice(k);
          break;
        }
      }
      return;
    }
    let parent = racine;
    for (let k = pile.length - 1; k >= 0; k--) {
      if (pile[k].porteur === m.deId) {
        parent = pile[k];
        break;
      }
    }
    const n = ++parent.compteur;
    const numero = "" === parent.numero ? String(n) : `${parent.numero}.${n}`;
    resultat[i] = numero;
    if (
      "synchrone" === m.type &&
      "" !== m.versId &&
      m.versId !== m.deId &&
      SEQUENCE_PERDU !== m.versId
    ) {
      pile.push({ porteur: m.versId, appelant: m.deId, numero, compteur: 0 });
    }
  });
  return resultat;
}

interface FragmentResolu {
  fragment: SequenceFragment;
  ordre: number;
  debut: number;
  fin: number;
  /** Opérandes valides (strictement après le début, dans le fragment), triés. */
  operandes: Array<{ id: string; index: number; garde: string }>;
  profondeur: number;
  niveauInterne: number;
}

function resoudreFragments(
  fragments: SequenceFragment[],
  idVersIndex: Map<string, number>,
): FragmentResolu[] {
  const resolus: FragmentResolu[] = [];
  fragments.forEach((fragment, ordre) => {
    const a = idVersIndex.get(fragment.debutId);
    const b = idVersIndex.get(fragment.finId);
    if (undefined === a || undefined === b) return;
    const debut = Math.min(a, b);
    const fin = Math.max(a, b);
    const vus = new Set<number>();
    const operandes = (fragment.operandes ?? [])
      .map((o) => ({
        id: o.id,
        index: idVersIndex.get(o.messageId) ?? -1,
        garde: o.garde,
      }))
      .filter(
        (o) =>
          o.index > debut &&
          o.index <= fin &&
          !vus.has(o.index) &&
          vus.add(o.index),
      )
      .sort((x, y) => x.index - y.index);
    resolus.push({
      fragment,
      ordre,
      debut,
      fin,
      operandes,
      profondeur: 0,
      niveauInterne: 0,
    });
  });

  const contient = (b: FragmentResolu, a: FragmentResolu) =>
    b !== a &&
    b.debut <= a.debut &&
    b.fin >= a.fin &&
    (b.debut < a.debut || b.fin > a.fin || b.ordre < a.ordre);

  resolus.forEach((a) => {
    a.profondeur = resolus.filter((b) => contient(b, a)).length;
  });
  resolus.forEach((a) => {
    a.niveauInterne = Math.max(
      0,
      ...resolus
        .filter((d) => contient(a, d))
        .map((d) => d.profondeur - a.profondeur),
    );
  });
  return resolus;
}

/**
 * Calcule toute la mise en page : colonnes, hauteur de chaque ligne (selon le nombre de lignes
 * du libellé et les cadres qui commencent / finissent là), positions des cadres de fragments.
 */
export function calculerDisposition(
  participants: SequenceParticipant[],
  messages: SequenceMessage[],
  fragments: SequenceFragment[] = [],
  notes: SequenceNote[] = [],
  activationsAuto = true,
  options: OptionsDisposition = {},
): Disposition {
  const colonne = new Map(participants.map((p, i) => [p.id, i]));
  /* Largeur de chaque colonne : au moins COLONNE_LARGEUR, plus si l'étiquette du participant
   * (retours à la ligne manuels compris) ne tiendrait pas sinon — voir largeurColonneParticipant.
   * Colonnes posées bord à bord (offsets cumulés) : xLigneDeVie en est le centre. */
  const largeursColonnes = participants.map(largeurColonneParticipant);
  const offsetsColonnes: number[] = [];
  {
    let cumul = 0;
    for (const l of largeursColonnes) {
      offsetsColonnes.push(cumul);
      cumul += l;
    }
  }
  const largeurColonnesTotale =
    0 === largeursColonnes.length
      ? 0
      : offsetsColonnes[offsetsColonnes.length - 1] +
        largeursColonnes[largeursColonnes.length - 1];
  const xLigneDeVie = (id: string) => {
    const i = colonne.get(id);
    return undefined === i
      ? null
      : offsetsColonnes[i] + largeursColonnes[i] / 2;
  };
  const largeurColonne = (id: string): number => {
    const i = colonne.get(id);
    return undefined === i ? COLONNE_LARGEUR : largeursColonnes[i];
  };

  const idVersIndex = new Map(messages.map((m, i) => [m.id, i]));
  const resolus = resoudreFragments(fragments, idVersIndex);
  const numeros = numeroterMessages(messages, options.numerotation);

  /* ───── Effets : quel message crée / détruit réellement son destinataire ───── */
  const creationDe = new Map<string, number>(); // participant → index du message qui le crée
  const effetCreation = messages.map((m, i) => {
    if (
      "creation" !== m.effet ||
      m.deId === m.versId ||
      !colonne.has(m.versId) ||
      !colonne.has(m.deId) ||
      creationDe.has(m.versId)
    )
      return false;
    creationDe.set(m.versId, i);
    return true;
  });
  const effetDestruction = messages.map(
    (m) => "destruction" === m.effet && colonne.has(m.versId),
  );

  /* ───── Lignes ───── */
  interface Brut {
    lignes: string[];
    auto: boolean;
    decalageArrow: number;
    contenu: number;
    separateurs: Array<{
      f: FragmentResolu;
      op: { id: string; garde: string };
    }>;
    debuts: FragmentResolu[];
    fins: FragmentResolu[];
  }

  const brut: Brut[] = messages.map((m, i) => {
    const corps = "" === m.texte ? [] : m.texte.split("\n");
    const lignes = [
      ...(effetCreation[i]
        ? ["«create»"]
        : effetDestruction[i]
          ? ["«destroy»"]
          : []),
      ...corps,
    ];
    if ("" !== numeros[i]) {
      if (0 === lignes.length) lignes.push(numeros[i]);
      else lignes[0] = `${numeros[i]}: ${lignes[0]}`;
    }
    const n = lignes.length;
    const auto = "" !== m.versId && m.deId === m.versId;
    let decalageArrow: number;
    let contenu: number;
    if (auto) {
      decalageArrow = 28;
      const bas = 18 + 9 + Math.max(0, n - 1) * INTERLIGNE + 4;
      contenu = Math.max(LIGNE_BASE, bas + 14);
    } else {
      decalageArrow = Math.max(28, n * INTERLIGNE + 14);
      contenu = decalageArrow + 28;
      if (effetCreation[i]) {
        const demi =
          hauteurBoiteCreee(participants[colonne.get(m.versId) as number]) / 2;
        decalageArrow = Math.max(decalageArrow, demi + 6);
        contenu = Math.max(contenu, decalageArrow + demi + 6);
      }
    }
    const debuts = resolus
      .filter((f) => f.debut === i)
      .sort((a, b) => a.profondeur - b.profondeur);
    const fins = resolus
      .filter((f) => f.fin === i)
      .sort((a, b) => b.profondeur - a.profondeur);
    const separateurs = resolus
      .flatMap((f) =>
        f.operandes.filter((o) => o.index === i).map((op) => ({ f, op })),
      )
      .sort((a, b) => a.f.profondeur - b.f.profondeur);
    return { lignes, auto, decalageArrow, contenu, separateurs, debuts, fins };
  });

  /* ───── Ordonnées (messages et notes, dans l'ordre de la chronologie) ───── */
  const tops: number[] = [];
  const contenuDebut: number[] = []; // début du contenu (après les bandeaux)
  const contenuFin: number[] = [];
  const notesPosees: NoteMiseEnPage[] = [];
  const notesParApres = new Map<string | null, SequenceNote[]>();
  notes.forEach((n) => {
    if ("duree" === n.genre || !colonne.has(n.participantId)) return;
    // Note rattachée à un message disparu : elle retombe à la fin plutôt que de se perdre.
    const cle =
      null === n.apresId || idVersIndex.has(n.apresId)
        ? n.apresId
        : (messages[messages.length - 1]?.id ?? null);
    notesParApres.set(cle, [...(notesParApres.get(cle) ?? []), n]);
  });
  let droiteMax = largeurColonnesTotale;

  let courant = HAUT_CORPS;
  const poserNotes = (cle: string | null, apresIndex: number) => {
    (notesParApres.get(cle) ?? []).forEach((note) => {
      const genre = note.genre ?? "note";
      const lignes = "" === note.texte ? [""] : note.texte.split("\n");
      const texteL = largeurTexte(lignes) + 20;
      const a = xLigneDeVie(note.participantId) ?? 0;
      const b = note.participantFinId
        ? (xLigneDeVie(note.participantFinId) ?? a)
        : a;
      const y = courant + NOTE_MARGE;
      let hauteur = lignes.length * INTERLIGNE + 14;
      let x: number;
      let largeur: number;
      let lien: NoteMiseEnPage["lien"] = null;
      if ("etat" === genre) {
        // Invariant d'état : rectangle arrondi centré sur la ligne de vie.
        hauteur = lignes.length * INTERLIGNE + 10;
        largeur = Math.max(texteL + 8, 54);
        x = Math.max(4, a - largeur / 2);
      } else if ("ref" === genre || "sur" === note.position) {
        const gauche = Math.min(a, b);
        const droite = Math.max(a, b);
        if ("ref" === genre)
          hauteur = HAUTEUR_ETIQUETTE + lignes.length * INTERLIGNE + 12;
        largeur = Math.max(
          texteL,
          droite - gauche + 40,
          "ref" === genre ? 120 : 90,
        );
        x = Math.max(4, (gauche + droite) / 2 - largeur / 2);
      } else if ("gauche" === note.position) {
        largeur = Math.max(texteL, 60);
        x = Math.max(4, a - NOTE_ECART - largeur);
        lien = { x1: a, x2: x + largeur, y: y + hauteur / 2 };
      } else {
        largeur = Math.max(texteL, 60);
        x = a + NOTE_ECART;
        lien = { x1: a, x2: x, y: y + hauteur / 2 };
      }
      droiteMax = Math.max(droiteMax, x + largeur + 8);
      notesPosees.push({
        note,
        lignes,
        x,
        y,
        largeur,
        hauteur,
        apresIndex,
        lien,
      });
      courant = y + hauteur + NOTE_MARGE;
    });
  };

  poserNotes(null, -1);
  brut.forEach((b, i) => {
    const extraHaut =
      b.separateurs.length * BANDEAU_OPERANDE +
      b.debuts.length * BANDEAU_FRAGMENT;
    const extraBas = b.fins.length * BAS_FRAGMENT;
    tops[i] = courant;
    contenuDebut[i] = courant + extraHaut;
    contenuFin[i] = courant + extraHaut + b.contenu;
    courant = contenuFin[i] + extraBas;
    poserNotes(messages[i].id, i);
  });
  const hauteurCorps = Math.max(courant, HAUT_CORPS + LIGNE_BASE) + BAS_CORPS;

  /* ───── Messages ───── */
  const lignesMessages: LigneMessage[] = messages.map((message, i) => {
    const trouve = SEQUENCE_TROUVE === message.deId;
    const perdu = SEQUENCE_PERDU === message.versId;
    let xDe = trouve ? null : xLigneDeVie(message.deId);
    let xVers =
      "" === message.versId || perdu ? null : xLigneDeVie(message.versId);
    // Point plein d'un message trouvé / perdu : à côté de la ligne de vie concernée.
    if (trouve && null !== xVers) xDe = xVers - DISTANCE_POINT;
    if (perdu && null !== xDe) xVers = xDe + DISTANCE_POINT;
    return {
      message,
      lignes: brut[i].lignes,
      xDe,
      xVers,
      xDepart: xDe ?? 0,
      xArrivee: xVers ?? 0,
      y: contenuDebut[i] + brut[i].decalageArrow,
      auto: brut[i].auto,
      complet: null !== xDe && null !== xVers,
      trouve,
      perdu,
      creation: effetCreation[i],
      destruction: null,
    };
  });

  /* ───── Participants créés : boîte au niveau de la flèche de création ───── */
  const creations: CreationParticipant[] = [];
  const creationBas = new Map<number, number>(); // index du message → bas de la boîte
  creationDe.forEach((index, participantId) => {
    const p = participants[colonne.get(participantId) as number];
    const hauteur = hauteurBoiteCreee(p);
    const x = (xLigneDeVie(participantId) as number) - BOITE_CREE_LARGEUR / 2;
    const y = lignesMessages[index].y - hauteur / 2;
    creations.push({
      participantId,
      x,
      y,
      largeur: BOITE_CREE_LARGEUR,
      hauteur,
    });
    creationBas.set(index, y + hauteur);
  });

  /* ───── Barres d'activation, puis flèches ramenées à leur bord ───── */
  const barres = calculerBarres(
    messages,
    lignesMessages,
    activationsAuto,
    xLigneDeVie,
    resolus.map((r) => ({ debut: r.debut, fin: r.fin })),
    creationBas,
  );
  const couvrant = (id: string, y: number) =>
    barres.filter(
      (b) => b.participantId === id && y >= b.top - 0.5 && y <= b.bottom + 0.5,
    );
  const bordDroit = (id: string, x: number, y: number) => {
    const bs = couvrant(id, y);
    return 0 === bs.length
      ? x
      : x +
          BARRE_LARGEUR / 2 +
          Math.max(...bs.map((b) => b.depth)) * BARRE_DECALAGE;
  };
  const bordGauche = (id: string, x: number, y: number) => {
    const bs = couvrant(id, y);
    return 0 === bs.length
      ? x
      : x -
          BARRE_LARGEUR / 2 +
          Math.min(...bs.map((b) => b.depth)) * BARRE_DECALAGE;
  };
  lignesMessages.forEach((l) => {
    if (!l.complet || null === l.xDe || null === l.xVers) return;
    const m = l.message;
    if (l.auto) {
      l.xDepart = bordDroit(m.deId, l.xDe, l.y - 10);
      l.xArrivee = bordDroit(m.deId, l.xDe, l.y + 10);
      if (effetDestruction[messages.indexOf(m)])
        l.destruction = { x: l.xDe, y: l.y + 10 };
      return;
    }
    const versLaDroite = l.xVers >= l.xDe;
    // Départ : point plein (trouvé) ou bord de la barre de l'émetteur.
    l.xDepart = l.trouve
      ? l.xDe
      : versLaDroite
        ? bordDroit(m.deId, l.xDe, l.y)
        : bordGauche(m.deId, l.xDe, l.y);
    if (l.perdu) {
      l.xArrivee = l.xVers;
    } else if (l.creation) {
      l.xArrivee = versLaDroite
        ? l.xVers - BOITE_CREE_LARGEUR / 2
        : l.xVers + BOITE_CREE_LARGEUR / 2;
    } else if (effetDestruction[messages.indexOf(m)]) {
      l.xArrivee = l.xVers + (versLaDroite ? -3 : 3);
      l.destruction = { x: l.xVers, y: l.y };
    } else {
      l.xArrivee = versLaDroite
        ? bordGauche(m.versId, l.xVers, l.y)
        : bordDroit(m.versId, l.xVers, l.y);
    }
  });

  /* ───── Étendue verticale des lignes de vie ───── */
  const vies: VieLigne[] = participants.map((p) => {
    const iCreation = creationDe.get(p.id);
    const haut =
      undefined === iCreation ? 0 : (creationBas.get(iCreation) as number);
    let bas = hauteurCorps;
    lignesMessages.forEach((l) => {
      if (l.destruction && l.message.versId === p.id)
        bas = Math.min(bas, l.destruction.y);
    });
    return { participantId: p.id, haut, bas: Math.max(bas, haut) };
  });

  /* ───── Contraintes de durée : double flèche le long d'une ligne de vie ───── */
  const durees: DureeMiseEnPage[] = [];
  notes.forEach((note) => {
    if (
      "duree" !== note.genre ||
      !colonne.has(note.participantId) ||
      null === note.apresId
    )
      return;
    const a = idVersIndex.get(note.apresId);
    if (undefined === a) return;
    const b =
      null !== (note.finId ?? null) && idVersIndex.has(note.finId as string)
        ? (idVersIndex.get(note.finId as string) as number)
        : a;
    let y1 = lignesMessages[Math.min(a, b)].y;
    let y2 = lignesMessages[Math.max(a, b)].y;
    if (y2 - y1 < 20) {
      y1 -= 10;
      y2 += 10;
    }
    const lignes = "" === note.texte ? [""] : note.texte.split("\n");
    const x =
      (xLigneDeVie(note.participantId) as number) + BARRE_LARGEUR / 2 + 16;
    droiteMax = Math.max(droiteMax, x + 10 + largeurTexte(lignes) + 8);
    durees.push({ note, lignes, x, y1, y2 });
  });

  /* ───── Cadres de fragments ───── */
  lignesMessages.forEach((l) => {
    if (l.auto && null !== l.xDe)
      droiteMax = Math.max(
        droiteMax,
        l.xDe + BOUCLE_LARGEUR + 8 + largeurTexte(l.lignes) + 8,
      );
    if (l.perdu && null !== l.xVers)
      droiteMax = Math.max(droiteMax, l.xVers + 12);
  });

  const cadres: CadreFragment[] = resolus
    .slice()
    .sort((a, b) => a.profondeur - b.profondeur)
    .map((r) => {
      const concernes = lignesMessages.slice(r.debut, r.fin + 1);
      const marge = MARGE_X_FRAGMENT + 12 * r.niveauInterne;
      let gauche = Infinity;
      let droite = -Infinity;
      concernes.forEach((l) => {
        const xs = [l.xDe, l.xVers].filter((x): x is number => null !== x);
        if (0 === xs.length) return;
        gauche = Math.min(gauche, Math.min(...xs) - marge);
        droite = Math.max(droite, Math.max(...xs) + marge);
        if (l.auto && null !== l.xDe)
          droite = Math.max(
            droite,
            l.xDe + BOUCLE_LARGEUR + 8 + largeurTexte(l.lignes) + 12,
          );
      });
      notesPosees.forEach((np) => {
        if (np.apresIndex >= r.debut && np.apresIndex < r.fin) {
          gauche = Math.min(gauche, np.x - 12);
          droite = Math.max(droite, np.x + np.largeur + 12);
        }
      });
      if (!Number.isFinite(gauche)) {
        const centre = largeursColonnes.length > 0 ? largeursColonnes[0] / 2 : COLONNE_LARGEUR / 2;
        gauche = centre - marge;
        droite = centre + marge;
      }
      gauche = Math.max(4, gauche);

      const etiquette = etiquetteFragment(r.fragment);
      const etiquetteLargeur = 22 + etiquette.length * 7;
      const garde = formaterGarde(r.fragment.garde);
      const largeurMini =
        etiquetteLargeur + 12 + garde.length * LARGEUR_CARACTERE + 12;
      droite = Math.max(droite, gauche + largeurMini);

      const brutDebut = brut[r.debut];
      const rang = brutDebut.debuts.indexOf(r);
      const y =
        tops[r.debut] +
        brutDebut.separateurs.length * BANDEAU_OPERANDE +
        rang * BANDEAU_FRAGMENT;

      const brutFin = brut[r.fin];
      const m = brutFin.fins.indexOf(r);
      const bas = contenuFin[r.fin] + 4 + m * BAS_FRAGMENT;

      const separateurs: SeparateurCadre[] = r.operandes.map((op) => {
        const b = brut[op.index];
        const rangSep = b.separateurs.findIndex(
          (s) => s.f === r && s.op.id === op.id,
        );
        return {
          operandeId: op.id,
          y: tops[op.index] + rangSep * BANDEAU_OPERANDE,
          garde: formaterGarde(op.garde),
        };
      });
      // La garde d'un opérande suivant (ex. « sinon ») démarre à la même abscisse que celle du
      // premier opérande (voir le rendu, SequenceContentNode) : le cadre doit rester assez large
      // pour elle aussi, pas seulement pour la garde du premier opérande.
      separateurs.forEach((s) => {
        droite = Math.max(
          droite,
          gauche + etiquetteLargeur + 8 + s.garde.length * LARGEUR_CARACTERE + 12,
        );
      });

      droiteMax = Math.max(droiteMax, droite + 8);
      return {
        fragment: r.fragment,
        x: gauche,
        y,
        largeur: droite - gauche,
        hauteur: bas - y,
        profondeur: r.profondeur,
        etiquette,
        etiquetteLargeur,
        etiquetteHauteur: HAUTEUR_ETIQUETTE,
        garde,
        separateurs,
      };
    });

  const largeur = Math.ceil(Math.max(COLONNE_LARGEUR, droiteMax));
  const hauteur = HAUTEUR_ENTETE + hauteurCorps;
  const sd = options.cadre
    ? {
        nom: options.cadre.nom,
        etiquetteLargeur: 26 + `sd ${options.cadre.nom}`.trim().length * 7,
      }
    : null;
  const extra = sd
    ? { gauche: SD_PAD_X, haut: SD_HAUT, droite: SD_PAD_X, bas: SD_PAD_BAS }
    : { gauche: 0, haut: 0, droite: 0, bas: 0 };
  const largeurSd = sd ? Math.max(largeur, sd.etiquetteLargeur) : largeur;

  return {
    largeur: largeurSd,
    hauteur,
    hauteurCorps,
    largeurTotale: largeurSd + 2 * MARGE_CONTENU + extra.gauche + extra.droite,
    hauteurTotale: hauteur + 2 * MARGE_CONTENU + extra.haut + extra.bas,
    extra,
    sd,
    lignes: lignesMessages,
    cadres,
    notes: notesPosees,
    durees,
    creations,
    vies,
    barres,
    xLigneDeVie,
    largeurColonne,
    offsetsColonnes,
  };
}

/**
 * Après suppression de messages, recale les fragments : début / fin = premiers et derniers
 * messages survivants de l'ancienne étendue ; un fragment sans survivant disparaît, de même
 * qu'un opérande sans message.
 */
export function reconcilierFragments(
  anciens: SequenceMessage[],
  nouveaux: SequenceMessage[],
  fragments: SequenceFragment[],
): SequenceFragment[] {
  const vivants = new Set(nouveaux.map((m) => m.id));
  const index = new Map(anciens.map((m, i) => [m.id, i]));
  const resultat: SequenceFragment[] = [];

  fragments.forEach((f) => {
    const a = index.get(f.debutId);
    const b = index.get(f.finId);
    if (undefined === a || undefined === b) return; // déjà orphelin : on le retire
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const survivants = anciens
      .slice(lo, hi + 1)
      .filter((m) => vivants.has(m.id));
    if (0 === survivants.length) return;
    const debutId = survivants[0].id;
    const finId = survivants[survivants.length - 1].id;
    const operandes = (f.operandes ?? []).flatMap((o) => {
      const s = index.get(o.messageId);
      if (undefined === s) return [];
      const suivant = anciens.slice(s, hi + 1).find((m) => vivants.has(m.id));
      return suivant && suivant.id !== debutId
        ? [{ ...o, messageId: suivant.id }]
        : [];
    });
    resultat.push({ ...f, debutId, finId, operandes });
  });
  return resultat;
}

/**
 * Après suppression de messages : une note qui suivait un message supprimé passe derrière le
 * message survivant précédent (ou tout en haut s'il n'y en a plus).
 */
export function reconcilierNotes(
  anciens: SequenceMessage[],
  nouveaux: SequenceMessage[],
  notes: SequenceNote[],
): SequenceNote[] {
  const vivants = new Set(nouveaux.map((m) => m.id));
  const index = new Map(anciens.map((m, i) => [m.id, i]));
  return notes.map((brute) => {
    // Contrainte de durée dont la fin a disparu : elle se réduit à son début.
    const n =
      brute.finId && !vivants.has(brute.finId)
        ? { ...brute, finId: undefined }
        : brute;
    if (null === n.apresId || vivants.has(n.apresId)) return n;
    const i = index.get(n.apresId);
    if (undefined === i) return { ...n, apresId: null };
    const precedent = anciens
      .slice(0, i)
      .reverse()
      .find((m) => vivants.has(m.id));
    return { ...n, apresId: precedent?.id ?? null };
  });
}

/**
 * Barres d'activation. Un message synchrone ou asynchrone active son destinataire ; la barre
 * s'arrête à la réponse (« retour ») correspondante — appariement en pile, comme des appels
 * imbriqués. Une réponse posée DANS un fragment (ex. le « 400 » d'un alt) alors que l'appel a
 * été fait en dehors ne clôt pas la barre : c'est la réponse finale, hors fragment, qui le fait
 * (à défaut, la dernière réponse rencontrée). Sans aucune réponse, la barre couvre les messages
 * que le destinataire envoie ensuite et les appels qu'il déclenche. Un message sur soi-même crée
 * une petite barre imbriquée. `message.activation` corrige le cas par cas (« aucune » ou id du
 * message de fin) ; `auto = false` ne garde que ces demandes.
 */
function calculerBarres(
  messages: SequenceMessage[],
  lignes: LigneMessage[],
  auto: boolean,
  xLigneDeVie: (id: string) => number | null,
  plages: Array<{ debut: number; fin: number }>,
  creationBas: Map<number, number> = new Map(),
): BarreActivation[] {
  const index = new Map(messages.map((m, i) => [m.id, i]));
  interface Brute {
    porteur: string;
    appelant: string;
    debut: number;
    fin: number;
    parReponse: boolean;
  }
  const brutes: Brute[] = [];
  const pile: Array<{
    index: number;
    porteur: string;
    appelant: string;
    derniereReponse: number | null;
  }> = [];
  const dansFragmentSans = (i: number, appel: number) =>
    plages.some(
      (f) =>
        f.debut <= i && i <= f.fin && !(f.debut <= appel && appel <= f.fin),
    );

  messages.forEach((m, i) => {
    const l = lignes[i];
    if (!l.complet) return;

    if ("retour" === m.type) {
      for (let k = pile.length - 1; k >= 0; k--) {
        const o = pile[k];
        if (o.porteur !== m.deId || o.appelant !== m.versId) continue;
        if (dansFragmentSans(i, o.index)) {
          o.derniereReponse = i; // réponse d'une branche : on attend la réponse finale
        } else {
          brutes.push({
            porteur: o.porteur,
            appelant: o.appelant,
            debut: o.index,
            fin: i,
            parReponse: true,
          });
          pile.splice(k, 1);
        }
        break;
      }
      return;
    }

    if (
      "aucune" === m.activation ||
      "destruction" === m.effet ||
      SEQUENCE_PERDU === m.versId
    )
      return;
    const fixe =
      undefined !== m.activation &&
      index.has(m.activation) &&
      (index.get(m.activation) as number) >= i
        ? (index.get(m.activation) as number)
        : null;
    if (null !== fixe) {
      brutes.push({
        porteur: m.versId,
        appelant: m.deId,
        debut: i,
        fin: fixe,
        parReponse: false,
      });
      return;
    }
    if (!auto) return;
    if (l.auto) {
      brutes.push({
        porteur: m.versId,
        appelant: m.deId,
        debut: i,
        fin: i,
        parReponse: false,
      });
      return;
    }
    pile.push({
      index: i,
      porteur: m.versId,
      appelant: m.deId,
      derniereReponse: null,
    });
  });

  // Appels restés ouverts : dernière réponse de branche, sinon les messages que le destinataire
  // envoie à la suite, étendus aux appels qu'il a lui-même déclenchés.
  pile.forEach((o) => {
    if (null !== o.derniereReponse) {
      brutes.push({
        porteur: o.porteur,
        appelant: o.appelant,
        debut: o.index,
        fin: o.derniereReponse,
        parReponse: true,
      });
      return;
    }
    let fin = o.index;
    let change = true;
    while (change) {
      change = false;
      while (
        fin + 1 < messages.length &&
        messages[fin + 1].deId === o.porteur
      ) {
        fin++;
        change = true;
      }
      brutes.forEach((c) => {
        if (
          c.appelant === o.porteur &&
          c.debut > o.index &&
          c.debut <= fin &&
          c.fin > fin
        ) {
          fin = c.fin;
          change = true;
        }
      });
    }
    brutes.push({
      porteur: o.porteur,
      appelant: o.appelant,
      debut: o.index,
      fin,
      parReponse: false,
    });
  });

  const bars = brutes
    .filter((b) => null !== xLigneDeVie(b.porteur))
    .map((b) => {
      const debut = lignes[b.debut];
      const top = Math.max(
        debut.auto ? debut.y + 10 : debut.y,
        creationBas.get(b.debut) ?? 0,
      );
      const hauteurMini = debut.auto ? 14 : 20;
      const bottom =
        b.fin === b.debut
          ? top + hauteurMini
          : lignes[b.fin].y + (b.parReponse ? 0 : 6);
      return {
        porteur: b.porteur,
        top,
        bottom: Math.max(bottom, top + hauteurMini),
      };
    })
    .sort((a, b) => a.top - b.top);

  return bars.map((b, i) => {
    const parents = bars
      .slice(0, i)
      .filter((o) => o.porteur === b.porteur && o.bottom >= b.top - 0.5).length;
    return {
      participantId: b.porteur,
      x: (xLigneDeVie(b.porteur) as number) + parents * BARRE_DECALAGE,
      top: b.top,
      bottom: b.bottom,
      depth: parents,
    };
  });
}

/** Retire des messages la fin de barre d'activation qui visait un message supprimé. */
export function nettoyerActivations(
  messages: SequenceMessage[],
): SequenceMessage[] {
  const ids = new Set(messages.map((m) => m.id));
  return messages.map((m) => {
    if (
      undefined === m.activation ||
      "aucune" === m.activation ||
      ids.has(m.activation)
    )
      return m;
    const { activation: _perdue, ...reste } = m;
    return reste;
  });
}
