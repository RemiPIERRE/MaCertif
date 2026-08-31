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

export function applyImportPayload(raw: string) {
  let parsed: ExportPayload
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ImportError('Le fichier sélectionné n\'est pas un JSON valide.')
  }
  if (!parsed || parsed.app !== 'macertif' || typeof parsed.data !== 'object') {
    throw new ImportError('Ce fichier ne provient pas d\'un export MaCertif.')
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
