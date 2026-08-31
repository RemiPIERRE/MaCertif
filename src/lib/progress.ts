import { allTasks } from '../data/dossierContent'
import type { DossierTask } from '../types/dossier'
import type { DossierReponses } from '../types/storage'

export function isTaskComplete(task: DossierTask, reponses: DossierReponses): boolean {
  const text = reponses[task.id]?.text ?? ''
  if (task.type === 'image') return text.trim().length > 0
  if (task.minChars === null) return text.trim().length > 0
  return text.length >= task.minChars && (task.maxChars === null || text.length <= task.maxChars)
}

export interface ProgressStats {
  completedCount: number
  totalCount: number
  percent: number
}

export function computeProgress(reponses: DossierReponses): ProgressStats {
  const completedCount = allTasks.filter((task) => isTaskComplete(task, reponses)).length
  const totalCount = allTasks.length
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 1000) / 10
  return { completedCount, totalCount, percent }
}
