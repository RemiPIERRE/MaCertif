import type { Edge, Node, Viewport } from "@xyflow/react";

/* ═══════════════════════ Style commun (MCD / MLD / MPD) ═══════════════════════ */

export interface ElementStyle {
  couleurContour: string;
  /** Couleur du nom de la table / de l'entité / de l'association (titre uniquement). */
  couleurNom: string;
  /** Couleur du texte des éléments (lignes). */
  couleurTexte: string;
  couleurFondTitre: string;
  couleurFondLigne: string;
}

export const STYLE_DEFAUT: ElementStyle = {
  couleurContour: "#263B55",
  couleurNom: "#1E293B",
  couleurTexte: "#1E293B",
  couleurFondTitre: "#DBEAFE",
  couleurFondLigne: "#F1F5F9",
};

/** L'ordre des clés est l'ordre d'affichage des sélecteurs de couleur. */
export const STYLE_LABELS: Record<keyof ElementStyle, string> = {
  couleurContour: "Contour",
  couleurNom: "Nom",
  couleurFondTitre: "Fond du titre",
  couleurTexte: "Élément",
  couleurFondLigne: "Fond des lignes",
};

/**
 * Style effectif d'un nœud : défauts + surcharges. Un style enregistré avant l'existence
 * de `couleurNom` garde son apparence : le nom reprend alors la couleur des éléments.
 */
export function resoudreStyle(style?: Partial<ElementStyle>): ElementStyle {
  return {
    ...STYLE_DEFAUT,
    ...style,
    couleurNom:
      style?.couleurNom ?? style?.couleurTexte ?? STYLE_DEFAUT.couleurNom,
  };
}

export const THEMES: Record<
  "clair" | "sombre" | "classique",
  { label: string; style: ElementStyle }
> = {
  clair: { label: "Clair", style: { ...STYLE_DEFAUT } },
  sombre: {
    label: "Sombre",
    style: {
      couleurContour: "#475569",
      couleurNom: "#E2E8F0",
      couleurTexte: "#E2E8F0",
      couleurFondTitre: "#17324D",
      couleurFondLigne: "#0F172A",
    },
  },
  classique: {
    label: "Classique",
    style: {
      couleurContour: "#000000",
      couleurNom: "#000000",
      couleurTexte: "#000000",
      couleurFondTitre: "#E5E7EB",
      couleurFondLigne: "#FFFFFF",
    },
  },
};

/* ═══════════════════════════════ MCD ═══════════════════════════════ */

/** Propriété d'une entité ou d'une association. `identifiant` n'a de sens que pour une entité (souligné). */
export interface McdPropriete {
  /** Identifiant stable (generateId) — key React ET base des ids de handles. */
  id: string;
  nom: string;
  /** Type de domaine, facultatif en MCD (la colonne n'apparaît que si renseigné). */
  type: string;
  identifiant: boolean;
}

export interface McdEntiteNodeData extends Record<string, unknown> {
  nom: string;
  proprietes: McdPropriete[];
  style?: Partial<ElementStyle>;
}

export interface McdAssociationNodeData extends Record<string, unknown> {
  nom: string;
  proprietes: McdPropriete[];
  style?: Partial<ElementStyle>;
}

export type McdMin = "0" | "1";
export type McdMax = "1" | "N";

/** Branche d'une association vers une entité. Toujours source = association, cible = entité. */
export interface LienMcdData extends Record<string, unknown> {
  /** Cardinalité côté entité : min,max (0,1 · 1,1 · 0,N · 1,N). */
  min: McdMin;
  max: McdMax;
  /** Nom de rôle (utile pour les associations réflexives), facultatif. */
  role?: string;
  /** Décalage perpendiculaire (px) — calculé à l'affichage pour écarter les liens parallèles ; jamais sauvegardé. */
  decalage?: number;
}

/* ═══════════════════════════ MLD / MPD ═══════════════════════════ */

export type FkAction =
  | "NO ACTION"
  | "RESTRICT"
  | "CASCADE"
  | "SET NULL"
  | "SET DEFAULT";

