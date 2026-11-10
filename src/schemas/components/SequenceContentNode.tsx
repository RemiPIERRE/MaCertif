import { useRef, useState, type ReactNode } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { BARRE_LARGEUR, BOUCLE_LARGEUR, CROIX_DEMI, etiquetteParticipant, HAUTEUR_ENTETE, INTERLIGNE, MARGE_CONTENU, SD_ETIQUETTE_HAUTEUR, type CadreFragment, type Disposition, type DureeMiseEnPage, type NoteMiseEnPage } from '../lib/sequenceLayout'
import type { SequenceParticipant } from '../types'

/** Ce qui est sélectionné (et ouvre un éditeur sous le canevas). */
export type SequenceSelection = { type: 'participant' | 'fragment' | 'note'; id: string } | null

export interface SequenceContentData extends Record<string, unknown> {
  participants: SequenceParticipant[]
  disposition: Disposition
  selection: SequenceSelection
  /** null = désélectionner (clic dans le vide du diagramme). */
  onSelectionner: (selection: SequenceSelection) => void
  /** Glisser-déposer : place le participant `id` à la position `versIndex` (0 = tout à gauche). */
  onDeplacerParticipant: (id: string, versIndex: number) => void
  onRegistrerRef: (el: HTMLDivElement | null) => void
}

type Props = NodeProps<Node<SequenceContentData, 'sequenceContent'>>

/* Couleurs par défaut : suivent le thème de la page (variables CSS) tant que l'utilisateur
   n'a rien choisi ; l'export les remplace par celles du fond choisi. */
const ENCRE = 'var(--ink, #222)'
const TRAIT_VIF = 'var(--ink, #222)'
const ETIQUETTE_FOND = '#F5E6B8'
const ETIQUETTE_TEXTE = '#3b2f10'
const ACCENT = '#8b7cf8'
const NOTE_FOND = '#FEF3C7'
const NOTE_TEXTE = '#3b2f10'

function Fleche({ x, y, sens, ouverte, couleur }: { x: number; y: number; sens: 1 | -1; ouverte: boolean; couleur: string }) {
  const arriere = x - sens * 10
  const d = ouverte ? `M ${arriere} ${y - 5} L ${x} ${y} L ${arriere} ${y + 5}` : `M ${x} ${y} L ${arriere} ${y - 5} L ${arriere} ${y + 5} Z`
  return <path d={d} style={{ fill: ouverte ? 'none' : couleur, stroke: couleur, strokeWidth: 1.6, strokeLinejoin: 'round', strokeDasharray: 'none' }} />
}

