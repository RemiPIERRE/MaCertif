import { lazy, Suspense, useMemo } from 'react'
import { findTaskContext } from '../lib/taskLookup'
import { useLocalStorage } from '../lib/useLocalStorage'
import { generateId } from '../lib/id'
import { STORAGE_KEYS, type CustomSiteRef } from '../types/storage'
import type { TacheLiee } from '../code-image'

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

export function CodeImagePage() {
  // « Mes visuels » n'affiche plus que les CustomSiteRef ajoutés par l'utilisateur (plus
  // de checklist par défaut, cf. Phase 3) : « marquer ce visuel comme prêt » crée/complète
  // désormais une référence là-bas plutôt que de cocher une entrée qui n'y apparaît plus.
  const [customRefs, setCustomRefs] = useLocalStorage<CustomSiteRef[]>(STORAGE_KEYS.siteCustomRefs, [])
  const tachesLiees = useMemo(() => tachesLieesParDefaut(), [])

  const visuelsPrets = useMemo(
    () => Object.fromEntries(customRefs.filter((r) => r.ready).map((r) => [r.taskId, true])),
    [customRefs],
  )

  const onMarquerVisuelPret = (tacheId: string) => {
    setCustomRefs((prev) => {
      const existing = prev.find((r) => r.taskId === tacheId)
      if (existing) return prev.map((r) => (r === existing ? { ...r, ready: true } : r))
      const context = findTaskContext(tacheId)
      const ref: CustomSiteRef = {
        id: generateId(),
        taskId: tacheId,
        label: context?.task.sectionTitle ?? context?.task.title ?? tacheId,
        kind: 'inline',
        ready: true,
        createdAt: new Date().toISOString(),
      }
      return [...prev, ref]
    })
  }

  return (
    <Suspense fallback={<p className="page-lede">Chargement de l'éditeur d'extraits de code…</p>}>
      <CodeImageTab tachesLiees={tachesLiees} visuelsPrets={visuelsPrets} onMarquerVisuelPret={onMarquerVisuelPret} />
    </Suspense>
  )
}
