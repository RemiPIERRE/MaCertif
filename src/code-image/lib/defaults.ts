import type { Reglages, TacheLiee } from '../types'

/** Pensé pour le dossier imprimé : fond blanc, thème clair, pas d'ombre, 2x pour rester net sur papier. */
export const REGLAGES_IMPRESSION: Reglages = {
  langage: 'auto',
  theme: 'github-light',
  fond: 'blanc',
  police: 'jetbrains',
  taillePolice: 14,
  remplissage: 24,
  nomFichier: '',
  numerosLignes: true,
  premiereLigne: 1,
  lignesMisesEnAvant: '',
  lignesMasquees: '',
  fenetre: true,
  ombre: false,
  largeur: 'auto',
  echelle: 2,
}

/** Rendu « capture d'écran » pour le support oral (écran, fond sombre). */
export const REGLAGES_ECRAN: Reglages = {
  ...REGLAGES_IMPRESSION,
  theme: 'one-dark',
  fond: 'ocean',
  remplissage: 48,
  ombre: true,
  numerosLignes: true,
  echelle: 2,
}

export const REGLAGES_PAR_DEFAUT: Reglages = REGLAGES_IMPRESSION

export type PresetId = 'impression' | 'ecran'

/** Applique uniquement la partie « style » d'un préréglage : le langage, le titre et les lignes ne bougent pas. */
export function appliquerPreset(r: Reglages, preset: PresetId): Reglages {
  const p = preset === 'impression' ? REGLAGES_IMPRESSION : REGLAGES_ECRAN
  return {
    ...r,
    theme: p.theme,
    fond: p.fond,
    ombre: p.ombre,
    fenetre: p.fenetre,
    remplissage: p.remplissage,
    taillePolice: p.taillePolice,
    numerosLignes: p.numerosLignes,
    echelle: p.echelle,
  }
}

/** Tâches du dossier qui attendent une image d'extrait de code. */
export const TACHES_CODE_PAR_DEFAUT: TacheLiee[] = [
  { id: 'code-capture-frontend', label: 'Extrait de code frontend (11.1)' },
  { id: 'code-capture-backend', label: 'Extrait de code backend (11.2)' },
  { id: 'code-capture-reset', label: 'Réinitialisation du mot de passe (12.1)' },
]

/** Au-delà, un avertissement de lisibilité à l'impression est affiché. */
export const SEUIL_LIGNES_LONGUES = 30
export const CODE_MAX_CARACTERES = 20000
