import { useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { generateId } from '../lib/id'
import { STORAGE_KEYS, type CustomSiteRef } from '../types/storage'
import './AnnexRefPanel.css'

const KIND_LABEL: Record<CustomSiteRef['kind'], string> = {
  annexe: 'Annexe',
  inline: 'Image inline',
}

export function AnnexRefPanel({ taskId }: { taskId: string }) {
  const [refs, setRefs] = useLocalStorage<CustomSiteRef[]>(STORAGE_KEYS.siteCustomRefs, [])
  const [formOpen, setFormOpen] = useState(false)
  const [kind, setKind] = useState<CustomSiteRef['kind']>('annexe')
  const [label, setLabel] = useState('')

  const taskRefs = refs.filter((r) => r.taskId === taskId)

  const addRef = () => {
    if (!label.trim()) return
    const ref: CustomSiteRef = {
      id: generateId(),
      taskId,
      label: label.trim(),
      kind,
      ready: false,
      createdAt: new Date().toISOString(),
    }
    setRefs((prev) => [...prev, ref])
    setLabel('')
    setKind('annexe')
    setFormOpen(false)
  }

  const toggleReady = (id: string) =>
    setRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ready: !r.ready } : r)))

  const removeRef = (id: string) => setRefs((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className="card annex-ref-panel">
      <h3>Références Annexe / Image</h3>
      <p className="annex-ref-hint">
        Besoin d'une image ou d'une annexe à cet endroit précis, mais pas encore prête ? Ajoutez un pense-bête : il
        apparaîtra dans Mon site avec le statut « à préparer ».
      </p>

      {taskRefs.length > 0 && (
        <ul className="annex-ref-list">
          {taskRefs.map((ref) => (
            <li key={ref.id} className={`annex-ref-item${ref.ready ? ' ready' : ''}`}>
              <label className="annex-ref-checkbox">
                <input type="checkbox" checked={ref.ready} onChange={() => toggleReady(ref.id)} />
              </label>
              <span className="tag tag-violet annex-ref-kind">{KIND_LABEL[ref.kind]}</span>
              <span className="annex-ref-label">{ref.label}</span>
              <button className="btn-icon-delete" onClick={() => removeRef(ref.id)} aria-label="Supprimer">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {formOpen ? (
        <div className="annex-ref-form">
          <div className="annex-ref-kind-toggle">
            <button className={`btn ${kind === 'annexe' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('annexe')}>
              Annexe
            </button>
            <button className={`btn ${kind === 'inline' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('inline')}>
              Image inline
            </button>
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Capture du tableau de bord admin"
            autoFocus
          />
          <div className="annex-ref-form-actions">
            <button className="btn btn-primary" onClick={addRef} disabled={!label.trim()}>
              Ajouter
            </button>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary" onClick={() => setFormOpen(true)}>
          Ajouter une référence Annexe / Image
        </button>
      )}
    </div>
  )
}
