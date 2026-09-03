import { generateId } from './id'
import { createDefaultPresentation, createNewSlide } from '../data/oralDefaults'
import type { OralAnnexCategory, OralSection, Slide, SlideBlock, SlideBlockType } from '../types/oral'
import { MAX_BLOCKS_PER_SLIDE } from '../types/oral'

function reindex(slides: Slide[]): Slide[] {
  return slides.map((s, i) => ({ ...s, ordre: i }))
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const copy = [...items]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

// ---- Presentation sections -------------------------------------------------

export interface FlatPresentationEntry {
  sectionId: string
  sectionTitre: string
  slide: Slide
}

export function flattenPresentation(sections: OralSection[]): FlatPresentationEntry[] {
  return sections.flatMap((s) => s.slides.map((slide) => ({ sectionId: s.id, sectionTitre: s.titre, slide })))
}

export function flattenActivePresentation(sections: OralSection[]): FlatPresentationEntry[] {
  return sections
    .filter((s) => !s.optionnelle || s.activee)
    .flatMap((s) => s.slides.map((slide) => ({ sectionId: s.id, sectionTitre: s.titre, slide })))
}

export function updateSlideInSections(sections: OralSection[], slideId: string, patch: Partial<Slide>): OralSection[] {
  return sections.map((s) => ({
    ...s,
    slides: s.slides.map((sl) => (sl.id === slideId ? { ...sl, ...patch } : sl)),
  }))
}

export function addSlideToSection(sections: OralSection[], sectionId: string): { sections: OralSection[]; newSlideId: string } {
  let newSlideId = ''
  const next = sections.map((s) => {
    if (s.id !== sectionId) return s
    const slide = createNewSlide(s.slides.length)
    newSlideId = slide.id
    return { ...s, slides: [...s.slides, slide] }
  })
  return { sections: next, newSlideId }
}

export function removeSlideFromSections(sections: OralSection[], slideId: string): OralSection[] {
  return sections.map((s) => ({ ...s, slides: reindex(s.slides.filter((sl) => sl.id !== slideId)) }))
}

export function moveSlideInSections(sections: OralSection[], sectionId: string, slideId: string, direction: -1 | 1): OralSection[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s
    const index = s.slides.findIndex((sl) => sl.id === slideId)
    if (index === -1) return s
    return { ...s, slides: reindex(moveItem(s.slides, index, direction)) }
  })
}

export function addSection(sections: OralSection[], titre: string, optionnelle: boolean): OralSection[] {
  return [
    ...sections,
    { id: generateId(), titre, optionnelle, activee: !optionnelle, slides: [], isDefault: false, defaultOrdre: -1, defaultActivee: !optionnelle },
  ]
}

export function removeSection(sections: OralSection[], sectionId: string): OralSection[] {
  return sections.filter((s) => s.id !== sectionId)
}

export function renameSection(sections: OralSection[], sectionId: string, titre: string): OralSection[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, titre } : s))
}

export function toggleSectionActive(sections: OralSection[], sectionId: string): OralSection[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, activee: !s.activee } : s))
}

export function moveSection(sections: OralSection[], sectionId: string, direction: -1 | 1): OralSection[] {
  const index = sections.findIndex((s) => s.id === sectionId)
  if (index === -1) return sections
  return moveItem(sections, index, direction)
}

/** Fixed id for the catch-all section a reset gathers orphaned/user content into, so repeated resets merge into the same section instead of piling up duplicates. */
const CATCH_ALL_SECTION_ID = 'sans-categorie'

/**
 * Restores the default sections to their original order, `activee` state, and
 * slide membership — using the canonical `createDefaultPresentation()` template
 * as the source of truth for "original", matched by id. Titles, blocks and
 * discours are never touched, only order and which section a slide belongs to.
 *
 * A default slide the user deleted stays deleted (never recreated). A slide the
 * user added inside a default section, or a section the user created outright,
 * isn't discarded either — it's swept into one "Sans catégorie" section at the
 * end, merging with any catch-all section from a previous reset.
 */
