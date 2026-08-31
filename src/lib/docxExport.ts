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
import { resolveOutline, type ResolvedItem, type ResolvedSection } from './resolveOutline'
import { isTaskComplete } from './progress'
import type { DossierReponses, ProfilInfos, Questionnaire } from '../types/storage'

const ACCENT = '641E0A'
const GREY = '6B6B6B'
const IMAGE_BG = 'F2F2F2'

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], size: number) {
  return new Paragraph({
    heading: level,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size })],
  })
}

function bodyParagraph(text: string) {
  const lines = text.split(/\n+/).filter(Boolean)
  if (lines.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: '(non renseigné)', italics: true, color: GREY })] })]
  }
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 200, line: 300 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: line })],
      }),
  )
}

function notePara(note: string) {
  return new Paragraph({
    spacing: { after: 200, line: 300 },
    children: [new TextRun({ text: note, italics: true, color: GREY })],
  })
}

function annexReferencePara(annexNumber: number) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `→ Voir Annexe ${annexNumber}.`, italics: true, color: GREY })],
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
                children: [new TextRun({ text: '📷 Image à insérer ici :', bold: true })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: description.trim() || '(description non renseignée)',
                    italics: !description.trim(),
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

function styledTableHeaderCell(text: string) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: ACCENT, fill: ACCENT },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
  })
}

function styledTableCell(text: string) {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text })] })],
  })
}

function countTaskItems(section: ResolvedSection, reponses: DossierReponses) {
  const allItems: ResolvedItem[] = section.subsections.length
    ? section.subsections.flatMap((s) => s.items)
    : section.items
  const taskItems = allItems.filter((i): i is Extract<ResolvedItem, { kind: 'task' }> => i.kind === 'task')
  const done = taskItems.filter((i) => isTaskComplete(i.task, reponses)).length
  return { done, total: taskItems.length }
}

function buildRecapTable(sections: ResolvedSection[], reponses: DossierReponses) {
  const numbered = sections.filter((s) => s.number !== null)
  const rows = numbered.map((section) => {
    const { done, total } = countTaskItems(section, reponses)
    return new TableRow({
      children: [
        styledTableCell(`${section.number}. ${section.title}`),
        styledTableCell(total === 0 ? '—' : `${done} / ${total}`),
      ],
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [styledTableHeaderCell('Chapitre'), styledTableHeaderCell('Tâches complétées')] }),
      ...rows,
    ],
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
                    children: [new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', bold: true, color: GREY, size: 18 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: 'Dossier de Projet', bold: true, color: ACCENT, size: 26 })],
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
                children: [new Paragraph({ children: [new TextRun({ text: profil.nomProjet || 'Mon projet', size: 16, color: GREY })] })],
              }),
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', size: 16, color: GREY })],
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
      children: [new TextRun({ text: 'DOSSIER DE PROJET', bold: true, color: ACCENT, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: profil.nomProjet || 'Nom du projet', bold: true, size: 56 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [new TextRun({ text: profil.sousTitreProjet || '', italics: true, size: 26, color: GREY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [
        new TextRun({ text: `${profil.prenom} ${profil.nom}`.trim() || 'Candidat·e', bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: profil.nomOrganisme || 'Organisme de formation', size: 22, color: GREY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: `Stage du ${formatDate(profil.dateDebutStage)} au ${formatDate(profil.dateFinStage)}`,
          size: 20,
          color: GREY,
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
        }),
      ],
    }),
    new Paragraph({ children: [], pageBreakBefore: true }),
  ]
}

function renderItem(item: ResolvedItem, reponses: DossierReponses): (Paragraph | Table)[] {
  if (item.kind === 'note') {
    return [notePara(item.note)]
  }
  const { task, annexNumber } = item
  const blocks: (Paragraph | Table)[] = [heading(task.sectionTitle ?? task.title, HeadingLevel.HEADING_3, 22)]
  if (annexNumber !== null) {
    blocks.push(annexReferencePara(annexNumber))
    return blocks
  }
  const text = reponses[task.id]?.text ?? ''
  if (task.type === 'image') {
    blocks.push(imagePlaceholder(text))
  } else {
    blocks.push(...bodyParagraph(text))
  }
  return blocks
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
    body.push(heading(section.title, HeadingLevel.HEADING_1, 28))
    for (const item of section.items) body.push(...renderItem(item, reponses))
  }

  body.push(heading('Sommaire', HeadingLevel.HEADING_1, 30))
  body.push(new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }))
  body.push(new Paragraph({ children: [], pageBreakBefore: true }))

  body.push(heading('Récapitulatif du dossier', HeadingLevel.HEADING_1, 30))
  body.push(buildRecapTable(outline.sections, reponses))
  body.push(new Paragraph({ children: [], pageBreakBefore: true }))

  for (const section of outline.sections.filter((s) => s.number !== null)) {
    body.push(heading(`${section.number}. ${section.title}`, HeadingLevel.HEADING_1, 30))
    if (section.subsections.length) {
      for (const sub of section.subsections) {
        body.push(heading(sub.title, HeadingLevel.HEADING_2, 26))
        for (const item of sub.items) body.push(...renderItem(item, reponses))
      }
    } else {
      for (const item of section.items) body.push(...renderItem(item, reponses))
    }
  }

  if (outline.annexes.length) {
    body.push(heading('Annexes', HeadingLevel.HEADING_1, 30))
    for (const annex of outline.annexes) {
      body.push(heading(`Annexe ${annex.number} : ${annex.task.sectionTitle ?? annex.task.title}`, HeadingLevel.HEADING_2, 26))
      body.push(imagePlaceholder(reponses[annex.task.id]?.text ?? ''))
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
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
