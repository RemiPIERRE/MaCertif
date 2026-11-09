import { useContext, type CSSProperties } from 'react'
import { Handle, NodeResizer, NodeToolbar, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { SchemaNode } from '../types'
import { EditionContext } from './EditionContext'
import { Libelle } from './ActiviteNode'
import { PaletteCouleur } from './PaletteCouleur'
import './activite.css'
import './casutilisation.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'cuStructure' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

const PLACEHOLDERS = { systeme: 'Système', paquetage: 'Paquetage', note: 'Note' } as const

/**
 * Éléments de structure d'un diagramme de cas d'utilisation : frontière du système (rectangle
 * titré qui contient les cas d'utilisation), paquetage (onglet + corps) et note (coin replié).
 * La frontière et le paquetage sont des zones : seuls leur titre et leur pourtour sont attrapables,
 * le reste laisse passer vers les formes posées dedans.
 */
export function CuStructureNode({ id, data, selected }: Props) {
  const { updateNodeData } = useReactFlow()
  const { editionId, fermer } = useContext(EditionContext)
  const edition = editionId === id
  const forme = data.forme
  const maj = (patch: Record<string, unknown>) => updateNodeData(id, patch)
  const style = data.couleur ? ({ '--ac': data.couleur } as CSSProperties) : undefined
  const classes = `schema-activite schema-cu-struct schema-cu-struct--${forme}${selected ? ' selected' : ''}${edition ? ' is-edition' : ''}`
  const texte = (className?: string) => (
    <Libelle valeur={data.texte} placeholder={PLACEHOLDERS[forme]} edition={edition} onChange={(v) => maj({ texte: v })} onFin={fermer} className={className} />
  )
  const palette = (
    <NodeToolbar isVisible={edition} position={Position.Top} offset={12}>
      <PaletteCouleur couleur={data.couleur} onChange={(couleur) => maj({ couleur })} />
    </NodeToolbar>
  )

  if ('note' === forme) {
    return (
      <div className={classes} style={style} data-couleur={data.couleur ? '' : undefined}>
        <NodeResizer isVisible={selected} minWidth={90} minHeight={44} handleClassName="schema-resize-handle" lineClassName="schema-resize-line" />
        {palette}
        {COTES.map((position) => (
          <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
        ))}
        <svg className="schema-activite-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="0,0 88,0 100,16 100,100 0,100" vectorEffect="non-scaling-stroke" className="schema-activite-forme" />
          <polyline points="88,0 88,16 100,16" vectorEffect="non-scaling-stroke" className="schema-activite-forme" style={{ fill: 'none' }} />
        </svg>
        {texte('schema-activite-note-texte')}
      </div>
    )
  }

  return (
    <div className={`${classes} schema-zone`} style={style} data-couleur={data.couleur ? '' : undefined}>
      <NodeResizer isVisible={selected} minWidth={160} minHeight={110} handleClassName="schema-resize-handle" lineClassName="schema-resize-line" />
      {palette}
      <div className="schema-zone-cadre" />
      <i className="schema-zone-bord schema-zone-bord--haut" />
      <i className="schema-zone-bord schema-zone-bord--bas" />
      <i className="schema-zone-bord schema-zone-bord--gauche" />
      <i className="schema-zone-bord schema-zone-bord--droite" />
      {'systeme' === forme ? (
        <div className="schema-zone-entete schema-cu-titre">{texte('schema-activite-centre')}</div>
      ) : (
        <div className="schema-zone-entete schema-cu-onglet">{texte()}</div>
      )}
    </div>
  )
}
