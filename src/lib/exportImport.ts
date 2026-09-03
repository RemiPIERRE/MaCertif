import { STORAGE_KEYS } from '../types/storage'
import { allTasks } from '../data/dossierContent'

const ALL_KEYS = Object.values(STORAGE_KEYS)

/**
 * Bumped whenever the data model changes shape. V1.5 (the first production release,
 * "Mon dossier" only) shipped exports with no `schemaVersion` field at all — those
 * are treated as version 1. V2 adds "Mon oral" (new keys only, nothing about the
 * existing Mon dossier/Notes/Calendrier keys changes), hence version 2. V3 adds
 * `isDefault` (Slide) and `isDefault`/`defaultOrdre`/`defaultActivee` (OralSection)
 * to support resetting the presentation back to its default order. V4 replaces the
 * old fixed questionnaire (`profil:questionnaire`) with the tag-based
 * `dossier:caracteristiques` that now drives which "Mon dossier" tasks are shown,
 * and adds the self-declarative `dossier:competences` (C1-C8).
 *
 * Migrations must never be removed, even once old exports become rare: an export a
 * user made years ago must still import cleanly.
 */
export const CURRENT_SCHEMA_VERSION = 4

/**
 * Ids and original position/activee of the default presentation template's sections,
 * kept in sync by hand with `createDefaultPresentation()` in `data/oralDefaults.ts`.
 * Used only by the v2->v3 migration to backfill `isDefault`/`defaultOrdre`/`defaultActivee`
 * on data that predates those fields.
 */
const DEFAULT_SECTION_META: Record<string, { defaultOrdre: number; defaultActivee: boolean }> = {
  'sec-intro': { defaultOrdre: 0, defaultActivee: true },
  'sec-analyse': { defaultOrdre: 1, defaultActivee: true },
  'sec-realisation': { defaultOrdre: 2, defaultActivee: true },
  'sec-jeux-essais': { defaultOrdre: 3, defaultActivee: false },
  'sec-recherche': { defaultOrdre: 4, defaultActivee: false },
  'sec-conclusion': { defaultOrdre: 5, defaultActivee: true },
}

const DEFAULT_SLIDE_IDS = new Set([
  'sec-intro-s1', 'sec-intro-s2', 'sec-intro-s3',
  'sec-analyse-s1', 'sec-analyse-s2', 'sec-analyse-s3', 'sec-analyse-s4',
  'sec-realisation-s1', 'sec-realisation-s2', 'sec-realisation-s3', 'sec-realisation-s4', 'sec-realisation-s5',
  'sec-jeux-essais-s1',
  'sec-recherche-s1',
  'sec-conclusion-s1', 'sec-conclusion-s2', 'sec-conclusion-s3', 'sec-conclusion-s4', 'sec-conclusion-s5',
])

