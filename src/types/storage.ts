export interface ProfilInfos {
  nom: string
  prenom: string
  nomProjet: string
  sousTitreProjet: string
  nomOrganisme: string
  dateDebutFormation: string
  dateFinFormation: string
  dateDebutStage: string
  dateFinStage: string
  /** Informative only — never inserted into the Word export. */
  dateExamen: string
}

export const EMPTY_PROFIL: ProfilInfos = {
  nom: '',
  prenom: '',
  nomProjet: '',
  sousTitreProjet: '',
  nomOrganisme: '',
  dateDebutFormation: '',
  dateFinFormation: '',
  dateDebutStage: '',
  dateFinStage: '',
  dateExamen: '',
}

export interface DossierReponse {
  text: string
  updatedAt: string
}

export type DossierReponses = Record<string, DossierReponse>

export type SiteCoches = Record<string, boolean>

export interface Note {
  id: string
  text: string
  color: string
  createdAt: string
}

export interface Deadline {
  id: string
  label: string
  date: string
  note: string
}

/** Answers to the personalisation questionnaire, keyed by question id. true = task shown. */
export type Questionnaire = Record<string, boolean>

export const STORAGE_KEYS = {
  profil: 'profil:infos',
  dossier: 'dossier:reponses',
  site: 'site:coches',
  notes: 'notes:items',
  calendrier: 'calendrier:deadlines',
  questionnaire: 'profil:questionnaire',
} as const
