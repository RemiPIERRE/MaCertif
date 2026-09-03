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
 * Answers to the old (V2.0) personalisation questionnaire, keyed by question id.
 * Superseded by `Caracteristiques` (see data/caracteristiques.ts) for gating dossier
 * tasks — kept only so old exports (V1.5-V2.0) still carry a recognised, validated
 * shape on import. Nothing in the live app reads or writes this key any more.
 */
export type Questionnaire = Record<string, boolean | string>

/**
 * Independent oui/non characteristics of the candidate's project(s), keyed by
 * characteristic id (see data/caracteristiques.ts). `true` = "oui"; absent or
 * `false` = "non" (nothing disappears from Mon dossier until actively checked).
 */
export type Caracteristiques = Record<string, boolean>

/** One DWWM referential competency (C1-C8): self-declared, never computed automatically. */
export interface Competence {
  validee: boolean
  texte: string
}

/** Keyed by competency id (see data/competences.ts). */
export type Competences = Record<string, Competence>

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
  caracteristiques: 'dossier:caracteristiques',
  competences: 'dossier:competences',
  oralPresentation: 'oral:presentation',
  oralAnnexes: 'oral:annexes',
  oralTheme: 'oral:theme',
} as const
