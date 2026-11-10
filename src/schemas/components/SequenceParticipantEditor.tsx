import { useRef } from 'react'
import { SEQUENCE_FORME_LABELS, SEQUENCE_TYPE_LABELS, type ElementStyle, type SequenceForme, type SequenceMessage, type SequenceMessageType, type SequenceParticipant } from '../types'
import { ChampTexteAuto } from './ChampTexteAuto'
import { OptionsDestinataire, OptionsEmetteur, POIGNEE, SelecteurEffet, useGlisserMessages } from './SequenceMessageCommun'
import { EditeurCadre } from './EditeurCadre'
import './merise.css'

interface Props {
  participant: SequenceParticipant
  participants: SequenceParticipant[]
  /** TOUS les messages du diagramme, dans l'ordre : l'éditeur n'affiche que ceux du participant. */
  messages: SequenceMessage[]
  /** Message dont le champ de destinataire prend le focus : le dernier créé. */
  dernierMessageId: string | null
  onNom: (nom: string) => void
  onMajParticipant: (patch: Partial<SequenceParticipant>) => void
  onStyle: (style: Partial<ElementStyle> | undefined) => void
  onSupprimer: () => void
  /** -1 = d'une place vers la gauche, 1 = vers la droite. */
  onDeplacer: (sens: -1 | 1) => void
  peutDeplacer: { gauche: boolean; droite: boolean }
  onClose: () => void
  /** Crée un message DÉPART = ce participant, destinataire et libellé vides. */
  onNouveauMessage: () => void
  onMajMessage: (id: string, patch: Partial<SequenceMessage>) => void
  onSupprimerMessage: (id: string) => void
  onDeplacerMessage: (id: string, direction: -1 | 1) => void
  /** Glisser-déposer : place le message `id` avant la position `versIndex` (0 = tout en haut). */
  onDeplacerMessageVers: (id: string, versIndex: number) => void
}

const TYPES = Object.keys(SEQUENCE_TYPE_LABELS) as SequenceMessageType[]

const CLES_PARTICIPANT: (keyof ElementStyle)[] = ['couleurContour', 'couleurNom', 'couleurFondTitre', 'couleurTexte', 'couleurFondLigne']
const LIBELLES_PARTICIPANT: Partial<Record<keyof ElementStyle, string>> = {
  couleurContour: 'Contour et ligne de vie',
  couleurNom: 'Nom',
  couleurFondTitre: 'Fond de l’en-tête',
  couleurTexte: 'Flèches et messages émis',
  couleurFondLigne: 'Fond des barres d’activation',
}

/**
 * Éditeur d'un participant (même cadre que les éditeurs de tables) : nom, apparence, et ses
 * messages (envoyés ou reçus). « + Nouveau message », sous la dernière ligne, ajoute une ligne
 * dont le départ est ce participant ; destinataire et libellé restent à remplir — la flèche
 * se trace dès que le destinataire est choisi.
 */
