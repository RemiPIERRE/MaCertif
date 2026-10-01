import type { DossierChapter, DossierTask } from '../types/dossier'

let counter = 0
const next = () => ++counter

interface TaskOptions {
  sectionTitle?: string
  minChars?: number
  tags?: string[]
  example?: string
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
    example: opts.example ?? null,
    tags: opts.tags,
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
    example: opts.example ?? null,
    tags: opts.tags,
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
    tags: opts.tags,
  }
}

// Reused across tasks that make sense whenever there's SOME kind of frontend,
// regardless of which — a framework, vanilla JS, or a WordPress theme aren't
// mutually exclusive with each other for a task like "how did you handle
// responsive design", so this list is deliberately reused verbatim.
const ANY_FRONTEND = ['front_framework', 'front_vanilla']
const ANY_BACKEND = ['back_framework', 'back_natif']
const ANY_BDD = ['bdd_relationnelle', 'bdd_non_relationnelle']
const ANY_ROLE_BEYOND_ADMIN = ['roles_multiples', 'authentification']
// Knowing one's hosting provider or HTTPS setup doesn't require having personally
// clicked "deploy" — it just requires at least one of the three forms of involvement.
const ANY_DEPLOIEMENT = ['deploiement_moi_meme', 'deploiement_participation', 'deploiement_documentation']
// For tasks about the mechanics of getting files onto the server — relevant to
// anyone who deployed or took part in deploying, but not to someone who only wrote
// documentation about a deployment they had no hand in.
const ANY_DEPLOIEMENT_ACTEUR = ['deploiement_moi_meme', 'deploiement_participation']

