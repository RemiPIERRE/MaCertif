import { generateId } from "../../lib/id";
import type {
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

/** Côté enfant d'un lien FK : max « 1 » si la colonne est unique, sinon « N » ; min « 1 » si chaque parent doit avoir un enfant. */
function cardinaliteEnfant(unique: boolean, obligatoire: boolean): "zero-un" | "un" | "zero-n" | "un-n" {
  if (unique) return obligatoire ? "un" : "zero-un";
  return obligatoire ? "un-n" : "zero-n";
}

function largeurNoeud(n: SchemaNode): number {
  return n.measured?.width ?? n.width ?? 240;
}

/**
 * Déduit les liens FK des colonnes : un lien par colonne dont `reference` désigne une
 * colonne existante. Source = table enfant (porte la FK), cible = table parent.
 * Les liens ne sont jamais stockés : une seule source de vérité, la colonne.
 */
export function aretesFk(nodes: SchemaNode[], notation: "fleche" | "patte"): LienFkEdgeType[] {
  const tables = nodes.filter((n): n is TableNodeType => "table" === n.type);
  const parId = new Map(tables.map((t) => [t.id, t]));
  const aretes: LienFkEdgeType[] = [];

  for (const enfant of tables) {
    const nbPk = enfant.data.colonnes.filter((c) => c.pk).length;
    for (const col of enfant.data.colonnes) {
      if (!col.reference) continue;
      const parent = parId.get(col.reference.tableId);
      const colParent = parent?.data.colonnes.find((c) => c.id === col.reference?.colonneId);
      if (!parent || !colParent) continue;

      const centreEnfant = enfant.position.x + largeurNoeud(enfant) / 2;
      const centreParent = parent.position.x + largeurNoeud(parent) / 2;
      const versLaDroite = centreParent > centreEnfant;
      const memeTable = parent.id === enfant.id;

      aretes.push({
        id: `fk-${col.id}`,
        type: "fk",
        source: enfant.id,
        sourceHandle: handleLigne(col.id, memeTable || versLaDroite ? "droite" : "gauche"),
        target: parent.id,
        targetHandle: handleLigne(colParent.id, memeTable || !versLaDroite ? "droite" : "gauche"),
        selectable: false,
        focusable: false,
        deletable: false,
        data: {
          notation,
          parent: col.nonNull || col.pk ? "un" : "zero-un",
          enfant: cardinaliteEnfant(col.unique || (col.pk && 1 === nbPk), col.enfantObligatoire),
        },
      });
    }
  }
  return aretes;
}
