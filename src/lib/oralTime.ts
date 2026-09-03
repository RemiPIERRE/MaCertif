import type { OralSection, Slide } from '../types/oral'

/** Speaking pace range used for every duration estimate and the teleprompter. */
export const WPM_MIN = 150
export const WPM_MAX = 160

export const TARGET_MIN_MINUTES = 35
export const TARGET_MAX_MINUTES = 40
/** Comfortable middle of the target range, used for the green band. */
export const COMFORT_MIN_MINUTES = 36
export const COMFORT_MAX_MINUTES = 38

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export interface DurationRange {
  words: number
  minMinutes: number
  maxMinutes: number
}

/** A slide's duration as a range: fewer minutes at the fast end of the pace, more at the slow end. */
export function slideDuration(discours: string): DurationRange {
  const words = countWords(discours)
  return {
    words,
    minMinutes: words / WPM_MAX,
    maxMinutes: words / WPM_MIN,
  }
}

function addRange(a: DurationRange, b: DurationRange): DurationRange {
  return { words: a.words + b.words, minMinutes: a.minMinutes + b.minMinutes, maxMinutes: a.maxMinutes + b.maxMinutes }
}

/** Only slides belonging to active sections (non-optional, or optional+activee) count. */
export function activeSlides(sections: OralSection[]): Slide[] {
  return sections.filter((s) => !s.optionnelle || s.activee).flatMap((s) => s.slides)
}

export function presentationDuration(sections: OralSection[]): DurationRange {
  return activeSlides(sections).reduce((acc, slide) => addRange(acc, slideDuration(slide.discours)), {
    words: 0,
    minMinutes: 0,
    maxMinutes: 0,
  })
}

export type PacingStatus = 'red' | 'orange' | 'green'

/** Representative estimate (midpoint of the pace range) used for the headline number and the pacing badge. */
export function averageMinutes(range: DurationRange): number {
  return (range.minMinutes + range.maxMinutes) / 2
}

export function pacingStatus(range: DurationRange): PacingStatus {
  const avg = averageMinutes(range)
  if (avg < TARGET_MIN_MINUTES || avg > TARGET_MAX_MINUTES) return 'red'
  if (avg >= COMFORT_MIN_MINUTES && avg <= COMFORT_MAX_MINUTES) return 'green'
  return 'orange'
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`
  return `${Math.round(minutes)} min`
}

export interface FilledStats {
  filled: number
  total: number
}

/** "Filled" = has a non-empty discours (required for every presentation slide). */
export function filledSlidesStats(sections: OralSection[]): FilledStats {
  const slides = activeSlides(sections)
  return { filled: slides.filter((s) => s.discours.trim().length > 0).length, total: slides.length }
}

export type FinalAssessmentStatus = 'red' | 'orange' | 'green'

export interface FinalAssessment {
  label: string
  status: FinalAssessmentStatus
}

/** Verdict for the real, measured chrono at the end of an entraînement run (as opposed to the word-count estimate used everywhere else). */
export function assessFinalChrono(elapsedSeconds: number): FinalAssessment {
  const minutes = elapsedSeconds / 60
  if (minutes < TARGET_MIN_MINUTES) return { label: 'Trop court', status: 'red' }
  if (minutes < 37) return { label: 'Parfait', status: 'green' }
  if (minutes < 39) return { label: 'Excellent', status: 'green' }
  if (minutes <= TARGET_MAX_MINUTES) return { label: 'Bien', status: 'orange' }
  return { label: 'Trop long', status: 'red' }
}
