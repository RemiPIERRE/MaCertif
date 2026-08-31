import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { useLocalStorage } from '../lib/useLocalStorage'
import { computeProgress, isTaskComplete } from '../lib/progress'
import { STORAGE_KEYS, type DossierReponses } from '../types/storage'
import { ProgressBar } from '../components/ProgressBar'
import type { DossierTask } from '../types/dossier'
import './DossierListPage.css'

function TaskRow({ task, reponses }: { task: DossierTask; reponses: DossierReponses }) {
  const complete = isTaskComplete(task, reponses)
  const length = reponses[task.id]?.text.length ?? 0
  return (
    <Link to={`/dossier/${task.id}`} className={`task-row${complete ? ' complete' : ''}`}>
      <span className={`task-row-status${complete ? ' complete' : ''}`} aria-hidden>
        {complete ? '✓' : ''}
      </span>
      <span className="task-row-title">
        {task.type === 'image' && <span className="tag tag-amber task-row-tag">Image</span>}
        {task.title}
      </span>
      <span className="task-row-count">
        {task.type === 'text' && task.minChars !== null
          ? `${length}/${task.minChars}–${task.maxChars}`
          : task.type === 'image'
            ? `${length} car.`
            : `${length} car.`}
      </span>
    </Link>
  )
}

export function DossierListPage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const progress = computeProgress(reponses)

  return (
    <div>
      <header className="page-header dossier-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Mon dossier projet</h1>
          <p className="page-lede">
            69 tâches réparties en 14 chapitres. Rédigez-les dans l'ordre qui vous convient : votre avancement est
            calculé automatiquement.
          </p>
        </div>
        <Link to="/dossier/compile" className="btn btn-secondary">
          Consulter le dossier compilé
        </Link>
      </header>

      <div className="card dossier-progress-card">
        <ProgressBar percent={progress.percent} label={`${progress.completedCount} / ${progress.totalCount} tâches`} />
      </div>

      <div className="dossier-chapters">
        {dossierChapters.map((chapter) => {
          const chapterTasks = chapter.subchapters
            ? chapter.subchapters.flatMap((s) => s.tasks)
            : (chapter.tasks ?? [])
          const doneCount = chapterTasks.filter((t) => isTaskComplete(t, reponses)).length
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
                chapter.subchapters.map((sub) => (
                  <div key={sub.id} className="subchapter">
                    <div className="subchapter-title">
                      {sub.code} {sub.title}
                    </div>
                    <div className="task-rows">
                      {sub.tasks.map((task) => (
                        <TaskRow key={task.id} task={task} reponses={reponses} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="task-rows">
                  {(chapter.tasks ?? []).map((task) => (
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
