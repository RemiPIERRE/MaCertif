import { useContext, type CSSProperties, type ReactNode } from 'react'
import { Handle, NodeResizer, NodeToolbar, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { ActiviteForme, SchemaNode } from '../types'
import { ChampTexteAuto } from './ChampTexteAuto'
import { EditionContext } from './EditionContext'
import { PaletteCouleur } from './PaletteCouleur'
import './activite.css'

type Props = NodeProps<Extract<SchemaNode, { type: 'activite' }>>

const COTES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

const PLACEHOLDERS: Partial<Record<ActiviteForme, string>> = {
  action: 'Action',
  appel: 'Activité appelée',
  decision: '?',
  envoi: 'Signal',
  reception: 'Signal',
  temps: 'Délai',
  objet: 'Objet : Type',
  connecteur: 'A',
  note: 'Note',
  cadre: 'Activité',
  couloir: 'Acteur',
  structure: 'Nœud structuré',
  expansion: 'Région d’expansion',
  interruptible: 'Région interruptible',
  barre: '{joinSpec = …}',
}

/**
 * Texte d'une forme : affiché tel quel (la forme reste attrapable partout) ; un double-clic
 * l'ouvre en édition — Entrée valide, Maj+Entrée ajoute une ligne, Échap ferme.
 */
export function Libelle({
  valeur,
  placeholder,
  edition,
  onChange,
  onFin,
  className = '',
}: {
  valeur: string
  placeholder: string
  edition: boolean
  onChange: (valeur: string) => void
  onFin: () => void
  className?: string
}) {
  if (edition) {
    return (
      <ChampTexteAuto
        className={`schema-activite-saisie nodrag nowheel nopan ${className}`}
        value={valeur}
        placeholder={placeholder}
        autoFocus
        spellCheck={false}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation() // ni suppression du nœud, ni raccourcis du canevas pendant la saisie
          if ('Escape' === e.key || ('Enter' === e.key && !e.shiftKey)) {
            e.preventDefault()
            onFin()
          }
        }}
      />
    )
  }
  return <div className={`schema-activite-libelle ${className}`}>{'' !== valeur ? valeur : <span className="schema-activite-vide">{placeholder}</span>}</div>
}

/** Forme dessinée en SVG étiré (pentagones des signaux) : le trait garde son épaisseur. */
function Polygone({ points }: { points: string }) {
  return (
    <svg className="schema-activite-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={points} vectorEffect="non-scaling-stroke" className="schema-activite-forme" />
    </svg>
  )
}

/**
 * Nœud « diagramme d'activité » : un seul type React Flow, une vingtaine de rendus selon
 * `data.forme` (voir types.ts). Un clic sélectionne (déplacer, redimensionner) ; un double-clic
 * ouvre l'édition : texte directement dans la forme, et palette de couleurs au-dessus.
 */
