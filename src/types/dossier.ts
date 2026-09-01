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
   * Gate(s) on questionnaire question(s) (see src/data/questionnaire.ts). A plain
   * string is a boolean question that must not be answered "non". An object gates
   * on a multi-choice question: the task is hidden only when the answer is one of
   * `excludes`. When an array, every rule must be satisfied. Unanswered questions
   * always satisfy their rule (nothing disappears until the user actively answers).
   */
  conditionalOn?: ConditionalFlag | ConditionalFlag[]
}

export type ConditionalFlag = string | { question: string; excludes: string[] }

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
