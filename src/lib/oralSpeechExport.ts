import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { flattenActivePresentation } from './oralMutations'
import type { OralSection } from '../types/oral'

const ACCENT = '641E0A'
const GREY = '6B6B6B'
const FONT = 'Arial'

function heading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 320, after: 200 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 32, font: FONT })],
  })
}

function heading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 140 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 26, font: FONT })],
  })
}

function speechBody(discours: string) {
  const lines = discours.trim().split(/\n+/).filter(Boolean)
  if (lines.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun({ text: 'Discours non rédigé pour cette slide.', italics: true, color: GREY, size: 24, font: FONT })],
      }),
    ]
  }
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 200, line: 320 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: line, size: 24, font: FONT })],
      }),
  )
}

/**
 * Printable speech script: one heading per Présentation section, one sub-heading
 * per slide (used as a landmark while reading, not spoken), followed by the
 * slide's discours text. Annexes are excluded — they aren't part of the timed talk.
 */
export async function generateSpeechDocx(sections: OralSection[]): Promise<Blob> {
  const flat = flattenActivePresentation(sections)
  const body: Paragraph[] = []

  let currentSectionId: string | null = null
  for (const entry of flat) {
    if (entry.sectionId !== currentSectionId) {
      currentSectionId = entry.sectionId
      body.push(heading1(entry.sectionTitre))
    }
    body.push(heading2(entry.slide.titre))
    body.push(...speechBody(entry.slide.discours))
  }

  if (body.length === 0) {
    body.push(
      new Paragraph({
        children: [new TextRun({ text: 'Aucune slide active dans la présentation.', italics: true, color: GREY, size: 24, font: FONT })],
      }),
    )
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 24 },
        },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: 'DISCOURS DE SOUTENANCE', bold: true, color: ACCENT, size: 32, font: FONT })],
          }),
          ...body,
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
