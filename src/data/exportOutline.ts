/**
 * The professional structure of the compiled dossier / Word export — distinct from
 * `dossierChapters` (used for the day-to-day "Mon dossier" editing flow). Reflects
 * the official DWWM (ENI) plan: an unnumbered "Remerciements", the table of contents,
 * an unnumbered "Introduction", numbered chapters, and an Annexes section at the
 * end for images that don't need to interrupt the reading flow.
 *
 * Chapter numbers are NOT hardcoded here: a candidate whose characteristics hide an
 * entire chapter (e.g. no WordPress at all) must never see a numbering gap or an
 * empty heading in their own document, so `resolveOutline` numbers only the
 * chapters that actually have content for that candidate, in this array's order.
 */

export type ExportItem =
  | { kind: 'task'; taskId: string; annex?: boolean }
  | { kind: 'note'; title: string; note: string }
  | { kind: 'competences' }

export interface ExportSubsection {
  title: string
  items: ExportItem[]
}

export interface ExportSection {
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
export const remerciementsSection: ExportSubsection = {
  title: 'Remerciements',
  items: [task('remerciements')],
}

/** Rendered right after the table of contents. */
export const introductionSection: ExportSubsection = {
  title: 'Introduction',
  items: [task('introduction-personnelle')],
}

export const numberedSections: ExportSection[] = [
  {
    title: "Présentation de l'entreprise",
    items: [task('entreprise-presentation')],
  },
  {
    title: "Présentation du poste et de l'environnement technique",
    items: [task('poste-presentation')],
  },
  {
    title: 'Liste des compétences du référentiel couvertes par le projet',
    items: [{ kind: 'competences' }],
  },
  {
    title: 'Résumé du projet',
    items: [task('cdc-presentation-site')],
  },
  {
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
        title: 'Base de données relationnelle',
        items: [task('bdd-technologie'), task('bdd-outil-admin'), task('bdd-methodologie'), task('bdd-entites'), task('bdd-schema')],
      },
      {
        title: 'Base de données non relationnelle',
        items: [task('bdd-nosql-technologie'), task('bdd-nosql-modele'), task('bdd-nosql-relations'), annexTask('bdd-nosql-schema')],
      },
      {
        title: 'Framework et architecture',
        items: [task('framework-architecture-generale'), task('framework-nom'), task('framework-organisation-dossiers')],
      },
      {
        title: 'Gestion des rôles utilisateurs',
        items: [task('roles-admin'), task('roles-user'), task('roles-autres')],
      },
      {
        title: 'SEO et hébergement',
        items: [task('seo-definition'), task('seo-mise-en-place'), task('hebergeur')],
      },
      {
        title: 'Développement dynamique et gestion de contenu',
        items: [
          task('dev-dynamique'),
          task('dev-gestion-contenu'),
          task('dev-acces-donnees'),
          task('api-documentation'),
          task('dev-methode-backend'),
          task('dev-backend-contenu'),
        ],
      },
    ],
  },
  {
    title: 'WordPress',
    items: [task('wp-plugins'), task('wp-securite'), task('wp-roles'), task('wp-personnalisation'), task('wp-cpt')],
  },
  {
    title: 'Réalisations',
    subsections: [
      { title: 'Frontend', items: [task('code-capture-frontend'), task('code-explication-frontend')] },
      { title: 'Backend', items: [task('code-capture-backend'), task('code-explication-backend')] },
    ],
  },
  {
    title: 'Sécurité',
    subsections: [
      {
        title: "Authentification et contrôle d'accès",
        items: [
          task('securite-auth-hash'),
          task('securite-controle-acces'),
          task('code-capture-reset'),
          task('code-explication-reset'),
        ],
      },
      {
        title: 'Protection des données et des échanges',
        items: [
          task('securite-validation-donnees'),
          task('securite-antispam'),
          task('https'),
          task('securite-api-externe'),
        ],
      },
    ],
  },
  {
    title: "Jeu d'essai / Tests",
    items: [task('tests-utilisateurs'), task('tests-integrite'), task('tests-injections'), task('tests-responsive')],
  },
  {
    title: 'Veille de sécurité',
    items: [task('veille-sites')],
  },
  {
    title: 'Recherche et traduction anglophone',
    subsections: [
      { title: 'Une situation de blocage', items: [task('blocage-situation')] },
      { title: 'Ressource anglophone', items: [task('anglais-extrait'), task('anglais-traduction')] },
    ],
  },
  {
    title: 'Bilan et perspectives',
    items: [task('valorisation-elements'), annexTask('valorisation-retroplanning'), task('perspectives-evolution')],
  },
]
