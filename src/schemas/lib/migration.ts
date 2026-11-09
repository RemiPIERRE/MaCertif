import { generateId } from "../../lib/id";
import type {
  ElementStyle,
  FkAction,
  FlowKind,
  LienMcdData,
  McdPropriete,
  RelationType,
  SchemaEdge,
  SchemaNode,
  TableColonne,
} from "../types";
import { FK_ACTIONS } from "../types";

/**
 * Normalisation défensive du contenu d'un schéma au chargement : ne fait confiance à
 * rien (données anciennes, incomplètes ou modifiées à la main) et garantit que
 * l'éditeur ne reçoit jamais de forme inattendue.
 *
 * Migration des anciens schémas Merise ('umlMerise', 'flow' ou sans kind) : ils
 * deviennent des MPD ; les entités sont converties en tables, les classes UML sont
 * supprimées, et les anciens liens (non convertibles en clés étrangères) sont écartés.
 */

type Brut = Record<string, unknown>;

const estObjet = (v: unknown): v is Brut =>
  null !== v && "object" === typeof v && !Array.isArray(v);
const texte = (v: unknown, defaut = ""): string =>
  "string" === typeof v ? v : defaut;
const couleurValide = (v: unknown): string | undefined =>
  "string" === typeof v && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined;
const vrai = (v: unknown): boolean => true === v;

const TYPES_PAR_KIND: Record<FlowKind, ReadonlySet<string>> = {
  mcd: new Set(["mcdEntite", "mcdAssociation"]),
  mld: new Set(["table"]),
  mpd: new Set(["table"]),
  casUtilisation: new Set(["acteur", "casUtilisation", "cuStructure"]),
  activite: new Set(["activite"]),
};

const FORMES_ACTIVITE: ReadonlySet<string> = new Set([
  "debut",
  "fin",
  "finFlux",
  "decision",
  "fusion",
  "barre",
  "connecteur",
  "action",
  "appel",
  "envoi",
  "reception",
  "temps",
  "objet",
  "broche",
  "cadre",
  "couloir",
  "structure",
  "expansion",
  "interruptible",
  "note",
]);

const RELATIONS_PAR_KIND: Partial<Record<FlowKind, ReadonlySet<string>>> = {
  casUtilisation: new Set([
    "association",
    "heritage",
    "inclut",
    "etend",
    "dependance",
    "lien",
  ]),
  activite: new Set(["flux", "interruption", "lien"]),
};

