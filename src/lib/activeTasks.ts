import type { DossierTask } from '../types/dossier'
import type { Questionnaire } from '../types/storage'

/** Unanswered questions default to "oui" (task shown) so nothing disappears silently. */
export function isTaskActive(task: DossierTask, questionnaire: Questionnaire): boolean {
  if (!task.conditionalOn) return true
  return questionnaire[task.conditionalOn] !== false
}

export function filterActiveTasks(tasks: DossierTask[], questionnaire: Questionnaire): DossierTask[] {
  return tasks.filter((task) => isTaskActive(task, questionnaire))
}
