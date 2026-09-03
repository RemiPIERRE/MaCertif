import { generateId } from '../lib/id'
import type { OralAnnexCategory, OralSection, Slide } from '../types/oral'

/**
 * Default-seed ids are fixed strings, not `generateId()`, on purpose: the seed is
 * recomputed independently by every page that mounts before the user's first edit
 * (nothing is written to localStorage until then), so two pages navigating the same
 * "default" slide must land on the same id. Random ids would make each page compute
 * a different in-memory default and break that navigation. Ids created afterwards
 * (new slides, new sections) use `generateId()` as usual since by then the data is
 * already persisted and every page reads the same stored state.
 */
function emptySlide(id: string, titre: string, ordre: number): Slide {
  return { id, titre, blocks: [], discours: '', ordre, isDefault: true }
}

function section(id: string, titre: string, slides: [string, string][], optionnelle: boolean, defaultOrdre: number): OralSection {
  const activee = !optionnelle
  return {
    id,
    titre,
    optionnelle,
    activee,
    slides: slides.map(([slideId, t], i) => emptySlide(slideId, t, i)),
    isDefault: true,
    defaultOrdre,
    defaultActivee: activee,
  }
}

/**
 * The starter presentation skeleton shown on first visit. Entirely editable:
 * sections and slides can be renamed, reordered, added or removed — this is only
 * a helpful starting point, never an imposed structure. Ids and `defaultOrdre`
 * here are the reference "Réinitialiser l'ordre des slides" resets back to.
 */
export function createDefaultPresentation(): OralSection[] {
  return [
    section('sec-intro', 'Introduction', [
      ['sec-intro-s1', 'Titre du projet'],
      ['sec-intro-s2', 'Votre parcours'],
      ['sec-intro-s3', 'Sommaire de la présentation'],
    ], false, 0),
    section('sec-analyse', 'Analyse & Conception', [
      ['sec-analyse-s1', 'Contexte du projet'],
      ['sec-analyse-s2', 'Cahier des charges'],
      ['sec-analyse-s3', 'Maquettes'],
      ['sec-analyse-s4', 'MCD / MLD'],
    ], false, 1),
    section('sec-realisation', 'Réalisation technique & Démo', [
      ['sec-realisation-s1', 'Architecture et stack technique'],
      ['sec-realisation-s2', 'Démonstration live'],
      ['sec-realisation-s3', 'Slide de secours (démo)'],
      ['sec-realisation-s4', 'Focus code — Frontend'],
      ['sec-realisation-s5', 'Focus code — Backend'],
    ], false, 2),
    section('sec-jeux-essais', "Jeux d'essais", [['sec-jeux-essais-s1', "Jeux d'essais"]], true, 3),
    section('sec-recherche', 'Exemple de recherche', [['sec-recherche-s1', 'Exemple de recherche']], true, 4),
    section('sec-conclusion', 'Gestion de projet & Conclusion', [
      ['sec-conclusion-s1', 'Méthodologie de gestion de projet'],
      ['sec-conclusion-s2', 'Sécurité'],
      ['sec-conclusion-s3', 'Difficultés rencontrées'],
      ['sec-conclusion-s4', 'Bilan'],
      ['sec-conclusion-s5', 'Remerciements'],
    ], false, 5),
  ]
}

const DEFAULT_ANNEX_CATEGORIES: [string, string][] = [
  ['annexe-details', 'Détails techniques'],
  ['annexe-captures', "Captures d'écran supplémentaires"],
  ['annexe-code', 'Extraits de code'],
  ['annexe-schemas', 'Schémas techniques'],
  ['annexe-documents', 'Documents / chiffres justificatifs'],
]

export function createDefaultAnnexes(): OralAnnexCategory[] {
  return DEFAULT_ANNEX_CATEGORIES.map(([id, categorie]) => ({ id, categorie, slides: [] }))
}

export function createNewSlide(ordre: number): Slide {
  return { id: generateId(), titre: 'Nouvelle slide', blocks: [], discours: '', ordre, isDefault: false }
}