export interface ExportPayload {
  app: 'macertif'
  schemaVersion: number
  exportedAt: string
  data: Record<string, unknown>
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Adds `isDefault` to every slide in a v2 (pre-v3) `oral:presentation` or `oral:annexes` array. */
function backfillSlideIsDefault(slides: unknown): unknown {
  if (!Array.isArray(slides)) return slides
  return slides.map((slide) => (isPlainObject(slide) ? { ...slide, isDefault: typeof slide.id === 'string' && DEFAULT_SLIDE_IDS.has(slide.id) } : slide))
}

/** v2 -> v3: backfills isDefault/defaultOrdre/defaultActivee on presentation sections and slides. */
function migratePresentationV2toV3(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((section) => {
    if (!isPlainObject(section)) return section
    const meta = typeof section.id === 'string' ? DEFAULT_SECTION_META[section.id] : undefined
    return {
      ...section,
      slides: backfillSlideIsDefault(section.slides),
      isDefault: meta !== undefined,
      defaultOrdre: meta?.defaultOrdre ?? -1,
      defaultActivee: meta?.defaultActivee ?? Boolean(section.activee),
    }
  })
}

/** v2 -> v3: annex categories aren't part of the default template, so their slides are always isDefault: false. */
function migrateAnnexesV2toV3(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((category) => (isPlainObject(category) ? { ...category, slides: backfillSlideIsDefault(category.slides) } : category))
}

/**
 * v3 -> v4: the fixed questionnaire is retired in favour of independent, taggable
 * characteristics. Existing users already wrote real content under the OLD fixed
 * task list (implicitly a "classic" profile: framework backend, relational DB...),
 * so nothing must silently vanish behind an unchecked characteristic. Rather than
 * trying to translate old questionnaire answers (they don't map 1:1 to the new
 * tags), this infers `dossier:caracteristiques` straight from which tasks already
 * have written content: for every task the candidate filled in, every one of its
 * (post-retag) tags is checked "oui". Everything else defaults to "non" — exactly
 * the "masqué ≠ supprimé" rule already in place: nothing is lost, it just needs a
 * checkbox ticked to resurface if a task happens to fall under an untouched tag.
 */
function inferCaracteristiquesFromReponses(reponses: unknown): Record<string, boolean> {
  const caracteristiques: Record<string, boolean> = {}
  if (!isPlainObject(reponses)) return caracteristiques
  for (const task of allTasks) {
    if (!task.tags || task.tags.length === 0) continue
    const entry = reponses[task.id]
    const text = isPlainObject(entry) && isString(entry.text) ? entry.text : ''
    if (text.trim().length === 0) continue
    for (const tag of task.tags) caracteristiques[tag] = true
  }
  return caracteristiques
}

/** Keyed by the version being migrated FROM. `MIGRATIONS[1]` takes v1 data to v2. */
const MIGRATIONS: Record<number, Migration> = {
  // v1 -> v2: "Mon oral" added its own new storage keys (oral:presentation,
  // oral:annexes, oral:theme). Nothing about existing v1 data needs to change —
  // the new keys are simply absent from old exports, and the app already treats
  // an absent key as "not started yet".
  1: (data) => data,
  // v2 -> v3: backfill isDefault (Slide) and isDefault/defaultOrdre/defaultActivee
  // (OralSection), needed by "Réinitialiser l'ordre des slides".
  2: (data) => {
    const next = { ...data }
    if (STORAGE_KEYS.oralPresentation in next) next[STORAGE_KEYS.oralPresentation] = migratePresentationV2toV3(next[STORAGE_KEYS.oralPresentation])
    if (STORAGE_KEYS.oralAnnexes in next) next[STORAGE_KEYS.oralAnnexes] = migrateAnnexesV2toV3(next[STORAGE_KEYS.oralAnnexes])
    return next
  },
  // v3 -> v4: derive dossier:caracteristiques from already-filled dossier:reponses.
  // dossier:competences is a brand new key with no prior data to migrate — it's
  // simply absent until the candidate fills it in, same as any other new key.
  3: (data) => {
    const next = { ...data }
    next[STORAGE_KEYS.caracteristiques] = inferCaracteristiquesFromReponses(next[STORAGE_KEYS.dossier])
    return next
  },
}

/** Applies every migration step from `fromVersion` up to CURRENT_SCHEMA_VERSION, in order. */
export function migrateData(data: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
  let result = data
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v]
    if (step) result = step(result)
  }
  return result
}