export const FK_ACTIONS: FkAction[] = [
  "NO ACTION",
  "RESTRICT",
  "CASCADE",
  "SET NULL",
  "SET DEFAULT",
];

/** La clé étrangère est portée par la colonne : les traits entre tables en sont DÉDUITS à l'affichage. */
export interface FkReference {
  tableId: string;
  colonneId: string;
}

/** Côté d'une table d'où part / où arrive un lien FK. */
export type CoteLienFk = "gauche" | "droite";

export interface TableColonne {
  /** Identifiant stable — key React ET base des ids de handles ("<id>-gauche" / "<id>-droite"). */
  id: string;
  nom: string;
  /** Type SQL (MPD) — ignoré à l'affichage en MLD. */
  type: string;
  pk: boolean;
  nonNull: boolean;
  unique: boolean;
  autoIncrement: boolean;
  defaut: string;
  /** Clé étrangère uniquement — « chaque ligne parent a au moins un enfant » (1,N plutôt que 0,N).
   * Purement documentaire : SQL ne sait pas l'imposer, mais la patte d'oie le montre. */
  enfantObligatoire: boolean;
  reference: FkReference | null;
  surSuppression: FkAction;
  surMiseAJour: FkAction;
  /** Apparence du lien FK : cardinalité (flèche/patte d'oie, défaut) ou simple trait. */
  styleLien?: "cardinalite" | "simple";
  /** Côtés gauche/droite choisis à la main (glisser-déposer ou éditeur) ; absent = calculé automatiquement (chemin le plus court). */
  cotes?: { enfant: CoteLienFk; parent: CoteLienFk } | null;
}

export interface TableNodeData extends Record<string, unknown> {
  nom: string;
  colonnes: TableColonne[];
  style?: Partial<ElementStyle>;
}

/** Extrémités d'un lien FK en patte d'oie (MPD). */
export type CardinaliteFk = "un" | "zero-un" | "zero-n" | "un-n";

/** Lien FK déduit des colonnes (jamais sauvegardé). Source = table enfant (porte la FK), cible = table parent. */
export interface LienFkData extends Record<string, unknown> {
  /** MLD : simple flèche enfant → parent ; MPD : pattes d'oie. */
  notation: "fleche" | "patte";
  /** Trait simple (sans marqueur) si 'simple' ; cardinalité (selon `notation`) sinon/absent. */
  styleLien?: "cardinalite" | "simple";
  parent: CardinaliteFk;
  enfant: CardinaliteFk;
}

/* ═══════════════════════════ Diagramme de classes (UML) ═══════════════════════════ */

export type ClasseVisibilite = "public" | "prive" | "protege" | "paquet";

export const VISIBILITE_SYMBOLES: Record<ClasseVisibilite, string> = {
  public: "+",
  prive: "-",
  protege: "#",
  paquet: "~",
};

export const VISIBILITE_LABELS: Record<ClasseVisibilite, string> = {
  public: "Public (+)",
  prive: "Privé (-)",
  protege: "Protégé (#)",
  paquet: "Paquet (~)",
};

export interface ClasseAttribut {
  id: string;
  nom: string;
  /** Type (facultatif, libre). */
  type: string;
  visibilite: ClasseVisibilite;
  statique?: boolean;
}

export interface ClasseMethode {
  id: string;
  nom: string;
  /** Paramètres en texte libre, ex. « id: int, nom: string ». */
  parametres: string;
  /** Type de retour (facultatif, libre ; vide = void). */
  typeRetour: string;
  visibilite: ClasseVisibilite;
  statique?: boolean;
  abstraite?: boolean;
}

