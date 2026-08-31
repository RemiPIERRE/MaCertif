import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { useLocalStorage } from '../lib/useLocalStorage'
import { filterActiveTasks } from '../lib/activeTasks'
import { STORAGE_KEYS, type DossierReponses, type SiteCoches, type Questionnaire } from '../types/storage'
import type { DossierTask } from '../types/dossier'
import './MonSitePage.css'

interface ImageEntry {
  chapterTitle: string
  task: DossierTask
}

export function MonSitePage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [coches, setCoches] = useLocalStorage<SiteCoches>(STORAGE_KEYS.site, {})
  const [questionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})

  const entries: ImageEntry[] = dossierChapters.flatMap((chapter) => {
    const tasks = chapter.subchapters ? chapter.subchapters.flatMap((s) => s.tasks) : (chapter.tasks ?? [])
    return filterActiveTasks(tasks, questionnaire)
      .filter((t) => t.type === 'image')
      .map((task) => ({ chapterTitle: `${chapter.number}. ${chapter.title}`, task }))
  })

  const readyCount = entries.filter((e) => coches[e.task.id]).length

  const toggle = (taskId: string) => setCoches((prev) => ({ ...prev, [taskId]: !prev[taskId] }))

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
          {readyCount} / {entries.length}
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
                  <p className="site-item-description empty">Pas encore de description — à rédiger dans Mon dossier.</p>
                )}
              </div>
              <Link className="btn btn-ghost site-item-link" to={`/dossier/${task.id}`}>
                {description ? 'Modifier' : 'Rédiger'}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
