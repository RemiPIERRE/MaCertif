import { STORAGE_KEYS } from '../types/storage'

const ALL_KEYS = Object.values(STORAGE_KEYS)

export interface ExportPayload {
  app: 'macertif'
  version: 1
  exportedAt: string
  data: Record<string, unknown>
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
    version: 1,
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

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
  let parsed: ExportPayload
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ImportError("Le fichier sélectionné n'est pas un JSON valide.")
  }
  if (!parsed || parsed.app !== 'macertif' || !isPlainObject(parsed.data)) {
    throw new ImportError("Ce fichier ne provient pas d'un export MaCertif.")
  }

  const errors = validateImportData(parsed.data)
  if (errors.length > 0) {
    throw new ImportError(`Fichier invalide, import annulé : ${errors.join(' ')}`)
  }

  for (const key of ALL_KEYS) {
    if (key in parsed.data) {
      window.localStorage.setItem(key, JSON.stringify(parsed.data[key]))
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
