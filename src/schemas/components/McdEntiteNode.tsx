import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { resoudreStyle, type ElementStyle, type SchemaNode } from '../types'
import { BarreDupliquer } from './BarreDupliquer'
import './merise.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'mcdEntite' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/** Entité du MCD en affichage seul (édition : McdEditor sous le canevas). L'identifiant est souligné. */
export function McdEntiteNode({ id, data, selected }: Props) {
  const proprietes = (data.proprietes ?? []).filter((p) => 'object' === typeof p && null !== p)
  const style: ElementStyle = resoudreStyle(data.style)
  const afficherType = proprietes.some((p) => p.type.trim())
  const gabarit = afficherType ? 'minmax(60px, 1fr) max-content' : 'minmax(60px, 1fr)'

  return (
    <div
      className={`schema-node schema-node-merise schema-node-mcd${selected ? ' selected' : ''}`}
      style={{ borderColor: style.couleurContour, color: style.couleurTexte, backgroundColor: style.couleurFondLigne }}
    >
      <BarreDupliquer id={id} />
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={44 + 28 * Math.max(1, proprietes.length)}
        handleClassName="schema-resize-handle"
        lineClassName="schema-resize-line"
      />

      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}

      <div className="schema-node-header" style={{ backgroundColor: style.couleurFondTitre }}>
        <span className="schema-node-titre" style={{ color: style.couleurNom }}>{data.nom || 'NOUVELLE ENTITÉ'}</span>
      </div>

      <div className="schema-node-section" style={{ gridTemplateColumns: gabarit }}>
        {0 === proprietes.length ? (
          <div className="schema-node-empty">Aucune propriété</div>
        ) : (
          proprietes.map((p) => (
            <div key={p.id} className="schema-ligne" style={{ backgroundColor: style.couleurFondLigne }}>
              <span className={`schema-cell schema-cell--nom${p.identifiant ? ' is-identifiant' : ''}`}>{p.nom || 'propriété'}</span>
              {afficherType && <span className="schema-cell schema-cell--type">{p.type}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}