export function resetPresentationOrder(sections: OralSection[]): OralSection[] {
  const template = createDefaultPresentation()
  const slideOrderInTemplate = new Map<string, number>()
  for (const templateSection of template) {
    templateSection.slides.forEach((slide, i) => slideOrderInTemplate.set(slide.id, i))
  }

  const currentSlidesById = new Map<string, Slide>()
  for (const section of sections) {
    for (const slide of section.slides) currentSlidesById.set(slide.id, slide)
  }

  const restoredDefaultSections = template.map((templateSection) => {
    const current = sections.find((s) => s.id === templateSection.id)
    const base = current ?? templateSection
    const slides = templateSection.slides
      .map((templateSlide) => currentSlidesById.get(templateSlide.id))
      .filter((slide): slide is Slide => slide !== undefined)
      .sort((a, b) => slideOrderInTemplate.get(a.id)! - slideOrderInTemplate.get(b.id)!)
      .map((slide, i) => ({ ...slide, ordre: i }))
    return { ...base, activee: base.defaultActivee, slides }
  })

  const orphanSlides: Slide[] = []
  for (const section of sections) {
    if (!section.isDefault) continue
    for (const slide of section.slides) {
      if (!slide.isDefault) orphanSlides.push(slide)
    }
  }

  const existingCatchAll = sections.find((s) => s.id === CATCH_ALL_SECTION_ID && !s.isDefault)
  if (existingCatchAll) orphanSlides.unshift(...existingCatchAll.slides)

  const userSections = sections.filter((s) => !s.isDefault && s.id !== CATCH_ALL_SECTION_ID)

  const result = [...restoredDefaultSections, ...userSections]
  if (orphanSlides.length > 0) {
    result.push({
      id: CATCH_ALL_SECTION_ID,
      titre: 'Sans catégorie',
      optionnelle: false,
      activee: true,
      isDefault: false,
      defaultOrdre: -1,
      defaultActivee: true,
      slides: orphanSlides.map((slide, i) => ({ ...slide, ordre: i })),
    })
  }
  return result
}

// ---- Annex categories -------------------------------------------------------

export interface FlatAnnexEntry {
  categoryId: string
  categoryTitre: string
  slide: Slide
}

export function flattenAnnexes(categories: OralAnnexCategory[]): FlatAnnexEntry[] {
  return categories.flatMap((c) => c.slides.map((slide) => ({ categoryId: c.id, categoryTitre: c.categorie, slide })))
}

export function updateSlideInAnnexes(categories: OralAnnexCategory[], slideId: string, patch: Partial<Slide>): OralAnnexCategory[] {
  return categories.map((c) => ({
    ...c,
    slides: c.slides.map((sl) => (sl.id === slideId ? { ...sl, ...patch } : sl)),
  }))
}

export function addSlideToCategory(categories: OralAnnexCategory[], categoryId: string): { categories: OralAnnexCategory[]; newSlideId: string } {
  let newSlideId = ''
  const next = categories.map((c) => {
    if (c.id !== categoryId) return c
    const slide = createNewSlide(c.slides.length)
    newSlideId = slide.id
    return { ...c, slides: [...c.slides, slide] }
  })
  return { categories: next, newSlideId }
}

export function removeSlideFromAnnexes(categories: OralAnnexCategory[], slideId: string): OralAnnexCategory[] {
  return categories.map((c) => ({ ...c, slides: reindex(c.slides.filter((sl) => sl.id !== slideId)) }))
}

export function moveSlideInAnnexes(categories: OralAnnexCategory[], categoryId: string, slideId: string, direction: -1 | 1): OralAnnexCategory[] {
  return categories.map((c) => {
    if (c.id !== categoryId) return c
    const index = c.slides.findIndex((sl) => sl.id === slideId)
    if (index === -1) return c
    return { ...c, slides: reindex(moveItem(c.slides, index, direction)) }
  })
}

export function addAnnexCategory(categories: OralAnnexCategory[], categorie: string): OralAnnexCategory[] {
  return [...categories, { id: generateId(), categorie, slides: [] }]
}

export function removeAnnexCategory(categories: OralAnnexCategory[], categoryId: string): OralAnnexCategory[] {
  return categories.filter((c) => c.id !== categoryId)
}

export function renameAnnexCategory(categories: OralAnnexCategory[], categoryId: string, categorie: string): OralAnnexCategory[] {
  return categories.map((c) => (c.id === categoryId ? { ...c, categorie } : c))
}

// ---- Blocks (shared by both) -------------------------------------------------

export function addBlock(slide: Slide, type: SlideBlockType): Slide {
  if (slide.blocks.length >= MAX_BLOCKS_PER_SLIDE) return slide
  const block: SlideBlock = { id: generateId(), type, content: '' }
  return { ...slide, blocks: [...slide.blocks, block] }
}

export function updateBlock(slide: Slide, blockId: string, content: string): Slide {
  return { ...slide, blocks: slide.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)) }
}

export function removeBlock(slide: Slide, blockId: string): Slide {
  return { ...slide, blocks: slide.blocks.filter((b) => b.id !== blockId) }
}
