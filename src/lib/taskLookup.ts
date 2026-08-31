import { allTasks, dossierChapters } from '../data/dossierContent'
import { filterActiveTasks } from './activeTasks'
import type { DossierChapter, DossierSubchapter, DossierTask } from '../types/dossier'
import type { Questionnaire } from '../types/storage'

export interface TaskContext {
  task: DossierTask
  chapter: DossierChapter
  subchapter: DossierSubchapter | null
}

export function getTaskById(taskId: string): DossierTask | null {
  return allTasks.find((t) => t.id === taskId) ?? null
}

export function findTaskContext(taskId: string): TaskContext | null {
  for (const chapter of dossierChapters) {
    if (chapter.subchapters) {
      for (const sub of chapter.subchapters) {
        const task = sub.tasks.find((t) => t.id === taskId)
        if (task) return { task, chapter, subchapter: sub }
      }
    } else if (chapter.tasks) {
      const task = chapter.tasks.find((t) => t.id === taskId)
      if (task) return { task, chapter, subchapter: null }
    }
  }
  return null
}

/** Prev/next only ever land on active (non-disabled) tasks. */
export function getAdjacentTasks(
  taskId: string,
  questionnaire: Questionnaire = {},
): { prev: DossierTask | null; next: DossierTask | null } {
  const active = filterActiveTasks(allTasks, questionnaire)
  const index = active.findIndex((t) => t.id === taskId)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? active[index - 1] : null,
    next: index < active.length - 1 ? active[index + 1] : null,
  }
}
