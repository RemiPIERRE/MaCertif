export type Niveau = 'facile' | 'moyen' | 'difficile'
export type Competence = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8'

export interface QuestionQcm {
  id: string
  competence: Competence
  niveau: Niveau
  theme: string
  type: 'qcm'
  question: string
  choix: [string, string, string, string]
  reponse: number
  explication: string
}

export interface QuestionOuverte {
  id: string
  competence: Competence
  niveau: Niveau
  theme: string
  type: 'ouverte'
  question: string
  reponse_attendue: string
}

export type Question = QuestionQcm | QuestionOuverte

export type Mode = 'qcm' | 'ouverte' | 'mix'

export interface Reglages {
  /** Clé = compétence|thème (voir themeKey()). */
  themes: Set<string>
  nombre: number
  minuteur: number
  mode: Mode
  niveaux: Set<Niveau>
}

export interface Reponse {
  question: Question
  /** Index choisi (qcm) ou texte saisi (ouverte). */
  valeur: number | string
  correcte: boolean
  /** Temps écoulé en secondes au moment de la réponse (ou du timeout). */
  tempsEcoule: number
}

export interface PartieTerminee {
  reponses: Reponse[]
  score: number
  meilleureSerie: number
}
