import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../types/storage'
import { applyImportPayload } from './exportImport'

/**
 * A frozen snapshot of a V3 export (Mon oral with isDefault/defaultOrdre/
 * defaultActivee, but predating dossier:caracteristiques/dossier:competences — the
 * old fixed `profil:questionnaire` was still in charge of showing/hiding tasks).
 * Exercises the v3->v4 migration: dossier:caracteristiques must be inferred from
 * which (post-retag) tasks already have written content, so nothing a candidate
 * already wrote disappears behind an unchecked characteristic.
 */
const V3_EXPORT = JSON.stringify({
  app: 'macertif',
  schemaVersion: 3,
  exportedAt: '2026-03-01T10:00:00.000Z',
  data: {
    [STORAGE_KEYS.dossier]: {
      // Always-shown task: irrelevant to caracteristiques inference either way.
      'entreprise-presentation': { text: 'Une entreprise de services numériques.', updatedAt: '2026-02-01T09:00:00.000Z' },
      // Tagged ['front_framework'] only -> should infer front_framework: true.
      'outil-frameworks': { text: 'React 18 avec Vite pour le tooling.', updatedAt: '2026-02-01T09:00:00.000Z' },
      // Tagged ['back_framework'] only -> should infer back_framework: true.
      'framework-nom': { text: 'Express.js pour le serveur HTTP.', updatedAt: '2026-02-01T09:00:00.000Z' },
      // Tagged ['bdd_relationnelle'] only -> should infer bdd_relationnelle: true.
      'bdd-entites': { text: 'Table users, table posts, table comments.', updatedAt: '2026-02-01T09:00:00.000Z' },
      // Tagged ['seo'], but left blank -> must NOT infer seo: true.
      'seo-definition': { text: '', updatedAt: '2026-02-01T09:00:00.000Z' },
      // Never written at all: cms_wordpress must stay false/absent.
    },
    [STORAGE_KEYS.questionnaire]: { hasFrontend: true, surMesure: true },
  },
})

describe('V3 -> V4 migration (caracteristiques inferred from filled tasks)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('imports a frozen V3 export without error', () => {
    expect(() => applyImportPayload(V3_EXPORT)).not.toThrow()
  })

  it('infers true only for characteristics behind tasks that already have content', () => {
    applyImportPayload(V3_EXPORT)
    const caracteristiques = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.caracteristiques)!)

    expect(caracteristiques.front_framework).toBe(true)
    expect(caracteristiques.back_framework).toBe(true)
    expect(caracteristiques.bdd_relationnelle).toBe(true)

    expect(caracteristiques.seo).not.toBe(true)
    expect(caracteristiques.cms_wordpress).not.toBe(true)
    expect(caracteristiques.mobile_natif).not.toBe(true)
  })

  it('leaves dossier:competences absent (a brand new key, nothing to migrate)', () => {
    applyImportPayload(V3_EXPORT)
    expect(window.localStorage.getItem(STORAGE_KEYS.competences)).toBeNull()
  })
})
