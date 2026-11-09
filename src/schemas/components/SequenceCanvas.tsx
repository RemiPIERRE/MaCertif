import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Background, Controls, ReactFlow, ReactFlowProvider, useNodesState, useReactFlow, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { generateId } from '../../lib/id'
import type { ElementStyle, SequenceContenu, SequenceFragment, SequenceMessage, SequenceMessageType, SequenceNote, SequenceNoteGenre, SequenceParticipant } from '../types'
import { SEQUENCE_PERDU, SEQUENCE_TROUVE, SEQUENCE_TYPE_LABELS } from '../types'
import { genererPngSequence, OPTIONS_EXPORT_DEFAUT, type OptionsExport } from '../lib/exportPng'
import { calculerDisposition, etiquetteParticipant, nettoyerActivations, reconcilierFragments, reconcilierNotes, type Disposition } from '../lib/sequenceLayout'
import { ApercuExport, useZoneApercu } from './ApercuExport'
import { ChampTexteAuto } from './ChampTexteAuto'
import { SequenceContentNode, type SequenceContentData, type SequenceSelection } from './SequenceContentNode'
import { SequenceFragmentEditor } from './SequenceFragmentEditor'
import { SequenceNoteEditor } from './SequenceNoteEditor'
import { OptionsDestinataire, OptionsEmetteur, POIGNEE, SelecteurEffet, useGlisserMessages } from './SequenceMessageCommun'
import { useHistorique } from './useHistorique'
import { SequenceParticipantEditor } from './SequenceParticipantEditor'
import './schemas.css'
import './sequence.css'

const NODE_TYPES = { sequenceContent: SequenceContentNode }

interface Props {
  nom: string
  contenu: SequenceContenu
  onChange: (contenu: SequenceContenu) => void
}

/**
 * Diagramme de séquence. Le diagramme est posé dans un cadre React Flow pannable/zoomable (un
 * seul nœud statique, voir SequenceContentNode) ; sa mise en page est calculée par
 * `calculerDisposition`. Un clic sur un participant ou sur l'étiquette d'un fragment ouvre son
 * éditeur sous le canevas ; sans sélection, la liste de tous les messages (ordre, de/vers…)
 * s'affiche à la place. Plein écran et « Aperçu de l'export » comme les autres diagrammes.
 */
