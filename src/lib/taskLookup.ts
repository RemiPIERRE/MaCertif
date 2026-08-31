import { allTasks, dossierChapters } from '../data/dossierContent'
import type { DossierChapter, DossierSubchapter, DossierTask } from '../types/dossier'

export interface TaskContext {
  task: DossierTask
  chapter: DossierChapter
  subchapter: DossierSubchapter | null
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

export function getAdjacentTasks(taskId: string): { prev: DossierTask | null; next: DossierTask | null } {
  const index = allTasks.findIndex((t) => t.id === taskId)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? allTasks[index - 1] : null,
    next: index < allTasks.length - 1 ? allTasks[index + 1] : null,
  }
}
