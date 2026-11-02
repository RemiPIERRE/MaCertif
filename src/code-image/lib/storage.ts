import { POLICES, type Echelle, type Extrait, type PoliceId, type Reglages } from '../types'
import { FONDS } from './backgrounds'
import { CODE_MAX_CARACTERES, REGLAGES_PAR_DEFAUT } from './defaults'
import { THEMES } from './themes'
import { LANGAGES } from './languages'

export const KEY_EXTRAITS = 'code:extraits'
export const KEY_REGLAGES = 'code:reglages'
/** Clé purement « interface » (extrait ouvert). NE PAS l'inclure dans l'export global. */
export const KEY_ACTIF = 'code:actif'

/** Clés à inclure dans l'export / import global de MaCertif. */
export const CODE_IMAGE_EXPORT_KEYS = [KEY_EXTRAITS, KEY_REGLAGES] as const

/**
 * Adaptateur de stockage. Par défaut : localStorage (JSON). L'intégration dans MaCertif
 * peut le remplacer par le helper de persistance déjà utilisé par « Mon dossier » / « Mon oral ».
 */
export interface StorageAdapter {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export const localStorageAdapter: StorageAdapter = {
  get(key) {
    try {
      const brut = localStorage.getItem(key)
      return brut === null ? null : JSON.parse(brut)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota dépassé ou stockage indisponible : on ne casse pas l'interface */
    }
  },
}

// ——— Normalisation : tolère les champs manquants / invalides (anciens exports, saisie corrompue) ———

const borne = (n: unknown, min: number, max: number, def: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : def
  return Math.min(max, Math.max(min, Math.round(v)))
}

export function normalizeReglages(raw: unknown): Reglages {
  const d = REGLAGES_PAR_DEFAUT
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const langage =
    typeof r.langage === 'string' && (r.langage === 'auto' || LANGAGES.some((l) => l.id === r.langage))
      ? r.langage
      : d.langage
  const echelle: Echelle = r.echelle === 1 || r.echelle === 2 || r.echelle === 3 ? r.echelle : d.echelle
  return {
    langage,
    theme: typeof r.theme === 'string' && THEMES.some((t) => t.id === r.theme) ? r.theme : d.theme,
    fond: typeof r.fond === 'string' && FONDS.some((f) => f.id === r.fond) ? r.fond : d.fond,
    police: POLICES.includes(r.police as PoliceId) ? (r.police as PoliceId) : d.police,
    taillePolice: borne(r.taillePolice, 10, 24, d.taillePolice),
    remplissage: borne(r.remplissage, 8, 96, d.remplissage),
    nomFichier: typeof r.nomFichier === 'string' ? r.nomFichier.slice(0, 80) : d.nomFichier,
    numerosLignes: typeof r.numerosLignes === 'boolean' ? r.numerosLignes : d.numerosLignes,
    premiereLigne: borne(r.premiereLigne, 1, 99999, d.premiereLigne),
    lignesMisesEnAvant: typeof r.lignesMisesEnAvant === 'string' ? r.lignesMisesEnAvant.slice(0, 120) : d.lignesMisesEnAvant,
    fenetre: typeof r.fenetre === 'boolean' ? r.fenetre : d.fenetre,
    ombre: typeof r.ombre === 'boolean' ? r.ombre : d.ombre,
    largeur: r.largeur === 'auto' || r.largeur === undefined ? 'auto' : borne(r.largeur, 300, 1200, 800),
    echelle,
  }
}

export function normalizeExtraits(raw: unknown): Extrait[] {
  if (!Array.isArray(raw)) return []
  const vus = new Set<string>()
  const out: Extrait[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    let id = typeof e.id === 'string' && e.id ? e.id : genererId()
    if (vus.has(id)) id = genererId()
    vus.add(id)
    const maintenant = new Date().toISOString()
    out.push({
      id,
      nom: typeof e.nom === 'string' && e.nom.trim() ? e.nom.slice(0, 80) : 'Extrait sans nom',
      tacheId: typeof e.tacheId === 'string' && e.tacheId ? e.tacheId : null,
      code: typeof e.code === 'string' ? e.code.slice(0, CODE_MAX_CARACTERES) : '',
      reglages: normalizeReglages(e.reglages),
      creeLe: typeof e.creeLe === 'string' ? e.creeLe : maintenant,
      modifieLe: typeof e.modifieLe === 'string' ? e.modifieLe : maintenant,
    })
  }
  return out
}

export function genererId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  return c?.randomUUID ? c.randomUUID() : `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Pour l'export global : instantané des deux clés. */
export function exporterCodeImage(adapter: StorageAdapter = localStorageAdapter): Record<string, unknown> {
  return {
    [KEY_EXTRAITS]: normalizeExtraits(adapter.get(KEY_EXTRAITS)),
    [KEY_REGLAGES]: normalizeReglages(adapter.get(KEY_REGLAGES)),
  }
}

/** Pour l'import global : absent = valeurs par défaut (un export antérieur à cet onglet reste valide). */
export function importerCodeImage(data: Record<string, unknown>, adapter: StorageAdapter = localStorageAdapter): void {
  if (KEY_EXTRAITS in data) adapter.set(KEY_EXTRAITS, normalizeExtraits(data[KEY_EXTRAITS]))
  if (KEY_REGLAGES in data) adapter.set(KEY_REGLAGES, normalizeReglages(data[KEY_REGLAGES]))
}