function normaliserStyle(v: unknown): Partial<ElementStyle> | undefined {
  if (!estObjet(v)) return undefined;
  const style: Partial<ElementStyle> = {};
  for (const cle of [
    "couleurContour",
    "couleurNom",
    "couleurTexte",
    "couleurFondTitre",
    "couleurFondLigne",
  ] as const) {
    if ("string" === typeof v[cle]) style[cle] = v[cle];
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

function normaliserPropriete(brut: unknown): McdPropriete | null {
  if ("string" === typeof brut)
    return "" === brut.trim()
      ? null
      : { id: generateId(), nom: brut, type: "", identifiant: false };
  if (!estObjet(brut)) return null;
  return {
    id: texte(brut.id) || generateId(),
    nom: texte(brut.nom),
    type: texte(brut.type),
    identifiant: vrai(brut.identifiant),
  };
}

function normaliserColonne(brut: unknown): TableColonne | null {
  // Ancien format : une ligne de textarea (string), puis MeriseAttribut { cle: 'PK' | 'FK' | 'UK' | 'PK,FK' }.
  if ("string" === typeof brut) {
    return "" === brut.trim() ? null : colonneVide(generateId(), brut);
  }
  if (!estObjet(brut)) return null;

  const cleLegacy = texte(brut.cle);
  const pk = vrai(brut.pk) || /PK/.test(cleLegacy);
  const reference =
    estObjet(brut.reference) &&
    "string" === typeof brut.reference.tableId &&
    "string" === typeof brut.reference.colonneId
      ? { tableId: brut.reference.tableId, colonneId: brut.reference.colonneId }
      : null;
  const action = (v: unknown): FkAction =>
    FK_ACTIONS.includes(v as FkAction) ? (v as FkAction) : "NO ACTION";

  return {
    id: texte(brut.id) || generateId(),
    nom: texte(brut.nom),
    type: texte(brut.type),
    pk,
    nonNull: vrai(brut.nonNull) || pk,
    unique: vrai(brut.unique) || /UK/.test(cleLegacy),
    autoIncrement: vrai(brut.autoIncrement),
    defaut: texte(brut.defaut),
    enfantObligatoire: vrai(brut.enfantObligatoire),
    reference,
    surSuppression: action(brut.surSuppression),
    surMiseAJour: action(brut.surMiseAJour),
  };
}

function colonneVide(id: string, nom: string): TableColonne {
  return {
    id,
    nom,
    type: "",
    pk: false,
    nonNull: false,
    unique: false,
    autoIncrement: false,
    defaut: "",
    enfantObligatoire: false,
    reference: null,
    surSuppression: "NO ACTION",
    surMiseAJour: "NO ACTION",
  };
}

function liste<T>(v: unknown, convertir: (x: unknown) => T | null): T[] {
  return (Array.isArray(v) ? v : [])
    .map(convertir)
    .filter((x): x is T => null !== x);
}

/** Retourne le nœud normalisé pour ce kind, ou null s'il n'a pas sa place dans ce schéma. */
function normaliserNoeud(brut: unknown, kind: FlowKind): SchemaNode | null {
  if (
    !estObjet(brut) ||
    "string" !== typeof brut.id ||
    !estObjet(brut.position)
  )
    return null;
  if (
    "number" !== typeof brut.position.x ||
    "number" !== typeof brut.position.y
  )
    return null;

  const donnees = estObjet(brut.data) ? brut.data : {};
  let type = texte(brut.type);
  let data: Brut;

  // Ancienne entité Merise → table (les classes UML 'umlClass' tombent dans le default : supprimées).
  if ("meriseEntity" === type) type = "table";

  switch (type) {
    case "table":
      data = {
        nom: texte(donnees.nom),
        colonnes: liste(
          donnees.colonnes ?? donnees.attributs,
          normaliserColonne,
        ),
        style: normaliserStyle(donnees.style),
      };
      break;
    case "mcdEntite":
    case "mcdAssociation":
      data = {
        nom: texte(donnees.nom),
        proprietes: liste(donnees.proprietes, normaliserPropriete),
        style: normaliserStyle(donnees.style),
      };
      break;
    case "acteur":
      data = {
        nom: texte(donnees.nom),
        couleur: couleurValide(donnees.couleur),
        forme: "rectangle" === donnees.forme ? "rectangle" : undefined,
        stereotype: texte(donnees.stereotype) || undefined,
      };
      break;
    case "casUtilisation": {
      const points = liste(donnees.pointsExtension, (p) =>
        "string" === typeof p && "" !== p.trim() ? p : null,
      );
      data = {
        nom: texte(donnees.nom),
        couleur: couleurValide(donnees.couleur),
        pointsExtension: points.length > 0 ? points : undefined,
      };
      break;
    }
    case "cuStructure":
      data = {
        forme:
          "paquetage" === donnees.forme || "note" === donnees.forme
            ? donnees.forme
            : "systeme",
        texte: texte(donnees.texte),
        couleur: couleurValide(donnees.couleur),
      };
      break;
    case "activite":
      data = {
        forme: FORMES_ACTIVITE.has(texte(donnees.forme))
          ? texte(donnees.forme)
          : "action",
        texte: texte(donnees.texte),
        couleur: /^#[0-9a-fA-F]{3,8}$/.test(texte(donnees.couleur))
          ? texte(donnees.couleur)
          : undefined,
        etat: texte(donnees.etat) || undefined,
        contrainte: texte(donnees.contrainte) || undefined,
        stereotype:
          "centralBuffer" === donnees.stereotype ||
          "datastore" === donnees.stereotype
            ? donnees.stereotype
            : undefined,
        mode:
          "iterative" === donnees.mode ||
          "parallel" === donnees.mode ||
          "stream" === donnees.mode
            ? donnees.mode
            : undefined,
        orientation:
          "horizontal" === donnees.orientation ? "horizontal" : undefined,
      };
      break;
    default:
      return null;
  }

  if (!TYPES_PAR_KIND[kind].has(type)) return null;
  return { ...brut, type, data } as unknown as SchemaNode;
}

export function migrerNoeuds(bruts: unknown, kind: FlowKind): SchemaNode[] {
  return liste(bruts, (n) => normaliserNoeud(n, kind));
}

/** Seuls sont conservés les liens dont les deux extrémités existent encore. Les liens FK du MLD/MPD ne sont jamais stockés. */
export function migrerAretes(
  bruts: unknown,
  noeuds: SchemaNode[],
  kind: FlowKind,
): SchemaEdge[] {
  if ("mld" === kind || "mpd" === kind) return [];
  const ids = new Set(noeuds.map((n) => n.id));

  return liste(bruts, (brut): SchemaEdge | null => {
    if (!estObjet(brut) || "string" !== typeof brut.id) return null;
    if ("string" !== typeof brut.source || "string" !== typeof brut.target)
      return null;
    if (!ids.has(brut.source) || !ids.has(brut.target)) return null;
    const donnees = estObjet(brut.data) ? brut.data : {};

    if ("mcd" === kind) {
      if ("lienMcd" !== brut.type) return null;
      const data: LienMcdData = {
        min: "1" === donnees.min ? "1" : "0",
        max: "1" === donnees.max ? "1" : "N",
        role: texte(donnees.role) || undefined,
      };
      return { ...brut, type: "lienMcd", data } as unknown as SchemaEdge;
    }

    const autorisees = RELATIONS_PAR_KIND[kind];
    const relationType = autorisees?.has(texte(donnees.relationType))
      ? (donnees.relationType as RelationType)
      : kind === "activite"
        ? "flux"
        : "association";
    return {
      ...brut,
      type: "relation",
      data: { ...donnees, relationType },
    } as unknown as SchemaEdge;
  });
}
