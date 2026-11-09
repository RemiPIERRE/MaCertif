import { useState, type DragEvent } from 'react'
import { etiquetteParticipant } from '../lib/sequenceLayout'
import { SEQUENCE_EFFET_LABELS, SEQUENCE_PERDU, SEQUENCE_TROUVE, type SequenceEffet, type SequenceParticipant } from '../types'

/** Options du sélecteur d'émetteur : les participants, plus l'extérieur du système (message trouvé). */
export function OptionsEmetteur({ participants }: { participants: SequenceParticipant[] }) {
  return (
    <>
      {participants.map((p) => (
        <option key={p.id} value={p.id}>
          {etiquetteParticipant(p)}
        </option>
      ))}
      <option value={SEQUENCE_TROUVE}>● Extérieur (trouvé)</option>
    </>
  )
}

/** Options du sélecteur de destinataire : les participants, plus la destination perdue (message perdu). */
export function OptionsDestinataire({ participants, deId }: { participants: SequenceParticipant[]; deId: string }) {
  return (
    <>
      <option value="" disabled>
        — destinataire —
      </option>
      {participants.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id === deId ? `${etiquetteParticipant(p)} (lui-même)` : etiquetteParticipant(p)}
        </option>
      ))}
      <option value={SEQUENCE_PERDU}>● Perdu</option>
    </>
  )
}

/** Effet du message sur son destinataire : aucun, création («create») ou destruction («destroy»). */
export function SelecteurEffet({ valeur, onChange, className }: { valeur: SequenceEffet | undefined; onChange: (effet: SequenceEffet | undefined) => void; className?: string }) {
  return (
    <select
      className={className}
      value={valeur ?? ''}
      onChange={(e) => onChange('' === e.target.value ? undefined : (e.target.value as SequenceEffet))}
      aria-label="Effet sur le destinataire"
      title="Création : la boîte du destinataire apparaît au niveau de la flèche. Destruction : une croix termine sa ligne de vie."
    >
      <option value="">Effet : aucun</option>
      {(Object.keys(SEQUENCE_EFFET_LABELS) as SequenceEffet[]).map((effet) => (
        <option key={effet} value={effet}>
          {SEQUENCE_EFFET_LABELS[effet]}
        </option>
      ))}
    </select>
  )
}

/**
 * Glisser-déposer des lignes de message pour les réordonner. `poignee(id)` : props de la
 * poignée (seule partie « attrapable » de la ligne, pour ne pas gêner la saisie de texte) ;
 * `ligne(index)` : props de la ligne qui reçoit ; `classe(index, total)` : repère d'insertion.
 */
export function useGlisserMessages(deplacer: (id: string, versIndex: number) => void) {
  const [glisse, setGlisse] = useState<string | null>(null)
  const [survol, setSurvol] = useState<number | null>(null)
  const fin = () => {
    setGlisse(null)
    setSurvol(null)
  }
  return {
    poignee: (id: string) => ({
      draggable: true as const,
      onDragStart: (e: DragEvent<HTMLElement>) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', id)
        const ligne = e.currentTarget.closest('[data-ligne-message]')
        if (ligne) e.dataTransfer.setDragImage(ligne, 12, 12)
        setGlisse(id)
      },
      onDragEnd: fin,
    }),
    ligne: (index: number) => ({
      'data-ligne-message': '',
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (null === glisse) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        const r = e.currentTarget.getBoundingClientRect()
        setSurvol(e.clientY < r.top + r.height / 2 ? index : index + 1)
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        if (null === glisse) return
        e.preventDefault()
        if (null !== survol) deplacer(glisse, survol)
        fin()
      },
    }),
    classe: (index: number, total: number) =>
      null === glisse ? '' : survol === index ? ' is-insertion-avant' : survol === total && index === total - 1 ? ' is-insertion-apres' : '',
    enCours: (id: string) => glisse === id,
  }
}

/** Poignée « ⠿ » : attraper pour réordonner. */
export const POIGNEE = '⠿'
