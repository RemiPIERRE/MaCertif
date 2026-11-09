import { useRef } from 'react'
import { SEQUENCE_OPERATEUR_LABELS, type ElementStyle, type SequenceFragment, type SequenceMessage, type SequenceOperateur } from '../types'
import { generateId } from '../../lib/id'
import { EditeurCadre } from './EditeurCadre'
import './merise.css'

interface Props {
  fragment: SequenceFragment
  messages: SequenceMessage[]
  libelleParticipant: (id: string) => string
  onMaj: (patch: Partial<SequenceFragment>) => void
  onSupprimer: () => void
  onClose: () => void
}

const OPERATEURS = Object.keys(SEQUENCE_OPERATEUR_LABELS) as SequenceOperateur[]
/** Opérateurs qui se découpent en plusieurs opérandes séparés par une ligne en pointillé. */
const MULTI_OPERANDES: SequenceOperateur[] = ['alt', 'par', 'seq', 'strict']

const CLES_FRAGMENT: (keyof ElementStyle)[] = ['couleurContour', 'couleurNom', 'couleurFondTitre']
const LIBELLES_FRAGMENT: Partial<Record<keyof ElementStyle, string>> = {
  couleurContour: 'Cadre',
  couleurNom: 'Texte (opérateur, gardes)',
  couleurFondTitre: 'Fond de l’étiquette',
}

/**
 * Éditeur d'un fragment combiné (alt, opt, loop, par, break, critical, neg, assert, strict, seq, ignore, consider) : opérateur, condition de
 * garde, messages enveloppés (du n° … au n° …) et, pour alt / par, les opérandes supplémentaires
 * (« else »). Le cadre et son étiquette suivent automatiquement ; loop accepte des bornes, ignore / consider une liste de messages.
 */
