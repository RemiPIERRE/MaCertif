import type { ConditionalFlag, DossierTask } from '../types/dossier'
import type { Questionnaire } from '../types/storage'

function flagSatisfied(flag: ConditionalFlag, questionnaire: Questionnaire): boolean {
  if (typeof flag === 'string') return questionnaire[flag] !== false
  const answer = questionnaire[flag.question]
  if (answer === undefined) return true
  return !flag.excludes.includes(String(answer))
}

/** Unanswered questions default to "oui" (task shown) so nothing disappears silently. */
export function isTaskActive(task: DossierTask, questionnaire: Questionnaire): boolean {
  if (!task.conditionalOn) return true
  const flags = Array.isArray(task.conditionalOn) ? task.conditionalOn : [task.conditionalOn]
  return flags.every((flag) => flagSatisfied(flag, questionnaire))
}

export function filterActiveTasks(tasks: DossierTask[], questionnaire: Questionnaire): DossierTask[] {
  return tasks.filter((task) => isTaskActive(task, questionnaire))
}
