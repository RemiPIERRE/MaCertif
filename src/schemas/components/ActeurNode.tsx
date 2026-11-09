import { useContext, type CSSProperties } from 'react'
import { Handle, NodeResizer, NodeToolbar, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { SchemaNode } from '../types'
import { EditionContext } from './EditionContext'
import { Libelle } from './ActiviteNode'
import { PaletteCouleur } from './PaletteCouleur'
import './activite.css'
import './casutilisation.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'acteur' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/**
 * Acteur d'un diagramme de cas d'utilisation : bonhomme (acteur humain) ou rectangle «actor»
 * (système, service externe). Double-clic : nom dans la forme, palette de couleurs, forme et stéréotype.
 */
export function ActeurNode({ id, data, selected }: Props) {
  const { updateNodeData } = useReactFlow()
  const { editionId, fermer } = useContext(EditionContext)
  const edition = editionId === id
  const rectangle = 'rectangle' === data.forme
  const maj = (patch: Record<string, unknown>) => updateNodeData(id, patch)
  const style = data.couleur ? ({ '--ac': data.couleur } as CSSProperties) : undefined
  const stereotype = data.stereotype?.trim() || (rectangle ? 'actor' : '')

  return (
    <div
      className={`schema-activite schema-cu-acteur${rectangle ? ' is-rectangle' : ''}${selected ? ' selected' : ''}${edition ? ' is-edition' : ''}`}
      style={style}
      data-couleur={data.couleur ? '' : undefined}
    >
      {rectangle && <NodeResizer isVisible={selected} minWidth={90} minHeight={50} handleClassName="schema-resize-handle" lineClassName="schema-resize-line" />}
      <NodeToolbar isVisible={edition} position={Position.Top} offset={12}>
        <PaletteCouleur couleur={data.couleur} onChange={(couleur) => maj({ couleur })}>
          <select
            className="schema-cu-select nodrag nopan"
            value={rectangle ? 'rectangle' : 'bonhomme'}
            onChange={(e) => maj({ forme: 'rectangle' === e.target.value ? 'rectangle' : undefined })}
            aria-label="Forme de l'acteur"
            title="Forme de l'acteur"
          >
            <option value="bonhomme">Bonhomme</option>
            <option value="rectangle">Rectangle</option>
          </select>
          <input
            className="schema-cu-champ nodrag nopan"
            value={data.stereotype ?? ''}
            onChange={(e) => maj({ stereotype: e.target.value || undefined })}
            onKeyDown={(e) => {
              e.stopPropagation()
              if ('Enter' === e.key || 'Escape' === e.key) fermer()
            }}
            placeholder="stéréotype"
            aria-label="Stéréotype"
            title="Stéréotype affiché entre « »"
          />
        </PaletteCouleur>
      </NodeToolbar>
      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}
      {rectangle ? (
        <div className="schema-cu-acteur-rect">
          {'' !== stereotype && <span className="schema-activite-stereotype">«{stereotype}»</span>}
          <Libelle valeur={data.nom} placeholder="Acteur" edition={edition} onChange={(v) => maj({ nom: v })} onFin={fermer} />
        </div>
      ) : (
        <div className="schema-cu-acteur-corps">
          <svg className="schema-cu-bonhomme" viewBox="0 0 40 60" aria-hidden="true">
            <circle cx="20" cy="9" r="7" />
            <path d="M20 16V38M5 25H35M20 38L8 57M20 38L32 57" />
          </svg>
          {'' !== stereotype && <span className="schema-activite-stereotype">«{stereotype}»</span>}
          <Libelle valeur={data.nom} placeholder="Acteur" edition={edition} onChange={(v) => maj({ nom: v })} onFin={fermer} />
        </div>
      )}
    </div>
  )
}