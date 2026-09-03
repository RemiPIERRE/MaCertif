import pptxgen from 'pptxgenjs'
import type { OralAnnexCategory, OralSection, SlideBlock } from '../types/oral'
import type { ProfilInfos } from '../types/storage'
import { flattenActivePresentation } from './oralMutations'

/** The "Signature Bordeaux" theme — the only one kept after the visual proposal round, matching the dossier's own cover page colors. */
const THEME = {
  bg: 'FAF9F7',
  ink: '2B1410',
  soft: '7A6F68',
  accent: '641E0A',
  titleFont: 'Georgia',
  bodyFont: 'Calibri',
  /** Unicode bullet character code (hex, no prefix): em dash. */
  bulletCode: '2014',
}

const SLIDE_W = 10
const SLIDE_H = 5.625
const MARGIN_X = 0.6
const CONTENT_W = SLIDE_W - MARGIN_X * 2
const CONTENT_TOP = 1.55
const CONTENT_BOTTOM = 5.25
const BLOCK_GAP = 0.15

function addTitleSlide(pptx: pptxgen, profil: ProfilInfos) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  slide.addText('SOUTENANCE DE PROJET', {
    x: 0,
    y: 1.5,
    w: SLIDE_W,
    h: 0.35,
    align: 'center',
    fontFace: THEME.bodyFont,
    fontSize: 11,
    bold: true,
    charSpacing: 2,
    color: THEME.accent,
  })

  slide.addText(profil.nomProjet || 'Nom du projet', {
    x: 0,
    y: 2.1,
    w: SLIDE_W,
    h: 0.9,
    align: 'center',
    fontFace: THEME.titleFont,
    fontSize: 34,
    bold: true,
    color: THEME.accent,
  })

  if (profil.sousTitreProjet) {
    slide.addText(profil.sousTitreProjet, {
      x: 0,
      y: 2.95,
      w: SLIDE_W,
      h: 0.45,
      align: 'center',
      fontFace: THEME.bodyFont,
      fontSize: 14,
      italic: true,
      color: THEME.soft,
    })
  }

  const candidate = `${profil.prenom} ${profil.nom}`.trim() || 'Candidat·e'
  slide.addText(candidate, {
    x: 0,
    y: 4.6,
    w: SLIDE_W,
    h: 0.4,
    align: 'center',
    fontFace: THEME.bodyFont,
    fontSize: 13,
    bold: true,
    color: THEME.ink,
  })
}

function addSectionDivider(pptx: pptxgen, titre: string) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }
  slide.addText(titre, {
    x: 0,
    y: SLIDE_H / 2 - 0.5,
    w: SLIDE_W,
    h: 1,
    align: 'center',
    valign: 'middle',
    fontFace: THEME.titleFont,
    fontSize: 28,
    bold: true,
    color: THEME.accent,
  })
}

function addContentSlide(pptx: pptxgen, titre: string, blocks: SlideBlock[], notes: string, eyebrow?: string) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  let titleY = 0.4
  if (eyebrow) {
    slide.addText(eyebrow.toUpperCase(), {
      x: MARGIN_X,
      y: 0.3,
      w: CONTENT_W,
      h: 0.3,
      fontFace: THEME.bodyFont,
      fontSize: 10,
      bold: true,
      charSpacing: 1,
      color: THEME.soft,
    })
    titleY = 0.62
  }

  slide.addText(titre || 'Sans titre', {
    x: MARGIN_X,
    y: titleY,
    w: CONTENT_W,
    h: 0.7,
    fontFace: THEME.titleFont,
    fontSize: 22,
    bold: true,
    color: THEME.accent,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_X,
    y: titleY + 0.72,
    w: 0.55,
    h: 0.035,
    fill: { color: THEME.accent },
    line: { type: 'none' },
  })

  if (blocks.length > 0) {
    const contentHeight = CONTENT_BOTTOM - CONTENT_TOP
    const blockH = (contentHeight - BLOCK_GAP * (blocks.length - 1)) / blocks.length
    const fontSize = blocks.length <= 2 ? 15 : blocks.length <= 4 ? 13 : 11

    blocks.forEach((block, i) => {
      const y = CONTENT_TOP + i * (blockH + BLOCK_GAP)
      if (block.type === 'image') {
        slide.addText(
          [
            { text: 'Image à insérer ici :', options: { bold: true, breakLine: true, color: THEME.ink } },
            { text: block.content.trim() || 'description non renseignée', options: { italic: true, color: THEME.soft } },
          ],
          {
            x: MARGIN_X,
            y,
            w: CONTENT_W,
            h: blockH,
            shape: pptx.ShapeType.rect,
            fill: { color: THEME.bg },
            line: { color: THEME.accent, width: 1.25, dashType: 'dash' },
            align: 'center',
            valign: 'middle',
            fontFace: THEME.bodyFont,
            fontSize: 12,
          },
        )
      } else {
        const lines = block.content.split(/\n+/).filter((l) => l.trim().length > 0)
        const text = (lines.length > 0 ? lines : ['—']).map((line) => ({
          text: line,
          options: { breakLine: true, bullet: { characterCode: THEME.bulletCode } },
        }))
        slide.addText(text, {
          x: MARGIN_X,
          y,
          w: CONTENT_W,
          h: blockH,
          fontFace: THEME.bodyFont,
          fontSize,
          color: THEME.ink,
          valign: 'top',
        })
      }
    })
  }

  if (notes.trim()) slide.addNotes(notes)
}

export async function exportOralPptx(sections: OralSection[], annexes: OralAnnexCategory[], profil: ProfilInfos, fileName: string): Promise<void> {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = `${profil.prenom} ${profil.nom}`.trim() || 'Candidat·e'
  pptx.title = profil.nomProjet || 'Soutenance de projet'

  addTitleSlide(pptx, profil)

  for (const section of sections) {
    if (section.optionnelle && !section.activee) continue
    if (section.slides.length === 0) continue
    addSectionDivider(pptx, section.titre)
    for (const slide of section.slides) {
      addContentSlide(pptx, slide.titre, slide.blocks, slide.discours)
    }
  }

  const annexCategoriesWithSlides = annexes.filter((c) => c.slides.length > 0)
  if (annexCategoriesWithSlides.length > 0) {
    addSectionDivider(pptx, 'Annexes')
    for (const category of annexCategoriesWithSlides) {
      for (const slide of category.slides) {
        addContentSlide(pptx, slide.titre, slide.blocks, slide.discours, category.categorie)
      }
    }
  }

  await pptx.writeFile({ fileName })
}

/** Exposed for a future "aucune slide" guard on the export button; unused slides never reach the deck either way. */
export function hasAnyActivePresentationSlide(sections: OralSection[]): boolean {
  return flattenActivePresentation(sections).length > 0
}