export interface ClasseNodeData extends Record<string, unknown> {
  nom: string;
  /** « interface », « enumeration »… affiché entre guillemets au-dessus du nom. */
  stereotype?: string;
  /** Nom affiché en italique (classe abstraite), sans incidence sur les méthodes. */
  abstraite?: boolean;
  /** Masque le compartiment méthodes tant qu'il est vide (évite le message « Aucune méthode »
   * sur un schéma imprimé/exporté) ; réapparaît de lui-même dès qu'une méthode est ajoutée. */
  sansMethode?: boolean;
  attributs: ClasseAttribut[];
  methodes: ClasseMethode[];
  style?: Partial<ElementStyle>;
}

/* ═══════════════════════ Cas d'utilisation / Activité ═══════════════════════ */

export interface ActeurNodeData extends Record<string, unknown> {
  nom: string;
  /** Couleur d'accent (hex) ; absent = couleurs du thème. */
  couleur?: string;
  /** « bonhomme » (défaut) ou « rectangle » (acteur système / externe, noté «actor»). */
  forme?: "bonhomme" | "rectangle";
  /** Stéréotype affiché entre guillemets au-dessus du nom (`system`, `external`…), sans les guillemets. */
  stereotype?: string;
}

export interface CasUtilisationNodeData extends Record<string, unknown> {
  nom: string;
  couleur?: string;
  /** Points d'extension (un par ligne dans l'éditeur) : cibles possibles d'un «extend». */
  pointsExtension?: string[];
}

/** Éléments de structure du diagramme de cas d'utilisation : frontière du système, paquetage, note. */
export type CuStructureForme = "systeme" | "paquetage" | "note";

/** Formes « zones » (posées derrière, elles emportent leur contenu quand on les déplace). */
export const CU_ZONES: ReadonlySet<string> = new Set(["systeme", "paquetage"]);

export interface CuStructureNodeData extends Record<string, unknown> {
  forme: CuStructureForme;
  texte: string;
  couleur?: string;
}

/**
 * Formes du diagramme d'activité (UML 2.5). Un seul type de nœud React Flow (`activite`), le
 * rendu dépend de `forme`.
 *  - contrôle : debut, fin (fin d'activité), finFlux, decision, fusion, barre (bifurcation `fork`
 *    ou synchronisation `join`, selon les flux qui y arrivent et en repartent), connecteur ;
 *  - actions : action, appel (action d'appel de comportement), envoi / reception (signal), temps ;
 *  - objets : objet (nœud d'objet, mémoire tampon, entrepôt de données ou paramètre d'activité
 *    selon `stereotype` et l'emplacement), broche (pin) ;
 *  - structure : cadre (cadre d'activité), couloir (partition), structure / expansion /
 *    interruptible (régions), note.
 */
export type ActiviteForme =
  | "debut"
  | "fin"
  | "finFlux"
  | "decision"
  | "fusion"
  | "barre"
  | "connecteur"
  | "action"
  | "appel"
  | "envoi"
  | "reception"
  | "temps"
  | "objet"
  | "broche"
  | "cadre"
  | "couloir"
  | "structure"
  | "expansion"
  | "interruptible"
  | "note";

/** Formes « zones » : grands rectangles posés derrière les autres nœuds, qui emportent avec eux
 * ce qu'ils contiennent quand on les déplace. */
export const ACTIVITE_ZONES: ReadonlySet<string> = new Set([
  "cadre",
  "couloir",
  "structure",
  "expansion",
  "interruptible",
]);

export type ActiviteStereotype = "" | "centralBuffer" | "datastore";
export type ActiviteModeExpansion = "iterative" | "parallel" | "stream";

export interface ActiviteNodeData extends Record<string, unknown> {
  forme: ActiviteForme;
  texte: string;
  /** Couleur d'accent (hex) : contour, et fond en teinte légère. Absent = couleurs du thème. */
  couleur?: string;
  /** objet : état entre crochets, et contrainte entre accolades (`{upperBound = 3}`, `{ordering = FIFO}`). */
  etat?: string;
  contrainte?: string;
  /** objet : «centralBuffer» ou «datastore». */
  stereotype?: ActiviteStereotype;
  /** expansion : mode de la région. */
  mode?: ActiviteModeExpansion;
  /** couloir : en-tête en haut (colonne, par défaut) ou à gauche (ligne). */
  orientation?: "vertical" | "horizontal";
}

