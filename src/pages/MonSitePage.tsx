import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { useLocalStorage } from '../lib/useLocalStorage'
import { filterActiveTasks } from '../lib/activeTasks'
import { findTaskContext } from '../lib/taskLookup'
import { STORAGE_KEYS, type DossierReponses, type SiteCoches, type Caracteristiques, type CustomSiteRef } from '../types/storage'
import type { DossierTask } from '../types/dossier'
import './MonSitePage.css'

interface ImageEntry {
  chapterTitle: string
  task: DossierTask
}

const KIND_LABEL: Record<CustomSiteRef['kind'], string> = {
  annexe: 'Annexe',
  inline: 'Image inline',
}

export function MonSitePage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [coches, setCoches] = useLocalStorage<SiteCoches>(STORAGE_KEYS.site, {})
  const [caracteristiques] = useLocalStorage<Caracteristiques>(STORAGE_KEYS.caracteristiques, {})
  const [customRefs, setCustomRefs] = useLocalStorage<CustomSiteRef[]>(STORAGE_KEYS.siteCustomRefs, [])

  const entries: ImageEntry[] = dossierChapters.flatMap((chapter) => {
    const tasks = chapter.subchapters ? chapter.subchapters.flatMap((s) => s.tasks) : (chapter.tasks ?? [])
    return filterActiveTasks(tasks, caracteristiques)
      .filter((t) => t.type === 'image')
      .map((task) => ({ chapterTitle: `${chapter.number}. ${chapter.title}`, task }))
  })

  const readyCount = entries.filter((e) => coches[e.task.id]).length
  const customReadyCount = customRefs.filter((r) => r.ready).length
  const totalCount = entries.length + customRefs.length
  const totalReady = readyCount + customReadyCount

  const toggle = (taskId: string) => setCoches((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  const toggleCustom = (id: string) =>
    setCustomRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ready: !r.ready } : r)))
  const removeCustom = (id: string) => setCustomRefs((prev) => prev.filter((r) => r.id !== id))

  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma certification</div>
        <h1>Mon site</h1>
        <p className="page-lede">
          La checklist de toutes les images à préparer pour votre dossier : captures d'écran, code, schémas,
          arborescences. Rédigez leur description dans « Mon dossier », puis cochez-les ici au fur et à mesure que
          vous les préparez. Vous les insérerez vous-même dans le document Word après export.
        </p>
      </header>

      <div className="card site-summary">
        <strong>
          {totalReady} / {totalCount}
        </strong>{' '}
        images prêtes
      </div>

      <div className="site-list">
        {entries.map(({ chapterTitle, task }) => {
          const description = reponses[task.id]?.text ?? ''
          const ready = !!coches[task.id]
          return (
            <div key={task.id} className={`card site-item${ready ? ' ready' : ''}`}>
              <label className="site-item-checkbox">
                <input type="checkbox" checked={ready} onChange={() => toggle(task.id)} />
              </label>
              <div className="site-item-body">
                <div className="site-item-chapter">{chapterTitle}</div>
                <div className="site-item-title">{task.title}</div>
                {description ? (
                  <p className="site-item-description">{description}</p>
                ) : (
                  <p className="site-item-description empty">Pas encore de description. À rédiger dans Mon dossier.</p>
                )}
              </div>
              <Link className="btn btn-ghost site-item-link" to={`/dossier/${task.id}`}>
                {description ? 'Modifier' : 'Rédiger'}
              </Link>
            </div>
          )
        })}
      </div>

      {customRefs.length > 0 && (
        <>
          <h3 className="site-custom-heading">Références ajoutées depuis vos tâches</h3>
          <div className="site-list">
            {customRefs.map((ref) => {
              const context = findTaskContext(ref.taskId)
              return (
                <div key={ref.id} className={`card site-item${ref.ready ? ' ready' : ''}`}>
                  <label className="site-item-checkbox">
                    <input type="checkbox" checked={ref.ready} onChange={() => toggleCustom(ref.id)} />
                  </label>
                  <div className="site-item-body">
                    <div className="site-item-chapter">
                      {context ? `${context.chapter.number}. ${context.chapter.title}` : 'Tâche introuvable'}
                      {' · '}
                      <span className="tag tag-violet">{KIND_LABEL[ref.kind]}</span>
                    </div>
                    <div className="site-item-title">{ref.label}</div>
                    <p className="site-item-description empty">À préparer.</p>
                  </div>
                  <Link className="btn btn-ghost site-item-link" to={`/dossier/${ref.taskId}`}>
                    Voir la tâche
                  </Link>
                  <button className="btn-icon-delete" onClick={() => removeCustom(ref.id)} aria-label="Supprimer">
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
