import { remerciementsSection, introductionSection, numberedSections, type ExportItem, type ExportSection, type ExportSubsection } from '../data/exportOutline'
import { getTaskById } from './taskLookup'
import { isTaskActive } from './activeTasks'
import type { DossierTask } from '../types/dossier'
import type { Caracteristiques } from '../types/storage'

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

export interface ResolvedCompetencesItem {
  kind: 'competences'
}

export type ResolvedItem = ResolvedTaskItem | ResolvedNoteItem | ResolvedCompetencesItem

export interface ResolvedSubsection {
  title: string
  items: ResolvedItem[]
}

export interface ResolvedSection {
  /** null for the unnumbered Remerciements/Introduction; assigned sequentially (no gaps) for numbered chapters. */
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

/**
 * Walks the export outline once, skipping disabled tasks and numbering annexes in
 * reading order. Numbered chapters that end up with no visible content for this
 * candidate (e.g. WordPress for a from-scratch project) are dropped entirely, and
 * the survivors are renumbered sequentially — the table of contents must reflect
 * only this candidate's real chapters, never a gap or an empty heading.
 */
export function resolveOutline(caracteristiques: Caracteristiques): ResolvedOutline {
  const annexes: { number: number; task: DossierTask }[] = []

  function resolveItems(items: ExportItem[]): ResolvedItem[] {
    const result: ResolvedItem[] = []
    for (const item of items) {
      if (item.kind === 'note') {
        result.push({ kind: 'note', title: item.title, note: item.note })
        continue
      }
      if (item.kind === 'competences') {
        result.push({ kind: 'competences' })
        continue
      }
      const task = getTaskById(item.taskId)
      if (!task || !isTaskActive(task, caracteristiques)) continue
      let annexNumber: number | null = null
      if (item.annex) {
        annexNumber = annexes.length + 1
        annexes.push({ number: annexNumber, task })
      }
      result.push({ kind: 'task', task, annexNumber })
    }
    return result
  }

  function resolveUnnumbered(section: ExportSubsection): ResolvedSection {
    return { number: null, title: section.title, items: resolveItems(section.items), subsections: [] }
  }

  function resolveNumbered(section: ExportSection): Omit<ResolvedSection, 'number'> {
    if (section.subsections) {
      const subsections = section.subsections
        .map((sub) => ({ title: sub.title, items: resolveItems(sub.items) }))
        .filter((sub) => sub.items.length > 0)
      return { title: section.title, items: [], subsections }
    }
    return { title: section.title, items: resolveItems(section.items ?? []), subsections: [] }
  }

  const numbered = numberedSections
    .map(resolveNumbered)
    .filter((section) => section.items.length > 0 || section.subsections.length > 0)
    .map((section, i) => ({ number: i + 1, ...section }))

  return {
    remerciements: resolveUnnumbered(remerciementsSection),
    introduction: resolveUnnumbered(introductionSection),
    numbered,
    annexes,
  }
}
