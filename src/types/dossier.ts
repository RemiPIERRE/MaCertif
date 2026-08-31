export type TaskType = 'text' | 'image'

export interface DossierTask {
  /** Stable id, used as the localStorage answer key. */
  id: string
  /** Order of appearance in the "Mon dossier" editing flow. */
  number: number
  /** Consigne shown in the app to guide the writer. */
  title: string
  /**
   * Professional title used in the compiled dossier / Word export. Falls back to
   * `title` when absent (kept optional so new tasks can omit it while being drafted).
   */
  sectionTitle?: string
  type: TaskType
  /** Indicative minimum; never blocks saving. null when there is no target at all. */
  minChars: number | null
  /** null = no upper bound (the general rule for all "texte" tasks). */
  maxChars: number | null
  /** Generic example text shown in the blue "Exemple" box. Filled in later (phase 2). */
  example: string | null
  /**
   * Id(s) of questionnaire question(s) (see src/data/questionnaire.ts) gating this
   * task. When an array, every question must be answered "oui" for the task to
   * stay active. Answering "non" to any of them excludes the task from the
   * dossier, Mon site and progress calculations.
   */
  conditionalOn?: string | string[]
}

export interface DossierSubchapter {
  id: string
  code: string
  title: string
  tasks: DossierTask[]
}

export interface DossierChapter {
  id: string
  number: number
  title: string
  subchapters?: DossierSubchapter[]
  tasks?: DossierTask[]
}
