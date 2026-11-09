import { useEffect, useRef } from 'react'

/**
 * Logique commune des éditeurs de lignes (colonnes d'une table, propriétés du MCD) :
 * ajouter après une ligne, modifier, supprimer, déplacer, et placer le curseur dans le
 * champ "Nom" de la ligne qu'on vient d'ajouter. Les lignes sont identifiées par un `id`
 * stable : leurs inputs ne sont jamais remontés pendant la frappe (le focus est conservé).
 */
export function useListeEditable<T extends { id: string }>(items: T[], onItems: (suivants: T[]) => void, creer: () => T) {
  const racineRef = useRef<HTMLDivElement | null>(null)
  const aFocaliser = useRef<string | null>(null)

  useEffect(() => {
    const id = aFocaliser.current
    if (!id) return
    aFocaliser.current = null
    const champ = racineRef.current?.querySelector<HTMLInputElement>(`[data-ligne-id="${id}"] input[name="nom"]`)
    champ?.focus()
    champ?.scrollIntoView({ block: 'nearest' })
  }, [items])

  const ajouter = (apresIndex: number = items.length - 1) => {
    const nouveau = creer()
    const copie = [...items]
    copie.splice(apresIndex + 1, 0, nouveau)
    aFocaliser.current = nouveau.id
    onItems(copie)
  }

  const maj = (id: string, patch: Partial<T>) => onItems(items.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const supprimer = (id: string) => onItems(items.filter((x) => x.id !== id))

  const deplacer = (index: number, direction: -1 | 1) => {
    const cible = index + direction
    if (cible < 0 || cible >= items.length) return
    const copie = [...items]
    ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
    onItems(copie)
  }

  return { racineRef, ajouter, maj, supprimer, deplacer }
}