export function ActiviteNode({ id, data, selected, width, height }: Props) {
  const { updateNodeData, setNodes } = useReactFlow()
  const { editionId, fermer } = useContext(EditionContext)
  const edition = editionId === id
  const forme = data.forme
  const maj = (patch: Record<string, unknown>) => updateNodeData(id, patch)
  const texte = (className?: string, placeholder = PLACEHOLDERS[forme] ?? '') => (
    <Libelle valeur={data.texte} placeholder={placeholder} edition={edition} onChange={(v) => maj({ texte: v })} onFin={fermer} className={className} />
  )

  const style = data.couleur ? ({ '--ac': data.couleur } as CSSProperties) : undefined
  const classes = `schema-activite schema-activite--${forme}${selected ? ' selected' : ''}${edition ? ' is-edition' : ''}`

  /** Pivote une barre ou un couloir : largeur et hauteur s'échangent. */
  const pivoter = () => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n
        const l = n.width ?? n.measured?.width ?? 100
        const h = n.height ?? n.measured?.height ?? 100
        const data2 = 'couloir' === forme ? { ...n.data, orientation: 'horizontal' === (n.data as { orientation?: string }).orientation ? undefined : 'horizontal' } : n.data
        return { ...n, width: h, height: l, data: data2, measured: undefined } as typeof n
      }),
    )
  }
  const paletteExtra: ReactNode =
    'barre' === forme || 'couloir' === forme ? (
      <button type="button" className="schema-palette-bouton" onClick={pivoter} title="Pivoter (horizontal / vertical)" aria-label="Pivoter">
        ⟳
      </button>
    ) : null

  const palette = (
    <NodeToolbar isVisible={edition} position={Position.Top} offset={12}>
      <PaletteCouleur couleur={data.couleur} onChange={(couleur) => maj({ couleur })}>
        {paletteExtra}
      </PaletteCouleur>
    </NodeToolbar>
  )
  const handles = COTES.map((position) => <Handle key={position} type="source" position={position} id={position} className="schema-node-handle" />)
  const enveloppe = (contenu: ReactNode, redimensionnable?: { minWidth: number; minHeight: number; ratio?: boolean }) => (
    <div className={classes} style={style} data-couleur={data.couleur ? '' : undefined} title={undefined}>
      {redimensionnable && (
        <NodeResizer
          isVisible={selected}
          minWidth={redimensionnable.minWidth}
          minHeight={redimensionnable.minHeight}
          keepAspectRatio={redimensionnable.ratio}
          handleClassName="schema-resize-handle"
          lineClassName="schema-resize-line"
        />
      )}
      {palette}
      {handles}
      {contenu}
    </div>
  )

  switch (forme) {
    case 'debut':
      return enveloppe(<div className="schema-activite-point" />)

    case 'fin':
      return enveloppe(
        <div className="schema-activite-anneau">
          <div className="schema-activite-point" />
        </div>,
      )

    case 'finFlux':
      return enveloppe(
        <svg className="schema-activite-croix" viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="15" r="12" className="schema-activite-forme" />
          <path d="M 9 9 L 21 21 M 21 9 L 9 21" className="schema-activite-trait" />
        </svg>,
      )

    case 'decision':
      return enveloppe(
        <>
          <div className="schema-activite-losange" />
          {texte('schema-activite-centre')}
        </>,
        { minWidth: 70, minHeight: 70, ratio: true },
      )

    case 'fusion':
      return enveloppe(<div className="schema-activite-losange" />, { minWidth: 40, minHeight: 40, ratio: true })

    case 'barre': {
      const horizontale = (width ?? 120) >= (height ?? 10)
      return enveloppe(
        <>
          <div className="schema-activite-barre" />
          {(edition || '' !== data.texte) && <div className={`schema-activite-barre-texte${horizontale ? '' : ' is-vertical'}`}>{texte()}</div>}
        </>,
        { minWidth: 8, minHeight: 8 },
      )
    }

    case 'connecteur':
      return enveloppe(<div className="schema-activite-cercle">{texte('schema-activite-centre')}</div>, { minWidth: 26, minHeight: 26, ratio: true })

    case 'action':
    case 'appel':
      return enveloppe(
        <>
          {texte('schema-activite-centre')}
          {'appel' === forme && (
            <svg className="schema-activite-rateau" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M 8 1 L 8 15 M 3 6 L 13 6 M 3 6 L 3 10 M 13 6 L 13 10" className="schema-activite-trait" />
            </svg>
          )}
        </>,
        { minWidth: 100, minHeight: 44 },
      )

    case 'envoi':
      return enveloppe(
        <>
          <Polygone points="0,0 86,0 100,50 86,100 0,100" />
          {texte('schema-activite-centre')}
        </>,
        { minWidth: 100, minHeight: 44 },
      )

    case 'reception':
      return enveloppe(
        <>
          <Polygone points="0,0 100,0 100,100 0,100 14,50" />
          {texte('schema-activite-centre')}
        </>,
        { minWidth: 100, minHeight: 44 },
      )

    case 'temps':
      return enveloppe(
        <>
          <svg className="schema-activite-sablier" viewBox="0 0 24 34" aria-hidden="true">
            <path d="M 3 2 L 21 2 L 12 17 L 21 32 L 3 32 L 12 17 Z" className="schema-activite-forme" />
          </svg>
          <div className="schema-activite-sous-texte">{texte()}</div>
        </>,
      )

    case 'objet':
      return enveloppe(
        <div className="schema-activite-objet">
          {data.stereotype && <div className="schema-activite-stereotype">{`«${data.stereotype}»`}</div>}
          {texte('schema-activite-centre')}
          {(edition || data.etat) && (
            <div className="schema-activite-annexe">
              {edition ? (
                <input className="schema-activite-saisie schema-activite-mini nodrag nopan" value={data.etat ?? ''} placeholder="état" onChange={(e) => maj({ etat: e.target.value })} onKeyDown={(e) => { e.stopPropagation(); if ('Escape' === e.key || 'Enter' === e.key) fermer() }} />
              ) : (
                `[${data.etat}]`
              )}
            </div>
          )}
          {(edition || data.contrainte) && (
            <div className="schema-activite-annexe">
              {edition ? (
                <input className="schema-activite-saisie schema-activite-mini nodrag nopan" value={data.contrainte ?? ''} placeholder="{upperBound = 3}" onChange={(e) => maj({ contrainte: e.target.value })} onKeyDown={(e) => { e.stopPropagation(); if ('Escape' === e.key || 'Enter' === e.key) fermer() }} />
              ) : (
                data.contrainte
              )}
            </div>
          )}
        </div>,
        { minWidth: 90, minHeight: 40 },
      )

    case 'broche':
      return enveloppe(<div className="schema-activite-broche" />)

    case 'note':
      return enveloppe(
        <>
          <svg className="schema-activite-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="0,0 88,0 100,16 100,100 0,100" vectorEffect="non-scaling-stroke" className="schema-activite-forme" />
            <polyline points="88,0 88,16 100,16" vectorEffect="non-scaling-stroke" className="schema-activite-forme" style={{ fill: 'none' }} />
          </svg>
          {texte('schema-activite-note-texte')}
        </>,
        { minWidth: 90, minHeight: 44 },
      )

    default: {
      // Zones : cadre d'activité, couloir, régions.
      const mode = data.mode ?? 'iterative'
      const etiquette =
        'cadre' === forme ? (
          <div className="schema-zone-entete schema-zone-tag">
            <span className="schema-zone-prefixe">act</span> {texte()}
          </div>
        ) : 'couloir' === forme ? (
          <div className="schema-zone-entete schema-zone-couloir-titre">{texte('schema-activite-centre')}</div>
        ) : (
          <div className="schema-zone-entete schema-zone-etiquette">
            {'structure' === forme && <span className="schema-zone-prefixe">«structured»</span>}
            {'expansion' === forme && (
              <select className="schema-zone-mode nodrag nopan" value={mode} onChange={(e) => maj({ mode: e.target.value })} disabled={!edition} title="Mode de la région d'expansion" onMouseDown={(e) => e.stopPropagation()}>
                <option value="iterative">«iterative»</option>
                <option value="parallel">«parallel»</option>
                <option value="stream">«stream»</option>
              </select>
            )}
            {'interruptible' === forme && <span className="schema-zone-prefixe">«interruptible»</span>}
            {texte()}
          </div>
        )
      return (
        <div className={`${classes} schema-zone${'horizontal' === data.orientation ? ' is-horizontal' : ''}`} style={style} data-couleur={data.couleur ? '' : undefined}>
          <NodeResizer isVisible={selected} minWidth={140} minHeight={100} handleClassName="schema-resize-handle" lineClassName="schema-resize-line" />
          {palette}
          <div className="schema-zone-cadre" />
          <i className="schema-zone-bord schema-zone-bord--haut" />
          <i className="schema-zone-bord schema-zone-bord--bas" />
          <i className="schema-zone-bord schema-zone-bord--gauche" />
          <i className="schema-zone-bord schema-zone-bord--droite" />
          {'expansion' === forme && (
            <>
              <span className="schema-zone-marques schema-zone-marques--gauche" aria-hidden="true" />
              <span className="schema-zone-marques schema-zone-marques--droite" aria-hidden="true" />
            </>
          )}
          {etiquette}
        </div>
      )
    }
  }
}