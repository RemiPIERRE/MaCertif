import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { RelationEdgeType } from '../types'
import { RELATION_STEREOTYPE_DEFAUT } from '../types'

/** Références vers les marqueurs définis une fois par <SchemaMarkers> (voir ce fichier
 * pour le détail des notations cas d'utilisation/activité). Association = ligne nue. */
const MARKER_END: Record<string, string | undefined> = {
  heritage: 'url(#schema-marker-heritage)',
  inclut: 'url(#schema-marker-fleche)',
  etend: 'url(#schema-marker-fleche)',
  flux: 'url(#schema-marker-fleche)',
  interruption: 'url(#schema-marker-fleche)',
  dependance: 'url(#schema-marker-fleche)',
}

/** Composition/agrégation (diagramme de classes) : losange côté « tout », à l'extrémité SOURCE
 * (⇄ Inverser échange les deux bouts si le sens posé n'est pas le bon) ; pas de pointe à l'autre bout. */
const MARKER_START: Record<string, string | undefined> = {
  composition: 'url(#schema-marker-composition)',
  agregation: 'url(#schema-marker-agregation)',
}

/** Inclusion/extension (cas d'utilisation) se notent par une flèche en pointillés, comme le lien d'une note. */
const POINTILLES = new Set(['inclut', 'etend', 'lien', 'dependance'])

/** Décalage (px, le long du segment source→cible) auquel afficher chaque cardinalité —
 * assez proche du nœud pour être lisible comme "appartenant" à cette extrémité. */
const DECALAGE_CARDINALITE = 28

type Props = EdgeProps<RelationEdgeType>

function cheminEclair(sx: number, sy: number, tx: number, ty: number, ux: number, uy: number, longueur: number): string {
  if (longueur < 48) return `M ${sx} ${sy} L ${tx} ${ty}`
  const mx = (sx + tx) / 2
  const my = (sy + ty) / 2
  const nx = -uy
  const ny = ux
  const p = (a: number, n: number) => `${mx + ux * a + nx * n} ${my + uy * a + ny * n}`
  return `M ${sx} ${sy} L ${p(-10, 0)} L ${p(-3, 8)} L ${p(3, -8)} L ${p(10, 0)} L ${tx} ${ty}`
}

