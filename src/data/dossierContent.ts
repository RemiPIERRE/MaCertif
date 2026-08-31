import type { DossierChapter, DossierTask } from '../types/dossier'

let counter = 0
const next = () => ++counter

function textTask(id: string, title: string): DossierTask {
  return {
    id,
    number: next(),
    title,
    type: 'text',
    minChars: 600,
    maxChars: 850,
    example: null,
  }
}

/** The English-excerpt task: length depends on the source quoted, not constrained. */
function freeTextTask(id: string, title: string): DossierTask {
  return {
    id,
    number: next(),
    title,
    type: 'text',
    minChars: null,
    maxChars: null,
    example: null,
  }
}

function imageTask(id: string, title: string): DossierTask {
  return {
    id,
    number: next(),
    title,
    type: 'image',
    minChars: 0,
    maxChars: 150,
    example: null,
  }
}

export const dossierChapters: DossierChapter[] = [
  {
    id: 'remerciements',
    number: 1,
    title: 'Remerciements',
    tasks: [
      textTask('remerciements-centre', 'Remercier le centre de formation, votre maître de stage, une personne ou un organisme qui vous a suivi'),
      textTask('remerciements-formateur', 'Remercier un formateur ou une personne qui vous a beaucoup apporté'),
      textTask('remerciements-famille', 'Remercier votre famille'),
    ],
  },
  {
    id: 'veille',
    number: 2,
    title: 'Veille technologique',
    tasks: [
      textTask('veille-sites', 'Décrire des sites intéressants dans votre veille de sécurité informatique'),
    ],
  },
  {
    id: 'cahier-des-charges',
    number: 3,
    title: 'Cahier des charges',
    subchapters: [
      {
        id: 'cdc-presentation',
        code: '3.1',
        title: 'Présentation du projet',
        tasks: [
          textTask('cdc-historique', "Expliquer l'historique, la naissance de votre idée"),
          textTask('cdc-presentation-site', 'Présenter brièvement votre site internet'),
        ],
      },
      {
        id: 'cdc-besoin',
        code: '3.2',
        title: 'Expression du besoin',
        tasks: [
          textTask('cdc-besoin', 'Expliquer le besoin que votre site comble et comment il le comble'),
        ],
      },
      {
        id: 'cdc-marche',
        code: '3.3',
        title: 'Étude de marché et benchmarking',
        tasks: [
          textTask('cdc-marche', "Donner quelques mots sur le marché, le domaine de l'activité et votre avis sur la présence de concurrents"),
          textTask('cdc-concurrents', 'Décrire chacun de vos concurrents sur ce marché'),
        ],
      },
      {
        id: 'cdc-cible',
        code: '3.4',
        title: 'Cible',
        tasks: [
          textTask('cdc-cible', 'Expliquer la population cible de votre site internet'),
        ],
      },
      {
        id: 'cdc-fonctionnalites',
        code: '3.5',
        title: 'Fonctionnalités et objectifs',
        tasks: [
          textTask('cdc-fonctionnalite', 'Expliquer une fonctionnalité importante de votre site internet'),
          textTask('cdc-objectif-1', 'Expliquer le premier objectif du site'),
          textTask('cdc-objectif-2', 'Expliquer le deuxième objectif du site'),
        ],
      },
      {
        id: 'cdc-roles',
        code: '3.6',
        title: 'Rôles et espace utilisateur',
        tasks: [
          textTask('cdc-role-admin', 'Expliquer à quoi sert le rôle admin sur votre site'),
          textTask('cdc-role-user', "Expliquer le rôle user et ce qu'il peut faire sur votre site"),
          textTask('cdc-espace-utilisateur', "Expliquer l'espace utilisateur de votre site"),
        ],
      },
      {
        id: 'cdc-arborescence',
        code: '3.7',
        title: 'Arborescence',
        tasks: [
          imageTask('cdc-arbo-visiteur', 'Arborescence : visiteur non enregistré'),
          imageTask('cdc-arbo-admin', 'Arborescence : administrateur'),
          imageTask('cdc-arbo-user', 'Arborescence : utilisateur enregistré'),
        ],
      },
    ],
  },
  {
    id: 'outillage',
    number: 4,
    title: 'Outillage et conception graphique',
    subchapters: [
      {
        id: 'outillage-langages',
        code: '4.1',
        title: 'Outils et langages front-end',
        tasks: [
          textTask('outil-vscode', 'Quelques mots sur VS Code'),
          textTask('outil-html', 'Quelques mots sur le langage HTML'),
          textTask('outil-css', 'Quelques mots sur le langage CSS'),
          textTask('outil-js', 'Quelques mots sur le langage JS'),
          textTask('outil-bootstrap', 'Quelques mots sur Bootstrap'),
        ],
      },
      {
        id: 'outillage-maquettage',
        code: '4.2',
        title: 'Maquettage et interface',
        tasks: [
          textTask('maquettage-pages', 'Ce que vous avez fait pour maquetter vos pages'),
          textTask('maquettage-adaptable', "Comment vous avez réalisé techniquement l'interface web adaptable"),
        ],
      },
      {
        id: 'outillage-identite',
        code: '4.3',
        title: 'Identité visuelle',
        tasks: [
          textTask('identite-couleurs', 'Décrire les couleurs utilisées'),
          textTask('identite-typo', 'Décrire la typographie utilisée'),
          textTask('identite-logo', 'Décrire votre logo et les techniques utilisées pour le créer'),
        ],
      },
      {
        id: 'outillage-captures',
        code: '4.4',
        title: "Captures d'interface",
        tasks: [
          imageTask('capture-accueil', "Capture de la page d'accueil"),
          imageTask('capture-connexion', 'Capture de la page de connexion'),
          imageTask('capture-smartphone', 'Capture du site sur smartphone'),
        ],
      },
    ],
  },
  {
    id: 'introduction-backend',
    number: 5,
    title: 'Introduction back-end',
    tasks: [
      textTask('backend-php', 'Quelques mots sur le langage PHP'),
      textTask('backend-frontend-roles', 'Expliquer à quoi sert le frontend et le backend de votre site'),
    ],
  },
  {
    id: 'base-de-donnees',
    number: 6,
    title: 'Base de données',
    subchapters: [
      {
        id: 'bdd-technologies',
        code: '6.1',
        title: 'Technologies',
        tasks: [
          textTask('bdd-mysql', 'Quelques mots sur MySQL'),
          textTask('bdd-phpmyadmin', 'Quelques mots sur phpMyAdmin'),
        ],
      },
      {
        id: 'bdd-conception',
        code: '6.2',
        title: 'Conception',
        tasks: [
          textTask('bdd-methodologie', 'Votre méthodologie pour la création de la base de données'),
          textTask('bdd-entites', 'Énumérer et expliquer les entités et tables stockées en base'),
          imageTask('bdd-schema', 'Schéma MCD ou MPD'),
        ],
      },
    ],
  },
  {
    id: 'framework',
    number: 7,
    title: 'Framework et architecture',
    subchapters: [
      {
        id: 'framework-vue-ensemble',
        code: '7.1',
        title: "Vue d'ensemble",
        tasks: [
          textTask('framework-technologie', 'Expliquer de manière générale la technologie utilisée (sur quoi repose le site)'),
          textTask('framework-symfony', 'Quelques mots sur Symfony'),
        ],
      },
      {
        id: 'framework-architecture',
        code: '7.2',
        title: 'Architecture Symfony',
        tasks: [
          textTask('framework-public', "Le dossier public de Symfony"),
          textTask('framework-src', 'Le contenu du dossier src'),
          textTask('framework-templates', 'Le contenu du dossier templates'),
        ],
      },
    ],
  },
  {
    id: 'extraits-code',
    number: 8,
    title: 'Extraits de code',
    subchapters: [
      {
        id: 'code-frontend',
        code: '8.1',
        title: 'Frontend',
        tasks: [
          imageTask('code-capture-frontend', 'Capture VS Code : code frontend intéressant (TWIG)'),
          textTask('code-explication-frontend', 'Expliquer le code frontend choisi'),
        ],
      },
      {
        id: 'code-backend',
        code: '8.2',
        title: 'Backend',
        tasks: [
          imageTask('code-capture-backend', 'Capture VS Code : code backend intéressant'),
          textTask('code-explication-backend', 'Expliquer le code backend choisi'),
        ],
      },
      {
        id: 'code-securite',
        code: '8.3',
        title: 'Sécurité des mots de passe',
        tasks: [
          imageTask('code-capture-reset', 'Capture VS Code : code de réinitialisation de mot de passe'),
          textTask('code-explication-reset', 'Expliquer comment fonctionne la réinitialisation de mot de passe'),
        ],
      },
    ],
  },
  {
    id: 'seo-hebergement',
    number: 9,
    title: 'SEO et hébergement',
    tasks: [
      textTask('seo-definition', 'Ce qu\'est le SEO et ses bénéfices pour votre projet'),
      textTask('seo-mise-en-place', 'Comment vous avez mis en place le SEO'),
      textTask('hebergeur', "Quel hébergeur utilisé, avec une brève description de son historique"),
      textTask('https', "Ce qu'est le protocole HTTPS et comment vous l'avez mis en place"),
    ],
  },
  {
    id: 'developpement-dynamique',
    number: 10,
    title: 'Développement dynamique et gestion de contenu',
    tasks: [
      textTask('dev-dynamique', 'Comment vous avez développé la partie dynamique du site'),
      textTask('dev-gestion-contenu', 'Ce que vous avez mis en place pour gérer du contenu'),
      textTask('dev-acces-donnees', "Comment vous avez mis en place et utilisé les composants d'accès aux données"),
      textTask('dev-methode-backend', 'Votre méthode de développement de la partie backend'),
      textTask('dev-backend-contenu', 'Comment vous avez élaboré la partie backend pour gérer le contenu'),
    ],
  },
  {
    id: 'tests',
    number: 11,
    title: 'Tests',
    tasks: [
      textTask('tests-utilisateurs', 'En quoi consistent les tests utilisateurs et comment ils ont été menés'),
      textTask('tests-integrite', "Comment vous avez vérifié l'intégrité des données enregistrées"),
      textTask('tests-injections', 'Les tests menés concernant les injections et leur résultat'),
      textTask('tests-responsive', 'Comment vous avez testé que le site est bien responsive'),
    ],
  },
  {
    id: 'difficultes-anglais',
    number: 12,
    title: 'Difficultés rencontrées et anglais technique',
    subchapters: [
      {
        id: 'difficultes-blocage',
        code: '12.1',
        title: 'Le blocage',
        tasks: [
          textTask('blocage-situation', 'Décrire une situation de travail ayant nécessité une longue recherche'),
        ],
      },
      {
        id: 'difficultes-anglais-ressource',
        code: '12.2',
        title: 'Ressource anglophone',
        tasks: [
          freeTextTask('anglais-extrait', 'Extrait en anglais des résultats de recherche'),
          textTask('anglais-traduction', 'Traduction en français (attention à l\'orthographe)'),
        ],
      },
    ],
  },
  {
    id: 'valorisation',
    number: 13,
    title: 'Valorisation',
    tasks: [
      textTask('valorisation-elements', 'Mettre en avant les éléments développés (idéalement non-techniques)'),
      imageTask('valorisation-retroplanning', 'Rétro-planning de développement'),
    ],
  },
  {
    id: 'perspectives',
    number: 14,
    title: 'Perspectives',
    tasks: [
      textTask('perspectives-evolution', "Décrire l'évolution future : nouvelles opportunités, ce qu'il reste à faire, fonctionnalités à venir"),
    ],
  },
]

export const allTasks: DossierTask[] = dossierChapters.flatMap((chapter) =>
  chapter.subchapters ? chapter.subchapters.flatMap((sub) => sub.tasks) : (chapter.tasks ?? []),
)

export const totalTaskCount = allTasks.length