export type McdEntiteNodeType = Node<McdEntiteNodeData, "mcdEntite">;
export type McdAssociationNodeType = Node<
  McdAssociationNodeData,
  "mcdAssociation"
>;
export type TableNodeType = Node<TableNodeData, "table">;
export type ClasseNodeType = Node<ClasseNodeData, "classe">;

export type SchemaNode =
  | McdEntiteNodeType
  | McdAssociationNodeType
  | TableNodeType
  | ClasseNodeType
  | Node<ActeurNodeData, "acteur">
  | Node<CasUtilisationNodeData, "casUtilisation">
  | Node<CuStructureNodeData, "cuStructure">
  | Node<ActiviteNodeData, "activite">;

/** Notations de relation des diagrammes de classes, cas d'utilisation et d'activité. */
export type RelationType =
  | "association"
  | "heritage"
  | "composition"
  | "agregation"
  | "inclut"
  | "etend"
  | "flux"
  | "interruption"
  | "lien"
  | "dependance";

export interface RelationEdgeData extends Record<string, unknown> {
  relationType: RelationType;
  /** Libellé libre, ou condition de garde côté activité — optionnel. */
  label?: string;
  cardinaliteSource?: string;
  cardinaliteCible?: string;
  /** «extend» : condition d'extension (affichée entre accolades) et point d'extension visé. */
  condition?: string;
  pointExtension?: string;
}

export type RelationEdgeType = Edge<RelationEdgeData, "relation">;
export type LienMcdEdgeType = Edge<LienMcdData, "lienMcd">;
export type LienFkEdgeType = Edge<LienFkData, "fk">;

export type SchemaEdge = RelationEdgeType | LienMcdEdgeType | LienFkEdgeType;

/* ═══════════════════════════ Contenus ═══════════════════════════ */

/** Les familles de diagramme "libre" (nœuds + arêtes sur un canevas pannable/zoomable,
 * un seul éditeur — SchemaCanvas) ; chacune n'expose que ses propres éléments. */
export type FlowKind = "mcd" | "mld" | "mpd" | "classe" | "casUtilisation" | "activite";

export interface FlowContenu {
  kind: FlowKind;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  viewport?: Viewport;
}

/** Forme d'un participant : rectangle (objet / composant) ou bonhomme (acteur humain). */
export type SequenceForme = "objet" | "acteur";

export interface SequenceParticipant {
  id: string;
  nom: string;
  /** « objet » par défaut. */
  forme?: SequenceForme;
  /** Classe / type : le participant s'affiche « nom : Classe » (notation UML des lignes de vie). */
  classe?: string;
  /** Apparence facultative : contour (cadre + ligne de vie), nom, fond de l'en-tête,
   * « élément » = flèches et libellés des messages ÉMIS par ce participant. */
  style?: Partial<ElementStyle>;
}

export type SequenceMessageType = "synchrone" | "retour" | "asynchrone";

/** Émetteur « extérieur au système » : message trouvé (flèche partant d'un point plein). */
export const SEQUENCE_TROUVE = "*trouve*";
/** Destinataire « perdu » : message perdu (flèche qui finit sur un point plein). */
export const SEQUENCE_PERDU = "*perdu*";

/** Effet d'un message sur son destinataire : le crée (« create », la boîte apparaît au niveau
 * de la flèche) ou le détruit (« destroy », croix sur la ligne de vie qui s'arrête là). */
export type SequenceEffet = "creation" | "destruction";

export interface SequenceMessage {
  id: string;
  deId: string;
  /** Destinataire. Chaîne vide = pas encore choisi (la flèche n'est pas tracée). */
  versId: string;
  /** Libellé ; les retours à la ligne (\n) sont conservés à l'affichage. */
  texte: string;
  type: SequenceMessageType;
  /**
   * Barre d'activation du destinataire. Absent = automatique (de ce message jusqu'à la réponse
   * correspondante) ; « aucune » = pas de barre ; sinon : id du message où la barre se termine.
   */
  activation?: string;
  /** Création ou destruction du destinataire. */
  effet?: SequenceEffet;
}