export function SequenceFragmentEditor({ fragment, messages, libelleParticipant, onMaj, onSupprimer, onClose }: Props) {
  const racineRef = useRef<HTMLDivElement | null>(null)
  const idx = (id: string) => messages.findIndex((m) => m.id === id)
  const debut = Math.max(0, idx(fragment.debutId))
  const fin = Math.max(0, idx(fragment.finId))
  const lo = Math.min(debut, fin)
  const hi = Math.max(debut, fin)
  const multi = MULTI_OPERANDES.includes(fragment.operateur)
  const operandes = fragment.operandes ?? []

  const titreMessage = (m: SequenceMessage, i: number) => {
    const vers = '' === m.versId ? '…' : libelleParticipant(m.versId)
    const texte = m.texte.split('\n')[0]
    return `${i + 1} · ${libelleParticipant(m.deId)} → ${vers}${'' === texte ? '' : ` : ${texte}`}`
  }
  const optionsMessages = messages.map((m, i) => (
    <option key={m.id} value={m.id}>
      {titreMessage(m, i)}
    </option>
  ))

  const ajouterOperande = () => {
    // Nouvel opérande : démarre au dernier message du fragment s'il n'est pas déjà le premier, sinon au suivant.
    const candidat = messages[Math.min(hi, lo + 1)]
    if (!candidat || candidat.id === messages[lo]?.id) return
    onMaj({ operandes: [...operandes, { id: generateId(), messageId: candidat.id, garde: 'alt' === fragment.operateur ? 'sinon' : '' }] })
  }

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom=""
      placeholderNom=""
      nom=""
      onNom={() => undefined}
      style={fragment.style}
      onStyle={(style) => onMaj({ style })}
      onClose={onClose}
      cles={CLES_FRAGMENT}
      libellesStyle={LIBELLES_FRAGMENT}
      champEntete={
        <div className="sequence-fragment-entete">
          <label className="me-champ-nom">
            <span className="me-etiquette">Fragment</span>
            <select className="me-input me-select" value={fragment.operateur} onChange={(e) => onMaj({ operateur: e.target.value as SequenceOperateur })}>
              {OPERATEURS.map((o) => (
                <option key={o} value={o}>
                  {SEQUENCE_OPERATEUR_LABELS[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="me-champ-nom">
            <span className="me-etiquette">Condition de garde</span>
            <input
              className="me-input"
              value={fragment.garde}
              onChange={(e) => onMaj({ garde: e.target.value })}
              placeholder="ex. données invalides"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </label>
        </div>
      }
      actions={
        <button type="button" className="me-bouton me-bouton--danger" onClick={onSupprimer} title="Supprime le cadre (les messages restent)">
          Supprimer le cadre
        </button>
      }
    >
      <div className="me-tableau sequence-editor">
        <div className="me-ligne me-ligne--portee">
          <span className="me-etiquette">Du message</span>
          <select className="me-input me-select" value={messages[lo]?.id ?? ''} onChange={(e) => onMaj({ debutId: e.target.value })}>
            {optionsMessages}
          </select>
          <span className="me-etiquette">au message</span>
          <select className="me-input me-select" value={messages[hi]?.id ?? ''} onChange={(e) => onMaj({ finId: e.target.value })}>
            {optionsMessages}
          </select>
        </div>

        {'loop' === fragment.operateur && (
          <div className="me-ligne me-ligne--portee">
            <span className="me-etiquette">Itérations min</span>
            <input className="me-input" value={fragment.min ?? ''} onChange={(e) => onMaj({ min: e.target.value })} placeholder="ex. 1 (vide = boucle simple)" autoComplete="off" spellCheck={false} />
            <span className="me-etiquette">max</span>
            <input className="me-input" value={fragment.max ?? ''} onChange={(e) => onMaj({ max: e.target.value })} placeholder="ex. 5, n ou * (vide = *)" autoComplete="off" spellCheck={false} />
          </div>
        )}

        {('ignore' === fragment.operateur || 'consider' === fragment.operateur) && (
          <div className="me-ligne me-ligne--portee">
            <span className="me-etiquette">{'ignore' === fragment.operateur ? 'Messages ignorés' : 'Messages considérés'}</span>
            <input className="me-input" value={fragment.liste ?? ''} onChange={(e) => onMaj({ liste: e.target.value })} placeholder="ex. log, ping  →  s'affiche « ignore {log, ping} »" autoComplete="off" spellCheck={false} />
            <span />
            <span />
          </div>
        )}

        {multi &&
          operandes.map((o) => (
            <div key={o.id} className="me-ligne me-ligne--portee">
              <span className="me-etiquette">{'alt' === fragment.operateur ? 'Sinon dès' : 'Branche dès'}</span>
              <select className="me-input me-select" value={o.messageId} onChange={(e) => onMaj({ operandes: operandes.map((x) => (x.id === o.id ? { ...x, messageId: e.target.value } : x)) })}>
                {messages.slice(lo + 1, hi + 1).map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {titreMessage(m, lo + 1 + i)}
                  </option>
                ))}
              </select>
              <span className="me-etiquette">garde</span>
              <div className="sequence-operande-garde">
                <input
                  className="me-input"
                  value={o.garde}
                  onChange={(e) => onMaj({ operandes: operandes.map((x) => (x.id === o.id ? { ...x, garde: e.target.value } : x)) })}
                  placeholder="ex. sinon"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => onMaj({ operandes: operandes.filter((x) => x.id !== o.id) })} title="Retirer cet opérande" aria-label="Retirer cet opérande">
                  ×
                </button>
              </div>
            </div>
          ))}

        {multi && (
          <button type="button" className="me-bouton me-bouton--petit me-nouveau-message" onClick={ajouterOperande} disabled={hi - lo < 1}>
            {'alt' === fragment.operateur ? '+ Ajouter un « sinon »' : '+ Ajouter une branche'}
          </button>
        )}
        {multi && hi - lo < 1 && <p className="me-astuce">Un « sinon » demande au moins deux messages dans le cadre.</p>}
      </div>
    </EditeurCadre>
  )
}