import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { findTaskContext, getAdjacentTasks } from '../lib/taskLookup'
import { AnnexRefPanel } from '../components/AnnexRefPanel'
import { STORAGE_KEYS, type DossierReponses, type Questionnaire } from '../types/storage'
import './DossierTaskPage.css'

export function DossierTaskPage() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const [reponses, setReponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [questionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
  const context = findTaskContext(taskId)
  const [text, setText] = useState(() => reponses[taskId]?.text ?? '')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setText(reponses[taskId]?.text ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  if (!context) {
    return (
      <div>
        <p>Tâche introuvable.</p>
        <Link to="/dossier">Retour au dossier</Link>
      </div>
    )
  }

  const { task, chapter, subchapter } = context
  const { prev, next } = getAdjacentTasks(taskId, questionnaire)
  const isDirty = text !== (reponses[taskId]?.text ?? '')
  const belowMin = task.minChars !== null && text.length < task.minChars

  const save = (currentText: string = text) => {
    setReponses((prevState) => ({
      ...prevState,
      [taskId]: { text: currentText, updatedAt: new Date().toISOString() },
    }))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  const goTo = (id: string | undefined) => {
    if (!id) return
    if (isDirty) save()
    navigate(`/dossier/${id}`)
  }

  return (
    <div>
      <div className="task-breadcrumb">
        <Link to="/dossier">Mon dossier</Link>
        <span>/</span>
        <span>
          {chapter.number}. {chapter.title}
        </span>
        {subchapter && (
          <>
            <span>/</span>
            <span>
              {subchapter.code} {subchapter.title}
            </span>
          </>
        )}
      </div>

      <header className="page-header">
        <h1>{task.title}</h1>
        {task.type === 'image' ? (
          <p className="page-lede">
            Pas d'upload ici : décrivez simplement l'image que vous préparerez (capture, schéma...). Vous
            l'insérerez vous-même dans le document Word après export.
          </p>
        ) : (
          <p className="page-lede">Rédigez votre réponse. Elle sera intégrée telle quelle dans le dossier compilé.</p>
        )}
      </header>

      <div className="example-box">
        <span className="tag tag-amber">Exemple</span>
        <p>{task.example ?? 'Un exemple générique sera ajouté prochainement pour cette tâche.'}</p>
      </div>

      <div className="task-editor card">
        <div className="task-editor-toolbar">
          <span className={`task-counter${belowMin ? ' warn' : ''}`}>
            {task.type === 'image'
              ? `${text.length} / ${task.maxChars} caractères`
              : task.minChars !== null
                ? `${text.length} caractères (cible indicative : ${task.minChars}+)`
                : `${text.length} caractères`}
          </span>
          {belowMin && (
            <span className="task-counter-hint">
              Encore {task.minChars! - text.length} caractères pour atteindre la cible (non bloquant)
            </span>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={task.type === 'image' ? (task.maxChars ?? undefined) : undefined}
          rows={task.type === 'image' ? 4 : 12}
          placeholder={
            task.type === 'image'
              ? "Ex : Capture de la page d'accueil, montrant le header et les 3 blocs principaux."
              : 'Votre réponse…'
          }
        />
        <div className="task-editor-actions">
          <button className="btn btn-primary" onClick={() => save()}>
            {savedFlash ? 'Sauvegardé ✓' : 'Sauvegarder'}
          </button>
          {isDirty && !savedFlash && <span className="task-editor-dirty">Modifications non sauvegardées</span>}
        </div>
      </div>

      <AnnexRefPanel taskId={taskId} />

      <div className="task-nav">
        <button className="btn btn-secondary" disabled={!prev} onClick={() => goTo(prev?.id)}>
          ← Tâche précédente
        </button>
        <button className="btn btn-secondary" disabled={!next} onClick={() => goTo(next?.id)}>
          Tâche suivante →
        </button>
      </div>
    </div>
  )
}
