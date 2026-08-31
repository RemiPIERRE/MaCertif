import { useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { generateId } from '../lib/id'
import { formatCountdown, isPast } from '../lib/countdown'
import { MonthCalendar, type CalendarEvent } from '../components/MonthCalendar'
import { STORAGE_KEYS, EMPTY_PROFIL, type Deadline, type ProfilInfos } from '../types/storage'
import './CalendrierPage.css'

const SUGGESTIONS = ['Oral blanc', 'Rendu du dossier', 'Relecture finale']

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function CalendrierPage() {
  const [deadlines, setDeadlines] = useLocalStorage<Deadline[]>(STORAGE_KEYS.calendrier, [])
  const [profil, setProfil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date))

  const profilEventCandidates: [string, string][] = [
    [profil.dateDebutFormation, 'Début formation'],
    [profil.dateFinFormation, 'Fin formation'],
    [profil.dateDebutStage, 'Début stage'],
    [profil.dateFinStage, 'Fin stage'],
    [profil.dateExamen, 'Examen'],
  ]
  const profilEvents: CalendarEvent[] = profilEventCandidates
    .filter(([date]) => Boolean(date))
    .map(([date, label]) => ({ date, label, kind: 'profil' }))

  const customEvents: CalendarEvent[] = deadlines.map((d) => ({ date: d.date, label: d.label, kind: 'custom' as const }))

  const addDeadline = () => {
    if (!label.trim() || !date) return
    const deadline: Deadline = { id: generateId(), label: label.trim(), date, note: note.trim() }
    setDeadlines((prev) => [...prev, deadline])
    setLabel('')
    setDate('')
    setNote('')
  }

  const removeDeadline = (id: string) => setDeadlines((prev) => prev.filter((d) => d.id !== id))

  const shiftMonth = (delta: number) =>
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))

  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma formation</div>
        <h1>Calendrier</h1>
        <p className="page-lede">
          Vos dates de formation, de stage et d'examen (renseignées dans Accueil) s'affichent automatiquement.
          Ajoutez vos propres échéances pour garder le rythme jusqu'à la soutenance.
        </p>
      </header>

      <MonthCalendar
        monthDate={visibleMonth}
        events={[...profilEvents, ...customEvents]}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={() => setVisibleMonth(startOfMonth(new Date()))}
      />

      <div className="card calendrier-form">
        <h3>Date d'examen</h3>
        <p className="calendrier-hint">
          Purement informative : partagée avec la fiche Accueil, jamais insérée dans le document Word exporté.
        </p>
        <div className="field calendrier-exam-field">
          <input
            type="date"
            value={profil.dateExamen}
            onChange={(e) => setProfil((prev) => ({ ...prev, dateExamen: e.target.value }))}
          />
          {profil.dateExamen && <span className="deadline-countdown">{formatCountdown(profil.dateExamen)}</span>}
        </div>
      </div>

      <div className="card calendrier-form">
        <h3>Ajouter une échéance personnalisée</h3>
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
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : finir 30% du dossier" />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Note (optionnel)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précisions libres" />
        </div>
        <button className="btn btn-primary" onClick={addDeadline} disabled={!label.trim() || !date}>
          Ajouter
        </button>
      </div>

      <div className="deadline-list">
        {sorted.length === 0 && <div className="card calendrier-empty">Aucune échéance personnalisée pour l'instant.</div>}
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
