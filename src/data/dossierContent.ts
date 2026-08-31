import type { DossierChapter, DossierTask } from '../types/dossier'

let counter = 0
const next = () => ++counter

interface TaskOptions {
  sectionTitle?: string
  minChars?: number
  conditionalOn?: string
}

/** Standard "texte" task: an indicative minimum, no upper bound (never blocks saving). */
function textTask(id: string, title: string, opts: TaskOptions = {}): DossierTask {
  return {
    id,
    number: next(),
    title,
    sectionTitle: opts.sectionTitle,
    type: 'text',
    minChars: opts.minChars ?? 600,
    maxChars: null,
    example: null,
    conditionalOn: opts.conditionalOn,
  }
}

/** The English-excerpt task: length depends entirely on the source quoted. */
function freeTextTask(id: string, title: string, opts: TaskOptions = {}): DossierTask {
  return {
    id,
    number: next(),
    title,
    sectionTitle: opts.sectionTitle,
    type: 'text',
    minChars: null,
    maxChars: null,
    example: null,
    conditionalOn: opts.conditionalOn,
  }
}

/** Short caption describing an image the user will insert by hand after export. */
function imageTask(id: string, title: string, opts: TaskOptions = {}): DossierTask {
  return {
    id,
    number: next(),
    title,
    sectionTitle: opts.sectionTitle,
    type: 'image',
    minChars: 0,
    maxChars: 150,
    example: null,
    conditionalOn: opts.conditionalOn,
  }
}

