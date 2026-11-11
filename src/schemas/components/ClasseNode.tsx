import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { resoudreStyle, VISIBILITE_SYMBOLES, type ElementStyle, type SchemaNode } from '../types'
import { BarreDupliquer } from './BarreDupliquer'
import './merise.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'classe' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/** Classe UML en affichage seul (édition : ClasseEditor sous le canevas) — trois compartiments :
 * nom (+ stéréotype éventuel), attributs, méthodes. Même mécanique que les tables MLD/MPD. */
export function ClasseNode({ id, data, selected }: Props) {
  const attributs = (data.attributs ?? []).filter((a) => 'object' === typeof a && null !== a)
  const methodes = (data.methodes ?? []).filter((m) => 'object' === typeof m && null !== m)
  const style: ElementStyle = resoudreStyle(data.style)
  const gabarit = 'max-content minmax(60px, 1fr) max-content'
  // « Sans méthode » ne masque que le compartiment VIDE (message « Aucune méthode », gênant à
  // l'impression) : dès qu'une méthode existe, le compartiment réapparaît de lui-même.
  const masquerMethodes = Boolean(data.sansMethode) && 0 === methodes.length
  const nbLignes = Math.max(1, attributs.length) + (masquerMethodes ? 0 : Math.max(1, methodes.length))

  return (
    <div
      className={`schema-node schema-node-merise schema-node-classe${selected ? ' selected' : ''}`}
      style={{ borderColor: style.couleurContour, color: style.couleurTexte, backgroundColor: style.couleurFondLigne }}
    >
      <BarreDupliquer id={id} />
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={(data.stereotype ? 60 : 44) + 28 * nbLignes}
        handleClassName="schema-resize-handle"
        lineClassName="schema-resize-line"
      />

      {COTES.map((position) => (
        <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />
      ))}

      <div className="schema-node-header" style={{ backgroundColor: style.couleurFondTitre }}>
        <span className="schema-node-titre" style={{ color: style.couleurNom }}>
          {data.stereotype && <small className="schema-node-stereotype">«{data.stereotype}»</small>}
          <span className={data.abstraite ? 'is-abstraite' : undefined}>{data.nom || 'NouvelleClasse'}</span>
        </span>
      </div>

      <div className="schema-node-section schema-node-section--classe" style={{ gridTemplateColumns: gabarit }}>
        {0 === attributs.length ? (
          <div className="schema-node-empty">Aucun attribut</div>
        ) : (
          attributs.map((a) => (
            <div key={a.id} className="schema-ligne" style={{ backgroundColor: style.couleurFondLigne }}>
              <span className="schema-cell schema-cell--visibilite">{VISIBILITE_SYMBOLES[a.visibilite]}</span>
              <span className={`schema-cell schema-cell--nom${a.statique ? ' is-souligne' : ''}`}>{a.nom || 'attribut'}</span>
              <span className="schema-cell schema-cell--type">{a.type.trim() ? `: ${a.type}` : ''}</span>
            </div>
          ))
        )}
      </div>

      {!masquerMethodes && (
        <div className="schema-node-section schema-node-section--classe schema-node-section--methodes" style={{ gridTemplateColumns: gabarit }}>
          {0 === methodes.length ? (
            <div className="schema-node-empty">Aucune méthode</div>
          ) : (
            methodes.map((m) => (
              <div key={m.id} className="schema-ligne" style={{ backgroundColor: style.couleurFondLigne }}>
                <span className="schema-cell schema-cell--visibilite">{VISIBILITE_SYMBOLES[m.visibilite]}</span>
                <span className={`schema-cell schema-cell--nom${m.statique ? ' is-souligne' : ''}${m.abstraite ? ' is-abstraite' : ''}`}>
                  {(m.nom || 'methode') + `(${m.parametres})`}
                </span>
                <span className="schema-cell schema-cell--type">{m.typeRetour.trim() ? `: ${m.typeRetour}` : ''}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
