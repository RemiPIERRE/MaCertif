import { useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { generateId } from '../lib/id'
import { formatCountdown, isPast } from '../lib/countdown'
import { STORAGE_KEYS, type Deadline } from '../types/storage'
import './CalendrierPage.css'

const SUGGESTIONS = ['Fin de stage', "Période d'examen", 'Oral blanc', 'Rendu du dossier']

export function CalendrierPage() {
  const [deadlines, setDeadlines] = useLocalStorage<Deadline[]>(STORAGE_KEYS.calendrier, [])
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date))

  const addDeadline = () => {
    if (!label.trim() || !date) return
    const deadline: Deadline = { id: generateId(), label: label.trim(), date, note: note.trim() }
    setDeadlines((prev) => [...prev, deadline])
    setLabel('')
    setDate('')
    setNote('')
  }

  const removeDeadline = (id: string) => setDeadlines((prev) => prev.filter((d) => d.id !== id))

  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma formation</div>
        <h1>Calendrier</h1>
        <p className="page-lede">
          Notez vos dates clés (fin de stage, examen…) et vos propres échéances pour garder le rythme jusqu'à la
          soutenance.
        </p>
      </header>

      <div className="card calendrier-form">
        <h3>Ajouter une échéance</h3>
        <div className="calendrier-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="btn btn-ghost calendrier-chip" onClick={() => setLabel(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="calendrier-form-row">
          <div className="field">
            <label>Intitulé</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Fin de stage" />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Note (optionnel)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : finir 30% du dossier" />
        </div>
        <button className="btn btn-primary" onClick={addDeadline} disabled={!label.trim() || !date}>
          Ajouter
        </button>
      </div>

      <div className="deadline-list">
        {sorted.length === 0 && <div className="card calendrier-empty">Aucune échéance pour l'instant.</div>}
        {sorted.map((deadline) => (
          <div key={deadline.id} className={`card deadline-item${isPast(deadline.date) ? ' past' : ''}`}>
            <div className="deadline-date-badge">
              {new Date(deadline.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
            <div className="deadline-body">
              <div className="deadline-label">{deadline.label}</div>
              {deadline.note && <div className="deadline-note">{deadline.note}</div>}
            </div>
            <div className="deadline-countdown">{formatCountdown(deadline.date)}</div>
            <button className="btn-icon-delete" onClick={() => removeDeadline(deadline.id)} aria-label="Supprimer">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
