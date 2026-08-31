import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { useLocalStorage } from '../lib/useLocalStorage'
import { filterActiveTasks } from '../lib/activeTasks'
import { computeProgress, getTaskStatus } from '../lib/progress'
import { STORAGE_KEYS, type DossierReponses, type Questionnaire } from '../types/storage'
import { ProgressBar } from '../components/ProgressBar'
import type { DossierTask } from '../types/dossier'
import './DossierListPage.css'

function TaskRow({ task, reponses }: { task: DossierTask; reponses: DossierReponses }) {
  const status = getTaskStatus(task, reponses)
  const length = reponses[task.id]?.text.length ?? 0
  return (
    <Link to={`/dossier/${task.id}`} className={`task-row status-${status}`}>
      <span className={`task-row-status status-${status}`} aria-hidden>
        {status === 'complete' ? '✓' : status === 'incomplete' ? '!' : ''}
      </span>
      <span className="task-row-title">
        {task.type === 'image' && <span className="tag tag-amber task-row-tag">Image</span>}
        {task.title}
      </span>
      <span className="task-row-count">
        {task.type === 'image'
          ? `${length} car.`
          : task.minChars !== null
            ? `${length} / ${task.minChars}+ car.`
            : `${length} car.`}
      </span>
    </Link>
  )
}

export function DossierListPage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [questionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
  const progress = computeProgress(reponses, questionnaire)

  return (
    <div>
      <header className="page-header dossier-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Mon dossier projet</h1>
          <p className="page-lede">
            {progress.totalCount} tâches réparties en {dossierChapters.length} chapitres. Rédigez-les dans l'ordre
            qui vous convient : votre avancement est calculé automatiquement.
          </p>
        </div>
        <Link to="/dossier/compile" className="btn btn-secondary">
          Consulter le dossier compilé
        </Link>
      </header>

      <div className="card dossier-progress-card">
        <ProgressBar
          percent={progress.percent}
          label={`${progress.completedCount} / ${progress.totalCount} tâches${
            progress.incompleteCount > 0 ? ` · ${progress.incompleteCount} sous la cible indicative` : ''
          }`}
        />
      </div>

      <div className="dossier-chapters">
        {dossierChapters.map((chapter) => {
          const rawTasks = chapter.subchapters ? chapter.subchapters.flatMap((s) => s.tasks) : (chapter.tasks ?? [])
          const chapterTasks = filterActiveTasks(rawTasks, questionnaire)
          if (chapterTasks.length === 0) return null
          const doneCount = chapterTasks.filter((t) => getTaskStatus(t, reponses) === 'complete').length
          return (
            <details key={chapter.id} className="card chapter-card" open={doneCount < chapterTasks.length}>
              <summary className="chapter-summary">
                <span className="chapter-number">{chapter.number}</span>
                <span className="chapter-title">{chapter.title}</span>
                <span className={`chapter-count${doneCount === chapterTasks.length ? ' complete' : ''}`}>
                  {doneCount}/{chapterTasks.length}
                </span>
              </summary>

              {chapter.subchapters ? (
                chapter.subchapters.map((sub) => {
                  const subTasks = filterActiveTasks(sub.tasks, questionnaire)
                  if (subTasks.length === 0) return null
                  return (
                    <div key={sub.id} className="subchapter">
                      <div className="subchapter-title">
                        {sub.code} {sub.title}
                      </div>
                      <div className="task-rows">
                        {subTasks.map((task) => (
                          <TaskRow key={task.id} task={task} reponses={reponses} />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="task-rows">
                  {chapterTasks.map((task) => (
                    <TaskRow key={task.id} task={task} reponses={reponses} />
                  ))}
                </div>
              )}
            </details>
          )
        })}
      </div>
    </div>
  )
}
