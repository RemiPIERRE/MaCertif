import { remerciementsSection, introductionSection, numberedSections, type ExportItem } from '../data/exportOutline'
import { getTaskById } from './taskLookup'
import { isTaskActive } from './activeTasks'
import type { DossierTask } from '../types/dossier'
import type { Questionnaire } from '../types/storage'

export interface ResolvedTaskItem {
  kind: 'task'
  task: DossierTask
  /** Set when this task's content lives in the Annexes instead of inline. */
  annexNumber: number | null
}

export interface ResolvedNoteItem {
  kind: 'note'
  title: string
  note: string
}

export type ResolvedItem = ResolvedTaskItem | ResolvedNoteItem

export interface ResolvedSubsection {
  title: string
  items: ResolvedItem[]
}

export interface ResolvedSection {
  number: number | null
  title: string
  items: ResolvedItem[]
  subsections: ResolvedSubsection[]
}

export interface ResolvedOutline {
  remerciements: ResolvedSection
  introduction: ResolvedSection
  numbered: ResolvedSection[]
  annexes: { number: number; task: DossierTask }[]
}

/** Walks the export outline once, skipping disabled tasks and numbering annexes in reading order. */
export function resolveOutline(questionnaire: Questionnaire): ResolvedOutline {
  const annexes: { number: number; task: DossierTask }[] = []

  function resolveItems(items: ExportItem[]): ResolvedItem[] {
    const result: ResolvedItem[] = []
    for (const item of items) {
      if (item.kind === 'note') {
        result.push({ kind: 'note', title: item.title, note: item.note })
        continue
      }
      const task = getTaskById(item.taskId)
      if (!task || !isTaskActive(task, questionnaire)) continue
      let annexNumber: number | null = null
      if (item.annex) {
        annexNumber = annexes.length + 1
        annexes.push({ number: annexNumber, task })
      }
      result.push({ kind: 'task', task, annexNumber })
    }
    return result
  }

  function resolveSection(section: typeof remerciementsSection) {
    if (section.subsections) {
      const subsections = section.subsections
        .map((sub) => ({ title: sub.title, items: resolveItems(sub.items) }))
        .filter((sub) => sub.items.length > 0)
      return { number: section.number, title: section.title, items: [], subsections }
    }
    return { number: section.number, title: section.title, items: resolveItems(section.items ?? []), subsections: [] }
  }

  return {
    remerciements: resolveSection(remerciementsSection),
    introduction: resolveSection(introductionSection),
    numbered: numberedSections.map(resolveSection),
    annexes,
  }
}