export const dossierChapters: DossierChapter[] = [
  {
    id: 'remerciements',
    number: 1,
    title: 'Remerciements',
    tasks: [
      textTask(
        'remerciements',
        "Rédigez vos remerciements : pensez par exemple à l'entreprise, votre tuteur de stage, vos collègues, votre organisme de formation, un formateur, votre famille…",
        { sectionTitle: 'Remerciements', minChars: 500 },
      ),
    ],
  },
  {
    id: 'entreprise',
    number: 2,
    title: "Présentation de l'entreprise",
    tasks: [
      textTask(
        'entreprise-presentation',
        "Présentez l'entreprise : son activité, ses chiffres-clés, son organisation hiérarchique, et le service ou contexte dans lequel vous avez été accueilli(e) en stage",
        { sectionTitle: "Présentation de l'entreprise", minChars: 900 },
      ),
    ],
  },
  {
    id: 'poste',
    number: 3,
    title: 'Présentation du poste et de l\'environnement technique',
    tasks: [
      textTask(
        'poste-presentation',
        "Présentez votre poste : l'équipe, le contexte et les contraintes du projet, vos méthodes de travail/organisation, et un aperçu rapide de l'environnement technique (sans le détailler, ce sera fait plus loin)",
        { sectionTitle: 'Présentation du poste et de l\'environnement technique', minChars: 700 },
      ),
    ],
  },
  {
    id: 'cahier-des-charges',
    number: 4,
    title: 'Cahier des charges',
    subchapters: [
      {
        id: 'cdc-presentation',
        code: '4.1',
        title: 'Présentation du projet',
        tasks: [
          textTask('cdc-historique', 'Expliquer la naissance du projet, son origine', { sectionTitle: 'Origine du projet' }),
          textTask('cdc-presentation-site', 'Présenter brièvement votre site internet', { sectionTitle: 'Résumé du projet' }),
        ],
      },
      {
        id: 'cdc-besoin',
        code: '4.2',
        title: 'Expression du besoin',
        tasks: [
          textTask('cdc-besoin', 'Expliquer le besoin que votre site comble et comment il le comble', { sectionTitle: 'Expression du besoin' }),
        ],
      },
      {
        id: 'cdc-marche',
        code: '4.3',
        title: 'Étude de marché et benchmarking',
        tasks: [
          textTask('cdc-marche', "Donner quelques mots sur le marché, le domaine de l'activité et votre avis sur la présence de concurrents", { sectionTitle: 'Étude de marché' }),
          textTask('cdc-concurrents', 'Décrire chacun de vos concurrents sur ce marché', { sectionTitle: 'Benchmarking concurrentiel' }),
        ],
      },
      {
        id: 'cdc-cible',
        code: '4.4',
        title: 'Cible',
        tasks: [
          textTask('cdc-cible', 'Expliquer la population cible de votre site internet', { sectionTitle: 'Cible' }),
        ],
      },
      {
        id: 'cdc-fonctionnalites',
        code: '4.5',
        title: 'Fonctionnalités et objectifs',
        tasks: [
          textTask('cdc-fonctionnalite', 'Expliquer une fonctionnalité importante de votre site internet', { sectionTitle: 'Fonctionnalités principales' }),
          textTask('cdc-objectif-1', 'Expliquer le premier objectif du site', { sectionTitle: 'Objectifs du projet' }),
          textTask('cdc-objectif-2', 'Expliquer le deuxième objectif du site', { sectionTitle: 'Objectifs du projet (suite)' }),
        ],
      },
      {
        id: 'cdc-roles',
        code: '4.6',
        title: 'Rôles et espace utilisateur',
        tasks: [
          textTask('cdc-role-admin', 'Expliquer à quoi sert le rôle admin sur votre site', { sectionTitle: 'Rôles et permissions' }),
          textTask('cdc-role-user', "Expliquer le rôle user et ce qu'il peut faire sur votre site", { sectionTitle: 'Rôles et permissions (utilisateur)' }),
          textTask('cdc-espace-utilisateur', "Expliquer l'espace utilisateur de votre site", { sectionTitle: 'Espace utilisateur' }),
        ],
      },
      {
        id: 'cdc-arborescence',
        code: '4.7',
        title: 'Arborescence',
        tasks: [
          imageTask('cdc-arbo-visiteur', 'Arborescence : visiteur non enregistré', { sectionTitle: 'Arborescence — visiteur' }),
          imageTask('cdc-arbo-admin', 'Arborescence : administrateur', { sectionTitle: 'Arborescence — administrateur' }),
          imageTask('cdc-arbo-user', 'Arborescence : utilisateur enregistré', { sectionTitle: 'Arborescence — utilisateur enregistré' }),
        ],
      },
    ],
  },
  {
    id: 'outillage',
    number: 5,
    title: 'Outillage et conception graphique',
    subchapters: [
      {
        id: 'outillage-langages',
        code: '5.1',
        title: 'Outils et langages front-end',
        tasks: [
          textTask('outil-ide', 'Quelques mots sur votre IDE (environnement de développement)', { sectionTitle: 'IDE' }),
          textTask('outil-html', 'Quelques mots sur le langage HTML', { sectionTitle: 'HTML' }),
          textTask('outil-css', 'Quelques mots sur le langage CSS', { sectionTitle: 'CSS' }),
          textTask('outil-js', 'Quelques mots sur le langage JS', { sectionTitle: 'JavaScript' }),
          textTask('outil-frameworks', 'Quelques mots sur les frameworks ou bibliothèques front-end utilisés', { sectionTitle: 'Frameworks front-end' }),
        ],
      },
      {
        id: 'outillage-maquettage',
        code: '5.2',
        title: 'Maquettage et interface',
        tasks: [
          textTask('maquettage-pages', 'Ce que vous avez fait pour maquetter vos pages', { sectionTitle: 'Maquettage' }),
          textTask('maquettage-responsive', 'Comment vous avez géré le responsive (ordinateur, tablette, mobile)', { sectionTitle: 'Responsive design' }),
        ],
      },
      {
        id: 'outillage-identite',
        code: '5.3',
        title: 'Identité visuelle',
        tasks: [
          textTask('identite-couleurs', 'Décrire les couleurs utilisées', { sectionTitle: 'Palette de couleurs' }),
          textTask('identite-typo', 'Décrire la typographie utilisée', { sectionTitle: 'Typographie' }),
          textTask('identite-logo', 'Décrire votre logo et les techniques utilisées pour le créer', { sectionTitle: 'Logo', conditionalOn: 'logo' }),
        ],
      },
      {
        id: 'outillage-captures',
        code: '5.4',
        title: "Captures d'interface",
        tasks: [
          imageTask('capture-accueil', "Capture de la page d'accueil", { sectionTitle: "Page d'accueil" }),
          imageTask('capture-connexion', 'Capture de la page de connexion', { sectionTitle: 'Page de connexion' }),
          imageTask('capture-smartphone', 'Capture du site sur smartphone', { sectionTitle: 'Version mobile' }),
        ],
      },
    ],
  },
  {
    id: 'introduction-backend',
    number: 6,
    title: 'Introduction back-end',
    tasks: [
      textTask('backend-frontend-langages', 'Présentez le ou les langages utilisés côté frontend', { sectionTitle: 'Langages frontend' }),
      textTask('backend-langages', 'Présentez le ou les langages utilisés côté backend', { sectionTitle: 'Langages backend' }),
    ],
  },
  {
    id: 'base-de-donnees',
    number: 7,
    title: 'Base de données',
    subchapters: [
      {
        id: 'bdd-technologies',
        code: '7.1',
        title: 'Technologies',
        tasks: [
          textTask('bdd-technologie', 'Présentez la technologie de base de données que vous avez utilisée', { sectionTitle: 'Technologie de base de données' }),
          textTask('bdd-outil-admin', 'Présentez l\'outil d\'administration de votre base de données', { sectionTitle: "Outil d'administration" }),
        ],
      },
      {
        id: 'bdd-conception',
        code: '7.2',
        title: 'Conception',
        tasks: [
          textTask('bdd-methodologie', 'Votre méthodologie pour la création de la base de données', { sectionTitle: 'Méthodologie de conception' }),
          textTask('bdd-entites', 'Énumérer et expliquer les entités et tables stockées en base', { sectionTitle: 'Entités et tables' }),
          imageTask('bdd-schema', 'Schéma MCD ou MPD', { sectionTitle: 'Schéma de base de données' }),
        ],
      },
    ],
  },
  {
    id: 'framework',
    number: 8,
    title: 'Framework et architecture',
    subchapters: [
      {
        id: 'framework-vue-ensemble',
        code: '8.1',
        title: "Vue d'ensemble",
        tasks: [
          textTask('framework-architecture-generale', "Présentez de manière générale l'architecture technique de votre backend (sur quoi repose le site)", { sectionTitle: 'Architecture technique' }),
          textTask('framework-nom', "Présentez le framework ou la bibliothèque backend que vous avez utilisé(e), et pourquoi ce choix", { sectionTitle: 'Framework backend' }),
        ],
      },
      {
        id: 'framework-organisation',
        code: '8.2',
        title: 'Organisation des dossiers',
        tasks: [
          textTask(
            'framework-organisation-dossiers',
            'Présentez l\'organisation des dossiers/fichiers de votre projet backend',
            { sectionTitle: 'Organisation des dossiers', conditionalOn: 'architectureDossiers' },
          ),
        ],
      },
    ],
  },
  {
    id: 'extraits-code',
    number: 9,
    title: 'Extraits de code',
    subchapters: [
      {
        id: 'code-frontend',
        code: '9.1',
        title: 'Frontend',
        tasks: [
          imageTask('code-capture-frontend', 'Capture de votre IDE : code frontend intéressant', { sectionTitle: 'Extrait de code frontend' }),
          textTask('code-explication-frontend', 'Expliquer le code frontend choisi', { sectionTitle: 'Explication du code frontend' }),
        ],
      },
      {
        id: 'code-backend',
        code: '9.2',
        title: 'Backend',
        tasks: [
          imageTask('code-capture-backend', 'Capture de votre IDE : code backend intéressant', { sectionTitle: 'Extrait de code backend' }),
          textTask('code-explication-backend', 'Expliquer le code backend choisi', { sectionTitle: 'Explication du code backend' }),
        ],
      },
      {
        id: 'code-securite',
        code: '9.3',
        title: 'Sécurité des mots de passe',
        tasks: [
          imageTask('code-capture-reset', 'Capture de votre IDE : code de réinitialisation de mot de passe', { sectionTitle: 'Extrait de code — réinitialisation du mot de passe' }),
          textTask('code-explication-reset', 'Expliquer comment fonctionne la réinitialisation de mot de passe', { sectionTitle: 'Fonctionnement de la réinitialisation du mot de passe' }),
        ],
      },
    ],
  },
  {
    id: 'seo-hebergement',
    number: 10,
    title: 'SEO et hébergement',
    tasks: [
      textTask('seo-definition', "Ce qu'est le SEO et ses bénéfices pour votre projet", { sectionTitle: 'Le SEO et ses bénéfices', conditionalOn: 'seo' }),
      textTask('seo-mise-en-place', 'Comment vous avez mis en place le SEO', { sectionTitle: 'Mise en place du SEO', conditionalOn: 'seo' }),
      textTask('hebergeur', 'Quel hébergeur utilisé, avec une brève description de son historique', { sectionTitle: 'Hébergement' }),
      textTask('https', "Ce qu'est le protocole HTTPS et comment vous l'avez mis en place", { sectionTitle: 'Sécurisation HTTPS' }),
    ],
  },
  {
    id: 'developpement-dynamique',
    number: 11,
    title: 'Développement dynamique et gestion de contenu',
    tasks: [
      textTask('dev-dynamique', 'Comment vous avez développé la partie dynamique du site', { sectionTitle: 'Développement dynamique' }),
      textTask('dev-gestion-contenu', 'Ce que vous avez mis en place pour gérer du contenu', { sectionTitle: 'Gestion de contenu' }),
      textTask('dev-acces-donnees', "Comment vous avez mis en place et utilisé les composants d'accès aux données", { sectionTitle: "Accès aux données" }),
      textTask('dev-methode-backend', 'Votre méthode de développement de la partie backend', { sectionTitle: 'Méthode de développement backend' }),
      textTask('dev-backend-contenu', 'Comment vous avez élaboré la partie backend pour gérer le contenu', { sectionTitle: 'Backend de gestion de contenu' }),
    ],
  },
  {
    id: 'tests',
    number: 12,
    title: 'Tests',
    tasks: [
      textTask('tests-utilisateurs', 'En quoi consistent les tests utilisateurs et comment ils ont été menés', { sectionTitle: 'Tests utilisateurs' }),
      textTask('tests-integrite', "Comment vous avez vérifié l'intégrité des données enregistrées", { sectionTitle: "Tests d'intégrité des données" }),
      textTask('tests-injections', 'Les tests menés concernant les injections et leur résultat', { sectionTitle: "Tests d'injection" }),
      textTask('tests-responsive', 'Comment vous avez testé que le site est bien responsive', { sectionTitle: 'Tests de responsive design' }),
    ],
  },
  {
    id: 'veille',
    number: 13,
    title: 'Veille technologique',
    tasks: [
      textTask('veille-sites', 'Décrire des sites intéressants dans votre veille de sécurité informatique', { sectionTitle: 'Veille de sécurité informatique' }),
    ],
  },
  {
    id: 'difficultes-anglais',
    number: 14,
    title: 'Difficultés rencontrées et anglais technique',
    subchapters: [
      {
        id: 'difficultes-blocage',
        code: '14.1',
        title: 'Le blocage',
        tasks: [
          textTask('blocage-situation', 'Décrire une situation de travail ayant nécessité une longue recherche', { sectionTitle: 'Une situation de blocage' }),
        ],
      },
      {
        id: 'difficultes-anglais-ressource',
        code: '14.2',
        title: 'Ressource anglophone',
        tasks: [
          freeTextTask('anglais-extrait', 'Extrait en anglais des résultats de recherche', { sectionTitle: 'Extrait en anglais' }),
          textTask('anglais-traduction', "Traduction en français (attention à l'orthographe)", {
            sectionTitle: 'Traduction en français',
            minChars: 750,
          }),
        ],
      },
    ],
  },
  {
    id: 'valorisation',
    number: 15,
    title: 'Valorisation',
    tasks: [
      textTask('valorisation-elements', 'Mettre en avant les éléments développés (idéalement non-techniques)', { sectionTitle: 'Valorisation du projet' }),
      imageTask('valorisation-retroplanning', 'Rétro-planning de développement', { sectionTitle: 'Rétro-planning' }),
    ],
  },
  {
    id: 'perspectives',
    number: 16,
    title: 'Perspectives',
    tasks: [
      textTask('perspectives-evolution', "Décrire l'évolution future : nouvelles opportunités, ce qu'il reste à faire, fonctionnalités à venir", { sectionTitle: 'Perspectives et évolutions futures' }),
    ],
  },
]

export const allTasks: DossierTask[] = dossierChapters.flatMap((chapter) =>
  chapter.subchapters ? chapter.subchapters.flatMap((sub) => sub.tasks) : (chapter.tasks ?? []),
)

export const totalTaskCount = allTasks.length
