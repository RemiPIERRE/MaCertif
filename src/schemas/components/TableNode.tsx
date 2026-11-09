import { useContext, useEffect } from 'react'
import { Handle, NodeResizer, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { resoudreStyle, type ElementStyle, type SchemaNode, type TableColonne } from '../types'
import { handleLigne } from '../lib/modele'
import { BarreDupliquer } from './BarreDupliquer'
import { NiveauContext } from './NiveauContext'
import './merise.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'table' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

const cleDe = (c: TableColonne) => (c.pk && c.reference ? 'PK, FK' : c.pk ? 'PK' : c.reference ? 'FK' : '')

function contraintesDe(c: TableColonne): string {
  const parties: string[] = []
  if (c.nonNull && !c.pk) parties.push('NN')
  if (c.unique) parties.push('UQ')
  if (c.autoIncrement) parties.push('AI')
  if (c.defaut.trim()) parties.push(`= ${c.defaut.trim()}`)
  return parties.join(' ')
}

/**
 * Table du MLD / MPD en affichage seul : toute l'édition se fait dans TableEditor (sous
 * le canevas), donc toute la surface du nœud est attrapable.
 *  - MLD : clé primaire soulignée, clé étrangère précédée de « # ».
 *  - MPD : colonnes progressives — clé, nom, type, contraintes — n'apparaissent que si au
 *    moins une ligne les renseigne.
 */
export function TableNode({ id, data, selected }: Props) {
  const niveau = useContext(NiveauContext)
  const updateNodeInternals = useUpdateNodeInternals()

  const colonnes = (data.colonnes ?? []).filter((c) => 'object' === typeof c && null !== c)
  const style: ElementStyle = resoudreStyle(data.style)
  const mpd = 'mpd' === niveau

  const afficherCle = mpd && colonnes.some((c) => c.pk || c.reference)
  const afficherType = mpd && colonnes.some((c) => c.type.trim())
  const afficherContraintes = mpd && colonnes.some((c) => contraintesDe(c))

  const gabarit = [
    afficherCle ? 'max-content' : null,
    'minmax(60px, 1fr)',
    afficherType ? 'max-content' : null,
    afficherContraintes ? 'max-content' : null,
  ]
    .filter(Boolean)
    .join(' ')

  // Les handles par ligne apparaissent / disparaissent / se déplacent avec les lignes.
  const signature = colonnes.map((c) => c.id).join('|')
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, signature, afficherCle, afficherType, afficherContraintes, updateNodeInternals])

  return (
    <div
      className={`schema-node schema-node-merise${selected ? ' selected' : ''}`}
      style={{ borderColor: style.couleurContour, color: style.couleurTexte, backgroundColor: style.couleurFondLigne }}
    >
      <BarreDupliquer id={id} />
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={44 + 28 * Math.max(1, colonnes.length)}
        handleClassName="schema-resize-handle"
        lineClassName="schema-resize-line"
      />

      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}

      <div className="schema-node-header" style={{ backgroundColor: style.couleurFondTitre }}>
        <span className="schema-node-titre" style={{ color: style.couleurNom }}>{data.nom || 'NOUVELLE TABLE'}</span>
      </div>

      <div className="schema-node-section" style={{ gridTemplateColumns: gabarit }}>
        {0 === colonnes.length ? (
          <div className="schema-node-empty">Aucun élément</div>
        ) : (
          colonnes.map((c) => (
            <div key={c.id} className="schema-ligne" style={{ backgroundColor: style.couleurFondLigne }}>
              {afficherCle && <span className="schema-cell schema-cell--cle">{cleDe(c)}</span>}

              <span className={`schema-cell schema-cell--nom${!mpd && c.pk ? ' is-identifiant' : ''}`}>
                {!mpd && c.reference ? '#' : ''}
                {c.nom || 'élément'}
              </span>

              {afficherType && <span className="schema-cell schema-cell--type">{c.type}</span>}

              {afficherContraintes && <span className="schema-cell schema-cell--contraintes">{contraintesDe(c)}</span>}

              <Handle type="source" position={Position.Left} id={handleLigne(c.id, 'gauche')} className="schema-merise-element-handle" />
              <Handle type="source" position={Position.Right} id={handleLigne(c.id, 'droite')} className="schema-merise-element-handle" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}