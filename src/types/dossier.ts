export type TaskType = 'text' | 'image'

export interface DossierTask {
  /** Stable id, used as the localStorage answer key. */
  id: string
  /** 1-69, order of appearance in the compiled dossier. */
  number: number
  title: string
  type: TaskType
  /** null when the task has no strict length constraint (e.g. English excerpt). */
  minChars: number | null
  maxChars: number | null
  /** Generic example text shown in the blue "Exemple" box. Filled in later (phase 2). */
  example: string | null
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
