import { useCallback, useEffect, useRef, useState } from 'react'

interface Instantane<T> {
  valeur: T
  signature: string
}

interface Options<T> {
  /** État courant complet du diagramme. */
  valeur: T
  /** Représentation texte de ce qui compte pour l'historique (sans sélection, glissement…). */
  signature: string
  /** Remet le diagramme dans l'état donné. */
  appliquer: (valeur: T) => void
  /** Vrai pendant un glissement : on n'enregistre rien tant que le geste n'est pas fini. */
  occupe?: () => boolean
  /** Raccourcis Ctrl/Cmd+Z (annuler) et Ctrl+Y / Ctrl/Cmd+Maj+Z (rétablir). Vrai par défaut. */
  clavier?: boolean
  /** Les modifications rapprochées (frappe, glissement) ne forment qu'une étape annulable. */
  delaiMs?: number
  limite?: number
}

/** Éléments que le navigateur gère lui-même : Ctrl+Z y annule la saisie de texte. */
const CHAMPS_DE_SAISIE = 'input, textarea, select, [contenteditable="true"]'

/** Retire de nœuds/arêtes ce qui est purement visuel ou recalculé : sélection, glissement, mesures. */
export function signatureSansEtatVisuel(nodes: unknown[], edges: unknown[]): string {
  const nettoyer = (liste: unknown[]) =>
    liste.map((el) => {
      const { selected: _s, dragging: _d, measured: _m, resizing: _r, positionAbsolute: _p, ...reste } = el as Record<string, unknown>
      return reste
    })
  return JSON.stringify([nettoyer(nodes), nettoyer(edges)])
}

/**
 * Historique annuler / rétablir, commun à tous les diagrammes. Principe : l'« instantané de
 * référence » est le dernier état enregistré ; quand le contenu change et se stabilise (délai),
 * la référence part dans la pile « annuler » et devient l'état courant. Une rafale de frappes ou
 * un glissement ne produit donc qu'UNE étape. Annuler / rétablir valident d'abord la rafale en
 * cours, puis remettent l'état voulu via `appliquer`.
 */
export function useHistorique<T>({ valeur, signature, appliquer, occupe, clavier = true, delaiMs = 400, limite = 100 }: Options<T>) {
  const valeurRef = useRef(valeur)
  const signatureRef = useRef(signature)
  const appliquerRef = useRef(appliquer)
  const occupeRef = useRef(occupe)
  valeurRef.current = valeur
  signatureRef.current = signature
  appliquerRef.current = appliquer
  occupeRef.current = occupe

  const reference = useRef<Instantane<T>>({ valeur, signature })
  const passe = useRef<Instantane<T>[]>([])
  const futur = useRef<Instantane<T>[]>([])
  const minuteur = useRef<number | null>(null)
  /** Après annuler/rétablir, les ajustements automatiques qui suivent ne forment pas une étape. */
  const absorberJusqua = useRef(0)
  const [, rafraichir] = useState(0)

  const arreterMinuteur = () => {
    if (null !== minuteur.current) {
      window.clearTimeout(minuteur.current)
      minuteur.current = null
    }
  }

  const enregistrer = useCallback(() => {
    passe.current.push(reference.current)
    if (passe.current.length > limite) passe.current.shift()
    futur.current = []
    reference.current = { valeur: valeurRef.current, signature: signatureRef.current }
    rafraichir((n) => n + 1)
  }, [limite])

  const validerRef = useRef<() => void>(() => undefined)
  validerRef.current = () => {
    minuteur.current = null
    if (occupeRef.current?.()) {
      minuteur.current = window.setTimeout(() => validerRef.current(), delaiMs)
      return
    }
    if (signatureRef.current !== reference.current.signature) enregistrer()
  }

  useEffect(() => {
    if (Date.now() < absorberJusqua.current) {
      absorberJusqua.current = 0
      arreterMinuteur()
      reference.current = { valeur: valeurRef.current, signature }
      return
    }
    if (signature === reference.current.signature) {
      arreterMinuteur()
      return
    }
    arreterMinuteur()
    minuteur.current = window.setTimeout(() => validerRef.current(), delaiMs)
  }, [signature, delaiMs])

  useEffect(() => arreterMinuteur, [])

  const annuler = useCallback(() => {
    arreterMinuteur()
    if (signatureRef.current !== reference.current.signature) enregistrer() // rafale en cours
    const precedent = passe.current.pop()
    if (!precedent) return
    futur.current.push(reference.current)
    reference.current = precedent
    absorberJusqua.current = Date.now() + 1000
    appliquerRef.current(precedent.valeur)
    rafraichir((n) => n + 1)
  }, [enregistrer])

  const retablir = useCallback(() => {
    arreterMinuteur()
    if (signatureRef.current !== reference.current.signature) enregistrer()
    const suivant = futur.current.pop()
    if (!suivant) return
    passe.current.push(reference.current)
    reference.current = suivant
    absorberJusqua.current = Date.now() + 1000
    appliquerRef.current(suivant.valeur)
    rafraichir((n) => n + 1)
  }, [enregistrer])

  /** Efface l'historique : le contenu vient d'être remplacé de l'extérieur (autre schéma, rechargement). */
  const reinitialiser = useCallback(() => {
    arreterMinuteur()
    passe.current = []
    futur.current = []
    absorberJusqua.current = 0
    reference.current = { valeur: valeurRef.current, signature: signatureRef.current }
    rafraichir((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!clavier) return
    const surClavier = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      if ((e.target as Element | null)?.closest?.(CHAMPS_DE_SAISIE)) return
      const touche = e.key.toLowerCase()
      if ('z' === touche && !e.shiftKey) {
        e.preventDefault()
        annuler()
      } else if ('y' === touche || ('z' === touche && e.shiftKey)) {
        e.preventDefault()
        retablir()
      }
    }
    window.addEventListener('keydown', surClavier)
    return () => window.removeEventListener('keydown', surClavier)
  }, [clavier, annuler, retablir])

  const enAttente = signature !== reference.current.signature
  return {
    annuler,
    retablir,
    reinitialiser,
    peutAnnuler: passe.current.length > 0 || enAttente,
    peutRetablir: futur.current.length > 0 && !enAttente,
  }
}
