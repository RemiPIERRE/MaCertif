import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { resoudreStyle, type ElementStyle, type SchemaNode } from '../types'
import { BarreDupliquer } from './BarreDupliquer'
import './merise.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'mcdAssociation' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/** Association du MCD : rectangle arrondi avec son nom, puis ses propriétés éventuelles. */
export function McdAssociationNode({ id, data, selected }: Props) {
  const proprietes = (data.proprietes ?? []).filter((p) => 'object' === typeof p && null !== p)
  const style: ElementStyle = resoudreStyle(data.style)
  const afficherType = proprietes.some((p) => p.type.trim())
  const gabarit = afficherType ? 'minmax(60px, 1fr) max-content' : 'minmax(60px, 1fr)'

  return (
    <div
      className={`schema-node schema-node-merise schema-node-mcd-association${selected ? ' selected' : ''}`}
      style={{ borderColor: style.couleurContour, color: style.couleurTexte, backgroundColor: style.couleurFondLigne }}
    >
      <BarreDupliquer id={id} />
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={36 + 28 * proprietes.length}
        handleClassName="schema-resize-handle"
        lineClassName="schema-resize-line"
      />

      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}

      <div className="schema-node-header" style={{ backgroundColor: style.couleurFondTitre }}>
        <span className="schema-node-titre" style={{ color: style.couleurNom }}>{data.nom || 'ASSOCIATION'}</span>
      </div>

      {proprietes.length > 0 && (
        <div className="schema-node-section" style={{ gridTemplateColumns: gabarit }}>
          {proprietes.map((p) => (
            <div key={p.id} className="schema-ligne" style={{ backgroundColor: style.couleurFondLigne }}>
              <span className="schema-cell schema-cell--nom">{p.nom || 'propriété'}</span>
              {afficherType && <span className="schema-cell schema-cell--type">{p.type}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}