/** Croix de destruction (✕) en bout de ligne de vie. */
function CroixDestruction({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  const c = CROIX_DEMI
  return <path className="sequence-croix" d={`M ${x - c} ${y - c} L ${x + c} ${y + c} M ${x - c} ${y + c} L ${x + c} ${y - c}`} style={{ stroke: couleur, strokeWidth: 2.4, strokeLinecap: 'round', fill: 'none' }} />
}

/** Bonhomme UML (acteur) : tête, tronc, bras, jambes. */
function Bonhomme({ contour, fond }: { contour: string; fond: string }) {
  const trait = { stroke: contour, strokeWidth: 1.8, strokeLinecap: 'round' as const, fill: 'none' }
  return (
    <svg className="sequence-bonhomme" width={28} height={34} viewBox="0 0 28 34" aria-hidden="true" style={{ overflow: 'visible' }}>
      <circle cx={14} cy={6} r={5.5} style={{ ...trait, fill: fond }} />
      <path d="M 14 11.5 L 14 23 M 3 16 L 25 16 M 14 23 L 5 33 M 14 23 L 23 33" style={trait} />
    </svg>
  )
}

/**
 * Élément posé dans la chronologie : note UML (coin plié), référence d'interaction `ref`
 * (cadre plein avec étiquette), invariant d'état (rectangle arrondi sur la ligne de vie).
 */
function Note({ np, selectionne, onSelectionner }: { np: NoteMiseEnPage; selectionne: boolean; onSelectionner: (s: SequenceSelection) => void }) {
  const { note, lignes, x, y, largeur, hauteur, lien } = np
  const genre = note.genre ?? 'note'
  const contour = note.style?.couleurContour ?? ('note' === genre ? 'var(--ink-soft, #666)' : TRAIT_VIF)
  const fond = note.style?.couleurFondTitre ?? ('note' === genre ? NOTE_FOND : 'ref' === genre ? ETIQUETTE_FOND : 'var(--surface, #fff)')
  const texte = note.style?.couleurNom ?? ('note' === genre ? NOTE_TEXTE : 'ref' === genre ? ETIQUETTE_TEXTE : ENCRE)
  const pli = 10
  const ouvrir = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelectionner({ type: 'note', id: note.id })
  }
  const textStyle = { fill: texte, fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }
  const etiquette = 'ref' === genre ? 36 : 0
  const contourNote =
    'note' === genre
      ? `M ${x} ${y} L ${x + largeur - pli} ${y} L ${x + largeur} ${y + pli} L ${x + largeur} ${y + hauteur} L ${x} ${y + hauteur} Z`
      : `M ${x} ${y} L ${x + largeur} ${y} L ${x + largeur} ${y + hauteur} L ${x} ${y + hauteur} Z`
  const titre = 'ref' === genre ? 'cette référence' : 'etat' === genre ? 'cet invariant' : 'cette note'

  return (
    <g className={`sequence-note${selectionne ? ' is-selected' : ''}`} onClick={ouvrir} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onKeyDown={(e) => ('Enter' === e.key || ' ' === e.key) && ouvrir(e)}>
      <title>Cliquer pour modifier {titre}</title>
      {lien && <line x1={lien.x1} y1={lien.y} x2={lien.x2} y2={lien.y} style={{ stroke: contour, strokeWidth: 1.2, strokeDasharray: '4 3' }} />}
      {selectionne && 'etat' !== genre && <path className="sequence-selection-halo" d={contourNote} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 6, opacity: 0.45, strokeLinejoin: 'round', pointerEvents: 'none' }} />}
      {selectionne && 'etat' === genre && <rect className="sequence-selection-halo" x={x} y={y} width={largeur} height={hauteur} rx={hauteur / 2} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 6, opacity: 0.45, pointerEvents: 'none' }} />}
      {'etat' === genre ? (
        <rect x={x} y={y} width={largeur} height={hauteur} rx={Math.min(hauteur / 2, 12)} style={{ fill: fond, stroke: contour, strokeWidth: 1.4 }} />
      ) : (
        <path d={contourNote} style={{ fill: 'ref' === genre ? 'var(--surface, #fff)' : fond, stroke: contour, strokeWidth: 1.3, strokeLinejoin: 'round' }} />
      )}
      {'note' === genre && <path d={`M ${x + largeur - pli} ${y} L ${x + largeur - pli} ${y + pli} L ${x + largeur} ${y + pli}`} style={{ fill: 'none', stroke: contour, strokeWidth: 1.3 }} />}
      {'ref' === genre && (
        <>
          <path d={`M ${x} ${y} L ${x + etiquette} ${y} L ${x + etiquette} ${y + 12} L ${x + etiquette - 6} ${y + 18} L ${x} ${y + 18} Z`} style={{ fill: fond, stroke: contour, strokeWidth: 1.4 }} />
          <text x={x + 9} y={y + 13} style={{ ...textStyle, fontWeight: 700 }}>
            ref
          </text>
        </>
      )}
      {lignes.map((ligne, i) =>
        'note' === genre ? (
          <text key={i} x={x + 8} y={y + 17 + i * INTERLIGNE} style={textStyle}>
            {ligne}
          </text>
        ) : (
          <text key={i} x={x + largeur / 2} y={('ref' === genre ? y + 18 + 17 : y + 15) + i * INTERLIGNE} style={{ ...textStyle, fill: 'ref' === genre ? ENCRE : texte, textAnchor: 'middle' }}>
            {ligne}
          </text>
        ),
      )}
    </g>
  )
}

