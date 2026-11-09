import { createContext } from 'react'

/** Niveau de modélisation du schéma affiché (fourni par SchemaCanvas) : le nœud "table"
 * est partagé entre MLD et MPD et n'affiche pas les mêmes informations. */
export type NiveauTable = 'mld' | 'mpd'

export const NiveauContext = createContext<NiveauTable>('mpd')
