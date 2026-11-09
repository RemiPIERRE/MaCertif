import { allTasks } from '../data/dossierContent'
import { filterActiveTasks } from './activeTasks'
import type { DossierTask } from '../types/dossier'
import type { Caracteristiques, DossierReponses } from '../types/storage'

export type TaskStatus = 'empty' | 'complete'

/** A task is complete as soon as it has any content — no character target to reach. */
export function getTaskStatus(task: DossierTask, reponses: DossierReponses): TaskStatus {
  const text = reponses[task.id]?.text ?? ''
  return text.trim().length === 0 ? 'empty' : 'complete'
}

export function isTaskComplete(task: DossierTask, reponses: DossierReponses): boolean {
  return getTaskStatus(task, reponses) === 'complete'
}

export interface ProgressStats {
  completedCount: number
  totalCount: number
  percent: number
}

export function computeProgress(
  reponses: DossierReponses,
  caracteristiques: Caracteristiques = {},
  tachesMasquees: string[] = [],
): ProgressStats {
  const activeTasks = filterActiveTasks(allTasks, caracteristiques, tachesMasquees)
  const completedCount = activeTasks.filter((task) => getTaskStatus(task, reponses) === 'complete').length
  const totalCount = activeTasks.length
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 1000) / 10
  return { completedCount, totalCount, percent }
}
