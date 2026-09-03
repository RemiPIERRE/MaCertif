import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { caracteristiques as caracteristiqueDefinitions, caracteristiqueCategories } from '../data/caracteristiques'
import { competences as competenceDefinitions } from '../data/competences'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useDisclaimer } from '../lib/useDisclaimer'
import { filterActiveTasks } from '../lib/activeTasks'
import { computeProgress, getTaskStatus } from '../lib/progress'
import { STORAGE_KEYS, type Caracteristiques, type Competences, type DossierReponses } from '../types/storage'
import { ProgressBar } from '../components/ProgressBar'
import { IconChevronDown } from '../components/icons'
import { DisclaimerModal } from '../components/DisclaimerModal'
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

function CaracteristiquesCard({
  caracteristiques,
  setCaracteristiques,
}: {
  caracteristiques: Caracteristiques
  setCaracteristiques: (updater: (prev: Caracteristiques) => Caracteristiques) => void
}) {
  const setAnswer = (id: string, value: boolean) => setCaracteristiques((prev) => ({ ...prev, [id]: value }))
  // Frozen at mount: collapses by default only if some characteristics were already
  // checked in a previous visit. Answering during this visit must not fight the user
  // by collapsing the card mid-interaction.
  const [defaultOpen] = useState(() => Object.keys(caracteristiques).length === 0)

  return (
    <details className="card questionnaire-card" open={defaultOpen}>
      <summary className="questionnaire-summary">
        <IconChevronDown className="questionnaire-chevron" />
        <span>Personnaliser mon dossier</span>
        <span className="questionnaire-summary-hint">Afficher les tâches qui correspondent à mon projet</span>
      </summary>
      <p className="questionnaire-intro">
        Cochez « oui » à chaque caractéristique qui correspond à votre projet pour afficher les tâches liées. Rien
        n'est exclusif : si vous avez travaillé sur plusieurs projets pendant votre formation, cochez tout ce qui
        s'applique. Vos réponses ne suppriment jamais un texte déjà rédigé, elles le masquent seulement — décochez
        puis recochez pour le faire réapparaître tel quel.
      </p>
      {caracteristiqueCategories.map((categorie) => {
        const items = caracteristiqueDefinitions.filter((c) => c.categorie === categorie)
        if (items.length === 0) return null
        return (
          <div key={categorie} className="caracteristiques-category">
            <div className="caracteristiques-category-title">{categorie}</div>
            <div className="questionnaire-list">
              {items.map((c) => {
                const answer = caracteristiques[c.id] === true
                return (
                  <div key={c.id} className="questionnaire-item">
                    <div>
                      <div className="questionnaire-label">{c.label}</div>
                    </div>
                    <div className="questionnaire-toggle">
                      <button className={`btn ${answer ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAnswer(c.id, true)}>
                        Oui
                      </button>
                      <button className={`btn ${!answer ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAnswer(c.id, false)}>
                        Non
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </details>
  )
}

function CompetencesCard({
  competences,
  setCompetences,
}: {
  competences: Competences
  setCompetences: (updater: (prev: Competences) => Competences) => void
}) {
  const setEntry = (id: string, patch: Partial<{ validee: boolean; texte: string }>) =>
    setCompetences((prev) => ({ ...prev, [id]: { validee: prev[id]?.validee ?? false, texte: prev[id]?.texte ?? '', ...patch } }))

  return (
    <details className="card questionnaire-card">
      <summary className="questionnaire-summary">
        <IconChevronDown className="questionnaire-chevron" />
        <span>Compétences du référentiel (C1 à C8)</span>
        <span className="questionnaire-summary-hint">Purement déclaratif, à rédiger vous-même</span>
      </summary>
      <p className="questionnaire-intro">
        Pour chaque compétence validée pendant votre projet, cochez la case et rédigez vous-même le passage qui la
        couvre. Rien n'est calculé automatiquement à partir des autres tâches.
      </p>
      <div className="competences-list">
        {competenceDefinitions.map((def) => {
          const entry = competences[def.id]
          return (
            <div key={def.id} className="competence-item">
              <label className="competence-checkbox">
                <input
                  type="checkbox"
                  checked={entry?.validee ?? false}
                  onChange={(e) => setEntry(def.id, { validee: e.target.checked })}
                />
                <span>
                  <strong>{def.code}</strong> — {def.label}
                </span>
              </label>
              <textarea
                className="competence-textarea"
                value={entry?.texte ?? ''}
                onChange={(e) => setEntry(def.id, { texte: e.target.value })}
                placeholder="Décrivez le passage de votre projet qui couvre cette compétence…"
                rows={3}
              />
            </div>
          )
        })}
      </div>
    </details>
  )
}

export function DossierListPage() {
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [caracteristiques, setCaracteristiques] = useLocalStorage<Caracteristiques>(STORAGE_KEYS.caracteristiques, {})
  const [competences, setCompetences] = useLocalStorage<Competences>(STORAGE_KEYS.competences, {})
  const progress = computeProgress(reponses, caracteristiques)
  const disclaimer = useDisclaimer('disclaimer:dossier')

  return (
    <div>
      {disclaimer.visible && <DisclaimerModal onDismissForever={disclaimer.dismissForever} onAcknowledge={disclaimer.acknowledge} />}
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

      <CaracteristiquesCard caracteristiques={caracteristiques} setCaracteristiques={setCaracteristiques} />
      <CompetencesCard competences={competences} setCompetences={setCompetences} />

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
          const chapterTasks = filterActiveTasks(rawTasks, caracteristiques)
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
                  const subTasks = filterActiveTasks(sub.tasks, caracteristiques)
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