/** Contrainte de durée : double flèche verticale le long de la ligne de vie, libellé à droite. */
function Duree({ d, selectionne, onSelectionner }: { d: DureeMiseEnPage; selectionne: boolean; onSelectionner: (s: SequenceSelection) => void }) {
  const { note, lignes, x, y1, y2 } = d
  const contour = note.style?.couleurContour ?? TRAIT_VIF
  const texte = note.style?.couleurNom ?? ENCRE
  const ouvrir = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelectionner({ type: 'note', id: note.id })
  }
  const trait = { stroke: contour, strokeWidth: 1.4, fill: 'none' }
  return (
    <g className={`sequence-note sequence-duree${selectionne ? ' is-selected' : ''}`} onClick={ouvrir} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onKeyDown={(e) => ('Enter' === e.key || ' ' === e.key) && ouvrir(e)}>
      <title>Cliquer pour modifier cette contrainte de durée</title>
      {selectionne && <line className="sequence-selection-halo" x1={x} y1={y1} x2={x} y2={y2} style={{ stroke: ACCENT, strokeWidth: 9, opacity: 0.45, pointerEvents: 'none' }} />}
      {/* zone cliquable plus large que le trait */}
      <rect x={x - 6} y={y1} width={20 + Math.max(...lignes.map((l) => l.length)) * 6.6} height={y2 - y1} style={{ fill: 'transparent' }} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} style={trait} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} style={trait} />
      <line x1={x} y1={y1} x2={x} y2={y2} style={trait} />
      <path d={`M ${x - 4} ${y1 + 8} L ${x} ${y1} L ${x + 4} ${y1 + 8}`} style={trait} />
      <path d={`M ${x - 4} ${y2 - 8} L ${x} ${y2} L ${x + 4} ${y2 - 8}`} style={trait} />
      {lignes.map((ligne, i) => (
        <text key={i} x={x + 10} y={(y1 + y2) / 2 + 4 - ((lignes.length - 1) * INTERLIGNE) / 2 + i * INTERLIGNE} style={{ fill: texte, fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}>
          {ligne}
        </text>
      ))}
    </g>
  )
}

