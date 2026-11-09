import { useEffect, useRef, useState } from 'react'
import type { Diagramme, FlowKind } from '../types'
import { DIAGRAM_KIND_LABELS } from '../types'

const BADGE_LABELS: Record<FlowKind | 'sequence', string> = {
  mcd: 'MCD',
  mld: 'MLD',
  mpd: 'MPD',
  casUtilisation: "Cas d'util.",
  activite: 'Activité',
  sequence: 'Séquence',
}

/** Ordre du menu « Nouveau schéma » = ordre des clés de DIAGRAM_KIND_LABELS (voir types.ts). */
const KINDS_MENU = Object.keys(DIAGRAM_KIND_LABELS) as (FlowKind | 'sequence')[]

interface Props {
  diagrammes: Diagramme[]
  actifId: string | null
  onSelect: (id: string) => void
  onRename: (id: string, nom: string) => void
  onCreate: (kind: FlowKind | 'sequence') => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function SchemasSidebar({ diagrammes, actifId, onSelect, onRename, onCreate, onDuplicate, onDelete }: Props) {
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOuvert) return
    const fermerSiExterieur = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOuvert(false)
    }
    document.addEventListener('mousedown', fermerSiExterieur)
    return () => document.removeEventListener('mousedown', fermerSiExterieur)
  }, [menuOuvert])

  return (
    <aside className="schema-side" aria-label="Mes schémas">
      <div className="schema-side-head">
        <h3>Mes schémas</h3>
        <span className="schema-count">{diagrammes.length}</span>
      </div>
      <ul className="schema-list">
        {diagrammes.map((d) => {
          const actif = d.id === actifId
          return (
            <li key={d.id} className={actif ? 'is-active' : ''}>
              {actif ? (
                <input
                  className="schema-list-rename"
                  value={d.nom}
                  onChange={(e) => onRename(d.id, e.target.value)}
                  aria-label="Nom du schéma"
                />
              ) : (
                <button type="button" className="schema-list-main" onClick={() => onSelect(d.id)}>
                  {d.nom}
                  <span className="schema-list-badge">{BADGE_LABELS[d.contenu.kind]}</span>
                </button>
              )}
              {actif && (
                <span className="schema-list-actions">
                  <button type="button" className="schema-mini" onClick={() => onDuplicate(d.id)} title="Dupliquer ce schéma">
                    Dupliquer
                  </button>
                  {aSupprimer === d.id ? (
                    <button
                      type="button"
                      className="schema-mini schema-mini--danger"
                      onClick={() => {
                        onDelete(d.id)
                        setASupprimer(null)
                      }}
                      onBlur={() => setASupprimer(null)}
                      autoFocus
                    >
                      Confirmer ?
                    </button>
                  ) : (
                    <button type="button" className="schema-mini" onClick={() => setASupprimer(d.id)} title="Supprimer ce schéma">
                      Supprimer
                    </button>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <div className="schema-add-menu schema-side-new" ref={menuRef}>
        <button type="button" className="schema-btn schema-btn--ghost" onClick={() => setMenuOuvert((o) => !o)}>
          + Nouveau schéma ▾
        </button>
        {menuOuvert && (
          <div className="schema-add-menu-dropdown schema-add-menu-dropdown--haut">
            {KINDS_MENU.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  onCreate(kind)
                  setMenuOuvert(false)
                }}
              >
                {DIAGRAM_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}