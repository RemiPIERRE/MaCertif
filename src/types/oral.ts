export type SlideBlockType = 'texte' | 'image'

/** Max total blocks (texte + image combined) allowed on a single slide. */
export const MAX_BLOCKS_PER_SLIDE = 6

export interface SlideBlock {
  id: string
  type: SlideBlockType
  /** Block text, or the description of the image to insert by hand after export. */
  content: string
}

export interface Slide {
  id: string
  titre: string
  blocks: SlideBlock[]
  /** Required for presentation slides, optional for annex slides. */
  discours: string
  ordre: number
  /** True for a slide seeded by the default presentation template; false for one the user added. */
  isDefault: boolean
}

export interface OralSection {
  id: string
  titre: string
  optionnelle: boolean
  activee: boolean
  slides: Slide[]
  /** True for a section from the default presentation template; false for one the user added. */
  isDefault: boolean
  /** Original position among the default template's sections, used to reset the order. */
  defaultOrdre: number
  /** Original `activee` value in the default template, used to reset it. */
  defaultActivee: boolean
}

export interface OralAnnexCategory {
  id: string
  categorie: string
  slides: Slide[]
}
