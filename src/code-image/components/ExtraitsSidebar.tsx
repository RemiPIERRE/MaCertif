import { useState } from 'react'
import type { Extrait, TacheLiee } from '../types'

interface Props {
  extraits: Extrait[]
  actifId: string | null
  taches: TacheLiee[]
  onSelect: (id: string) => void
  onCreate: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function ExtraitsSidebar({ extraits, actifId, taches, onSelect, onCreate, onDuplicate, onDelete }: Props) {
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const libelleTache = (id: string | null) => (id ? (taches.find((t) => t.id === id)?.label ?? id) : null)

  return (
    <aside className="ci-side" aria-label="Mes extraits">
      <div className="ci-side-head">
        <h3>Mes extraits</h3>
        <span className="ci-count">{extraits.length}</span>
      </div>
      <ul className="ci-list">
        {extraits.map((e) => {
          const actif = e.id === actifId
          const lien = libelleTache(e.tacheId)
          return (
            <li key={e.id} className={actif ? 'is-active' : ''}>
              <button type="button" className="ci-list-main" onClick={() => onSelect(e.id)} aria-current={actif ? 'true' : undefined}>
                <span className="ci-list-name">{e.nom}</span>
                {lien && <span className="ci-list-task">↳ {lien}</span>}
              </button>
              {actif && (
                <span className="ci-list-actions">
                  <button type="button" className="ci-mini" onClick={() => onDuplicate(e.id)} title="Dupliquer cet extrait">
                    Dupliquer
                  </button>
                  {aSupprimer === e.id ? (
                    <button
                      type="button"
                      className="ci-mini ci-mini--danger"
                      onClick={() => {
                        onDelete(e.id)
                        setASupprimer(null)
                      }}
                      onBlur={() => setASupprimer(null)}
                      autoFocus
                    >
                      Confirmer ?
                    </button>
                  ) : (
                    <button type="button" className="ci-mini" onClick={() => setASupprimer(e.id)} title="Supprimer cet extrait">
                      Supprimer
                    </button>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <button type="button" className="ci-btn ci-btn--ghost ci-side-new" onClick={onCreate}>
        + Nouvel extrait
      </button>
    </aside>
  )
}
