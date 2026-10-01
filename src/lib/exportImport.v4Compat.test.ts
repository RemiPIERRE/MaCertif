import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../types/storage'
import { applyImportPayload } from './exportImport'

/**
 * A frozen snapshot of a real V2.1-shaped export (schemaVersion 4): the tag-based
 * caracteristiques system is already in place, `deploiement_effectue: true` is
 * checked, and the candidate has already written content on `hebergeur`/`https`
 * (both tagged `deploiement_effectue` at the time). Exercises the v4->v5 migration
 * (Correctif 1): splitting `deploiement_effectue` into `deploiement_moi_meme` /
 * `deploiement_participation` / `deploiement_documentation` must back-fill
 * `deploiement_moi_meme: true` so `hebergeur`/`https` (now tagged with the new
 * characteristics) stay visible — nothing already written must fall into a blind
 * spot created by the correctif itself.
 */
const V4_EXPORT = JSON.stringify({
  app: 'macertif',
  schemaVersion: 4,
  exportedAt: '2026-06-01T10:00:00.000Z',
  data: {
    [STORAGE_KEYS.dossier]: {
      hebergeur: { text: 'OVH, hébergement mutualisé depuis mars 2026.', updatedAt: '2026-05-01T09:00:00.000Z' },
      https: { text: 'Certificat Let\'s Encrypt configuré via le panneau OVH.', updatedAt: '2026-05-01T09:00:00.000Z' },
    },
    [STORAGE_KEYS.caracteristiques]: {
      front_framework: true,
      deploiement_effectue: true,
    },
  },
})

/** A candidate who never deployed at all: the three new characteristics must stay false. */
const V4_EXPORT_NO_DEPLOIEMENT = JSON.stringify({
  app: 'macertif',
  schemaVersion: 4,
  exportedAt: '2026-06-01T10:00:00.000Z',
  data: {
    [STORAGE_KEYS.dossier]: {},
    [STORAGE_KEYS.caracteristiques]: { front_framework: true },
  },
})

describe('V4 -> V5 migration (deploiement_effectue split into three characteristics)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('imports a frozen V4 export without error', () => {
    expect(() => applyImportPayload(V4_EXPORT)).not.toThrow()
  })

  it('backfills deploiement_moi_meme: true when deploiement_effectue was true, keeping hebergeur/https visible', () => {
    applyImportPayload(V4_EXPORT)
    const caracteristiques = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.caracteristiques)!)

    expect(caracteristiques.deploiement_moi_meme).toBe(true)
    expect(caracteristiques.deploiement_participation).toBe(false)
    expect(caracteristiques.deploiement_documentation).toBe(false)
    // The old flag is preserved too (masqué != supprimé: never delete data on migration).
    expect(caracteristiques.deploiement_effectue).toBe(true)

    const reponses = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.dossier)!)
    expect(reponses.hebergeur.text).toContain('OVH')
    expect(reponses.https.text).toContain('Let\'s Encrypt')
  })

  it('leaves the three new characteristics false for a candidate who never deployed', () => {
    applyImportPayload(V4_EXPORT_NO_DEPLOIEMENT)
    const caracteristiques = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.caracteristiques)!)

    expect(caracteristiques.deploiement_moi_meme).not.toBe(true)
    expect(caracteristiques.deploiement_participation).not.toBe(true)
    expect(caracteristiques.deploiement_documentation).not.toBe(true)
  })
})
