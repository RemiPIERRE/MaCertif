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
        "Rédigez vos remerciements : pensez par exemple à l'entreprise, à votre tuteur de stage, à vos collègues, à votre organisme de formation, à un formateur ou à votre famille.",
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
        "Présentez l'entreprise : son activité, ses chiffres-clés, son organisation hiérarchique, ainsi que le service ou le contexte dans lequel vous avez été accueilli en stage.",
        { sectionTitle: "Présentation de l'entreprise", minChars: 900 },
      ),
    ],
  },
  {
    id: 'poste',
    number: 3,
    title: "Présentation du poste et de l'environnement technique",
    tasks: [
      textTask(
        'poste-presentation',
        "Présentez votre poste : l'équipe, le contexte et les contraintes du projet, vos méthodes de travail, et un aperçu rapide de l'environnement technique (le détail viendra plus loin).",
        { sectionTitle: "Présentation du poste et de l'environnement technique", minChars: 700 },
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
          textTask('cdc-historique', 'Expliquez la naissance du projet et son origine.', { sectionTitle: 'Origine du projet' }),
          textTask('cdc-presentation-site', 'Présentez brièvement votre site internet.', { sectionTitle: 'Résumé du projet' }),
        ],
      },
      {
        id: 'cdc-besoin',
        code: '4.2',
        title: 'Expression du besoin',
        tasks: [
          textTask('cdc-besoin', 'Expliquez le besoin auquel répond votre site et la manière dont il y répond.', { sectionTitle: 'Expression du besoin' }),
        ],
      },
      {
        id: 'cdc-marche',
        code: '4.3',
        title: 'Étude de marché et benchmarking',
        tasks: [
          textTask('cdc-marche', "Présentez le marché et le domaine d'activité de votre projet, et donnez votre avis sur la présence de concurrents.", { sectionTitle: 'Étude de marché' }),
          textTask('cdc-concurrents', 'Décrivez vos principaux concurrents sur ce marché.', { sectionTitle: 'Benchmarking concurrentiel' }),
        ],
      },
      {
        id: 'cdc-cible',
        code: '4.4',
        title: 'Cible',
        tasks: [
          textTask('cdc-cible', 'Décrivez la population cible de votre site internet.', { sectionTitle: 'Cible' }),
        ],
      },
      {
        id: 'cdc-fonctionnalites',
        code: '4.5',
        title: 'Fonctionnalités et objectifs',
        tasks: [
          textTask('cdc-fonctionnalite', 'Présentez une fonctionnalité clé de votre site internet.', { sectionTitle: 'Fonctionnalités principales' }),
          textTask('cdc-objectif-1', 'Présentez le premier objectif de votre site.', { sectionTitle: 'Objectifs du projet' }),
          textTask('cdc-objectif-2', 'Présentez le second objectif de votre site.', { sectionTitle: 'Objectifs du projet (suite)' }),
        ],
      },
      {
        id: 'cdc-roles',
        code: '4.6',
        title: 'Rôles et espace utilisateur',
        tasks: [
          textTask('cdc-role-admin', "Expliquez le rôle et les permissions de l'administrateur sur votre site.", { sectionTitle: 'Rôle administrateur', conditionalOn: 'auth' }),
          textTask('cdc-role-user', "Expliquez le rôle de l'utilisateur et ce qu'il peut faire sur votre site.", { sectionTitle: 'Rôle utilisateur', conditionalOn: 'auth' }),
          textTask('cdc-espace-utilisateur', "Décrivez l'espace utilisateur de votre site.", { sectionTitle: 'Espace utilisateur', conditionalOn: 'auth' }),
        ],
      },
      {
        id: 'cdc-arborescence',
        code: '4.7',
        title: 'Arborescence',
        tasks: [
          imageTask('cdc-arbo-visiteur', 'Illustrez l\'arborescence du site pour un visiteur non enregistré.', { sectionTitle: 'Arborescence du visiteur' }),
          imageTask('cdc-arbo-admin', "Illustrez l'arborescence du site pour l'administrateur.", { sectionTitle: "Arborescence de l'administrateur", conditionalOn: 'auth' }),
          imageTask('cdc-arbo-user', "Illustrez l'arborescence du site pour un utilisateur enregistré.", { sectionTitle: "Arborescence de l'utilisateur enregistré", conditionalOn: 'auth' }),
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
          textTask('outil-ide', "Présentez l'IDE (environnement de développement) que vous avez utilisé.", { sectionTitle: 'IDE' }),
          textTask('outil-html', 'Présentez le langage HTML et son rôle dans votre projet.', { sectionTitle: 'HTML' }),
          textTask('outil-css', 'Présentez le langage CSS et son rôle dans votre projet.', { sectionTitle: 'CSS' }),
          textTask('outil-js', 'Présentez le langage JavaScript et son rôle dans votre projet.', { sectionTitle: 'JavaScript' }),
          textTask('outil-frameworks', 'Présentez les frameworks ou bibliothèques front-end que vous avez utilisés.', { sectionTitle: 'Frameworks front-end' }),
        ],
      },
      {
        id: 'outillage-maquettage',
        code: '5.2',
        title: 'Maquettage et interface',
        tasks: [
          textTask('maquettage-pages', 'Expliquez comment vous avez maquetté vos pages.', { sectionTitle: 'Maquettage', conditionalOn: 'maquettage' }),
          textTask('maquettage-responsive', 'Expliquez comment vous avez géré le responsive (ordinateur, tablette, mobile).', { sectionTitle: 'Responsive design' }),
        ],
      },
      {
        id: 'outillage-identite',
        code: '5.3',
        title: 'Identité visuelle',
        tasks: [
          textTask('identite-couleurs', 'Décrivez la palette de couleurs utilisée et vos choix.', { sectionTitle: 'Palette de couleurs' }),
          textTask('identite-typo', 'Décrivez la typographie utilisée et vos choix.', { sectionTitle: 'Typographie' }),
          textTask('identite-logo', "Décrivez votre logo et la manière dont vous l'avez créé.", { sectionTitle: 'Logo', conditionalOn: 'logo' }),
        ],
      },
      {
        id: 'outillage-captures',
        code: '5.4',
        title: "Captures d'interface",
        tasks: [
          imageTask('capture-accueil', 'Illustrez la page d\'accueil de votre site.', { sectionTitle: "Page d'accueil" }),
          imageTask('capture-connexion', 'Illustrez la page de connexion de votre site.', { sectionTitle: 'Page de connexion', conditionalOn: 'auth' }),
          imageTask('capture-smartphone', 'Illustrez le rendu de votre site sur smartphone.', { sectionTitle: 'Version mobile' }),
        ],
      },
    ],
  },
  {
    id: 'introduction-backend',
    number: 6,
    title: 'Introduction back-end',
    tasks: [
      textTask('backend-frontend-langages', 'Présentez le ou les langages que vous avez utilisés côté frontend.', { sectionTitle: 'Langages frontend' }),
      textTask('backend-langages', 'Présentez le ou les langages que vous avez utilisés côté backend.', { sectionTitle: 'Langages backend' }),
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
          textTask('bdd-technologie', 'Présentez la technologie de base de données que vous avez utilisée.', { sectionTitle: 'Technologie de base de données', conditionalOn: 'bdd' }),
          textTask('bdd-outil-admin', "Présentez l'outil d'administration de votre base de données.", { sectionTitle: "Outil d'administration", conditionalOn: 'bdd' }),
        ],
      },
      {
        id: 'bdd-conception',
        code: '7.2',
        title: 'Conception',
        tasks: [
          textTask('bdd-methodologie', 'Présentez votre méthodologie de conception de la base de données.', { sectionTitle: 'Méthodologie de conception', conditionalOn: 'bdd' }),
          textTask('bdd-entites', 'Listez et expliquez les entités et tables de votre base de données.', { sectionTitle: 'Entités et tables', conditionalOn: 'bdd' }),
          imageTask('bdd-schema', 'Illustrez le schéma MCD ou MPD de votre base de données.', { sectionTitle: 'Schéma de base de données', conditionalOn: 'bdd' }),
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
          textTask('framework-architecture-generale', "Présentez de manière générale l'architecture technique de votre backend (sur quoi repose le site).", { sectionTitle: 'Architecture technique' }),
          textTask('framework-nom', 'Présentez le framework ou la bibliothèque backend que vous avez utilisé, et pourquoi ce choix.', { sectionTitle: 'Framework backend' }),
        ],
      },
      {
        id: 'framework-organisation',
        code: '8.2',
        title: 'Organisation des dossiers',
        tasks: [
          textTask(
            'framework-organisation-dossiers',
            "Présentez l'organisation des dossiers et fichiers de votre projet backend.",
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
          imageTask('code-capture-frontend', 'Illustrez un extrait de code frontend intéressant depuis votre IDE.', { sectionTitle: 'Extrait de code frontend' }),
          textTask('code-explication-frontend', 'Expliquez le fonctionnement du code frontend présenté.', { sectionTitle: 'Explication du code frontend' }),
        ],
      },
      {
        id: 'code-backend',
        code: '9.2',
        title: 'Backend',
        tasks: [
          imageTask('code-capture-backend', 'Illustrez un extrait de code backend intéressant depuis votre IDE.', { sectionTitle: 'Extrait de code backend' }),
          textTask('code-explication-backend', 'Expliquez le fonctionnement du code backend présenté.', { sectionTitle: 'Explication du code backend' }),
        ],
      },
      {
        id: 'code-securite',
        code: '9.3',
        title: 'Sécurité des mots de passe',
        tasks: [
          imageTask('code-capture-reset', 'Illustrez le code de réinitialisation du mot de passe depuis votre IDE.', { sectionTitle: 'Extrait de code : réinitialisation du mot de passe', conditionalOn: 'auth' }),
          textTask('code-explication-reset', 'Expliquez le fonctionnement de la réinitialisation du mot de passe.', { sectionTitle: 'Fonctionnement de la réinitialisation du mot de passe', conditionalOn: 'auth' }),
        ],
      },
    ],
  },
  {
    id: 'seo-hebergement',
    number: 10,
    title: 'SEO et hébergement',
    tasks: [
      textTask('seo-definition', "Expliquez ce qu'est le SEO et ses bénéfices pour votre projet.", { sectionTitle: 'Le SEO et ses bénéfices', conditionalOn: 'seo' }),
      textTask('seo-mise-en-place', 'Expliquez comment vous avez mis en place le SEO sur votre projet.', { sectionTitle: 'Mise en place du SEO', conditionalOn: 'seo' }),
      textTask('hebergeur', 'Présentez l\'hébergeur utilisé et son historique en quelques mots.', { sectionTitle: 'Hébergement', conditionalOn: 'deploiement' }),
      textTask('https', "Expliquez ce qu'est le protocole HTTPS et comment vous l'avez mis en place.", { sectionTitle: 'Sécurisation HTTPS', conditionalOn: 'deploiement' }),
    ],
  },
  {
    id: 'developpement-dynamique',
    number: 11,
    title: 'Développement dynamique et gestion de contenu',
    tasks: [
      textTask('dev-dynamique', 'Expliquez comment vous avez développé la partie dynamique du site.', { sectionTitle: 'Développement dynamique' }),
      textTask('dev-gestion-contenu', 'Expliquez ce que vous avez mis en place pour gérer le contenu du site.', { sectionTitle: 'Gestion de contenu' }),
      textTask('dev-acces-donnees', "Expliquez comment vous avez mis en place et utilisé les composants d'accès aux données.", { sectionTitle: 'Accès aux données', conditionalOn: 'api' }),
      textTask('dev-methode-backend', 'Présentez votre méthode de développement de la partie backend.', { sectionTitle: 'Méthode de développement backend' }),
      textTask('dev-backend-contenu', 'Expliquez comment vous avez conçu la partie backend de gestion de contenu.', { sectionTitle: 'Backend de gestion de contenu' }),
    ],
  },
  {
    id: 'tests',
    number: 12,
    title: 'Tests',
    tasks: [
      textTask('tests-utilisateurs', 'Expliquez en quoi consistent vos tests utilisateurs et comment vous les avez menés.', { sectionTitle: 'Tests utilisateurs' }),
      textTask('tests-integrite', "Expliquez comment vous avez vérifié l'intégrité des données enregistrées.", { sectionTitle: "Tests d'intégrité des données", conditionalOn: 'testsAuto' }),
      textTask('tests-injections', 'Présentez les tests menés contre les injections et leurs résultats.', { sectionTitle: "Tests d'injection", conditionalOn: 'testsAuto' }),
      textTask('tests-responsive', 'Expliquez comment vous avez testé le responsive de votre site.', { sectionTitle: 'Tests de responsive design' }),
    ],
  },
  {
    id: 'veille',
    number: 13,
    title: 'Veille technologique',
    tasks: [
      textTask('veille-sites', 'Présentez des sites intéressants issus de votre veille en sécurité informatique.', { sectionTitle: 'Veille de sécurité informatique' }),
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
          textTask('blocage-situation', 'Décrivez une situation de travail ayant nécessité une recherche approfondie.', { sectionTitle: 'Une situation de blocage' }),
        ],
      },
      {
        id: 'difficultes-anglais-ressource',
        code: '14.2',
        title: 'Ressource anglophone',
        tasks: [
          freeTextTask('anglais-extrait', 'Citez un extrait en anglais issu de vos recherches.', { sectionTitle: 'Extrait en anglais' }),
          textTask('anglais-traduction', "Traduisez cet extrait en français (soignez l'orthographe).", {
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
      textTask('valorisation-elements', 'Mettez en avant les éléments développés, si possible non techniques.', { sectionTitle: 'Valorisation du projet' }),
      imageTask('valorisation-retroplanning', 'Illustrez le rétro-planning de développement de votre projet.', { sectionTitle: 'Rétro-planning' }),
    ],
  },
  {
    id: 'perspectives',
    number: 16,
    title: 'Perspectives',
    tasks: [
      textTask('perspectives-evolution', "Décrivez les perspectives d'évolution : nouvelles opportunités, travail restant, fonctionnalités à venir.", { sectionTitle: 'Perspectives et évolutions futures' }),
    ],
  },
]

export const allTasks: DossierTask[] = dossierChapters.flatMap((chapter) =>
  chapter.subchapters ? chapter.subchapters.flatMap((sub) => sub.tasks) : (chapter.tasks ?? []),
)

export const totalTaskCount = allTasks.length
