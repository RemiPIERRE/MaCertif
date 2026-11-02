import { lazy, Suspense, useMemo } from 'react'
import { findTaskContext } from '../lib/taskLookup'
import { useLocalStorage } from '../lib/useLocalStorage'
import { STORAGE_KEYS, type SiteCoches } from '../types/storage'
import type { StorageAdapter, TacheLiee } from '../code-image'

// Dynamic import: highlight.js' language grammars, html-to-image and the embedded
// fonts only ever load once this tab is actually opened, never as part of the main
// bundle (verified by `vite build` producing a separate chunk for this module).
const CodeImageTab = lazy(() => import('../code-image').then((m) => ({ default: m.CodeImageTab })))

/** Tasks that expect a code-capture image, looked up live from dossierContent.ts so
 * a chapter renumbering never leaves this list pointing at stale labels/ids. */
const CODE_CAPTURE_TASK_IDS = ['code-capture-frontend', 'code-capture-backend', 'code-capture-reset']

function tachesLieesParDefaut(): TacheLiee[] {
  return CODE_CAPTURE_TASK_IDS.flatMap((id) => {
    const context = findTaskContext(id)
    if (!context) return []
    const code = context.subchapter?.code ?? String(context.chapter.number)
    return [{ id, label: `${context.task.sectionTitle ?? context.task.title} (${code})` }]
  })
}

/** Same localStorage + cross-tab-sync pattern as `useLocalStorage`, exposed as the
 * module's own StorageAdapter shape so "Mes extraits de code" stays in sync with
 * the rest of MaCertif without the module needing to know about our hook. */
const macertifStorageAdapter: StorageAdapter = {
  get(key) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? null : JSON.parse(raw)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      window.dispatchEvent(new CustomEvent('macertif:storage', { detail: { key } }))
    } catch {
      // quota exceeded or storage unavailable: don't break the tab over it
    }
  },
}

export function CodeImagePage() {
  const [coches, setCoches] = useLocalStorage<SiteCoches>(STORAGE_KEYS.site, {})
  const tachesLiees = useMemo(() => tachesLieesParDefaut(), [])

  const onMarquerVisuelPret = (tacheId: string) => setCoches((prev) => ({ ...prev, [tacheId]: true }))

  return (
    <Suspense fallback={<p className="page-lede">Chargement de l'éditeur d'extraits de code…</p>}>
      <CodeImageTab
        storage={macertifStorageAdapter}
        tachesLiees={tachesLiees}
        visuelsPrets={coches}
        onMarquerVisuelPret={onMarquerVisuelPret}
      />
    </Suspense>
  )
}
