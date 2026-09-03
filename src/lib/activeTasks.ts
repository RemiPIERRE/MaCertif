import type { DossierTask } from '../types/dossier'
import type { Caracteristiques } from '../types/storage'

/** No tags = always shown. With tags, shown as soon as ANY one is checked "oui" (never AND-combined). */
export function isTaskActive(task: DossierTask, caracteristiques: Caracteristiques): boolean {
  if (!task.tags || task.tags.length === 0) return true
  return task.tags.some((tag) => caracteristiques[tag] === true)
}

export function filterActiveTasks(tasks: DossierTask[], caracteristiques: Caracteristiques): DossierTask[] {
  return tasks.filter((task) => isTaskActive(task, caracteristiques))
}
