import { useRef } from 'react'
import { SEQUENCE_NOTE_GENRE_LABELS, SEQUENCE_NOTE_POSITION_LABELS, type ElementStyle, type SequenceNoteGenre, type SequenceMessage, type SequenceNote, type SequenceNotePosition, type SequenceParticipant } from '../types'
import { etiquetteParticipant } from '../lib/sequenceLayout'
import { ChampTexteAuto } from './ChampTexteAuto'
import { EditeurCadre } from './EditeurCadre'
import './merise.css'

interface Props {
  note: SequenceNote
  participants: SequenceParticipant[]
  messages: SequenceMessage[]
  libelleParticipant: (id: string) => string
  onMaj: (patch: Partial<SequenceNote>) => void
  onSupprimer: () => void
  onClose: () => void
}

const GENRES = Object.keys(SEQUENCE_NOTE_GENRE_LABELS) as SequenceNoteGenre[]
const POSITIONS = Object.keys(SEQUENCE_NOTE_POSITION_LABELS) as SequenceNotePosition[]
const CLES_NOTE: (keyof ElementStyle)[] = ['couleurContour', 'couleurNom', 'couleurFondTitre']
const LIBELLES_NOTE: Partial<Record<keyof ElementStyle, string>> = {
  couleurContour: 'Contour',
  couleurNom: 'Texte',
  couleurFondTitre: 'Fond',
}
const TEXTES: Record<SequenceNoteGenre, { champ: string; placeholder: string; supprimer: string }> = {
  note: { champ: 'Texte de la note', placeholder: 'Note (Entrée = nouvelle ligne)', supprimer: 'Supprimer la note' },
  ref: { champ: 'Interaction référencée', placeholder: 'ex. Authentification', supprimer: 'Supprimer la référence' },
  etat: { champ: 'État de la ligne de vie', placeholder: 'ex. {connecté}', supprimer: "Supprimer l'invariant" },
  duree: { champ: 'Contrainte de durée', placeholder: 'ex. {0..3s}', supprimer: 'Supprimer la contrainte' },
}

/**
 * Éditeur d'une note (commentaire UML), d'une référence `ref`, d'un invariant d'état ou d'une contrainte de durée : texte sur plusieurs lignes, position par rapport à un
 * participant (sur sa ligne de vie, à gauche, à droite) et moment où elle s'insère dans la
 * chronologie (après quel message).
 */
export function SequenceNoteEditor({ note, participants, messages, libelleParticipant, onMaj, onSupprimer, onClose }: Props) {
  const racineRef = useRef<HTMLDivElement | null>(null)
  const genre = note.genre ?? 'note'
  const textes = TEXTES[genre]
  /** Changer de genre ramène les réglages incompatibles à une valeur valide. */
  const changerGenre = (nouveau: SequenceNoteGenre) => {
    const dernier = messages[messages.length - 1]?.id
    onMaj({
      genre: 'note' === nouveau ? undefined : nouveau,
      position: 'note' === nouveau ? note.position : 'sur',
      apresId: 'duree' === nouveau ? (note.apresId ?? dernier ?? null) : note.apresId,
      finId: 'duree' === nouveau ? (note.finId ?? note.apresId ?? dernier) : undefined,
      participantFinId: 'ref' === nouveau || 'note' === nouveau ? note.participantFinId : undefined,
    })
  }
  const titreMessage = (m: SequenceMessage, i: number) => {
    const vers = '' === m.versId ? '…' : libelleParticipant(m.versId)
    const texte = m.texte.split('\n')[0]
    return `${i + 1} · ${libelleParticipant(m.deId)} → ${vers}${'' === texte ? '' : ` : ${texte}`}`
  }

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom=""
      placeholderNom=""
      nom=""
      onNom={() => undefined}
      style={note.style}
      onStyle={(style) => onMaj({ style })}
      onClose={onClose}
      cles={CLES_NOTE}
      libellesStyle={LIBELLES_NOTE}
      champEntete={
        <label className="me-champ-nom sequence-note-texte">
          <span className="me-etiquette">{textes.champ}</span>
          <ChampTexteAuto
            className="me-input me-textarea"
            value={note.texte}
            onChange={(e) => onMaj({ texte: e.target.value })}
            placeholder={textes.placeholder}
            spellCheck={false}
            autoFocus
          />
        </label>
      }
      actions={
        <button type="button" className="me-bouton me-bouton--danger" onClick={onSupprimer}>
          {textes.supprimer}
        </button>
      }
    >
      <div className="me-tableau sequence-editor">
        <div className="me-ligne me-ligne--portee">
          <span className="me-etiquette">Type</span>
          <select className="me-input me-select" value={genre} onChange={(e) => changerGenre(e.target.value as SequenceNoteGenre)}>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {SEQUENCE_NOTE_GENRE_LABELS[g]}
              </option>
            ))}
          </select>
          <span className="me-etiquette">Participant</span>
          <select className="me-input me-select" value={note.participantId} onChange={(e) => onMaj({ participantId: e.target.value })}>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {etiquetteParticipant(p)}
              </option>
            ))}
          </select>
        </div>

        {'duree' === genre ? (
          <div className="me-ligne me-ligne--portee">
            <span className="me-etiquette">Du message</span>
            <select className="me-input me-select" value={note.apresId ?? ''} onChange={(e) => onMaj({ apresId: e.target.value })}>
              {messages.map((m, i) => (
                <option key={m.id} value={m.id}>
                  {titreMessage(m, i)}
                </option>
              ))}
            </select>
            <span className="me-etiquette">au message</span>
            <select className="me-input me-select" value={note.finId ?? note.apresId ?? ''} onChange={(e) => onMaj({ finId: e.target.value })}>
              {messages.map((m, i) => (
                <option key={m.id} value={m.id}>
                  {titreMessage(m, i)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="me-ligne me-ligne--portee">
            <span className="me-etiquette">Placée</span>
            <select className="me-input me-select" value={note.apresId ?? ''} onChange={(e) => onMaj({ apresId: '' === e.target.value ? null : e.target.value })}>
              <option value="">Tout en haut du diagramme</option>
              {messages.map((m, i) => (
                <option key={m.id} value={m.id}>
                  Après {titreMessage(m, i)}
                </option>
              ))}
            </select>
            {'note' === genre ? (
              <>
                <span className="me-etiquette">Position</span>
                <select className="me-input me-select" value={note.position} onChange={(e) => onMaj({ position: e.target.value as SequenceNotePosition })}>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {SEQUENCE_NOTE_POSITION_LABELS[pos]}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <span />
                <span />
              </>
            )}
          </div>
        )}

        {('ref' === genre || ('note' === genre && 'sur' === note.position)) && (
          <div className="me-ligne me-ligne--portee">
            <span className="me-etiquette">Jusqu'à</span>
            <select className="me-input me-select" value={note.participantFinId ?? ''} onChange={(e) => onMaj({ participantFinId: '' === e.target.value ? undefined : e.target.value })}>
              <option value="">— ce participant seulement —</option>
              {participants
                .filter((p) => p.id !== note.participantId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {etiquetteParticipant(p)}
                  </option>
                ))}
            </select>
            <span />
            <span />
          </div>
        )}
      </div>
    </EditeurCadre>
  )
}