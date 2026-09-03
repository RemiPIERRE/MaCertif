import { allTasks } from '../data/dossierContent'
import { filterActiveTasks } from './activeTasks'
import type { DossierTask } from '../types/dossier'
import type { Caracteristiques, DossierReponses } from '../types/storage'

export type TaskStatus = 'empty' | 'incomplete' | 'complete'

/**
 * Saving is never blocked: below the indicative minimum, a task is "incomplete"
 * (flagged, but already has content) rather than invalid.
 */
export function getTaskStatus(task: DossierTask, reponses: DossierReponses): TaskStatus {
  const text = reponses[task.id]?.text ?? ''
  if (text.trim().length === 0) return 'empty'
  if (task.minChars !== null && text.length < task.minChars) return 'incomplete'
  return 'complete'
}

export function isTaskComplete(task: DossierTask, reponses: DossierReponses): boolean {
  return getTaskStatus(task, reponses) === 'complete'
}

export interface ProgressStats {
  completedCount: number
  incompleteCount: number
  totalCount: number
  percent: number
}

export function computeProgress(reponses: DossierReponses, caracteristiques: Caracteristiques = {}): ProgressStats {
  const activeTasks = filterActiveTasks(allTasks, caracteristiques)
  let completedCount = 0
  let incompleteCount = 0
  for (const task of activeTasks) {
    const status = getTaskStatus(task, reponses)
    if (status === 'complete') completedCount++
    else if (status === 'incomplete') incompleteCount++
  }
  const totalCount = activeTasks.length
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 1000) / 10
  return { completedCount, incompleteCount, totalCount, percent }
}