/** Opérateurs de fragment combiné (UML 2) pris en charge. */
export type SequenceOperateur =
  | "alt"
  | "opt"
  | "loop"
  | "par"
  | "break"
  | "critical"
  | "neg"
  | "assert"
  | "strict"
  | "seq"
  | "ignore"
  | "consider";

/** Opérande supplémentaire d'un fragment (« else » d'un alt, branche d'un par) : il commence
 * au message `messageId`, une ligne en pointillé sépare les opérandes. */
export interface SequenceOperande {
  id: string;
  messageId: string;
  /** Condition de garde, sans les crochets (affichés automatiquement). */
  garde: string;
}

/**
 * Fragment combiné : un cadre plein (opérandes séparés par un trait en pointillé), avec en haut à gauche l'étiquette de l'opérateur
 * (alt, opt, loop…) suivie de la condition de garde entre crochets. Il enveloppe les messages
 * de `debutId` à `finId` inclus ; son étendue horizontale est calculée (participants concernés).
 */
export interface SequenceFragment {
  id: string;
  operateur: SequenceOperateur;
  /** Garde du premier opérande, sans les crochets. */
  garde: string;
  debutId: string;
  finId: string;
  operandes: SequenceOperande[];
  /** loop : bornes `loop(min,max)` (texte libre : « 1 », « n », « * »). Vides = boucle simple. */
  min?: string;
  max?: string;
  /** ignore / consider : messages concernés, affichés `ignore {a, b}`. */
  liste?: string;
  /** contour = cadre, nom = texte de l'étiquette et des gardes, fond du titre = fond de l'étiquette. */
  style?: Partial<ElementStyle>;
}

export type SequenceNotePosition = "sur" | "gauche" | "droite";

/**
 * Ce que représente l'élément « note » :
 *  - note : commentaire (coin plié) ;
 *  - ref : référence d'interaction (cadre « ref » renvoyant vers un autre diagramme de séquence) ;
 *  - etat : invariant d'état posé sur une ligne de vie (rectangle arrondi) ;
 *  - duree : contrainte de durée entre deux messages, le long d'une ligne de vie.
 */
export type SequenceNoteGenre = "note" | "ref" | "etat" | "duree";

/**
 * Note (commentaire UML : rectangle au coin plié). Elle s'insère dans la chronologie, juste
 * après le message `apresId` (null = tout en haut), et se place par rapport à un participant :
 * « sur » (à cheval sur sa ligne de vie, ou entre deux participants avec `participantFinId`),
 * « gauche » ou « droite » (à côté, reliée à la ligne de vie par un pointillé).
 */
export interface SequenceNote {
  id: string;
  /** « note » par défaut. */
  genre?: SequenceNoteGenre;
  texte: string;
  position: SequenceNotePosition;
  participantId: string;
  /** Pour « sur » : second participant, la note s'étend alors de l'un à l'autre. */
  participantFinId?: string;
  apresId: string | null;
  /** duree : message où la contrainte se termine (`apresId` = où elle commence). */
  finId?: string;
  /** contour, nom = texte, fond du titre = fond de la note. */
  style?: Partial<ElementStyle>;
}

/**
 * Diagramme de séquence : pas un graphe nœuds/arêtes (les messages sont une liste
 * ORDONNÉE dans le temps, pas des connexions libres) — modèle de données et éditeur
 * entièrement différents (SequenceCanvas), volontairement pas construits sur React Flow.
 */
