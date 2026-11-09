import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { CardinaliteFk, LienFkEdgeType } from '../types'

const MARQUEURS: Record<CardinaliteFk, string> = {
  un: 'url(#schema-marker-sql-un)',
  'zero-un': 'url(#schema-marker-sql-zero-un)',
  'zero-n': 'url(#schema-marker-sql-zero-n)',
  'un-n': 'url(#schema-marker-sql-un-n)',
}

type Props = EdgeProps<LienFkEdgeType>

/**
 * Lien de clé étrangère, déduit des colonnes (voir aretesFk). Source = table enfant,
 * cible = table parent. MLD : flèche enfant → parent. MPD : pattes d'oie aux deux extrémités
 * (parent : « un » ou « zéro ou un » selon NOT NULL ; enfant : « zéro ou plusieurs », ou
 * « zéro ou un » si la colonne est UNIQUE).
 */
export function FkEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: Props) {
  const [chemin] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 })
  const simple = 'simple' === data?.styleLien
  const patte = !simple && 'patte' === data?.notation

  return (
    <BaseEdge
      id={id}
      path={chemin}
      markerStart={patte && data ? MARQUEURS[data.enfant] : undefined}
      markerEnd={simple ? undefined : patte && data ? MARQUEURS[data.parent] : 'url(#schema-marker-fleche)'}
      style={{ strokeWidth: selected ? 2.5 : 1.5 }}
    />
  )
}
