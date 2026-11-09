import { useCallback, useEffect, useRef, useState } from "react";
import type { Diagramme, DiagrammeContenu, FlowKind } from "../types";
import { contenuVide } from "../types";
import {
  creerDiagramme,
  listerDiagrammes,
  majDiagramme,
  supprimerDiagramme,
} from "./api";

const SAUVEGARDE_DEBOUNCE_MS = 800;
const KEY_ACTIF = "schemas:actif-id";

function lireActifLocal(): string | null {
  try {
    return window.localStorage.getItem(KEY_ACTIF);
  } catch {
    return null;
  }
}

function ecrireActifLocal(id: string): void {
  try {
    window.localStorage.setItem(KEY_ACTIF, id);
  } catch {
    // stockage indisponible (navigation privée, quota) : simple confort, pas grave de le perdre
  }
}

/**
 * Bibliothèque de schémas, branchée sur /api/diagrammes (CRUD normalisé, même pattern
 * que useExtraits pour les extraits de code). Le canevas React Flow pousse ses
 * changements (nœuds/arêtes/viewport) très fréquemment pendant un glisser-déposer —
 * remplacerContenu met donc à jour l'état local à chaque appel mais ne déclenche
 * qu'une sauvegarde debouncée côté API.
 */
export function useDiagrammes() {
  const [diagrammes, setDiagrammes] = useState<Diagramme[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actifId, setActifId] = useState<string | null>(lireActifLocal);

  const dernier = useRef(diagrammes);
  dernier.current = diagrammes;

  useEffect(() => {
    let annule = false;
    listerDiagrammes()
      .then((liste) => {
        if (!annule) setDiagrammes(liste);
      })
      .catch((error: unknown) =>
        console.warn("Impossible de charger les schémas", error),
      )
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  // L'éditeur actif doit exister ; sinon on prend le premier.
  useEffect(() => {
    if (!diagrammes.length) return;
    if (!actifId || !diagrammes.some((d) => d.id === actifId))
      setActifId(diagrammes[0].id);
  }, [diagrammes, actifId]);

  useEffect(() => {
    if (actifId) ecrireActifLocal(actifId);
  }, [actifId]);

  const actif = diagrammes.find((d) => d.id === actifId) ?? null;

  const debounceParId = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const planifierSauvegarde = useCallback((id: string) => {
    const existant = debounceParId.current.get(id);
    if (existant) clearTimeout(existant);
    debounceParId.current.set(
      id,
      setTimeout(() => {
        debounceParId.current.delete(id);
        const diagramme = dernier.current.find((d) => d.id === id);
        if (!diagramme) return;
        majDiagramme(id, diagramme.nom, diagramme.contenu).catch(
          (error: unknown) =>
            console.warn(`Échec de l'enregistrement du schéma ${id}`, error),
        );
      }, SAUVEGARDE_DEBOUNCE_MS),
    );
  }, []);

  const renommer = useCallback(
    (id: string, nom: string) => {
      setDiagrammes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, nom } : d)),
      );
      planifierSauvegarde(id);
    },
    [planifierSauvegarde],
  );

  const remplacerContenu = useCallback(
    (id: string, contenu: DiagrammeContenu) => {
      setDiagrammes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, contenu } : d)),
      );
      planifierSauvegarde(id);
    },
    [planifierSauvegarde],
  );

  const creer = useCallback((kind: FlowKind | "sequence" = "mcd") => {
    const nom = `Schéma ${dernier.current.length + 1}`;
    creerDiagramme(nom, contenuVide(kind))
      .then((d) => {
        setDiagrammes((prev) => [...prev, d]);
        setActifId(d.id);
      })
      .catch((error: unknown) =>
        console.warn("Impossible de créer le schéma", error),
      );
  }, []);

  const dupliquer = useCallback((id: string) => {
    const src = dernier.current.find((d) => d.id === id);
    if (!src) return;
    creerDiagramme(`${src.nom} (copie)`.slice(0, 200), src.contenu)
      .then((copie) => {
        setDiagrammes((prev) => {
          const i = prev.findIndex((d) => d.id === id);
          return [...prev.slice(0, i + 1), copie, ...prev.slice(i + 1)];
        });
        setActifId(copie.id);
      })
      .catch((error: unknown) =>
        console.warn("Impossible de dupliquer le schéma", error),
      );
  }, []);

  const supprimer = useCallback((id: string) => {
    setDiagrammes((prev) => prev.filter((d) => d.id !== id));
    supprimerDiagramme(id).catch((error: unknown) =>
      console.warn("Impossible de supprimer le schéma", error),
    );
  }, []);

  return {
    diagrammes,
    actif,
    actifId,
    setActifId,
    chargement,
    renommer,
    remplacerContenu,
    creer,
    dupliquer,
    supprimer,
  };
}
