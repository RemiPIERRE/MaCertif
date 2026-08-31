import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import { resolveOutline, type ResolvedItem } from './resolveOutline'
import type { DossierReponses, ProfilInfos, Questionnaire } from '../types/storage'

const ACCENT = '641E0A'
const GREY = '6B6B6B'
const IMAGE_BG = 'F2F2F2'
const FONT = 'Arial'

/** One default Word tab stop (0.5in), used for the "indent by N tabs" requirement. */
const TAB = 720

function formatDate(value: string): string {
  if (!value) return 'Non renseignée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Titre 1 (chapitre) : 20pt, centré, gras. */
function heading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 320, after: 200 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 40, font: FONT })],
  })
}

/** Titre 2 (sous-chapitre) : 18pt, gras, indenté de deux tabulations. */
function heading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    indent: { left: TAB * 2 },
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 36, font: FONT })],
  })
}

/** Titre 3 (détail de sous-chapitre) : 16pt, gras, indenté d'une tabulation. */
function heading3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    indent: { left: TAB },
    spacing: { before: 240, after: 140 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 32, font: FONT })],
  })
}

function bodyParagraph(text: string) {
  const lines = text.split(/\n+/).filter(Boolean)
  if (lines.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun({ text: 'Non renseigné', italics: true, color: GREY, size: 24, font: FONT })],
      }),
    ]
  }
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 200, line: 300 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: line, size: 24, font: FONT })],
      }),
  )
}

function notePara(note: string) {
  return new Paragraph({
    spacing: { after: 200, line: 300 },
    children: [new TextRun({ text: note, italics: true, color: GREY, size: 24, font: FONT })],
  })
}

function annexReferencePara(annexNumber: number) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: `Voir Annexe ${annexNumber}.`, italics: true, color: GREY, size: 24, font: FONT }),
    ],
  })
}

function imagePlaceholder(description: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: IMAGE_BG, fill: IMAGE_BG },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.DASHED, size: 6, color: 'A3A3A3' },
              bottom: { style: BorderStyle.DASHED, size: 6, color: 'A3A3A3' },
              left: { style: BorderStyle.DASHED, size: 6, color: 'A3A3A3' },
              right: { style: BorderStyle.DASHED, size: 6, color: 'A3A3A3' },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: '📷 Image à insérer ici :', bold: true, size: 24, font: FONT })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: description.trim() || 'Description non renseignée',
                    italics: !description.trim(),
                    size: 24,
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    margins: { top: 100, bottom: 300 },
  })
}

function buildHeader(profil: ProfilInfos) {
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', bold: true, color: GREY, size: 18, font: FONT }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: 'Dossier de Projet', bold: true, color: ACCENT, size: 26, font: FONT })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildFooter(profil: ProfilInfos) {
  return new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'C9C9C9' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: profil.nomProjet || 'Mon projet', size: 16, color: GREY, font: FONT })] })],
              }),
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY, font: FONT })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', size: 16, color: GREY, font: FONT })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildCoverPage(profil: ProfilInfos) {
  return [
    new Paragraph({ spacing: { before: 1600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'DOSSIER DE PROJET', bold: true, color: ACCENT, size: 30, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: profil.nomProjet || 'Nom du projet', bold: true, size: 56, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [new TextRun({ text: profil.sousTitreProjet || '', italics: true, size: 26, color: GREY, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [
        new TextRun({ text: `${profil.prenom} ${profil.nom}`.trim() || 'Candidat', bold: true, size: 28, font: FONT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', size: 22, color: GREY, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: `Stage du ${formatDate(profil.dateDebutStage)} au ${formatDate(profil.dateFinStage)}`,
          size: 20,
          color: GREY,
          font: FONT,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Formation du ${formatDate(profil.dateDebutFormation)} au ${formatDate(profil.dateFinFormation)}`,
          size: 20,
          color: GREY,
          font: FONT,
        }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true }),
  ]
}

function renderTaskBody(item: Extract<ResolvedItem, { kind: 'task' }>, reponses: DossierReponses): (Paragraph | Table)[] {
  const { task, annexNumber } = item
  if (annexNumber !== null) return [annexReferencePara(annexNumber)]
  const text = reponses[task.id]?.text ?? ''
  return task.type === 'image' ? [imagePlaceholder(text)] : bodyParagraph(text)
}

/**
 * Renders a list of items under a parent heading (section or subsection). When the
 * list holds exactly one task, its own heading would just repeat the parent's title
 * (e.g. section "1. Présentation de l'entreprise" with a single task of the same
 * name) — so it's skipped and the content goes straight under the parent heading.
 */
function renderItemList(items: ResolvedItem[], reponses: DossierReponses): (Paragraph | Table)[] {
  if (items.length === 1 && items[0].kind === 'task') {
    return renderTaskBody(items[0], reponses)
  }
  return items.flatMap((item) => {
    if (item.kind === 'note') return [notePara(item.note)]
    return [heading3(item.task.sectionTitle ?? item.task.title), ...renderTaskBody(item, reponses)]
  })
}

export async function generateDossierDocx(
  profil: ProfilInfos,
  reponses: DossierReponses,
  questionnaire: Questionnaire,
): Promise<Blob> {
  const outline = resolveOutline(questionnaire)
  const body: (Paragraph | Table)[] = []

  body.push(...buildCoverPage(profil))

  // Front matter: unnumbered sections (Remerciements, Introduction personnelle)
  for (const section of outline.sections.filter((s) => s.number === null)) {
    body.push(heading1(section.title))
    body.push(...renderItemList(section.items, reponses))
  }

  body.push(heading1('Sommaire'))
  body.push(new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }))
  body.push(new Paragraph({ children: [], pageBreakBefore: true }))

  for (const section of outline.sections.filter((s) => s.number !== null)) {
    body.push(heading1(`${section.number}. ${section.title}`))
    if (section.subsections.length) {
      for (const sub of section.subsections) {
        body.push(heading2(sub.title))
        body.push(...renderItemList(sub.items, reponses))
      }
    } else {
      body.push(...renderItemList(section.items, reponses))
    }
  }

  if (outline.annexes.length) {
    body.push(heading1('Annexes'))
    for (const annex of outline.annexes) {
      body.push(heading2(`Annexe ${annex.number} : ${annex.task.sectionTitle ?? annex.task.title}`))
      body.push(imagePlaceholder(reponses[annex.task.id]?.text ?? ''))
    }
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
        properties: {
          titlePage: true,
        },
        headers: {
          default: buildHeader(profil),
          first: new Header({ children: [new Paragraph({ children: [] })] }),
        },
        footers: {
          default: buildFooter(profil),
          first: new Footer({ children: [new Paragraph({ children: [] })] }),
        },
        children: body,
      },
    ],
  })

  return Packer.toBlob(doc)
}

export function downloadDocxBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
