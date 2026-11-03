import type { Competence } from '../types'

export const COMPETENCES: Record<Competence, { titre: string; description: string }> = {
  C1: { titre: 'Environnement de travail', description: 'Installer et configurer son environnement' },
  C2: { titre: 'Maquettage', description: 'Maquetter des interfaces web et mobile' },
  C3: { titre: 'Interfaces statiques', description: 'HTML, CSS, responsive, accessibilité' },
  C4: { titre: 'Interfaces dynamiques', description: 'JavaScript, Angular, API, tests' },
  C5: { titre: 'Base relationnelle', description: 'Modélisation, SQL, intégrité, sauvegarde' },
  C6: { titre: 'Accès aux données', description: 'SQL avancé, NoSQL, ORM' },
  C7: { titre: 'Composants serveur', description: 'PHP, Symfony, Laravel, sécurité' },
  C8: { titre: 'Déploiement', description: 'Hébergement, CI/CD, documentation' },
}

const THEME_LABELS: Record<string, string> = {
  anglais: 'Anglais technique', git: 'Git', terminal: 'Terminal', ide: 'IDE et outils', environnement: 'Environnement et Docker',
  veille: 'Veille', methodes: 'Méthodes et gestion de projet', documentation: 'Documentation', 'ergonomie-poste': 'Poste de travail',
  entretien: "Questions d'entretien", 'ux-ui': 'UX et UI', wireframe: 'Wireframes et maquettes', outils: 'Outils de design',
  typo: 'Typographie', couleurs: 'Couleurs', ergonomie: 'Ergonomie', accessibilite: 'Accessibilité', prototype: 'Prototypage',
  charte: 'Charte graphique', conception: 'Conception', 'html-base': 'HTML', semantique: 'HTML sémantique', formulaires: 'Formulaires',
  medias: 'Médias', 'css-base': 'CSS', boite: 'Modèle de boîte', unites: 'Unités', positionnement: 'Positionnement',
  flexbox: 'Flexbox', grid: 'Grid', responsive: 'Responsive', animations: 'Animations', frameworks: 'Bootstrap et Tailwind',
  methodo: 'Méthodologie CSS', 'lecture-code': 'Lecture de code', 'js-base': 'JavaScript', dom: 'DOM et événements',
  async: 'Asynchrone', api: 'API et HTTP', validation: 'Validation', typescript: 'TypeScript', modules: 'Modules',
  outillage: 'Outillage npm', tests: 'Tests', angular: 'Angular', 'react-vue': 'React et Vue', algo: 'Algorithmique',
  modelisation: 'Modélisation', uml: 'UML', normalisation: 'Normalisation', ddl: 'SQL DDL', contraintes: 'Contraintes',
  types: 'Types de données', index: 'Index', transactions: 'Transactions', sauvegarde: 'Sauvegarde', migrations: 'Migrations',
  'securite-bdd': 'Sécurité de la base', 'jeux-essai': "Jeux d'essai", 'lecture-sql': 'Lecture de requêtes', concurrence: 'Concurrence',
  sgbd: 'SGBD', select: 'SELECT', agregats: 'Agrégats', jointures: 'Jointures', dml: 'INSERT, UPDATE, DELETE',
  'sous-requetes': 'Sous-requêtes et fenêtres', vues: 'Vues et triggers', 'securite-sql': 'Injection SQL', pdo: 'PDO',
  perf: 'Performance', nosql: 'NoSQL', 'json-sql': 'JSON en SQL', orm: 'ORM', 'sql-avance': 'SQL avancé',
  'nosql-avance': 'NoSQL avancé', 'orm-avance': 'ORM avancé', 'lecture-nosql': 'Lecture NoSQL', 'php-base': 'PHP',
  poo: 'Programmation objet', architecture: 'Architecture', http: 'HTTP et API REST', upload: 'Upload', mail: 'E-mail',
  logs: 'Logs', qualite: 'Qualité du code', symfony: 'Symfony', laravel: 'Laravel', comparaison: 'Frameworks comparés',
  owasp: 'OWASP', xss: 'XSS', csrf: 'CSRF', cookies: 'Cookies', crypto: 'Cryptographie', headers: 'En-têtes de sécurité',
  principes: 'Principes de sécurité', langages: 'Langages', patterns: 'Design patterns', 'lecture-php': 'Lecture de code PHP',
  'lecture-http': 'Codes HTTP en situation', hebergement: 'Hébergement', dns: 'DNS', reseau: 'Réseau', serveur: 'Serveur web',
  https: 'HTTPS', build: 'Build', cicd: 'CI/CD', deploiement: 'Déploiement', docker: 'Docker', seo: 'SEO',
  monitoring: 'Surveillance', maintenance: 'Maintenance',
}

export function themeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme.charAt(0).toUpperCase() + theme.slice(1).replace(/-/g, ' ')
}

/** Clé stable compétence+thème, utilisée pour les Set de sélection dans Reglages.themes. */
export function themeKey(competence: string, theme: string): string {
  return `${competence}|${theme}`
}
