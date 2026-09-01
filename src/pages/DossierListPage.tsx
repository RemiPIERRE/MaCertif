import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { questionnaireQuestions } from '../data/questionnaire'
import { useLocalStorage } from '../lib/useLocalStorage'
import { filterActiveTasks } from '../lib/activeTasks'
import { computeProgress, getTaskStatus } from '../lib/progress'
import { STORAGE_KEYS, type DossierReponses, type Questionnaire } from '../types/storage'
import { ProgressBar } from '../components/ProgressBar'
import { IconChevronDown } from '../components/icons'
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

function QuestionnaireCard({
  questionnaire,
  setQuestionnaire,
}: {
  questionnaire: Questionnaire
  setQuestionnaire: (updater: (prev: Questionnaire) => Questionnaire) => void
}) {
  const setAnswer = (id: string, value: boolean | string) => setQuestionnaire((prev) => ({ ...prev, [id]: value }))
  // Frozen at mount: collapses by default only if the questionnaire was already filled
  // in a previous visit. Answering questions during this visit must not fight the
  // user by collapsing the card mid-interaction.
  const [defaultOpen] = useState(() => Object.keys(questionnaire).length === 0)

  return (
    <details className="card questionnaire-card" open={defaultOpen}>
      <summary className="questionnaire-summary">
        <IconChevronDown className="questionnaire-chevron" />
        <span>Personnaliser mon dossier</span>
        <span className="questionnaire-summary-hint">Retirer les tâches qui ne s'appliquent pas à mon projet</span>
      </summary>
      <p className="questionnaire-intro">
        Répondez « non » à une question pour retirer les tâches liées de votre dossier et de votre progression. Vous
        pouvez changer d'avis à tout moment.
      </p>
      <div className="questionnaire-list">
        {questionnaireQuestions.map((q) => {
          const answer = questionnaire[q.id]
          return (
            <div key={q.id} className="questionnaire-item">
              <div>
                <div className="questionnaire-label">{q.label}</div>
                {q.helpText && <div className="questionnaire-help">{q.helpText}</div>}
              </div>
              {q.options ? (
                <div className="questionnaire-toggle questionnaire-choice">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      className={`btn ${answer === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAnswer(q.id, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="questionnaire-toggle">
                  <button
                    className={`btn ${answer !== false ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAnswer(q.id, true)}
                  >
                    Oui
                  </button>
                  <button
                    className={`btn ${answer === false ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAnswer(q.id, false)}
                  >
                    Non
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </details>
  )
}

export function DossierListPage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [questionnaire, setQuestionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
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

      <QuestionnaireCard questionnaire={questionnaire} setQuestionnaire={setQuestionnaire} />

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