export function RelationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: Props) {
  const relationType = data?.relationType ?? 'association'
  const [cheminDroit, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const longueur = Math.hypot(dx, dy) || 1
  // Flux d'interruption : trait droit coupé d'un éclair en son milieu.
  const edgePath = 'interruption' === relationType ? cheminEclair(sourceX, sourceY, targetX, targetY, dx / longueur, dy / longueur, longueur) : cheminDroit
  const cardSrcX = sourceX + (dx / longueur) * DECALAGE_CARDINALITE
  const cardSrcY = sourceY + (dy / longueur) * DECALAGE_CARDINALITE
  const cardDstX = targetX - (dx / longueur) * DECALAGE_CARDINALITE
  const cardDstY = targetY - (dy / longueur) * DECALAGE_CARDINALITE

  // Flux d'activité : le libellé est une garde, notée entre crochets (sauf {poids}, «stéréotype» ou [garde] déjà saisis).
  const brut = data?.label?.trim() ?? ''
  const libelle = 'flux' === relationType && '' !== brut && !/^[[{«]/.test(brut) ? `[${brut}]` : data?.label || RELATION_STEREOTYPE_DEFAUT[relationType]

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={MARKER_START[relationType]}
        markerEnd={MARKER_END[relationType]}
        style={{ strokeWidth: selected ? 2.5 : 1.5, strokeDasharray: POINTILLES.has(relationType) ? '6 4' : undefined }}
      />
      <EdgeLabelRenderer>
        {(libelle || ('etend' === relationType && (data?.condition?.trim() || data?.pointExtension?.trim()))) && (
          <div
            className="schema-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {libelle}
            {'etend' === relationType && data?.condition?.trim() && <span className="schema-edge-label-ligne">{`{${data.condition.trim()}}`}</span>}
            {'etend' === relationType && data?.pointExtension?.trim() && (
              <span className="schema-edge-label-ligne">{`extension point : ${data.pointExtension.trim()}`}</span>
            )}
          </div>
        )}
        {data?.cardinaliteSource && (
          <div
            className="schema-edge-cardinalite"
            style={{ transform: `translate(-50%, -50%) translate(${cardSrcX}px, ${cardSrcY}px)` }}
          >
            {data.cardinaliteSource}
          </div>
        )}
        {data?.cardinaliteCible && (
          <div
            className="schema-edge-cardinalite"
            style={{ transform: `translate(-50%, -50%) translate(${cardDstX}px, ${cardDstY}px)` }}
          >
            {data.cardinaliteCible}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

/** Défs SVG partagées, montées une seule fois par le canevas — les marqueurs sont
 * référencés par id (url(#...)) depuis n'importe quel <svg> du document, y compris
 * celui que React Flow dessine pour les arêtes. */
export function SchemaMarkers() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Héritage/généralisation : triangle creux à la pointe cible. */}
        <marker id="schema-marker-heritage" viewBox="0 0 20 20" markerWidth="18" markerHeight="18" refX="18" refY="10" orient="auto-start-reverse">
          <path d="M 2 2 L 18 10 L 2 18 Z" className="schema-marker-heritage" />
        </marker>
        {/* Flèche simple ouverte : inclusion/extension (cas d'utilisation), flux (activité), lien FK du MLD. */}
        <marker id="schema-marker-fleche" viewBox="0 0 16 16" markerWidth="14" markerHeight="14" refX="14" refY="8" orient="auto-start-reverse">
          <path d="M 2 2 L 14 8 L 2 14" className="schema-marker-fleche" />
        </marker>

        {/* Composition/agrégation (diagramme de classes) : losange côté « tout », plein ou creux. */}
        <marker id="schema-marker-composition" viewBox="0 0 24 14" markerWidth="22" markerHeight="13" refX="22" refY="7" orient="auto-start-reverse">
          <path d="M 2 7 L 12 1 L 22 7 L 12 13 Z" className="schema-marker-composition" />
        </marker>
        <marker id="schema-marker-agregation" viewBox="0 0 24 14" markerWidth="22" markerHeight="13" refX="22" refY="7" orient="auto-start-reverse">
          <path d="M 2 7 L 12 1 L 22 7 L 12 13 Z" className="schema-marker-agregation" />
        </marker>

        {/* Pattes d'oie (MPD). Dessinées pour un trait qui arrive de la gauche : x = 28 est le bord de la table.
            Le même marqueur sert aux deux extrémités (orient="auto-start-reverse"). */}
        <marker id="schema-marker-sql-un" viewBox="0 0 28 16" markerWidth="28" markerHeight="16" markerUnits="userSpaceOnUse" refX="28" refY="8" orient="auto-start-reverse">
          {/* « Un et un seul » : double barre. */}
          <path d="M 17 2 L 17 14 M 23 2 L 23 14" className="schema-marker-sql" />
        </marker>
        <marker id="schema-marker-sql-zero-un" viewBox="0 0 28 16" markerWidth="28" markerHeight="16" markerUnits="userSpaceOnUse" refX="28" refY="8" orient="auto-start-reverse">
          <circle cx="13" cy="8" r="4" className="schema-marker-sql schema-marker-sql--rond" />
          <path d="M 22 2 L 22 14" className="schema-marker-sql" />
        </marker>
        <marker id="schema-marker-sql-zero-n" viewBox="0 0 28 16" markerWidth="28" markerHeight="16" markerUnits="userSpaceOnUse" refX="28" refY="8" orient="auto-start-reverse">
          <circle cx="8" cy="8" r="4" className="schema-marker-sql schema-marker-sql--rond" />
          <path d="M 14 8 L 28 1 M 14 8 L 28 8 M 14 8 L 28 15" className="schema-marker-sql" />
        </marker>
        <marker id="schema-marker-sql-un-n" viewBox="0 0 28 16" markerWidth="28" markerHeight="16" markerUnits="userSpaceOnUse" refX="28" refY="8" orient="auto-start-reverse">
          <path d="M 10 2 L 10 14" className="schema-marker-sql" />
          <path d="M 14 8 L 28 1 M 14 8 L 28 8 M 14 8 L 28 15" className="schema-marker-sql" />
        </marker>
      </defs>
    </svg>
  )
}