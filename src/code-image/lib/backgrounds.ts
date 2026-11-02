export interface FondDef {
  id: string
  label: string
  /** valeur CSS `background` ; null = transparent */
  css: string | null
  /** vrai si le fond est clair (ombre plus légère) */
  clair: boolean
  groupe: 'degrade' | 'impression'
}

export const FONDS: FondDef[] = [
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #ff9966 0%, #ff5e7e 52%, #8e44ad 100%)', clair: false, groupe: 'degrade' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 55%, #1e3a8a 100%)', clair: false, groupe: 'degrade' },
  { id: 'emerald', label: 'Emerald', css: 'linear-gradient(135deg, #6ee7b7 0%, #059669 55%, #064e3b 100%)', clair: false, groupe: 'degrade' },
  { id: 'twilight', label: 'Twilight', css: 'linear-gradient(135deg, #6366f1 0%, #a855f7 52%, #ec4899 100%)', clair: false, groupe: 'degrade' },
  { id: 'candy', label: 'Candy', css: 'linear-gradient(135deg, #fbcfe8 0%, #c4b5fd 52%, #a5d8ff 100%)', clair: true, groupe: 'degrade' },
  { id: 'carbon', label: 'Carbon', css: 'linear-gradient(135deg, #3f3f46 0%, #18181b 55%, #09090b 100%)', clair: false, groupe: 'degrade' },
  { id: 'transparent', label: 'Transparent', css: null, clair: true, groupe: 'degrade' },
  { id: 'blanc', label: 'Blanc (impression)', css: '#ffffff', clair: true, groupe: 'impression' },
  { id: 'gris-clair', label: 'Gris clair (impression)', css: '#eef0f3', clair: true, groupe: 'impression' },
]

export const FOND_PAR_DEFAUT = 'blanc'

export function getFond(id: string): FondDef {
  return FONDS.find((f) => f.id === id) ?? FONDS.find((f) => f.id === FOND_PAR_DEFAUT)!
}
