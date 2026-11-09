import { useContext, type CSSProperties } from 'react'
import { Handle, NodeResizer, NodeToolbar, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { SchemaNode } from '../types'
import { EditionContext } from './EditionContext'
import { Libelle } from './ActiviteNode'
import { PaletteCouleur } from './PaletteCouleur'
import './activite.css'
import './casutilisation.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'casUtilisation' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/**
 * Cas d'utilisation : ellipse portant le nom ; une liste de points d'extension (cibles d'un
 * «extend») apparaît sous un trait. Double-clic : nom dans la forme, palette et points d'extension.
 */
export function CasUtilisationNode({ id, data, selected }: Props) {
  const { updateNodeData } = useReactFlow()
  const { editionId, fermer } = useContext(EditionContext)
  const edition = editionId === id
  const maj = (patch: Record<string, unknown>) => updateNodeData(id, patch)
  const style = data.couleur ? ({ '--ac': data.couleur } as CSSProperties) : undefined
  const points = data.pointsExtension ?? []

  return (
    <div
      className={`schema-activite schema-cu-cas${selected ? ' selected' : ''}${edition ? ' is-edition' : ''}`}
      style={style}
      data-couleur={data.couleur ? '' : undefined}
    >
      <NodeResizer isVisible={selected} minWidth={120} minHeight={60} handleClassName="schema-resize-handle" lineClassName="schema-resize-line" />
      <NodeToolbar isVisible={edition} position={Position.Top} offset={12}>
        <PaletteCouleur couleur={data.couleur} onChange={(couleur) => maj({ couleur })} />
      </NodeToolbar>
      <NodeToolbar isVisible={edition} position={Position.Bottom} offset={12}>
        <label className="schema-cu-points nodrag nopan nowheel" onMouseDown={(e) => e.stopPropagation()}>
          <span>Points d'extension (un par ligne)</span>
          <textarea
            rows={3}
            value={points.join('\n')}
            placeholder="paiement en ligne"
            spellCheck={false}
            onChange={(e) => {
              const lignes = e.target.value.split('\n')
              maj({ pointsExtension: lignes.some((l) => '' !== l) ? lignes : undefined })
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if ('Escape' === e.key) fermer()
            }}
          />
        </label>
      </NodeToolbar>
      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}
      <div className="schema-cu-ellipse" />
      <div className="schema-cu-cas-contenu">
        <Libelle valeur={data.nom} placeholder="Cas d'utilisation" edition={edition} onChange={(v) => maj({ nom: v })} onFin={fermer} />
        {points.some((p) => '' !== p.trim()) && (
          <div className="schema-cu-points-liste">
            <span className="schema-cu-points-titre">extension points</span>
            {points
              .filter((p) => '' !== p.trim())
              .map((p, i) => (
                <span key={i}>{p}</span>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}