export interface SequenceContenu {
  kind: "sequence";
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  /** Absent des schémas enregistrés avant l'existence des fragments. */
  fragments?: SequenceFragment[];
  /** Absent des schémas enregistrés avant l'existence des notes. */
  notes?: SequenceNote[];
  /** Barres d'activation automatiques (vrai si absent). Faux : seules celles demandées explicitement. */
  activationsAuto?: boolean;
  /** Cadre englobant `sd nom` (présent = affiché). */
  cadre?: { nom: string };
  /** Numérotation des messages : 1, 2, 3… ou hiérarchique 1, 1.1, 1.2, 2… Absent = aucune. */
  numerotation?: "simple" | "hierarchique";
}

/** Les exports antérieurs ('umlMerise', 'flow' ou sans `kind`) sont migrés au chargement
 * (voir lib/migration.ts, appelé par normaliserContenu dans lib/api.ts). */
export type DiagrammeContenu = FlowContenu | SequenceContenu;

export interface Diagramme {
  id: string;
  nom: string;
  contenu: DiagrammeContenu;
  creeLe: string;
  modifieLe: string;
}

/* ═══════════════════════════ Libellés ═══════════════════════════ */

export const RELATION_LABELS: Record<RelationType, string> = {
  association: "Association",
  heritage: "Héritage",
  composition: "Composition",
  agregation: "Agrégation",
  inclut: "Inclusion",
  etend: "Extension",
  flux: "Flux",
  interruption: "Interruption",
  lien: "Lien (note)",
  dependance: "Dépendance",
};

/** Stéréotype affiché par défaut sur le lien quand l'utilisateur n'a pas tapé son propre libellé. */
export const RELATION_STEREOTYPE_DEFAUT: Partial<Record<RelationType, string>> =
  {
    inclut: "«include»",
    etend: "«extend»",
  };

export const SEQUENCE_TYPE_LABELS: Record<SequenceMessageType, string> = {
  synchrone: "Synchrone",
  retour: "Retour",
  asynchrone: "Asynchrone",
};

export const SEQUENCE_FORME_LABELS: Record<SequenceForme, string> = {
  objet: "Objet (rectangle)",
  acteur: "Acteur (bonhomme)",
};

export const SEQUENCE_NOTE_POSITION_LABELS: Record<
  SequenceNotePosition,
  string
> = {
  sur: "Sur la ligne de vie",
  gauche: "À gauche de",
  droite: "À droite de",
};

export const SEQUENCE_OPERATEUR_LABELS: Record<SequenceOperateur, string> = {
  alt: "alt — Alternative (si / sinon)",
  opt: "opt — Optionnel (si)",
  loop: "loop — Boucle",
  par: "par — Parallèle",
  break: "break — Interruption",
  critical: "critical — Section critique",
  neg: "neg — Interdit (scénario invalide)",
  assert: "assert — Assertion (seul scénario valide)",
  strict: "strict — Ordre strict",
  seq: "seq — Ordre faible (séquence)",
  ignore: "ignore — Messages ignorés",
  consider: "consider — Messages considérés",
};

export const SEQUENCE_EFFET_LABELS: Record<SequenceEffet, string> = {
  creation: "Crée le destinataire",
  destruction: "Détruit le destinataire",
};

export const SEQUENCE_NOTE_GENRE_LABELS: Record<SequenceNoteGenre, string> = {
  note: "Note",
  ref: "Référence (ref)",
  etat: "Invariant d'état",
  duree: "Contrainte de durée",
};

export function contenuVide(
  kind: FlowKind | "sequence" = "mcd",
): DiagrammeContenu {
  return "sequence" === kind
    ? {
        kind: "sequence",
        participants: [],
        messages: [],
        fragments: [],
        notes: [],
      }
    : { kind, nodes: [], edges: [] };
}

/** L'ordre des clés est l'ordre d'affichage du menu "Nouveau schéma". */
export const DIAGRAM_KIND_LABELS: Record<FlowKind | "sequence", string> = {
  mcd: "MCD — Modèle conceptuel",
  mld: "MLD — Modèle logique",
  mpd: "MPD — Modèle physique",
  classe: "Diagramme de classes",
  sequence: "Diagramme de séquence",
  activite: "Diagramme d'activité",
  casUtilisation: "Diagramme de cas d'utilisation",
};
