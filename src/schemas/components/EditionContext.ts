import { createContext } from 'react'

/**
 * Élément en cours d'édition (ouvert par un double-clic). Un simple clic ne fait que sélectionner
 * (déplacement, redimensionnement) ; le texte et l'apparence ne se modifient qu'en édition.
 */
export interface EditionContextValue {
  editionId: string | null
  fermer: () => void
}

export const EditionContext = createContext<EditionContextValue>({ editionId: null, fermer: () => undefined })
