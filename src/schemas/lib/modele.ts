import { generateId } from "../../lib/id";
import type {
  CoteLienFk,
  LienFkEdgeType,
  McdPropriete,
  SchemaNode,
  TableColonne,
  TableNodeType,
} from "../types";

export function nouvelleColonne(patch: Partial<TableColonne> = {}): TableColonne {
  return {
    id: generateId(),
    nom: "",
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
    ...patch,
  };
}

export function nouvellePropriete(patch: Partial<McdPropriete> = {}): McdPropriete {
  return { id: generateId(), nom: "", type: "", identifiant: false, ...patch };
}

const SUFFIXES_HANDLE_LIGNE = ["-gauche", "-droite"] as const;

export function handleLigne(idLigne: string, cote: "gauche" | "droite"): string {
  return `${idLigne}-${cote}`;
}

/** Id de ligne d'un handle "<idLigne>-gauche|droite", ou null pour un handle de nœud (top/right/bottom/left). */
export function idLigneDuHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const suffixe = SUFFIXES_HANDLE_LIGNE.find((s) => handle.endsWith(s));
  return suffixe ? handle.slice(0, -suffixe.length) : null;
}

/** Côté "gauche"/"droite" d'un handle de ligne "<idLigne>-gauche|droite", ou null pour un handle de nœud. */
export function coteDuHandle(handle: string | null | undefined): CoteLienFk | null {
  if (!handle) return null;
  if (handle.endsWith("-gauche")) return "gauche";
  if (handle.endsWith("-droite")) return "droite";
  return null;
}

/** Côté enfant d'un lien FK : max « 1 » si la colonne est unique, sinon « N » ; min « 1 » si chaque parent doit avoir un enfant. */
function cardinaliteEnfant(unique: boolean, obligatoire: boolean): "zero-un" | "un" | "zero-n" | "un-n" {
  if (unique) return obligatoire ? "un" : "zero-un";
  return obligatoire ? "un-n" : "zero-n";
}

function largeurNoeud(n: SchemaNode): number {
  return n.measured?.width ?? n.width ?? 240;
}

/** Hauteur d'en-tête + d'une ligne de table (voir TableNode.tsx : `44 + 28 * nbLignes`). */
const HAUTEUR_ENTETE = 44;
const HAUTEUR_LIGNE = 28;

/** Position approximative (canevas) du point d'ancrage d'une colonne, pour comparer les tracés. */
function pointAncrage(table: TableNodeType, index: number, cote: CoteLienFk): { x: number; y: number } {
  return {
    x: table.position.x + ("droite" === cote ? largeurNoeud(table) : 0),
    y: table.position.y + HAUTEUR_ENTETE + HAUTEUR_LIGNE * index + HAUTEUR_LIGNE / 2,
  };
}

const COTES: readonly CoteLienFk[] = ["gauche", "droite"];

/**
 * Choisit, parmi les 4 combinaisons gauche/droite possibles, celle qui donne le tracé le plus
 * direct : distance (façon Manhattan) entre les deux points d'ancrage, pénalisée lourdement
 * quand un côté choisi oblige le trait à repartir en arrière (contourner toute la table) — c'est
 * ce qui produit les doubles angles droits quand deux tables sont l'une au-dessus de l'autre.
 * Pas un vrai routeur anti-croisement global : un calcul local par lien, volontairement léger.
 */
function meilleursCotes(
  enfant: TableNodeType,
  indexEnfant: number,
  parent: TableNodeType,
  indexParent: number,
): { enfant: CoteLienFk; parent: CoteLienFk } {
  let meilleur: { enfant: CoteLienFk; parent: CoteLienFk } = { enfant: "droite", parent: "gauche" };
  let meilleurCout = Infinity;

  for (const coteEnfant of COTES) {
    for (const coteParent of COTES) {
      const depart = pointAncrage(enfant, indexEnfant, coteEnfant);
      const arrivee = pointAncrage(parent, indexParent, coteParent);
      const versLaDroite = arrivee.x >= depart.x;
      let cout = Math.abs(arrivee.x - depart.x) + Math.abs(arrivee.y - depart.y);
      // Sortir à droite pour finalement devoir revenir à gauche (ou l'inverse) : le trait
      // doit contourner la table de départ — gros détour, pénalisé fortement.
      if (("droite" === coteEnfant) !== versLaDroite) cout += 2 * largeurNoeud(enfant);
      // Entrer par la gauche alors qu'on vient de la droite (ou l'inverse) : même problème côté arrivée.
      if (("gauche" === coteParent) !== versLaDroite) cout += 2 * largeurNoeud(parent);

      if (cout < meilleurCout) {
        meilleurCout = cout;
        meilleur = { enfant: coteEnfant, parent: coteParent };
      }
    }
  }
  return meilleur;
}

/**
 * Déduit les liens FK des colonnes : un lien par colonne dont `reference` désigne une
 * colonne existante. Source = table enfant (porte la FK), cible = table parent.
 * Les liens ne sont jamais stockés : une seule source de vérité, la colonne. Les côtés
 * gauche/droite de chaque extrémité sont soit choisis à la main (`col.cotes`), soit calculés
 * automatiquement (voir meilleursCotes).
 */
export function aretesFk(nodes: SchemaNode[], notation: "fleche" | "patte"): LienFkEdgeType[] {
  const tables = nodes.filter((n): n is TableNodeType => "table" === n.type);
  const parId = new Map(tables.map((t) => [t.id, t]));
  const aretes: LienFkEdgeType[] = [];

  for (const enfant of tables) {
    const nbPk = enfant.data.colonnes.filter((c) => c.pk).length;
    for (const [indexEnfant, col] of enfant.data.colonnes.entries()) {
      if (!col.reference) continue;
      const parent = parId.get(col.reference.tableId);
      const indexParent = parent?.data.colonnes.findIndex((c) => c.id === col.reference?.colonneId) ?? -1;
      const colParent = -1 === indexParent ? undefined : parent?.data.colonnes[indexParent];
      if (!parent || !colParent) continue;

      const memeTable = parent.id === enfant.id;
      const cotes = memeTable
        ? { enfant: "droite" as const, parent: "droite" as const }
        : (col.cotes ?? meilleursCotes(enfant, indexEnfant, parent, indexParent));

      aretes.push({
        id: `fk-${col.id}`,
        type: "fk",
        source: enfant.id,
        sourceHandle: handleLigne(col.id, cotes.enfant),
        target: parent.id,
        targetHandle: handleLigne(colParent.id, cotes.parent),
        selectable: true,
        focusable: true,
        deletable: false,
        reconnectable: true,
        data: {
          notation,
          styleLien: col.styleLien,
          parent: col.nonNull || col.pk ? "un" : "zero-un",
          enfant: cardinaliteEnfant(col.unique || (col.pk && 1 === nbPk), col.enfantObligatoire),
        },
      });
    }
  }
  return aretes;
}