function Cadre({ cadre, selectionne, onSelectionner, partie }: { cadre: CadreFragment; selectionne: boolean; onSelectionner: (s: SequenceSelection) => void; partie: 'trait' | 'etiquette' }) {
  const { fragment: f, x, y, largeur, hauteur, etiquette, etiquetteLargeur, etiquetteHauteur, garde, separateurs } = cadre
  const contour = f.style?.couleurContour ?? TRAIT_VIF
  const texte = f.style?.couleurNom ?? ETIQUETTE_TEXTE
  const fond = f.style?.couleurFondTitre ?? ETIQUETTE_FOND
  // Les gardes se lisent sur le fond du diagramme, pas sur l'étiquette : couleur « encre » par défaut.
  const texteGarde = f.style?.couleurNom ?? ENCRE
  const ouvrir = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onSelectionner({ type: 'fragment', id: f.id })
  }
  const dash = '6 4'
  // Étiquette : pentagone (coin inférieur droit coupé), nomenclature UML des fragments combinés.
  const t = etiquetteLargeur
  const h = etiquetteHauteur
  const pentagone = `M ${x} ${y} L ${x + t} ${y} L ${x + t} ${y + h - 6} L ${x + t - 6} ${y + h} L ${x} ${y + h} Z`

  if ('trait' === partie) {
    return (
      <g className={`sequence-fragment${selectionne ? ' is-selected' : ''}`}>
      {selectionne && (
        <rect className="sequence-selection-halo" x={x - 3} y={y - 3} width={largeur + 6} height={hauteur + 6} rx={4} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 3, opacity: 0.45, pointerEvents: 'none' }} />
      )}
      <rect x={x} y={y} width={largeur} height={hauteur} rx={2} style={{ fill: 'none', stroke: contour, strokeWidth: 1.6, pointerEvents: 'none' }} />
      {separateurs.map((s) => (
        <g key={s.operandeId} onClick={ouvrir} className="sequence-fragment-separateur">
          <line x1={x} y1={s.y} x2={x + largeur} y2={s.y} style={{ stroke: contour, strokeWidth: 1.6, strokeDasharray: dash }} />
          {'' !== s.garde && (
            // Même abscisse que la garde du premier opérande (x + t + 8, juste après le pentagone
            // "alt"/"loop"…) : sinon elle démarre plus à gauche et chevauche la première ligne de vie.
            <text x={x + t + 8} y={s.y + 15} style={{ fill: texteGarde, fontSize: 11, fontFamily: 'var(--font-mono, monospace)', cursor: 'pointer' }}>
              {s.garde}
            </text>
          )}
        </g>
      ))}
      </g>
    )
  }

  // L'étiquette se dessine PAR-DESSUS les barres d'activation.
  return (
    <g>
      <g onClick={ouvrir} className="sequence-fragment-etiquette" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onKeyDown={(e) => ('Enter' === e.key || ' ' === e.key) && ouvrir(e)}>
        <title>Cliquer pour modifier ce fragment</title>
        <path d={pentagone} style={{ fill: fond, stroke: contour, strokeWidth: 1.4 }} />
        <text x={x + 9} y={y + 13} style={{ fill: texte, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
          {etiquette}
        </text>
        {'' !== garde && (
          <text x={x + t + 8} y={y + 13} style={{ fill: texteGarde, fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}>
            {garde}
          </text>
        )}
      </g>
    </g>
  )
}

/**
 * Rendu du diagramme de séquence (en-têtes, lignes de vie, fragments, messages), posé comme
 * UN SEUL nœud React Flow non déplaçable — pour hériter du cadre pannable/zoomable des autres
 * schémas. Toute la mise en page vient de `calculerDisposition` (lib/sequenceLayout).
 *
 * Participants et fragments sont cliquables : l'édition (nom, messages, couleurs…) se fait dans
 * les éditeurs sous le canevas. React Flow applique `pointer-events: none` à un nœud ni
 * déplaçable, ni sélectionnable, ni connectable : il est rétabli en CSS (sequence.css).
 */
export function SequenceContentNode({ data }: Props) {
  const { participants, disposition, selection, onSelectionner, onDeplacerParticipant, onRegistrerRef } = data
  // Glisser-déposer d'un participant : celui qu'on tient, et l'emplacement d'insertion indiqué.
  const [glisse, setGlisse] = useState<string | null>(null)
  const [insertion, setInsertion] = useState<number | null>(null)
  const enteteRef = useRef<HTMLDivElement | null>(null)

  const { largeur, hauteur, hauteurCorps, lignes, cadres, notes, durees, creations, vies, barres, xLigneDeVie, largeurColonne, offsetsColonnes, extra, sd } = disposition
  // Bord gauche de chaque colonne, plus le bord droit de la dernière : une limite par position
  // d'insertion possible (0 = tout à gauche, participants.length = tout à droite).
  const limitesColonnes =
    0 === participants.length
      ? [0]
      : [...offsetsColonnes, offsetsColonnes[offsetsColonnes.length - 1] + largeurColonne(participants[participants.length - 1].id)]

  /** Emplacement d'insertion sous le pointeur, correct quel que soit le zoom du canevas (colonnes de largeur variable : on cherche la limite la plus proche). */
  const indexSousPointeur = (clientX: number): number => {
    const rect = enteteRef.current?.getBoundingClientRect()
    const largeurTotale = limitesColonnes[limitesColonnes.length - 1]
    if (!rect || 0 === rect.width || 0 === participants.length || 0 === largeurTotale) return 0
    const echelle = rect.width / largeurTotale
    const xLogique = (clientX - rect.left) / echelle
    let meilleur = 0
    let distanceMini = Infinity
    limitesColonnes.forEach((limite, i) => {
      const distance = Math.abs(limite - xLogique)
      if (distance < distanceMini) {
        distanceMini = distance
        meilleur = i
      }
    })
    return meilleur
  }
  const finGlisser = () => {
    setGlisse(null)
    setInsertion(null)
  }
  const creeId = new Set(creations.map((c) => c.participantId))
  const parId = new Map(participants.map((p) => [p.id, p]))

  /** Boîte (ou bonhomme) d'un participant : en-tête, ou boîte posée au niveau de la création. */
  const boiteParticipant = (p: SequenceParticipant): ReactNode => {
    const acteur = 'acteur' === p.forme
    return (
      <div
        className={`sequence-participant-boite nopan${acteur ? ' sequence-participant-acteur' : ''}${'participant' === selection?.type && p.id === selection.id ? ' is-selected' : ''}`}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', p.id) // requis par Firefox pour démarrer le glissement
          setGlisse(p.id)
        }}
        onDragEnd={finGlisser}
        title="Cliquer pour modifier — glisser pour changer de place"
        style={{
          borderColor: acteur ? undefined : p.style?.couleurContour,
          background: acteur ? undefined : p.style?.couleurFondTitre,
          color: p.style?.couleurNom,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectionner({ type: 'participant', id: p.id })
        }}
        onKeyDown={(e) => {
          if ('Enter' === e.key || ' ' === e.key) {
            e.preventDefault()
            onSelectionner({ type: 'participant', id: p.id })
          }
        }}
      >
        {acteur && <Bonhomme contour={p.style?.couleurContour ?? TRAIT_VIF} fond={p.style?.couleurFondTitre ?? 'var(--surface, #fff)'} />}
        <span>{etiquetteParticipant(p) || 'Participant'}</span>
      </div>
    )
  }

  return (
    <div
      className="sequence-diagram-contenu"
      ref={onRegistrerRef}
      style={{
        width: largeur,
        height: hauteur,
        paddingTop: MARGE_CONTENU + extra.haut,
        paddingRight: MARGE_CONTENU + extra.droite,
        paddingBottom: MARGE_CONTENU + extra.bas,
        paddingLeft: MARGE_CONTENU + extra.gauche,
      }}
      onClick={() => onSelectionner(null)}
    >
      {sd && (
        <svg className="sequence-cadre-sd" width={largeur + extra.gauche + extra.droite} height={hauteur + extra.haut + extra.bas} style={{ position: 'absolute', left: MARGE_CONTENU, top: MARGE_CONTENU, overflow: 'visible', pointerEvents: 'none' }}>
          <rect x={0.8} y={0.8} width={largeur + extra.gauche + extra.droite - 1.6} height={hauteur + extra.haut + extra.bas - 1.6} rx={2} style={{ fill: 'none', stroke: TRAIT_VIF, strokeWidth: 1.6 }} />
          <path d={`M 0.8 0.8 L ${sd.etiquetteLargeur} 0.8 L ${sd.etiquetteLargeur} ${SD_ETIQUETTE_HAUTEUR - 6} L ${sd.etiquetteLargeur - 8} ${SD_ETIQUETTE_HAUTEUR + 2} L 0.8 ${SD_ETIQUETTE_HAUTEUR + 2} Z`} style={{ fill: ETIQUETTE_FOND, stroke: TRAIT_VIF, strokeWidth: 1.4 }} />
          <text x={9} y={15} style={{ fill: ETIQUETTE_TEXTE, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
            {`sd ${sd.nom}`.trim()}
          </text>
        </svg>
      )}
      <div
        ref={enteteRef}
        className="sequence-participants"
        style={{ height: HAUTEUR_ENTETE }}
        onDragOver={(e) => {
          if (null === glisse) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setInsertion(indexSousPointeur(e.clientX))
        }}
        onDrop={(e) => {
          if (null === glisse) return
          e.preventDefault()
          onDeplacerParticipant(glisse, indexSousPointeur(e.clientX))
          finGlisser()
        }}
      >
        {null !== glisse && null !== insertion && <div className="sequence-insertion" style={{ left: limitesColonnes[insertion] ?? 0 }} />}
        {participants.map((p) => (
          <div key={p.id} className="sequence-participant" style={{ width: largeurColonne(p.id) }}>
            {!creeId.has(p.id) && boiteParticipant(p)}
          </div>
        ))}
      </div>

      <div className="sequence-corps" style={{ height: hauteurCorps }}>
        {participants.map((p) => {
          const vie = vies.find((v) => v.participantId === p.id)
          const haut = vie?.haut ?? 0
          return (
            <div
              key={p.id}
              className="sequence-ligne-vie"
              style={{ left: xLigneDeVie(p.id) ?? 0, top: haut, bottom: 'auto', height: (vie?.bas ?? hauteurCorps) - haut, borderLeftColor: p.style?.couleurContour }}
            />
          )
        })}

        {creations.map((c) => {
          const p = parId.get(c.participantId)
          if (!p) return null
          return (
            <div key={c.participantId} className="sequence-participant-creee" style={{ left: c.x, top: c.y, width: c.largeur, height: c.hauteur }}>
              {boiteParticipant(p)}
            </div>
          )
        })}

        <svg className="sequence-messages-svg" width={largeur} height={hauteurCorps} style={{ overflow: 'visible' }}>
          {cadres.map((c) => (
            <Cadre key={c.fragment.id} partie="trait" cadre={c} selectionne={'fragment' === selection?.type && c.fragment.id === selection.id} onSelectionner={onSelectionner} />
          ))}

          {barres.map((b, i) => {
            const st = parId.get(b.participantId)?.style
            return (
              <rect
                key={i}
                className="sequence-barre"
                x={b.x - BARRE_LARGEUR / 2}
                y={b.top}
                width={BARRE_LARGEUR}
                height={b.bottom - b.top}
                style={{ fill: st?.couleurFondLigne ?? 'var(--surface, #fff)', stroke: st?.couleurContour ?? TRAIT_VIF, strokeWidth: 1.4 }}
              />
            )
          })}

          {lignes.map((l) => {
            const m = l.message
            if (!l.complet || null === l.xDe || null === l.xVers) return null
            const couleur = (l.trouve ? parId.get(m.versId) : parId.get(m.deId))?.style?.couleurTexte ?? TRAIT_VIF
            const pointille = 'retour' === m.type
            const ouverte = 'synchrone' !== m.type
            const trait = { stroke: couleur, strokeWidth: 1.6, fill: 'none', strokeDasharray: pointille ? '6 4' : undefined }
            const texteStyle = { fill: couleur, fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }
            const x1 = l.xDe
            const x2 = l.xVers
            const xd = l.xDepart
            const xa = l.xArrivee
            const croix = l.destruction ? <CroixDestruction x={l.destruction.x} y={l.destruction.y} couleur={parId.get(m.versId)?.style?.couleurContour ?? TRAIT_VIF} /> : null

            if (l.auto) {
              // Boucle sur la ligne de vie ; libellé en haut à droite, aligné sur le haut de la boucle.
              const haut = l.y - 10
              return (
                <g key={m.id} className={`sequence-message${pointille ? ' pointille' : ''}`}>
                  <path d={`M ${xd} ${haut} L ${xd + BOUCLE_LARGEUR} ${haut} L ${xd + BOUCLE_LARGEUR} ${l.y + 10} L ${xa} ${l.y + 10}`} style={trait} />
                  <Fleche x={xa} y={l.y + 10} sens={-1} ouverte={ouverte} couleur={couleur} />
                  {l.lignes.map((ligne, i) => (
                    <text key={i} x={xd + BOUCLE_LARGEUR + 8} y={haut + 9 + i * INTERLIGNE} style={{ ...texteStyle, textAnchor: 'start' }}>
                      {ligne}
                    </text>
                  ))}
                  {croix}
                </g>
              )
            }

            // Libellé centré AU-DESSUS de la flèche ; plusieurs lignes : empilées vers le haut.
            const premiere = l.y - 11 - (l.lignes.length - 1) * INTERLIGNE
            const sens: 1 | -1 = x2 >= x1 ? 1 : -1
            // Message perdu : la pointe s'arrête juste avant le point plein.
            const pointe = l.perdu ? xa - sens * 5 : xa
            return (
              <g key={m.id} className={`sequence-message${pointille ? ' pointille' : ''}`}>
                <line x1={xd} y1={l.y} x2={pointe} y2={l.y} style={trait} />
                <Fleche x={pointe} y={l.y} sens={sens} ouverte={ouverte} couleur={couleur} />
                {l.trouve && <circle cx={xd} cy={l.y} r={4.5} style={{ fill: couleur, stroke: couleur }} />}
                {l.perdu && <circle cx={xa} cy={l.y} r={4.5} style={{ fill: couleur, stroke: couleur }} />}
                {l.lignes.map((ligne, i) => (
                  <text key={i} x={l.creation ? (xd + xa) / 2 : (x1 + x2) / 2} y={premiere + i * INTERLIGNE} style={{ ...texteStyle, textAnchor: 'middle' }}>
                    {ligne}
                  </text>
                ))}
                {croix}
              </g>
            )
          })}

          {cadres.map((c) => (
            <Cadre key={c.fragment.id} partie="etiquette" cadre={c} selectionne={false} onSelectionner={onSelectionner} />
          ))}

          {notes.map((np) => (
            <Note key={np.note.id} np={np} selectionne={'note' === selection?.type && np.note.id === selection.id} onSelectionner={onSelectionner} />
          ))}

          {durees.map((d) => (
            <Duree key={d.note.id} d={d} selectionne={'note' === selection?.type && d.note.id === selection.id} onSelectionner={onSelectionner} />
          ))}
        </svg>
      </div>
    </div>
  )
}