export function buildExportPayload(): ExportPayload {
  const data: Record<string, unknown> = {}
  for (const key of ALL_KEYS) {
    const raw = window.localStorage.getItem(key)
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        // ignore corrupted entry
      }
    }
  }
  return {
    app: 'macertif',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function downloadExport() {
  const payload = buildExportPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `macertif-export-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export class ImportError extends Error {}

const isString = (value: unknown): value is string => typeof value === 'string'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isNumber = (value: unknown): value is number => typeof value === 'number'

function isSlideBlock(v: unknown): boolean {
  return isPlainObject(v) && isString(v.id) && (v.type === 'texte' || v.type === 'image') && isString(v.content)
}

function isSlide(v: unknown): boolean {
  return (
    isPlainObject(v) &&
    isString(v.id) &&
    isString(v.titre) &&
    Array.isArray(v.blocks) &&
    v.blocks.every(isSlideBlock) &&
    isString(v.discours) &&
    isNumber(v.ordre) &&
    isBoolean(v.isDefault)
  )
}

/** One validator per known storage key: returns an error message, or null if the shape is fine. */
const VALIDATORS: Record<string, (value: unknown) => string | null> = {
  [STORAGE_KEYS.profil]: (v) => (isPlainObject(v) ? null : '« Accueil » doit être un objet.'),
  [STORAGE_KEYS.dossier]: (v) => {
    if (!isPlainObject(v)) return '« Mon dossier » doit être un objet.'
    for (const [id, entry] of Object.entries(v)) {
      if (!isPlainObject(entry) || !isString(entry.text) || !isString(entry.updatedAt)) {
        return `Réponse invalide pour la tâche "${id}".`
      }
    }
    return null
  },
  [STORAGE_KEYS.site]: (v) => {
    if (!isPlainObject(v)) return '« Mon site » doit être un objet.'
    for (const [id, val] of Object.entries(v)) {
      if (!isBoolean(val)) return `Valeur invalide pour "${id}" dans Mon site.`
    }
    return null
  },
  [STORAGE_KEYS.siteCustomRefs]: (v) => {
    if (!Array.isArray(v)) return 'Les références Annexe/Image doivent être une liste.'
    for (const item of v) {
      if (
        !isPlainObject(item) ||
        !isString(item.id) ||
        !isString(item.taskId) ||
        !isString(item.label) ||
        (item.kind !== 'annexe' && item.kind !== 'inline') ||
        !isBoolean(item.ready) ||
        !isString(item.createdAt)
      ) {
        return 'Une référence Annexe/Image est mal formée.'
      }
    }
    return null
  },
  [STORAGE_KEYS.notes]: (v) => {
    if (!Array.isArray(v)) return '« Mes notes » doit être une liste.'
    for (const item of v) {
      if (!isPlainObject(item) || !isString(item.id) || !isString(item.text) || !isString(item.color) || !isString(item.createdAt)) {
        return 'Une note est mal formée.'
      }
    }
    return null
  },
  [STORAGE_KEYS.calendrier]: (v) => {
    if (!Array.isArray(v)) return '« Calendrier » doit être une liste.'
    for (const item of v) {
      if (!isPlainObject(item) || !isString(item.id) || !isString(item.label) || !isString(item.date) || !isString(item.note)) {
        return 'Une échéance de calendrier est mal formée.'
      }
    }
    return null
  },
  [STORAGE_KEYS.questionnaire]: (v) => {
    if (!isPlainObject(v)) return 'Le questionnaire doit être un objet.'
    for (const [id, val] of Object.entries(v)) {
      if (!isBoolean(val) && !isString(val)) return `Réponse invalide pour la question "${id}".`
    }
    return null
  },
  [STORAGE_KEYS.caracteristiques]: (v) => {
    if (!isPlainObject(v)) return 'Les caractéristiques du projet doivent être un objet.'
    for (const [id, val] of Object.entries(v)) {
      if (!isBoolean(val)) return `Valeur invalide pour la caractéristique "${id}".`
    }
    return null
  },
  [STORAGE_KEYS.competences]: (v) => {
    if (!isPlainObject(v)) return 'Les compétences doivent être un objet.'
    for (const [id, entry] of Object.entries(v)) {
      if (!isPlainObject(entry) || !isBoolean(entry.validee) || !isString(entry.texte)) {
        return `Compétence invalide pour "${id}".`
      }
    }
    return null
  },
  [STORAGE_KEYS.oralPresentation]: (v) => {
    if (!Array.isArray(v)) return '« Mon oral » (présentation) doit être une liste.'
    for (const section of v) {
      if (
        !isPlainObject(section) ||
        !isString(section.id) ||
        !isString(section.titre) ||
        !isBoolean(section.optionnelle) ||
        !isBoolean(section.activee) ||
        !Array.isArray(section.slides) ||
        !section.slides.every(isSlide) ||
        !isBoolean(section.isDefault) ||
        !isNumber(section.defaultOrdre) ||
        !isBoolean(section.defaultActivee)
      ) {
        return 'Une section de la présentation orale est mal formée.'
      }
    }
    return null
  },
  [STORAGE_KEYS.oralAnnexes]: (v) => {
    if (!Array.isArray(v)) return '« Mon oral » (annexes) doit être une liste.'
    for (const category of v) {
      if (
        !isPlainObject(category) ||
        !isString(category.id) ||
        !isString(category.categorie) ||
        !Array.isArray(category.slides) ||
        !category.slides.every(isSlide)
      ) {
        return 'Une catégorie d\'annexe orale est mal formée.'
      }
    }
    return null
  },
  [STORAGE_KEYS.oralTheme]: (v) => (isString(v) ? null : 'Le thème choisi pour Mon oral doit être une chaîne de caractères.'),
}

/** Validates every known key present in `data`. Returns the list of problems found (empty = valid). */
export function validateImportData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const key of ALL_KEYS) {
    if (!(key in data)) continue
    const error = VALIDATORS[key]?.(data[key])
    if (error) errors.push(error)
  }
  return errors
}

export function applyImportPayload(raw: string) {
  let parsed: Partial<ExportPayload> & { version?: number }
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ImportError("Le fichier sélectionné n'est pas un JSON valide.")
  }
  if (!parsed || parsed.app !== 'macertif' || !isPlainObject(parsed.data)) {
    throw new ImportError("Ce fichier ne provient pas d'un export MaCertif.")
  }

  // V1.5 exports predate `schemaVersion` (they used a literal `version: 1` field
  // that never changed); anything without a recognisable version is the oldest
  // known shape.
  const fromVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : (parsed.version ?? 1)
  const migrated = migrateData(parsed.data, fromVersion)

  const errors = validateImportData(migrated)
  if (errors.length > 0) {
    throw new ImportError(`Fichier invalide, import annulé : ${errors.join(' ')}`)
  }

  for (const key of ALL_KEYS) {
    if (key in migrated) {
      window.localStorage.setItem(key, JSON.stringify(migrated[key]))
      window.dispatchEvent(new CustomEvent('macertif:storage', { detail: { key } }))
    }
  }
}

export function importFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        applyImportPayload(String(reader.result))
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new ImportError('Impossible de lire le fichier.'))
    reader.readAsText(file)
  })
}

const LOCAL_SCHEMA_VERSION_KEY = 'macertif:schemaVersion'

/**
 * Runs the same migration steps as file import, but in place on this browser's own
 * localStorage. File import isn't the only place old-shaped data shows up: a browser
 * that used an earlier version of the app already has un-migrated data sitting under
 * these keys, and nothing else upgrades it. Must run once, synchronously, before any
 * component reads these keys — see the call in main.tsx, before the app is rendered.
 * Trusted, already-validated data (the app's own past writes), so unlike file import
 * this skips `validateImportData` — it only ever adds fields, never rejects.
 */
export function migrateLocalStorageInPlace() {
  let fromVersion: number
  try {
    const raw = window.localStorage.getItem(LOCAL_SCHEMA_VERSION_KEY)
    fromVersion = raw ? Number(raw) : 1
    if (!Number.isFinite(fromVersion)) fromVersion = 1
  } catch {
    return
  }
  if (fromVersion >= CURRENT_SCHEMA_VERSION) return

  const data: Record<string, unknown> = {}
  for (const key of ALL_KEYS) {
    const raw = window.localStorage.getItem(key)
    if (raw === null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      // leave corrupted entries untouched
    }
  }

  const migrated = migrateData(data, fromVersion)

  try {
    for (const key of ALL_KEYS) {
      if (key in migrated) window.localStorage.setItem(key, JSON.stringify(migrated[key]))
    }
    window.localStorage.setItem(LOCAL_SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
  } catch {
    // ignore: worst case, migration retries on next boot
  }
}
