import type { DossierTask } from '../types/dossier'
import type { Caracteristiques } from '../types/storage'

/** No tags = always shown. With tags, shown as soon as ANY one is checked "oui" (never AND-combined). */
export function isTaskActive(task: DossierTask, caracteristiques: Caracteristiques): boolean {
  if (!task.tags || task.tags.length === 0) return true
  return task.tags.some((tag) => caracteristiques[tag] === true)
}

/**
 * Combine le filtrage par caractéristiques (ci-dessus) et le masquage explicite par
 * l'utilisateur (tachesMasquees) — deux mécanismes indépendants, additifs : une tâche
 * masquée le reste même si ses caractéristiques redeviennent actives.
 */
export function isTaskVisible(task: DossierTask, caracteristiques: Caracteristiques, tachesMasquees: string[] = []): boolean {
  return isTaskActive(task, caracteristiques) && !tachesMasquees.includes(task.id)
}

export function filterActiveTasks(
  tasks: DossierTask[],
  caracteristiques: Caracteristiques,
  tachesMasquees: string[] = [],
): DossierTask[] {
  return tasks.filter((task) => isTaskVisible(task, caracteristiques, tachesMasquees))
}
