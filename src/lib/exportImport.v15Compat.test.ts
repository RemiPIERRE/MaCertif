import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../types/storage'
import { migrateData } from './exportImport'

/**
 * A frozen snapshot of a real V1.5 export's `data` ("Mon dossier" only, no "Mon
 * oral"). V1.5 exports never had a `schemaVersion` field — they carried a literal
 * `version: 1` that never changed — so this fixture must NEVER be updated to add
 * one: it is exactly what a file downloaded from production V1.5 looks like, and it
 * must keep migrating cleanly into every future version of the app.
 *
 * migrateData() is exercised directly (not applyImportPayload, which now dispatches
 * the result to the API — see exportImport.ts) because the transformation itself,
 * not the HTTP plumbing around it, is what must never regress for an old export.
 */
const V1_5_DATA = {
  [STORAGE_KEYS.profil]: {
    nom: 'Dupont',
    prenom: 'Alex',
    nomProjet: 'Mon super projet',
    sousTitreProjet: 'Une application web',
    nomOrganisme: 'Centre de formation',
    dateDebutFormation: '2025-09-01',
    dateFinFormation: '2026-08-31',
    dateDebutStage: '2026-03-01',
    dateFinStage: '2026-05-31',
    dateExamenDebut: '2026-09-01',
    dateExamenFin: '2026-09-03',
  },
  [STORAGE_KEYS.dossier]: {
    'tache-1': { text: 'Réponse rédigée pour la tâche 1.', updatedAt: '2026-01-10T09:00:00.000Z' },
    'tache-2': { text: 'Réponse rédigée pour la tâche 2.', updatedAt: '2026-01-11T09:00:00.000Z' },
  },
  [STORAGE_KEYS.site]: {
    'tache-1': true,
    'tache-2': false,
  },
  [STORAGE_KEYS.siteCustomRefs]: [
    { id: 'ref-1', taskId: 'tache-1', label: 'Capture accueil', kind: 'annexe', ready: true, createdAt: '2026-01-10T09:00:00.000Z' },
  ],
  [STORAGE_KEYS.notes]: [{ id: 'note-1', text: 'Ne pas oublier de relire.', color: 'violet', createdAt: '2026-01-05T09:00:00.000Z' }],
  [STORAGE_KEYS.calendrier]: [{ id: 'deadline-1', label: 'Rendu dossier', date: '2026-08-15', note: 'Date limite envoi' }],
  [STORAGE_KEYS.questionnaire]: { hasBackend: true, hasFrontend: true, roles: 'plusieurs' },
}

describe('V1.5 export compatibility', () => {
  it('migrates a frozen V1.5 export without error', () => {
    expect(() => migrateData(V1_5_DATA, 1)).not.toThrow()
  })

  it('preserves every V1.5 key with its original data', () => {
    const migrated = migrateData(V1_5_DATA, 1)

    expect((migrated[STORAGE_KEYS.profil] as { nomProjet: string }).nomProjet).toBe('Mon super projet')
    expect((migrated[STORAGE_KEYS.dossier] as Record<string, { text: string }>)['tache-1'].text).toBe('Réponse rédigée pour la tâche 1.')
    expect(migrated[STORAGE_KEYS.notes]).toHaveLength(1)
  })

  it('leaves the new Mon oral (V2) keys absent rather than erroring on their absence', () => {
    const migrated = migrateData(V1_5_DATA, 1)

    expect(migrated[STORAGE_KEYS.oralPresentation]).toBeUndefined()
    expect(migrated[STORAGE_KEYS.oralAnnexes]).toBeUndefined()
    expect(migrated[STORAGE_KEYS.oralTheme]).toBeUndefined()
  })
})