export function SequenceCanvas({ nom, contenu, onChange }: Props) {
  const { participants, messages } = contenu
  const fragments = useMemo(() => contenu.fragments ?? [], [contenu.fragments])
  const notes = useMemo(() => contenu.notes ?? [], [contenu.notes])
  const activationsAuto = false !== contenu.activationsAuto

  // Dernier contenu émis vers le parent : sert à repérer un remplacement venu de l'extérieur
  // (autre schéma, rechargement), après lequel l'historique ne doit pas rester.
  const derniereSignatureEmise = useRef<string | null>(null)
  // Menu « + Ajouter » de la vue standard (le plein écran affiche la liste complète).
  const [menuAjoutOuvert, setMenuAjoutOuvert] = useState(false)
  const menuAjoutRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuAjoutOuvert) return
    const fermer = (e: MouseEvent) => {
      if (menuAjoutRef.current && !menuAjoutRef.current.contains(e.target as globalThis.Node)) setMenuAjoutOuvert(false)
    }
    document.addEventListener('mousedown', fermer)
    return () => document.removeEventListener('mousedown', fermer)
  }, [menuAjoutOuvert])
  const choisirAjout = (action: () => void) => {
    setMenuAjoutOuvert(false)
    action()
  }

  const emettreContenu = (nouveau: SequenceContenu) => {
    derniereSignatureEmise.current = JSON.stringify(nouveau)
    onChange(nouveau)
  }
  const emettre = (patch: Partial<SequenceContenu>) =>
    emettreContenu({ kind: 'sequence', participants, messages, fragments, notes, activationsAuto: contenu.activationsAuto, cadre: contenu.cadre, numerotation: contenu.numerotation, ...patch })

  /* Annuler / rétablir (Ctrl+Z, Ctrl+Y) : le contenu entier est l'instantané. */
  const signatureContenu = useMemo(() => JSON.stringify(contenu), [contenu])
  const { reinitialiser } = useHistorique({
    valeur: contenu,
    signature: signatureContenu,
    appliquer: emettreContenu,
  })
  useEffect(() => {
    if (null !== derniereSignatureEmise.current && signatureContenu !== derniereSignatureEmise.current) reinitialiser()
    derniereSignatureEmise.current = signatureContenu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureContenu])

  const [selection, setSelection] = useState<SequenceSelection>(null)
  const [dernierMessageId, setDernierMessageId] = useState<string | null>(null)
  const [pleinEcran, setPleinEcran] = useState(false)
  const [optionsExport, setOptionsExport] = useState<OptionsExport>(OPTIONS_EXPORT_DEFAUT)
  const [apercuOuvert, setApercuOuvert] = useState(true)
  const racineRef = useRef<HTMLDivElement | null>(null)
  const contenuRef = useRef<HTMLDivElement | null>(null)
  const cibleApercu = useZoneApercu(racineRef)

  // Une sélection dont l'élément n'existe plus (suppression) ne laisse pas d'éditeur orphelin.
  const participantSelectionne = 'participant' === selection?.type ? (participants.find((p) => p.id === selection.id) ?? null) : null
  const noteSelectionnee = 'note' === selection?.type ? (notes.find((n) => n.id === selection.id) ?? null) : null
  const fragmentSelectionne = 'fragment' === selection?.type ? (fragments.find((f) => f.id === selection.id) ?? null) : null

  const disposition = useMemo(
    () => calculerDisposition(participants, messages, fragments, notes, activationsAuto, { cadre: contenu.cadre, numerotation: contenu.numerotation }),
    [participants, messages, fragments, notes, activationsAuto, contenu.cadre, contenu.numerotation],
  )

  /* ───── Participants ───── */

  const ajouterParticipant = () => {
    const participant: SequenceParticipant = { id: generateId(), nom: `Participant ${participants.length + 1}` }
    emettre({ participants: [...participants, participant] })
    setSelection({ type: 'participant', id: participant.id })
  }

  /** Change la place d'un participant (glisser-déposer ou boutons ◀ ▶) ; les messages le suivent. */
  const deplacerParticipant = (id: string, versIndex: number) => {
    const de = participants.findIndex((p) => p.id === id)
    if (de < 0) return
    const cible = Math.max(0, Math.min(participants.length, versIndex))
    const copie = [...participants]
    const [pris] = copie.splice(de, 1)
    copie.splice(cible > de ? cible - 1 : cible, 0, pris)
    if (copie.every((p, i) => p.id === participants[i].id)) return
    emettre({ participants: copie })
  }

  const majParticipant = (id: string, patch: Partial<SequenceParticipant>) =>
    emettre({ participants: participants.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const supprimerParticipant = (id: string) => {
    const restants = nettoyerActivations(messages.filter((m) => m.deId !== id && m.versId !== id))
    setSelection(null)
    emettre({
      participants: participants.filter((p) => p.id !== id),
      messages: restants,
      fragments: reconcilierFragments(messages, restants, fragments),
      notes: reconcilierNotes(messages, restants, notes)
        .filter((n) => n.participantId !== id)
        .map((n) => (n.participantFinId === id ? { ...n, participantFinId: undefined } : n)),
    })
  }

  /* ───── Messages ───── */

  /** Nouvelle ligne : départ = `deId`, destinataire et libellé vides (à remplir dans l'éditeur). */
  const nouveauMessageDepuis = (deId: string) => {
    const message: SequenceMessage = { id: generateId(), deId, versId: '', texte: '', type: 'synchrone' }
    setDernierMessageId(message.id)
    setSelection({ type: 'participant', id: deId })
    emettre({ messages: [...messages, message] })
  }

  const ajouterMessage = () => {
    const emetteur = participantSelectionne?.id ?? participants[0]?.id
    if (emetteur) nouveauMessageDepuis(emetteur)
  }

  const majMessage = (id: string, patch: Partial<SequenceMessage>) => emettre({ messages: messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

  const supprimerMessage = (id: string) => {
    const restants = nettoyerActivations(messages.filter((m) => m.id !== id))
    emettre({ messages: restants, fragments: reconcilierFragments(messages, restants, fragments), notes: reconcilierNotes(messages, restants, notes) })
  }

  const deplacerMessage = (id: string, direction: -1 | 1) => {
    const index = messages.findIndex((m) => m.id === id)
    const cible = index + direction
    if (index < 0 || cible < 0 || cible >= messages.length) return
    const copie = [...messages]
    ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
    emettre({ messages: copie })
  }

  /** Glisser-déposer : place le message `id` juste avant la position `versIndex` (messages.length = à la fin). */
  const deplacerMessageVers = (id: string, versIndex: number) => {
    const de = messages.findIndex((m) => m.id === id)
    if (de < 0) return
    const cible = Math.max(0, Math.min(messages.length, versIndex))
    const copie = [...messages]
    const [pris] = copie.splice(de, 1)
    copie.splice(cible > de ? cible - 1 : cible, 0, pris)
    if (copie.every((m, i) => m.id === messages[i].id)) return
    emettre({ messages: copie })
  }
  const glisserMessages = useGlisserMessages(deplacerMessageVers)

  /* ───── Fragments ───── */

  const ajouterFragment = () => {
    const dernier = messages[messages.length - 1]
    if (!dernier) return
    const fragment: SequenceFragment = { id: generateId(), operateur: 'alt', garde: '', debutId: dernier.id, finId: dernier.id, operandes: [] }
    emettre({ fragments: [...fragments, fragment] })
    setSelection({ type: 'fragment', id: fragment.id })
  }

  const majFragment = (id: string, patch: Partial<SequenceFragment>) => emettre({ fragments: fragments.map((f) => (f.id === id ? { ...f, ...patch } : f)) })

  const supprimerFragment = (id: string) => {
    setSelection(null)
    emettre({ fragments: fragments.filter((f) => f.id !== id) })
  }

  /* ───── Notes ───── */

  const ajouterNote = (genre: SequenceNoteGenre = 'note') => {
    const participantId = participantSelectionne?.id ?? participants[0]?.id
    if (!participantId) return
    const dernier = messages[messages.length - 1]?.id
    const note: SequenceNote = {
      id: generateId(),
      genre: 'note' === genre ? undefined : genre,
      texte: { note: 'Note', ref: 'Interaction', etat: '{état}', duree: '{0..3s}' }[genre],
      position: 'note' === genre ? 'droite' : 'sur',
      participantId,
      apresId: dernier ?? null,
      finId: 'duree' === genre ? dernier : undefined,
    }
    emettre({ notes: [...notes, note] })
    setSelection({ type: 'note', id: note.id })
  }

  const majNote = (id: string, patch: Partial<SequenceNote>) => emettre({ notes: notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })

  const supprimerNote = (id: string) => {
    setSelection(null)
    emettre({ notes: notes.filter((n) => n.id !== id) })
  }

  const selectionner = useCallback((s: SequenceSelection) => setSelection(s), [])
  const libelleParticipant = (id: string) => {
    if (SEQUENCE_TROUVE === id) return '● extérieur'
    if (SEQUENCE_PERDU === id) return '● perdu'
    const p = participants.find((x) => x.id === id)
    return p ? etiquetteParticipant(p) : '?'
  }

  /* ───── Plein écran (Échap pour quitter) ───── */

  useEffect(() => {
    if (!pleinEcran) return
    const quitter = (e: KeyboardEvent) => {
      if ('Escape' === e.key) setPleinEcran(false)
    }
    const overflowInitial = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', quitter)
    return () => {
      window.removeEventListener('keydown', quitter)
      document.body.style.overflow = overflowInitial
    }
  }, [pleinEcran])

  /* ───── Export / aperçu ───── */

  const generer = (options: OptionsExport) =>
    contenuRef.current && participants.length > 0
      ? genererPngSequence(contenuRef.current, options)
      : Promise.reject(new Error('Rien à exporter : ajoutez au moins un participant.'))

  const contenuApercu = useMemo(() => JSON.stringify([participants, messages, fragments, notes, activationsAuto, contenu.cadre, contenu.numerotation]), [participants, messages, fragments, notes, activationsAuto, contenu.cadre, contenu.numerotation])

  /** Tout ce que la barre d'outils sait ajouter (menu « + Ajouter » ; liste à plat en plein écran). */
  const sansParticipant = 0 === participants.length
  const sansMessage = 0 === messages.length
  const elementsAjout: Array<{ cle: string; libelle: string; action: () => void; desactive?: boolean; titre?: string }> = [
    { cle: 'participant', libelle: 'Participant', action: ajouterParticipant },
    { cle: 'message', libelle: 'Message', action: ajouterMessage, desactive: sansParticipant },
    { cle: 'fragment', libelle: 'Fragment', action: ajouterFragment, desactive: sansMessage, titre: "Encadre les messages d'une alternative (alt), d'une boucle (loop)…" },
    { cle: 'note', libelle: 'Note', action: () => ajouterNote('note'), desactive: sansParticipant, titre: 'Ajoute un commentaire (rectangle au coin plié)' },
    { cle: 'ref', libelle: 'Référence (ref)', action: () => ajouterNote('ref'), desactive: sansParticipant, titre: "Renvoie vers une autre interaction (cadre « ref »)" },
    { cle: 'etat', libelle: "Invariant d'état", action: () => ajouterNote('etat'), desactive: sansParticipant, titre: 'État d’une ligne de vie, entre accolades' },
    { cle: 'duree', libelle: 'Contrainte de durée', action: () => ajouterNote('duree'), desactive: sansMessage || sansParticipant, titre: 'Durée entre deux messages, le long d’une ligne de vie' },
  ]

  const boutonBarres = (
    <button
      type="button"
      className="schema-btn"
      aria-pressed={activationsAuto}
      onClick={() => emettre({ activationsAuto: activationsAuto ? false : undefined })}
      title="Barres d'activation automatiques : un message synchrone active son destinataire jusqu'à la réponse. En manuel, seules les barres demandées message par message s'affichent."
    >
      Barres : {activationsAuto ? 'auto' : 'manuel'}
    </button>
  )

  return (
    <div ref={racineRef} className={`sequence-tab${pleinEcran ? ' is-plein-ecran' : ''}`}>
      <div className="sequence-toolbar">
        {pleinEcran ? (
          <>
            {elementsAjout.map((e) => (
              <button key={e.cle} type="button" className="schema-btn" onClick={e.action} disabled={e.desactive} title={e.titre}>
                + {e.libelle}
              </button>
            ))}
            {boutonBarres}
          </>
        ) : (
          <div className="schema-add-menu" ref={menuAjoutRef}>
            <button type="button" className="schema-btn" onClick={() => setMenuAjoutOuvert((o) => !o)}>
              + Ajouter ▾
            </button>
            {menuAjoutOuvert && (
              <div className="schema-add-menu-dropdown">
                {elementsAjout.map((e) => (
                  <button key={e.cle} type="button" disabled={e.desactive} title={e.titre} onClick={() => choisirAjout(e.action)}>
                    {e.libelle}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!pleinEcran && boutonBarres}
        <button
          type="button"
          className="schema-btn sequence-toolbar-droite"
          onClick={() => setPleinEcran((p) => !p)}
          title={pleinEcran ? 'Quitter le plein écran (Échap)' : 'Plein écran'}
          aria-label={pleinEcran ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {pleinEcran ? '⤡ Quitter' : '⤢ Plein écran'}
        </button>
      </div>

      {0 === participants.length ? (
        <p className="page-lede">Ajoutez au moins un participant pour commencer.</p>
      ) : (
        <div className="sequence-frame">
          <ReactFlowProvider>
            <SequenceFlowFrame
              participants={participants}
              disposition={disposition}
              pleinEcran={pleinEcran}
              selection={selection}
              onSelectionner={selectionner}
              onDeplacerParticipant={deplacerParticipant}
              onRegistrerRef={(el) => {
                contenuRef.current = el
              }}
            />
          </ReactFlowProvider>
        </div>
      )}

      {participantSelectionne && (
        <SequenceParticipantEditor
          key={participantSelectionne.id}
          participant={participantSelectionne}
          participants={participants}
          messages={messages}
          dernierMessageId={dernierMessageId}
          onNom={(n) => majParticipant(participantSelectionne.id, { nom: n })}
          onMajParticipant={(patch) => majParticipant(participantSelectionne.id, patch)}
          onStyle={(style: Partial<ElementStyle> | undefined) => majParticipant(participantSelectionne.id, { style })}
          onSupprimer={() => supprimerParticipant(participantSelectionne.id)}
          onDeplacer={(sens) => deplacerParticipant(participantSelectionne.id, participants.findIndex((p) => p.id === participantSelectionne.id) + (sens < 0 ? -1 : 2))}
          peutDeplacer={{ gauche: participants[0]?.id !== participantSelectionne.id, droite: participants[participants.length - 1]?.id !== participantSelectionne.id }}
          onClose={() => setSelection(null)}
          onNouveauMessage={() => nouveauMessageDepuis(participantSelectionne.id)}
          onMajMessage={majMessage}
          onSupprimerMessage={supprimerMessage}
          onDeplacerMessage={deplacerMessage}
          onDeplacerMessageVers={deplacerMessageVers}
        />
      )}

      {fragmentSelectionne && (
        <SequenceFragmentEditor
          key={fragmentSelectionne.id}
          fragment={fragmentSelectionne}
          messages={messages}
          libelleParticipant={libelleParticipant}
          onMaj={(patch) => majFragment(fragmentSelectionne.id, patch)}
          onSupprimer={() => supprimerFragment(fragmentSelectionne.id)}
          onClose={() => setSelection(null)}
        />
      )}

      {noteSelectionnee && (
        <SequenceNoteEditor
          key={noteSelectionnee.id}
          note={noteSelectionnee}
          participants={participants}
          messages={messages}
          libelleParticipant={libelleParticipant}
          onMaj={(patch) => majNote(noteSelectionnee.id, patch)}
          onSupprimer={() => supprimerNote(noteSelectionnee.id)}
          onClose={() => setSelection(null)}
        />
      )}

      {!participantSelectionne && !fragmentSelectionne && !noteSelectionnee && participants.length > 0 && (
        <div className="sequence-options">
          <label>
            <input
              type="checkbox"
              checked={undefined !== contenu.cadre}
              onChange={(e) => emettre({ cadre: e.target.checked ? { nom: nom || '' } : undefined })}
            />
            Cadre <code>sd</code>
          </label>
          {contenu.cadre && (
            <input
              className="me-input"
              value={contenu.cadre.nom}
              onChange={(e) => emettre({ cadre: { nom: e.target.value } })}
              placeholder="Nom de l'interaction"
              autoComplete="off"
              spellCheck={false}
              aria-label="Nom du cadre sd"
            />
          )}
          <label>
            Numérotation
            <select
              className="me-input me-select"
              value={contenu.numerotation ?? ''}
              onChange={(e) => emettre({ numerotation: '' === e.target.value ? undefined : (e.target.value as 'simple' | 'hierarchique') })}
            >
              <option value="">Aucune</option>
              <option value="simple">1, 2, 3…</option>
              <option value="hierarchique">1, 1.1, 1.2, 2…</option>
            </select>
          </label>
        </div>
      )}

      {!participantSelectionne && !fragmentSelectionne && !noteSelectionnee && messages.length > 0 && (
        <div className="sequence-liste">
          {messages.map((m, index) => (
            <div
              key={m.id}
              className={`sequence-liste-ligne${glisserMessages.classe(index, messages.length)}${glisserMessages.enCours(m.id) ? ' is-glisse' : ''}`}
              {...glisserMessages.ligne(index)}
            >
              <span className="sequence-liste-index">
                <span className="sequence-poignee" title="Glisser pour changer l'ordre du message" {...glisserMessages.poignee(m.id)}>
                  {POIGNEE}
                </span>
                {index + 1}
              </span>
              <select value={m.deId} onChange={(e) => majMessage(m.id, { deId: e.target.value })}>
                <OptionsEmetteur participants={participants} />
              </select>
              <span aria-hidden="true">→</span>
              <select value={m.versId} onChange={(e) => majMessage(m.id, { versId: e.target.value })}>
                <OptionsDestinataire participants={participants} deId={m.deId} />
              </select>
              <ChampTexteAuto
                className="sequence-liste-texte"
                value={m.texte}
                onChange={(e) => majMessage(m.id, { texte: e.target.value })}
                placeholder="Message (Entrée = nouvelle ligne)"
              />
              <select value={m.type} onChange={(e) => majMessage(m.id, { type: e.target.value as SequenceMessageType })}>
                {(Object.keys(SEQUENCE_TYPE_LABELS) as SequenceMessageType[]).map((type) => (
                  <option key={type} value={type}>
                    {SEQUENCE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <SelecteurEffet valeur={m.effet} onChange={(effet) => majMessage(m.id, { effet })} />
              <button type="button" className="schema-mini" onClick={() => deplacerMessage(m.id, -1)} disabled={0 === index} title="Monter">
                ↑
              </button>
              <button type="button" className="schema-mini" onClick={() => deplacerMessage(m.id, 1)} disabled={index === messages.length - 1} title="Descendre">
                ↓
              </button>
              <button type="button" className="schema-mini schema-mini--danger" onClick={() => supprimerMessage(m.id)} title="Supprimer">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!pleinEcran &&
        cibleApercu &&
        createPortal(
          <ApercuExport
            generer={generer}
            contenu={contenuApercu}
            nom={nom || 'sequence'}
            options={optionsExport}
            onOptions={setOptionsExport}
            ouvert={apercuOuvert}
            onOuvert={setApercuOuvert}
          />,
          cibleApercu,
        )}
    </div>
  )
}

interface FrameProps {
  participants: SequenceParticipant[]
  disposition: Disposition
  pleinEcran: boolean
  selection: SequenceSelection
  onSelectionner: (selection: SequenceSelection) => void
  onDeplacerParticipant: (id: string, versIndex: number) => void
  onRegistrerRef: (el: HTMLDivElement | null) => void
}

function SequenceFlowFrame({ participants, disposition, pleinEcran, selection, onSelectionner, onDeplacerParticipant, onRegistrerRef }: FrameProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SequenceContentData, 'sequenceContent'>>([])
  const { fitView } = useReactFlow()
  const { largeurTotale, hauteurTotale } = disposition

  useEffect(() => {
    setNodes([
      {
        id: 'contenu',
        type: 'sequenceContent',
        position: { x: 0, y: 0 },
        // Taille extérieure du nœud = diagramme + marge de chaque côté.
        width: largeurTotale,
        height: hauteurTotale,
        draggable: false,
        selectable: false,
        connectable: false,
        data: { participants, disposition, selection, onSelectionner, onDeplacerParticipant, onRegistrerRef },
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, disposition, selection])

  // On recadre quand le diagramme change de FORME (participants, messages) ou que le cadre change
  // de taille (plein écran) — pas à chaque lettre tapée.
  const nbMessages = disposition.lignes.length
  const nbCadres = disposition.cadres.length
  useEffect(() => {
    const id = window.requestAnimationFrame(() => fitView({ padding: 0.08, maxZoom: 1.5, duration: 200 }))
    return () => window.cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants.length, nbMessages, nbCadres, pleinEcran])

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      nodeTypes={NODE_TYPES}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onPaneClick={() => onSelectionner(null)}
      minZoom={0.2}
      maxZoom={2}
      fitView
      fitViewOptions={{ padding: 0.08, maxZoom: 1.5 }}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}