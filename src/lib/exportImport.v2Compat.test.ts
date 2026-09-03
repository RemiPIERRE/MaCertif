import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../types/storage'
import { applyImportPayload } from './exportImport'

/**
 * A frozen snapshot of a V2 export ("Mon oral" present, but predating `isDefault`/
 * `defaultOrdre`/`defaultActivee` on OralSection/Slide). Exercises the v2->v3
 * migration specifically, including a slide the user added inside a default
 * section and a section the user created outright — both should come out
 * `isDefault: false` after migration.
 */
const V2_EXPORT = JSON.stringify({
  app: 'macertif',
  schemaVersion: 2,
  exportedAt: '2026-02-01T10:00:00.000Z',
  data: {
    [STORAGE_KEYS.oralPresentation]: [
      {
        id: 'sec-intro',
        titre: 'Introduction',
        optionnelle: false,
        activee: true,
        slides: [
          { id: 'sec-intro-s1', titre: 'Titre du projet', blocks: [], discours: '', ordre: 0 },
          { id: 'sec-intro-s2', titre: 'Votre parcours', blocks: [], discours: '', ordre: 1 },
          { id: 'user-slide-1', titre: 'Slide ajoutée par le candidat', blocks: [], discours: '', ordre: 2 },
        ],
      },
      {
        id: 'user-section-1',
        titre: 'Section ajoutée par le candidat',
        optionnelle: false,
        activee: true,
        slides: [{ id: 'user-slide-2', titre: 'Autre slide', blocks: [], discours: '', ordre: 0 }],
      },
    ],
    [STORAGE_KEYS.oralAnnexes]: [
      {
        id: 'annexe-details',
        categorie: 'Détails techniques',
        slides: [{ id: 'annexe-slide-1', titre: 'Détail', blocks: [], discours: '', ordre: 0 }],
      },
    ],
  },
})

describe('V2 -> V3 migration (isDefault/defaultOrdre/defaultActivee backfill)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('imports a frozen V2 export without error', () => {
    expect(() => applyImportPayload(V2_EXPORT)).not.toThrow()
  })

  it('marks the default section and its default slides, and leaves user content isDefault: false', () => {
    applyImportPayload(V2_EXPORT)
    const sections = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.oralPresentation)!)

    const intro = sections.find((s: { id: string }) => s.id === 'sec-intro')
    expect(intro.isDefault).toBe(true)
    expect(intro.defaultOrdre).toBe(0)
    expect(intro.defaultActivee).toBe(true)

    const slidesById = Object.fromEntries(intro.slides.map((s: { id: string; isDefault: boolean }) => [s.id, s.isDefault]))
    expect(slidesById['sec-intro-s1']).toBe(true)
    expect(slidesById['sec-intro-s2']).toBe(true)
    expect(slidesById['user-slide-1']).toBe(false)

    const userSection = sections.find((s: { id: string }) => s.id === 'user-section-1')
    expect(userSection.isDefault).toBe(false)
    expect(userSection.slides[0].isDefault).toBe(false)
  })

  it('backfills isDefault: false on annex slides (never part of the default template)', () => {
    applyImportPayload(V2_EXPORT)
    const annexes = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.oralAnnexes)!)
    expect(annexes[0].slides[0].isDefault).toBe(false)
  })
})
