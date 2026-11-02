import { useCallback, useEffect, useRef, useState } from 'react'
import type { Extrait, Reglages } from '../types'
import { REGLAGES_PAR_DEFAUT } from './defaults'
import {
  KEY_ACTIF,
  KEY_EXTRAITS,
  KEY_REGLAGES,
  genererId,
  localStorageAdapter,
  normalizeExtraits,
  normalizeReglages,
  type StorageAdapter,
} from './storage'

function nouvelExtrait(nom: string, reglages: Reglages): Extrait {
  const maintenant = new Date().toISOString()
  return { id: genererId(), nom, tacheId: null, code: '', reglages: { ...reglages }, creeLe: maintenant, modifieLe: maintenant }
}

export function useExtraits(adapter: StorageAdapter = localStorageAdapter) {
  const [extraits, setExtraits] = useState<Extrait[]>(() => normalizeExtraits(adapter.get(KEY_EXTRAITS)))
  const [reglagesNeufs, setReglagesNeufs] = useState<Reglages>(() => normalizeReglages(adapter.get(KEY_REGLAGES)))
  const [actifId, setActifId] = useState<string | null>(() => {
    const id = adapter.get(KEY_ACTIF)
    return typeof id === 'string' ? id : null
  })

  const dernier = useRef({ extraits, reglagesNeufs, actifId })
  dernier.current = { extraits, reglagesNeufs, actifId }

  // Première ouverture (ou bibliothèque vide) : un extrait prêt à l'emploi.
  useEffect(() => {
    setExtraits((prev) => (prev.length ? prev : [nouvelExtrait('Extrait 1', dernier.current.reglagesNeufs)]))
  }, [])

  // L'extrait actif doit exister ; sinon on prend le premier.
  useEffect(() => {
    if (!extraits.length) return
    if (!actifId || !extraits.some((e) => e.id === actifId)) setActifId(extraits[0].id)
  }, [extraits, actifId])

  // Sauvegarde différée + vidage à la fermeture de l'onglet.
  useEffect(() => {
    const t = setTimeout(() => adapter.set(KEY_EXTRAITS, extraits), 300)
    return () => clearTimeout(t)
  }, [extraits, adapter])
  useEffect(() => {
    adapter.set(KEY_REGLAGES, reglagesNeufs)
  }, [reglagesNeufs, adapter])
  useEffect(() => {
    if (actifId) adapter.set(KEY_ACTIF, actifId)
  }, [actifId, adapter])
  useEffect(
    () => () => {
      adapter.set(KEY_EXTRAITS, dernier.current.extraits)
    },
    [adapter],
  )
  useEffect(() => {
    const vider = () => adapter.set(KEY_EXTRAITS, dernier.current.extraits)
    window.addEventListener('beforeunload', vider)
    return () => window.removeEventListener('beforeunload', vider)
  }, [adapter])

  const actif = extraits.find((e) => e.id === actifId) ?? extraits[0] ?? null

  const modifier = useCallback((id: string, patch: Partial<Omit<Extrait, 'id' | 'reglages'>>) => {
    setExtraits((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, modifieLe: new Date().toISOString() } : e)))
  }, [])

  const modifierReglages = useCallback((id: string, patch: Partial<Reglages>) => {
    setExtraits((prev) =>
      prev.map((e) => (e.id === id ? { ...e, reglages: { ...e.reglages, ...patch }, modifieLe: new Date().toISOString() } : e)),
    )
    // Les derniers réglages de style servent de base aux prochains extraits — mais
    // jamais le contenu propre à CET extrait (lignes en évidence, masquées, langage,
    // première ligne, nom de fichier) : un nouvel extrait doit toujours en repartir
    // vierge, même si ce patch vient d'un repliement dans l'éditeur.
    setReglagesNeufs((r) => ({ ...r, ...patch, nomFichier: r.nomFichier, lignesMisesEnAvant: '', lignesMasquees: '', premiereLigne: 1, langage: r.langage }))
  }, [])

  const creer = useCallback(() => {
    const e = nouvelExtrait(`Extrait ${dernier.current.extraits.length + 1}`, dernier.current.reglagesNeufs)
    setExtraits((prev) => [...prev, e])
    setActifId(e.id)
  }, [])

  const dupliquer = useCallback((id: string) => {
    const src = dernier.current.extraits.find((e) => e.id === id)
    if (!src) return
    const copie: Extrait = {
      ...src,
      id: genererId(),
      nom: `${src.nom} (copie)`.slice(0, 80),
      reglages: { ...src.reglages },
      creeLe: new Date().toISOString(),
      modifieLe: new Date().toISOString(),
    }
    setExtraits((prev) => {
      const i = prev.findIndex((e) => e.id === id)
      return [...prev.slice(0, i + 1), copie, ...prev.slice(i + 1)]
    })
    setActifId(copie.id)
  }, [])

  const supprimer = useCallback((id: string) => {
    setExtraits((prev) => {
      const reste = prev.filter((e) => e.id !== id)
      return reste.length ? reste : [nouvelExtrait('Extrait 1', dernier.current.reglagesNeufs)]
    })
  }, [])

  return { extraits, actif, actifId, setActifId, modifier, modifierReglages, creer, dupliquer, supprimer, reglagesParDefaut: REGLAGES_PAR_DEFAUT }
}
