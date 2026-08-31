import './MonthCalendar.css'

export interface CalendarEvent {
  date: string
  label: string
  kind: 'profil' | 'custom'
}

interface MonthCalendarProps {
  monthDate: Date
  events: CalendarEvent[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function MonthCalendar({ monthDate, events, onPrev, onNext, onToday }: MonthCalendarProps) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const event of events) {
    const date = new Date(event.date)
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month) continue
    const day = date.getDate()
    if (!eventsByDay.has(day)) eventsByDay.set(day, [])
    eventsByDay.get(day)!.push(event)
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div className="card month-calendar">
      <div className="month-calendar-header">
        <button className="btn btn-ghost" onClick={onPrev} aria-label="Mois précédent">
          ←
        </button>
        <div className="month-calendar-title">
          <span className="month-calendar-title-text">
            {monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-ghost month-calendar-today" onClick={onToday}>
            Aujourd'hui
          </button>
        </div>
        <button className="btn btn-ghost" onClick={onNext} aria-label="Mois suivant">
          →
        </button>
      </div>

      <div className="month-calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="month-calendar-grid">
        {cells.map((day, i) => (
          <div key={i} className={`month-calendar-cell${day === null ? ' empty' : ''}${day && isToday(day) ? ' today' : ''}`}>
            {day !== null && (
              <>
                <div className="month-calendar-daynum">{day}</div>
                <div className="month-calendar-events">
                  {(eventsByDay.get(day) ?? []).map((event, idx) => (
                    <div key={idx} className={`month-calendar-event event-${event.kind}`} title={event.label}>
                      {event.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="month-calendar-legend">
        <span>
          <i className="legend-dot legend-profil" /> Dates clés (Accueil)
        </span>
        <span>
          <i className="legend-dot legend-custom" /> Échéances personnalisées
        </span>
      </div>
    </div>
  )
}
