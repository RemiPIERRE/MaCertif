import { generateId } from "../../lib/id";
import type { SchemaNode } from "../types";

/** Types de nœuds qui se dupliquent / se copient-collent (tables, éléments du MCD et formes du diagramme d'activité). */
export const TYPES_DUPLIQUABLES: ReadonlySet<string> = new Set([
  "mcdEntite",
  "mcdAssociation",
  "table",
  "classe",
  "activite",
  "acteur",
  "casUtilisation",
  "cuStructure",
]);

/**
 * Copie d'un nœud pour "Dupliquer" / "Coller" : nouvel id, décalée par rapport à
 * l'original, sélectionnée. Les ids de lignes (propriétés, colonnes) sont renouvelés : ils
 * servent de key React ET d'ids de handles, donc doivent rester uniques. Les clés
 * étrangères sont conservées (la copie référence les mêmes tables parentes) ; une FK
 * auto-référente pointe vers la copie elle-même.
 */
export function dupliquerNoeud(source: SchemaNode, decalage = 40): SchemaNode {
  const copie = {
    ...source,
    id: generateId(),
    position: {
      x: source.position.x + decalage,
      y: source.position.y + decalage,
    },
    selected: true,
    dragging: false,
    // Re-mesuré par React Flow à l'affichage.
    measured: undefined,
  } as SchemaNode;

  const suffixer = (nom: string) => (nom ? `${nom}_copie` : "");

  if ("table" === source.type && "table" === copie.type) {
    const idsColonnes = new Map(
      source.data.colonnes.map((c) => [c.id, generateId()]),
    );
    copie.data = {
      ...source.data,
      nom: suffixer(source.data.nom),
      style: source.data.style ? { ...source.data.style } : undefined,
      colonnes: source.data.colonnes.map((c) => ({
        ...c,
        id: idsColonnes.get(c.id) ?? generateId(),
        reference:
          c.reference && c.reference.tableId === source.id
            ? {
                tableId: copie.id,
                colonneId:
                  idsColonnes.get(c.reference.colonneId) ??
                  c.reference.colonneId,
              }
            : c.reference
              ? { ...c.reference }
              : null,
      })),
    };
  } else if (
    ("mcdEntite" === source.type && "mcdEntite" === copie.type) ||
    ("mcdAssociation" === source.type && "mcdAssociation" === copie.type)
  ) {
    copie.data = {
      ...source.data,
      nom: suffixer(source.data.nom),
      style: source.data.style ? { ...source.data.style } : undefined,
      proprietes: source.data.proprietes.map((p) => ({
        ...p,
        id: generateId(),
      })),
    };
  } else if ("classe" === source.type && "classe" === copie.type) {
    copie.data = {
      ...source.data,
      nom: suffixer(source.data.nom),
      style: source.data.style ? { ...source.data.style } : undefined,
      attributs: source.data.attributs.map((a) => ({ ...a, id: generateId() })),
      methodes: source.data.methodes.map((m) => ({ ...m, id: generateId() })),
    };
  }

  return copie;
}
