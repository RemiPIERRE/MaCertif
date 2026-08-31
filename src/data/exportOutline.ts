/**
 * The professional structure of the compiled dossier / Word export — distinct from
 * `dossierChapters` (used for the day-to-day "Mon dossier" editing flow). Reflects
 * the official DWWM (ENI) plan: an unnumbered "Remerciements", the table of contents,
 * an unnumbered "Introduction", 11 numbered chapters, and an Annexes section at the
 * end for images that don't need to interrupt the reading flow.
 */

export type ExportItem =
  | { kind: 'task'; taskId: string; annex?: boolean }
  | { kind: 'note'; title: string; note: string }

export interface ExportSubsection {
  title: string
  items: ExportItem[]
}

export interface ExportSection {
  /** null for the unnumbered Remerciements/Introduction sections. */
  number: number | null
  title: string
  subsections?: ExportSubsection[]
  items?: ExportItem[]
}

function task(taskId: string): ExportItem {
  return { kind: 'task', taskId }
}

function annexTask(taskId: string): ExportItem {
  return { kind: 'task', taskId, annex: true }
}

/** Rendered before the table of contents. */
export const remerciementsSection: ExportSection = {
  number: null,
  title: 'Remerciements',
  items: [task('remerciements')],
}

/** Rendered right after the table of contents. */
export const introductionSection: ExportSection = {
  number: null,
  title: 'Introduction',
  items: [task('introduction-personnelle')],
}

export const numberedSections: ExportSection[] = [
  {
    number: 1,
    title: "Présentation de l'entreprise",
    items: [task('entreprise-presentation')],
  },
  {
    number: 2,
    title: "Présentation du poste et de l'environnement technique",
    items: [task('poste-presentation')],
  },
  {
    number: 3,
    title: 'Liste des compétences du référentiel couvertes par le projet',
    items: [
      {
        kind: 'note',
        title: 'Compétences couvertes',
        note: "Section à venir (Phase 2) : une checklist des compétences du référentiel (C1 à C8) sera ajoutée ici, à cocher avec votre tuteur de stage. En attendant, listez-les directement dans Word.",
      },
    ],
  },
  {
    number: 4,
    title: 'Résumé du projet',
    items: [task('cdc-presentation-site')],
  },
  {
    number: 5,
    title: 'Cahier des charges',
    subsections: [
      { title: 'Origine du projet', items: [task('cdc-historique')] },
      { title: 'Expression du besoin', items: [task('cdc-besoin')] },
      { title: 'Étude de marché et positionnement', items: [task('cdc-marche'), task('cdc-concurrents')] },
      { title: 'Cible', items: [task('cdc-cible')] },
      {
        title: 'Fonctionnalités et objectifs',
        items: [task('cdc-fonctionnalite'), task('cdc-objectif-1'), task('cdc-objectif-2')],
      },
      {
        title: 'Rôles et espace utilisateur',
        items: [task('cdc-role-admin'), task('cdc-role-user'), task('cdc-espace-utilisateur')],
      },
      {
        title: 'Arborescence',
        items: [task('cdc-arbo-visiteur'), task('cdc-arbo-admin'), task('cdc-arbo-user')],
      },
    ],
  },
  {
    number: 6,
    title: 'Spécifications techniques',
    subsections: [
      {
        title: 'Outils front-end',
        items: [task('outil-ide'), task('outil-html'), task('outil-css'), task('outil-js'), task('outil-frameworks')],
      },
      { title: 'Maquettage et interface', items: [task('maquettage-pages'), task('maquettage-responsive')] },
      {
        title: 'Identité visuelle',
        items: [task('identite-couleurs'), task('identite-typo'), task('identite-logo')],
      },
      {
        title: "Captures d'interface",
        items: [annexTask('capture-accueil'), annexTask('capture-connexion'), annexTask('capture-smartphone')],
      },
      { title: 'Langages et technologies', items: [task('backend-frontend-langages'), task('backend-langages')] },
      {
        title: 'Base de données',
        items: [task('bdd-technologie'), task('bdd-outil-admin'), task('bdd-methodologie'), task('bdd-entites'), task('bdd-schema')],
      },
      {
        title: 'Framework et architecture',
        items: [task('framework-architecture-generale'), task('framework-nom'), task('framework-organisation-dossiers')],
      },
      {
        title: 'SEO et hébergement',
        items: [task('seo-definition'), task('seo-mise-en-place'), task('hebergeur'), task('https')],
      },
      {
        title: 'Développement dynamique et gestion de contenu',
        items: [
          task('dev-dynamique'),
          task('dev-gestion-contenu'),
          task('dev-acces-donnees'),
          task('dev-methode-backend'),
          task('dev-backend-contenu'),
        ],
      },
    ],
  },
  {
    number: 7,
    title: 'Réalisations',
    subsections: [
      { title: 'Frontend', items: [task('code-capture-frontend'), task('code-explication-frontend')] },
      { title: 'Backend', items: [task('code-capture-backend'), task('code-explication-backend')] },
      {
        title: 'Sécurité des mots de passe',
        items: [task('code-capture-reset'), task('code-explication-reset')],
      },
    ],
  },
  {
    number: 8,
    title: "Jeu d'essai / Tests",
    items: [task('tests-utilisateurs'), task('tests-integrite'), task('tests-injections'), task('tests-responsive')],
  },
  {
    number: 9,
    title: 'Veille de sécurité',
    items: [task('veille-sites')],
  },
  {
    number: 10,
    title: 'Recherche et traduction anglophone',
    subsections: [
      { title: 'Une situation de blocage', items: [task('blocage-situation')] },
      { title: 'Ressource anglophone', items: [task('anglais-extrait'), task('anglais-traduction')] },
    ],
  },
  {
    number: 11,
    title: 'Bilan et perspectives',
    items: [task('valorisation-elements'), annexTask('valorisation-retroplanning'), task('perspectives-evolution')],
  },
]
