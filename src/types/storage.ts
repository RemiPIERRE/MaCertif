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
  /** Informative only, never inserted into the Word export: an exam usually spans several days. */
  dateExamenDebut: string
  dateExamenFin: string
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
  dateExamenDebut: '',
  dateExamenFin: '',
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

/**
 * Answers to the personalisation questionnaire, keyed by question id. Boolean
 * questions store `false` for "non" (anything else, including unanswered, counts
 * as active); choice questions store the selected option's string value.
 */
export type Questionnaire = Record<string, boolean | string>

/**
 * A pense-bête created from a text or image task: "I'll need an annex/inline image
 * here", named but not written yet. Shows up in Mon site as "à préparer".
 */
export interface CustomSiteRef {
  id: string
  taskId: string
  label: string
  kind: 'annexe' | 'inline'
  ready: boolean
  createdAt: string
}

export const STORAGE_KEYS = {
  profil: 'profil:infos',
  dossier: 'dossier:reponses',
  site: 'site:coches',
  siteCustomRefs: 'site:custom-refs',
  notes: 'notes:items',
  calendrier: 'calendrier:deadlines',
  questionnaire: 'profil:questionnaire',
} as const