export function SequenceParticipantEditor({
  participant,
  participants,
  messages,
  dernierMessageId,
  onNom,
  onMajParticipant,
  onStyle,
  onSupprimer,
  onDeplacer,
  peutDeplacer,
  onClose,
  onNouveauMessage,
  onMajMessage,
  onSupprimerMessage,
  onDeplacerMessage,
  onDeplacerMessageVers,
}: Props) {
  const glisser = useGlisserMessages(onDeplacerMessageVers)
  const racineRef = useRef<HTMLDivElement | null>(null)
  const lignes = messages
    .map((m, index) => ({ m, index }))
    .filter(({ m }) => m.deId === participant.id || m.versId === participant.id)

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom="Nom du participant"
      placeholderNom="Participant"
      nom={participant.nom}
      onNom={onNom}
      style={participant.style}
      onStyle={onStyle}
      onClose={onClose}
      cles={CLES_PARTICIPANT}
      libellesStyle={LIBELLES_PARTICIPANT}
      champEntete={
        <label className="me-champ-nom">
          <span className="me-etiquette">Nom du participant</span>
          <ChampTexteAuto
            className="me-input me-input--titre me-textarea"
            value={participant.nom}
            onChange={(e) => onNom(e.target.value)}
            placeholder="Participant (Entrée = nouvelle ligne, sans couper les mots)"
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            spellCheck={false}
          />
        </label>
      }
      actions={
        <>
          <button type="button" className="me-bouton me-bouton--icone" onClick={() => onDeplacer(-1)} disabled={!peutDeplacer.gauche} title="Déplacer d'une place vers la gauche (ou glisser l'en-tête)" aria-label="Déplacer vers la gauche">
            ◀
          </button>
          <button type="button" className="me-bouton me-bouton--icone" onClick={() => onDeplacer(1)} disabled={!peutDeplacer.droite} title="Déplacer d'une place vers la droite (ou glisser l'en-tête)" aria-label="Déplacer vers la droite">
            ▶
          </button>
          <button type="button" className="me-bouton me-bouton--danger" onClick={onSupprimer} title="Supprime le participant et ses messages">
            Supprimer
          </button>
        </>
      }
    >
      <div className="me-tableau sequence-editor">
        <div className="me-ligne me-ligne--portee sequence-identite">
          <span className="me-etiquette">Forme</span>
          <select className="me-input me-select" value={participant.forme ?? 'objet'} onChange={(e) => onMajParticipant({ forme: e.target.value as SequenceForme })}>
            {(Object.keys(SEQUENCE_FORME_LABELS) as SequenceForme[]).map((forme) => (
              <option key={forme} value={forme}>
                {SEQUENCE_FORME_LABELS[forme]}
              </option>
            ))}
          </select>
          <span className="me-etiquette">Classe</span>
          <input
            className="me-input"
            value={participant.classe ?? ''}
            onChange={(e) => onMajParticipant({ classe: e.target.value })}
            placeholder="ex. PlatController  →  s'affiche « nom : PlatController »"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {lignes.map(({ m, index }) => (
          <div key={m.id} className={`me-ligne me-ligne--sequence${glisser.classe(index, messages.length)}${glisser.enCours(m.id) ? ' is-glisse' : ''}`} {...glisser.ligne(index)}>
            <span className="me-etiquette">
              <span className="sequence-poignee" title="Glisser pour changer l'ordre du message" {...glisser.poignee(m.id)}>
                {POIGNEE}
              </span>
              {index + 1}
            </span>
            <select className="me-input me-select" value={m.deId} onChange={(e) => onMajMessage(m.id, { deId: e.target.value })} aria-label="Émetteur">
              <OptionsEmetteur participants={participants} />
            </select>
            <span aria-hidden="true">→</span>
            <select
              className="me-input me-select"
              value={m.versId}
              onChange={(e) => onMajMessage(m.id, { versId: e.target.value })}
              aria-label="Destinataire"
              autoFocus={m.id === dernierMessageId}
            >
              <OptionsDestinataire participants={participants} deId={m.deId} />
            </select>
            <ChampTexteAuto
              className="me-input me-textarea"
              value={m.texte}
              onChange={(e) => onMajMessage(m.id, { texte: e.target.value })}
              placeholder="Message (Entrée = nouvelle ligne)"
              spellCheck={false}
            />
            <select className="me-input me-select" value={m.type} onChange={(e) => onMajMessage(m.id, { type: e.target.value as SequenceMessageType })} aria-label="Type de message">
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {SEQUENCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <SelecteurEffet className="me-input me-select" valeur={m.effet} onChange={(effet) => onMajMessage(m.id, { effet })} />
            {'retour' === m.type ? (
              <span />
            ) : (
              <select
                className="me-input me-select"
                value={m.activation ?? ''}
                onChange={(e) => onMajMessage(m.id, { activation: '' === e.target.value ? undefined : e.target.value })}
                aria-label="Barre d'activation du destinataire"
                title="Barre d'activation du destinataire : automatique (jusqu'à la réponse), aucune, ou jusqu'à un message précis"
              >
                <option value="">Barre : auto</option>
                <option value="aucune">Barre : aucune</option>
                {messages.slice(index).map((suivant, k) => (
                  <option key={suivant.id} value={suivant.id}>
                    Barre → n° {index + k + 1}
                  </option>
                ))}
              </select>
            )}
            <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => onDeplacerMessage(m.id, -1)} disabled={0 === index} title="Monter">
              ↑
            </button>
            <button
              type="button"
              className="me-bouton me-bouton--icone me-bouton--mini"
              onClick={() => onDeplacerMessage(m.id, 1)}
              disabled={index === messages.length - 1}
              title="Descendre"
            >
              ↓
            </button>
            <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => onSupprimerMessage(m.id)} title="Supprimer le message" aria-label="Supprimer le message">
              ×
            </button>
          </div>
        ))}

        <button type="button" className="me-bouton me-bouton--petit me-nouveau-message" onClick={onNouveauMessage}>
          + Nouveau message
        </button>
      </div>
    </EditeurCadre>
  )
}