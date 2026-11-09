import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'
import type { LienMcdEdgeType } from '../types'

/** Distance (px) du nœud entité à laquelle s'affiche la cardinalité. */
const DECALAGE_CARDINALITE = 26

type Props = EdgeProps<LienMcdEdgeType>

/**
 * Branche d'une association vers une entité (MCD) : trait droit, cardinalité « min,max »
 * près de l'entité, nom de rôle au milieu. Source = association, cible = entité.
 * `data.decalage` écarte les liens parallèles (association réflexive : deux branches vers la même entité).
 */
export function LienMcdEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }: Props) {
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const longueur = Math.hypot(dx, dy) || 1
  const decalage = data?.decalage ?? 0
  const nx = (-dy / longueur) * decalage
  const ny = (dx / longueur) * decalage

  const sx = sourceX + nx
  const sy = sourceY + ny
  const tx = targetX + nx
  const ty = targetY + ny

  const cardX = tx - (dx / longueur) * DECALAGE_CARDINALITE
  const cardY = ty - (dy / longueur) * DECALAGE_CARDINALITE
  const milieuX = (sx + tx) / 2
  const milieuY = (sy + ty) / 2

  return (
    <>
      <BaseEdge id={id} path={`M ${sx} ${sy} L ${tx} ${ty}`} style={{ strokeWidth: selected ? 2.5 : 1.5 }} />
      <EdgeLabelRenderer>
        {data && (
          <div className="schema-edge-cardinalite" style={{ transform: `translate(-50%, -50%) translate(${cardX}px, ${cardY}px)` }}>
            {data.min},{data.max}
          </div>
        )}
        {data?.role && (
          <div className="schema-edge-label" style={{ transform: `translate(-50%, -50%) translate(${milieuX}px, ${milieuY}px)` }}>
            {data.role}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