export const dossierChapters: DossierChapter[] = [
  {
    id: 'remerciements',
    number: 1,
    title: 'Remerciements',
    tasks: [
      textTask(
        'remerciements',
        "Rédigez vos remerciements : pensez par exemple à l'entreprise, à votre tuteur de stage, à vos collègues, à votre organisme de formation, à un formateur ou à votre famille.",
        { sectionTitle: 'Remerciements', minChars: 400 },
      ),
    ],
  },
  {
    id: 'introduction',
    number: 2,
    title: 'Introduction',
    tasks: [
      textTask(
        'introduction-personnelle',
        'Racontez votre parcours jusqu\'à ce projet : votre formation, vos motivations, ce qui vous a mené jusqu\'ici.',
        { sectionTitle: 'Introduction', minChars: 600 },
      ),
    ],
  },
  {
    id: 'entreprise',
    number: 3,
    title: "Présentation de l'entreprise",
    tasks: [
      textTask(
        'entreprise-presentation',
        "Présentez l'entreprise : son activité, ses chiffres-clés, son organisation hiérarchique, ainsi que le service ou le contexte dans lequel vous avez été accueilli en stage.",
        { sectionTitle: "Présentation de l'entreprise", minChars: 800 },
      ),
    ],
  },
  {
    id: 'poste',
    number: 4,
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
    number: 5,
    title: 'Cahier des charges',
    subchapters: [
      {
        id: 'cdc-presentation',
        code: '5.1',
        title: 'Présentation du projet',
        tasks: [
          textTask('cdc-historique', 'Expliquez la naissance du projet et son origine.', { sectionTitle: 'Origine du projet', minChars: 350 }),
          textTask('cdc-presentation-site', 'Présentez brièvement votre site internet.', { sectionTitle: 'Résumé du projet', minChars: 300 }),
        ],
      },
      {
        id: 'cdc-besoin',
        code: '5.2',
        title: 'Expression du besoin',
        tasks: [
          textTask('cdc-besoin', 'Expliquez le besoin auquel répond votre site et la manière dont il y répond.', { sectionTitle: 'Expression du besoin', minChars: 500 }),
        ],
      },
      {
        id: 'cdc-marche',
        code: '5.3',
        title: 'Étude de marché et positionnement',
        tasks: [
          textTask('cdc-marche', "Présentez le marché et le contexte dans lequel s'inscrit votre projet : domaine d'activité, positionnement, concurrence éventuelle.", { sectionTitle: 'Étude de marché', minChars: 550 }),
          textTask('cdc-concurrents', 'Décrivez vos principaux concurrents sur ce marché.', { sectionTitle: 'Benchmarking concurrentiel', tags: ['concurrence'], minChars: 550 }),
        ],
      },
      {
        id: 'cdc-cible',
        code: '5.4',
        title: 'Cible',
        tasks: [
          textTask('cdc-cible', 'Décrivez la population cible de votre site internet.', { sectionTitle: 'Cible', minChars: 350 }),
        ],
      },
      {
        id: 'cdc-fonctionnalites',
        code: '5.5',
        title: 'Fonctionnalités et objectifs',
        tasks: [
          textTask('cdc-fonctionnalite', 'Présentez une fonctionnalité clé de votre site internet.', { sectionTitle: 'Fonctionnalité principale', minChars: 700 }),
          textTask('cdc-objectif-1', 'Présentez le premier objectif de votre site.', { sectionTitle: 'Objectifs du projet', minChars: 250 }),
          textTask('cdc-objectif-2', 'Présentez le second objectif de votre site.', { sectionTitle: 'Objectifs du projet (suite)', minChars: 250 }),
        ],
      },
      {
        id: 'cdc-roles',
        code: '5.6',
        title: 'Rôles et espace utilisateur',
        tasks: [
          textTask(
            'cdc-role-admin',
            "Décrivez, du point de vue de l'utilisateur final, ce que peut faire un administrateur sur votre site : les écrans auxquels il a accès et les actions qu'il peut réaliser (angle fonctionnel — le détail technique de l'implémentation est traité au chapitre 9).",
            { sectionTitle: 'Rôle administrateur', tags: ['authentification'], minChars: 350 },
          ),
          textTask(
            'cdc-role-user',
            "Décrivez, du point de vue de l'utilisateur final, ce que peuvent faire le ou les rôles utilisateurs sur votre site : écrans accessibles et actions possibles (angle fonctionnel — le détail technique est traité au chapitre 9).",
            { sectionTitle: 'Rôle utilisateur', tags: ANY_ROLE_BEYOND_ADMIN, minChars: 400 },
          ),
          textTask(
            'cdc-espace-utilisateur',
            "Décrivez l'espace utilisateur de votre site du point de vue de l'utilisateur final : ce qu'il y trouve et ce qu'il peut y faire.",
            { sectionTitle: 'Espace utilisateur', tags: ANY_ROLE_BEYOND_ADMIN, minChars: 350 },
          ),
        ],
      },
      {
        id: 'cdc-arborescence',
        code: '5.7',
        title: 'Arborescence',
        tasks: [
          imageTask('cdc-arbo-visiteur', 'Illustrez l\'arborescence du site pour un visiteur non enregistré.', { sectionTitle: 'Arborescence du visiteur', tags: ['visiteur_public'] }),
          imageTask('cdc-arbo-admin', "Illustrez l'arborescence du site pour l'administrateur.", { sectionTitle: "Arborescence de l'administrateur", tags: ['authentification'] }),
          imageTask('cdc-arbo-user', "Illustrez l'arborescence du site pour un utilisateur enregistré.", { sectionTitle: "Arborescence de l'utilisateur enregistré", tags: ANY_ROLE_BEYOND_ADMIN }),
        ],
      },
    ],
  },
  {
    id: 'outillage',
    number: 6,
    title: 'Outillage et conception graphique',
    subchapters: [
      {
        id: 'outillage-langages',
        code: '6.1',
        title: 'Outils front-end',
        tasks: [
          textTask('outil-ide', "Présentez l'IDE (environnement de développement) que vous avez utilisé.", { sectionTitle: 'IDE', minChars: 150 }),
          textTask('outil-html', 'Présentez le langage HTML et son rôle dans votre projet.', { sectionTitle: 'HTML', tags: ANY_FRONTEND, minChars: 200 }),
          textTask('outil-css', 'Présentez le langage CSS et son rôle dans votre projet.', { sectionTitle: 'CSS', tags: ANY_FRONTEND, minChars: 250 }),
          textTask('outil-js', 'Présentez le langage JavaScript (ou TypeScript) et son rôle dans votre projet.', { sectionTitle: 'JavaScript / TypeScript', tags: ANY_FRONTEND, minChars: 300 }),
          textTask('outil-frameworks', 'Présentez les frameworks, bibliothèques ou moteurs de templates front-end que vous avez utilisés (React, Vue, Twig...).', { sectionTitle: 'Frameworks front-end', tags: ['front_framework'], minChars: 400 }),
        ],
      },
      {
        id: 'outillage-maquettage',
        code: '6.2',
        title: 'Maquettage et interface',
        tasks: [
          textTask('maquettage-pages', 'Expliquez comment vous avez maquetté vos pages.', { sectionTitle: 'Maquettage', tags: ANY_FRONTEND, minChars: 400 }),
          textTask('maquettage-responsive', 'Expliquez comment vous avez géré le responsive (ordinateur, tablette, mobile).', { sectionTitle: 'Responsive design', tags: ANY_FRONTEND, minChars: 400 }),
          textTask(
            'maquettage-accessibilite',
            "Avez-vous pris en compte l'accessibilité (RGAA) dans la conception de vos interfaces ? Si oui, comment (contrastes, alternatives textuelles, navigation clavier...) ? Si non, pourquoi pas et serait-ce un axe d'amélioration ?",
            { sectionTitle: 'Accessibilité (RGAA)', minChars: 350 },
          ),
          textTask(
            'maquettage-eco-conception',
            "Avez-vous pris en compte des pratiques d'éco-conception (optimisation des images, réduction des requêtes, sobriété visuelle...) ? Si oui, lesquelles ?",
            { sectionTitle: 'Éco-conception', minChars: 300 },
          ),
        ],
      },
      {
        id: 'outillage-identite',
        code: '6.3',
        title: 'Identité visuelle',
        tasks: [
          textTask('identite-couleurs', 'Décrivez la palette de couleurs utilisée et vos choix.', { sectionTitle: 'Palette de couleurs', tags: ANY_FRONTEND, minChars: 300 }),
          textTask('identite-typo', 'Décrivez la typographie utilisée et vos choix.', { sectionTitle: 'Typographie', tags: ANY_FRONTEND, minChars: 250 }),
          textTask('identite-logo', "Décrivez votre logo et la manière dont vous l'avez créé.", { sectionTitle: 'Logo', tags: ['logo_personnalise'], minChars: 350 }),
        ],
      },
      {
        id: 'outillage-captures',
        code: '6.4',
        title: "Captures d'interface",
        tasks: [
          imageTask('capture-accueil', 'Illustrez la page d\'accueil de votre site.', { sectionTitle: "Page d'accueil", tags: ANY_FRONTEND }),
          imageTask('capture-connexion', 'Illustrez la page de connexion de votre site.', { sectionTitle: 'Page de connexion', tags: ['authentification'] }),
          imageTask('capture-smartphone', 'Illustrez le rendu de votre site sur smartphone.', { sectionTitle: 'Version mobile', tags: ANY_FRONTEND }),
        ],
      },
    ],
  },
  {
    id: 'langages-technologies',
    number: 7,
    title: 'Langages et technologies',
    tasks: [
      textTask('backend-frontend-langages', 'Présentez le ou les langages que vous avez utilisés côté frontend.', { sectionTitle: 'Langages frontend', tags: ANY_FRONTEND, minChars: 250 }),
      textTask('backend-langages', 'Présentez le ou les langages que vous avez utilisés côté backend.', { sectionTitle: 'Langages backend', minChars: 250 }),
    ],
  },
  {
    id: 'base-de-donnees',
    number: 8,
    title: 'Base de données',
    subchapters: [
      {
        id: 'bdd-technologies',
        code: '8.1',
        title: 'Technologies',
        tasks: [
          textTask('bdd-technologie', 'Présentez la technologie de base de données que vous avez utilisée.', { sectionTitle: 'Technologie de base de données', tags: ANY_BDD, minChars: 300 }),
          textTask('bdd-outil-admin', "Présentez l'outil d'administration de votre base de données.", { sectionTitle: "Outil d'administration", tags: ANY_BDD, minChars: 200 }),
        ],
      },
      {
        id: 'bdd-conception',
        code: '8.2',
        title: 'Conception (relationnelle)',
        tasks: [
          textTask('bdd-methodologie', 'Présentez votre méthodologie de conception de la base de données.', { sectionTitle: 'Méthodologie de conception', tags: ['bdd_relationnelle'], minChars: 450 }),
          textTask('bdd-entites', 'Listez et expliquez les entités et tables de votre base de données.', { sectionTitle: 'Entités et tables', tags: ['bdd_relationnelle'], minChars: 600 }),
          imageTask('bdd-schema', 'Illustrez le schéma MCD ou MPD de votre base de données.', { sectionTitle: 'Schéma de base de données', tags: ['bdd_relationnelle'] }),
          textTask(
            'bdd-sauvegarde',
            'Avez-vous mis en place une stratégie de sauvegarde et de restauration de votre base de données ? Décrivez comment.',
            { sectionTitle: 'Sauvegarde et restauration', tags: ['bdd_relationnelle'], minChars: 400 },
          ),
          textTask(
            'bdd-droits-acces',
            "Avez-vous créé des utilisateurs dédiés avec des droits d'accès spécifiques au niveau de la base de données (hors rôles applicatifs) ?",
            { sectionTitle: "Utilisateurs et droits d'accès (SGBD)", tags: ['bdd_relationnelle'], minChars: 350 },
          ),
        ],
      },
      {
        id: 'bdd-nosql',
        code: '8.3',
        title: 'Base de données non relationnelle',
        tasks: [
          textTask('bdd-nosql-technologie', 'Présentez la technologie de base de données NoSQL que vous avez utilisée.', { sectionTitle: 'Technologie de BDD NoSQL', tags: ['bdd_non_relationnelle'], minChars: 300 }),
          textTask('bdd-nosql-modele', 'Décrivez le modèle de documents ou de collections de votre base de données.', { sectionTitle: 'Modèle de documents / collections', tags: ['bdd_non_relationnelle'], minChars: 500 }),
          textTask('bdd-nosql-relations', 'Expliquez comment vous gérez les relations entre vos données : par référence ou par embedding.', { sectionTitle: 'Relations par référence ou embedding', tags: ['bdd_non_relationnelle'], minChars: 400 }),
          imageTask('bdd-nosql-schema', 'Illustrez un schéma de document représentatif de votre base de données.', { sectionTitle: 'Schéma de document représentatif', tags: ['bdd_non_relationnelle'] }),
        ],
      },
    ],
  },
  {
    id: 'framework',
    number: 9,
    title: 'Framework et architecture',
    subchapters: [
      {
        id: 'framework-vue-ensemble',
        code: '9.1',
        title: "Vue d'ensemble",
        tasks: [
          textTask('framework-architecture-generale', "Présentez de manière générale l'architecture technique de votre backend (sur quoi repose le site).", { sectionTitle: 'Architecture technique', tags: ANY_BACKEND, minChars: 550 }),
          textTask('framework-nom', 'Présentez le framework ou la bibliothèque backend que vous avez utilisé, et pourquoi ce choix.', { sectionTitle: 'Framework backend', tags: ['back_framework'], minChars: 300 }),
        ],
      },
      {
        id: 'framework-organisation',
        code: '9.2',
        title: 'Organisation des dossiers',
        tasks: [
          textTask(
            'framework-organisation-dossiers',
            "Présentez l'organisation des dossiers et fichiers de votre projet backend.",
            { sectionTitle: 'Organisation des dossiers', tags: ANY_BACKEND, minChars: 400 },
          ),
        ],
      },
      {
        id: 'framework-methodologie',
        code: '9.3',
        title: 'Environnement de travail et méthodologie',
        tasks: [
          textTask(
            'methodologie-travail',
            "Présentez la méthode de travail utilisée sur le projet (agile, sprints, Scrum, Kanban, autre) — ou expliquez pourquoi aucune méthode formalisée n'a été mise en place, si c'est le cas.",
            { sectionTitle: 'Méthode de travail', minChars: 400 },
          ),
          textTask(
            'methodologie-organisation',
            "Expliquez l'organisation du travail : avez-vous travaillé seul ou en équipe ? Quel outil de suivi de tâches avez-vous utilisé le cas échéant (Trello, Notion, Jira...) ?",
            { sectionTitle: 'Organisation du travail', minChars: 300 },
          ),
          textTask(
            'methodologie-git',
            'Présentez votre stratégie de versionnement Git : organisation des branches, fréquence et granularité de vos commits.',
            { sectionTitle: 'Stratégie de versionnement Git', minChars: 400 },
          ),
          textTask(
            'methodologie-conteneurisation',
            "Décrivez l'outil de conteneurisation utilisé (Docker ou équivalent) et son rôle dans votre projet (ex : reconstituer un environnement proche de la production).",
            { sectionTitle: 'Conteneurisation', tags: ['conteneurisation_utilisee'], minChars: 350 },
          ),
          textTask(
            'methodologie-qualite-code',
            "Décrivez l'outil de contrôle de qualité de code que vous avez utilisé (linter, SonarLint, ESLint...) et ce qu'il contrôle (style, bonnes pratiques, bugs potentiels).",
            { sectionTitle: 'Contrôle de qualité de code', tags: ['qualite_code_outil'], minChars: 300 },
          ),
          textTask(
            'methodologie-transfert-fichiers',
            "Décrivez le mode de transfert de fichiers utilisé vers votre hébergeur (SFTP, SCP, FTP, déploiement automatisé...).",
            { sectionTitle: 'Transfert de fichiers vers l\'hébergeur', tags: ANY_DEPLOIEMENT_ACTEUR, minChars: 250 },
          ),
        ],
      },
      {
        id: 'framework-roles',
        code: '9.4',
        title: 'Gestion des rôles utilisateurs',
        tasks: [
          textTask(
            'roles-admin',
            "Décrivez comment le rôle Administrateur est contrôlé techniquement dans le code : middleware de vérification des droits, structure en base de données, gestion de session (angle technique — l'angle fonctionnel, ce que l'administrateur peut faire à l'écran, est déjà couvert au chapitre 5.6).",
            { sectionTitle: 'Rôle Administrateur', tags: ['roles_multiples'], minChars: 450 },
          ),
          textTask(
            'roles-user',
            "Décrivez comment le rôle Utilisateur est contrôlé techniquement dans le code : middleware de vérification des droits, structure en base de données, gestion de session (angle technique — l'angle fonctionnel est déjà couvert au chapitre 5.6).",
            { sectionTitle: 'Rôle Utilisateur', tags: ['roles_multiples'], minChars: 450 },
          ),
          textTask(
            'roles-autres',
            "Présentez l'implémentation technique des autres rôles éventuels de votre projet : comment leurs permissions sont contrôlées dans le code (angle technique — l'angle fonctionnel est déjà couvert au chapitre 5.6).",
            { sectionTitle: 'Autres rôles', tags: ['roles_multiples'], minChars: 350 },
          ),
        ],
      },
    ],
  },
  {
    id: 'wordpress',
    number: 10,
    title: 'WordPress',
    tasks: [
      textTask('wp-plugins', 'Présentez les plugins que vous avez utilisés ou développés pour votre projet WordPress.', { sectionTitle: 'Plugins utilisés / développés', tags: ['cms_wordpress'], minChars: 350 }),
      textTask('wp-securite', 'Expliquez les mesures de sécurité spécifiques à WordPress que vous avez mises en place (mises à jour, hardening).', { sectionTitle: 'Sécurité spécifique WordPress', tags: ['cms_wordpress'], minChars: 350 }),
      textTask('wp-roles', 'Présentez la gestion des rôles et permissions sur votre site WordPress (rôles natifs ou personnalisés).', { sectionTitle: 'Rôles et permissions WordPress', tags: ['cms_wordpress'], minChars: 300 }),
      textTask('wp-personnalisation', 'Décrivez la personnalisation du thème et du front-end de votre site WordPress.', { sectionTitle: 'Personnalisation du thème / front-end', tags: ['cms_wordpress'], minChars: 350 }),
      textTask('wp-cpt', 'Présentez les Custom Post Types (CPT) que vous avez créés pour votre projet.', { sectionTitle: 'Custom Post Types (CPT)', tags: ['cms_wordpress'], minChars: 350 }),
    ],
  },
  {
    id: 'extraits-code',
    number: 11,
    title: 'Extraits de code',
    subchapters: [
      {
        id: 'code-frontend',
        code: '11.1',
        title: 'Frontend',
        tasks: [
          imageTask('code-capture-frontend', 'Illustrez un extrait de code frontend intéressant depuis votre IDE.', { sectionTitle: 'Extrait de code frontend', tags: ANY_FRONTEND }),
          textTask('code-explication-frontend', 'Expliquez le fonctionnement du code frontend présenté.', { sectionTitle: 'Explication du code frontend', tags: ANY_FRONTEND, minChars: 400 }),
        ],
      },
      {
        id: 'code-backend',
        code: '11.2',
        title: 'Backend',
        tasks: [
          imageTask('code-capture-backend', 'Illustrez un extrait de code backend intéressant depuis votre IDE.', { sectionTitle: 'Extrait de code backend', tags: ANY_BACKEND }),
          textTask('code-explication-backend', 'Expliquez le fonctionnement du code backend présenté.', { sectionTitle: 'Explication du code backend', tags: ANY_BACKEND, minChars: 400 }),
        ],
      },
    ],
  },
  {
    id: 'securite',
    number: 12,
    title: 'Sécurité',
    subchapters: [
      {
        id: 'securite-authentification',
        code: '12.1',
        title: 'Authentification et contrôle d\'accès',
        tasks: [
          textTask('securite-auth-hash', "Expliquez comment l'authentification est sécurisée : stockage et hashage des mots de passe (bcrypt, Argon2...).", { sectionTitle: 'Sécurisation des mots de passe', tags: ['securite_mdp'], minChars: 350 }),
          textTask('securite-controle-acces', "Expliquez comment votre application empêche un utilisateur non autorisé d'accéder à une route ou une action réservée à un autre rôle.", { sectionTitle: 'Contrôle d\'accès par rôle', tags: ['authentification', 'roles_multiples'], minChars: 400 }),
          imageTask('code-capture-reset', 'Illustrez le code de réinitialisation du mot de passe depuis votre IDE.', { sectionTitle: 'Extrait de code : réinitialisation du mot de passe', tags: ['securite_mdp'] }),
          textTask('code-explication-reset', 'Expliquez le fonctionnement de la réinitialisation du mot de passe.', { sectionTitle: 'Fonctionnement de la réinitialisation du mot de passe', tags: ['securite_mdp'], minChars: 350 }),
        ],
      },
      {
        id: 'securite-donnees',
        code: '12.2',
        title: 'Protection des données et des échanges',
        tasks: [
          textTask('securite-validation-donnees', 'Expliquez les contrôles de validation des données mis en place côté client et côté serveur, et pourquoi les deux sont nécessaires.', { sectionTitle: 'Validation des données', minChars: 400 }),
          textTask('securite-antispam', 'Expliquez comment vous protégez vos formulaires publics contre le spam (captcha, honeypot, limitation de fréquence...).', { sectionTitle: 'Protection anti-spam', tags: ['formulaires_publics'], minChars: 300 }),
          textTask('https', "Expliquez ce qu'est le protocole HTTPS et comment vous l'avez mis en place.", { sectionTitle: 'Sécurisation HTTPS', tags: ANY_DEPLOIEMENT, minChars: 350 }),
          textTask('securite-api-externe', "Expliquez comment vous protégez l'accès aux services externes que vous utilisez (clés API non exposées côté client).", { sectionTitle: 'Protection des accès externes', tags: ['api_tierce'], minChars: 300 }),
          textTask(
            'securite-rgpd',
            "Votre projet met-il en place des mentions légales / une politique de confidentialité liées au RGPD ? Si oui, lesquelles ? Si non, le projet traite-t-il réellement des données personnelles, et pourquoi ce point n'a pas été traité ?",
            { sectionTitle: 'Mentions légales et RGPD', minChars: 400 },
          ),
        ],
      },
    ],
  },
  {
    id: 'seo-hebergement',
    number: 13,
    title: 'SEO et hébergement',
    tasks: [
      textTask('seo-definition', "Expliquez ce qu'est le SEO et ses bénéfices pour votre projet.", { sectionTitle: 'Le SEO et ses bénéfices', tags: ['seo'], minChars: 350 }),
      textTask('seo-mise-en-place', 'Expliquez comment vous avez mis en place le SEO sur votre projet.', { sectionTitle: 'Mise en place du SEO', tags: ['seo'], minChars: 350 }),
      textTask('hebergeur', 'Présentez l\'hébergeur utilisé et son historique en quelques mots.', { sectionTitle: 'Hébergement', tags: ANY_DEPLOIEMENT, minChars: 200 }),
      textTask(
        'deploiement-moi-meme',
        "Expliquez comment vous avez déployé l'application : étapes suivies, hébergeur choisi, configuration réalisée.",
        { sectionTitle: "Déploiement réalisé par mes soins", tags: ['deploiement_moi_meme'], minChars: 500 },
      ),
      textTask(
        'deploiement-participation',
        "Expliquez comment votre application est déployée (fonctionnement du déploiement, même si vous n'étiez pas seul·e aux manettes).",
        { sectionTitle: 'Fonctionnement du déploiement', tags: ['deploiement_participation'], minChars: 400 },
      ),
      textTask(
        'deploiement-documentation',
        'Présentez la documentation que vous avez créée sur le déploiement : son existence, sa structure, à qui elle s\'adresse.',
        { sectionTitle: 'Documentation du déploiement', tags: ['deploiement_documentation'], minChars: 350 },
      ),
    ],
  },
  {
    id: 'developpement-dynamique',
    number: 14,
    title: 'Développement dynamique et gestion de contenu',
    tasks: [
      textTask('dev-dynamique', 'Expliquez comment vous avez développé la partie dynamique du site.', { sectionTitle: 'Développement dynamique', minChars: 500 }),
      textTask('dev-gestion-contenu', 'Expliquez ce que vous avez mis en place pour gérer le contenu du site.', { sectionTitle: 'Gestion de contenu', minChars: 450 }),
      textTask('dev-acces-donnees', "Expliquez comment vous avez mis en place et utilisé les composants d'accès aux données.", { sectionTitle: 'Accès aux données', tags: [...ANY_BDD, 'api_creee'], minChars: 500 }),
      textTask('api-documentation', 'Présentez la documentation de votre API : principaux points d\'accès, formats de requêtes et de réponses.', { sectionTitle: "Documentation de l'API", tags: ['api_creee'], minChars: 500 }),
      textTask('dev-methode-backend', 'Présentez votre méthode de développement de la partie backend.', { sectionTitle: 'Méthode de développement backend', tags: ANY_BACKEND, minChars: 350 }),
      textTask('dev-backend-contenu', 'Expliquez comment vous avez conçu la partie backend de gestion de contenu.', { sectionTitle: 'Backend de gestion de contenu', tags: ANY_BACKEND, minChars: 450 }),
    ],
  },
  {
    id: 'tests',
    number: 15,
    title: 'Tests',
    tasks: [
      textTask('tests-utilisateurs', 'Expliquez en quoi consistent vos tests utilisateurs et comment vous les avez menés.', { sectionTitle: 'Tests utilisateurs', minChars: 450 }),
      textTask('tests-integrite', "Expliquez comment vous avez vérifié l'intégrité des données enregistrées.", { sectionTitle: "Tests d'intégrité des données", tags: ['tests_auto'], minChars: 350 }),
      textTask('tests-injections', 'Présentez les tests menés contre les injections et leurs résultats.', { sectionTitle: "Tests d'injection", tags: ['tests_auto'], minChars: 350 }),
      textTask('tests-responsive', 'Expliquez comment vous avez testé le responsive de votre site.', { sectionTitle: 'Tests de responsive design', tags: ANY_FRONTEND, minChars: 300 }),
    ],
  },
  {
    id: 'veille',
    number: 16,
    title: 'Veille technologique',
    tasks: [
      textTask(
        'veille-sites',
        "Présentez vos sources de veille en sécurité informatique, puis précisez si des vulnérabilités ou failles ont été identifiées pendant le projet et comment elles ont été corrigées — ou, à défaut, mentionnez explicitement qu'aucune vulnérabilité notable n'a été rencontrée.",
        {
          sectionTitle: 'Veille de sécurité informatique',
          minChars: 550,
          example:
            "Exemple : « Je suis régulièrement le blog de l'OWASP et le flux CVE de mon framework. Pendant le projet, l'audit avec [outil] a révélé une faille d'injection SQL sur le formulaire de recherche, corrigée en passant aux requêtes préparées. Aucune autre vulnérabilité notable n'a été identifiée. »",
        },
      ),
    ],
  },
  {
    id: 'difficultes-anglais',
    number: 17,
    title: 'Difficultés rencontrées et anglais technique',
    subchapters: [
      {
        id: 'difficultes-blocage',
        code: '17.1',
        title: 'Le blocage',
        tasks: [
          textTask('blocage-situation', 'Décrivez une situation de travail ayant nécessité une recherche approfondie.', { sectionTitle: 'Une situation de blocage', minChars: 550 }),
        ],
      },
      {
        id: 'difficultes-anglais-ressource',
        code: '17.2',
        title: 'Ressource anglophone',
        tasks: [
          freeTextTask('anglais-extrait', 'Citez un extrait en anglais issu de vos recherches.', { sectionTitle: 'Extrait en anglais' }),
          // A fixed minChars can't track the length of anglais-extrait (a dynamic
          // minimum would need this static catalog to read another task's live
          // answer, which the current single-task model doesn't support) — 500 is
          // a reasonable middle ground for a typical excerpt length.
          textTask('anglais-traduction', "Traduisez cet extrait en français (soignez l'orthographe).", {
            sectionTitle: 'Traduction en français',
            minChars: 500,
          }),
        ],
      },
    ],
  },
  {
    id: 'valorisation',
    number: 18,
    title: 'Valorisation',
    tasks: [
      textTask('valorisation-elements', 'Mettez en avant les éléments développés, si possible non techniques.', { sectionTitle: 'Valorisation du projet', minChars: 450 }),
      imageTask('valorisation-retroplanning', 'Illustrez le rétro-planning de développement de votre projet.', { sectionTitle: 'Rétro-planning' }),
    ],
  },
  {
    id: 'perspectives',
    number: 19,
    title: 'Perspectives',
    tasks: [
      textTask('perspectives-evolution', "Décrivez les perspectives d'évolution : nouvelles opportunités, travail restant, fonctionnalités à venir.", { sectionTitle: 'Perspectives et évolutions futures', minChars: 450 }),
    ],
  },
]

export const allTasks: DossierTask[] = dossierChapters.flatMap((chapter) =>
  chapter.subchapters ? chapter.subchapters.flatMap((sub) => sub.tasks) : (chapter.tasks ?? []),
)

export const totalTaskCount = allTasks.length
