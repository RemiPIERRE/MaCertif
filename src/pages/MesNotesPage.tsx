import { useLocalStorage } from '../lib/useLocalStorage'
import { generateId } from '../lib/id'
import { STORAGE_KEYS, type Note } from '../types/storage'
import './MesNotesPage.css'

const COLORS = ['forest', 'amber', 'red', 'plain'] as const

export function MesNotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>(STORAGE_KEYS.notes, [])

  const addNote = () => {
    const note: Note = { id: generateId(), text: '', color: 'forest', createdAt: new Date().toISOString() }
    setNotes((prev) => [note, ...prev])
  }

  const updateNote = (id: string, patch: Partial<Note>) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id))

  return (
    <div>
      <header className="page-header notes-header">
        <div>
          <div className="page-eyebrow">Ma formation</div>
          <h1>Mes notes</h1>
          <p className="page-lede">Un bloc-notes libre pour y jeter vos idées en vrac, sans structure imposée.</p>
        </div>
        <button className="btn btn-primary" onClick={addNote}>
          + Nouvelle note
        </button>
      </header>

      {notes.length === 0 ? (
        <div className="card notes-empty">Aucune note pour l'instant. Créez-en une pour commencer.</div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className={`note-card note-${note.color}`}>
              <div className="note-card-toolbar">
                <div className="note-colors">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`note-color-dot note-dot-${color}${note.color === color ? ' active' : ''}`}
                      aria-label={`Couleur ${color}`}
                      onClick={() => updateNote(note.id, { color })}
                    />
                  ))}
                </div>
                <button className="note-delete" onClick={() => deleteNote(note.id)} aria-label="Supprimer la note">
                  ×
                </button>
              </div>
              <textarea
                value={note.text}
                onChange={(e) => updateNote(note.id, { text: e.target.value })}
                placeholder="Écrivez quelque chose…"
                autoFocus={note.text === ''}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
