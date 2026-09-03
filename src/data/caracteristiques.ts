export interface Caracteristique {
  id: string
  label: string
  categorie: string
}

/**
 * Independent, non-exclusive oui/non characteristics of the candidate's project(s).
 * Drives which "Mon dossier" tasks are shown (see lib/activeTasks.ts): a task with
 * no tags is always shown; a tagged task is shown as soon as ANY one of its tags is
 * checked "oui" here. Not exclusive on purpose — a candidate who worked on several
 * projects during their training can check several characteristics that look
 * mutually exclusive at first glance (e.g. bdd_relationnelle AND bdd_non_relationnelle).
 *
 * Extensible: add a new characteristic here (with a category) and tag the relevant
 * tasks with its id — nothing else needs to change.
 */
export const caracteristiques: Caracteristique[] = [
  // Frontend
  { id: 'front_framework', categorie: 'Frontend', label: 'Avez-vous utilisé un framework/librairie front-end (React, Angular, Vue...) ?' },
  { id: 'front_vanilla', categorie: 'Frontend', label: 'Avez-vous développé une partie du front en JavaScript natif, sans framework ?' },

  // Backend
  { id: 'back_framework', categorie: 'Backend', label: 'Avez-vous utilisé un framework back-end (Symfony, Laravel, Spring Boot, Express, Django...) ?' },
  { id: 'back_natif', categorie: 'Backend', label: 'Avez-vous développé une partie du back-end sans framework ?' },

  // CMS
  { id: 'cms_wordpress', categorie: 'CMS', label: 'Avez-vous développé sur WordPress (thème, plugin, personnalisation) ?' },

  // Base de données
  { id: 'bdd_relationnelle', categorie: 'Base de données', label: 'Avez-vous conçu une base de données relationnelle (SQL) ?' },
  { id: 'bdd_non_relationnelle', categorie: 'Base de données', label: 'Avez-vous conçu une base de données non relationnelle (NoSQL) ?' },
  { id: 'bdd_aucune', categorie: 'Base de données', label: 'Votre projet fonctionne-t-il sans base de données propre (site statique, API tierce uniquement) ?' },
  { id: 'orm_odm', categorie: 'Base de données', label: 'Avez-vous utilisé un ORM/ODM (Doctrine, Eloquent, Hibernate, Mongoose...) ?' },

  // Mobile
  { id: 'mobile_natif', categorie: 'Mobile', label: 'Avez-vous développé une application mobile native ou hybride (React Native, Flutter...) ?' },

  // Comptes & accès
  { id: 'authentification', categorie: 'Comptes & accès', label: "Avez-vous créé ou géré une page/un système d'authentification (connexion/inscription) ?" },
  { id: 'roles_multiples', categorie: 'Comptes & accès', label: 'Votre projet gère-t-il plusieurs rôles utilisateurs différents (admin, utilisateur, autre) ?' },
  { id: 'securite_mdp', categorie: 'Comptes & accès', label: 'Avez-vous géré vous-même la sécurité des mots de passe (hashage, réinitialisation) ?' },
  { id: 'visiteur_public', categorie: 'Comptes & accès', label: 'Votre site a-t-il une partie accessible sans connexion (visiteur non enregistré) ?' },

  // API & intégrations
  { id: 'api_creee', categorie: 'API & intégrations', label: 'Avez-vous développé votre propre API (REST/GraphQL) ?' },
  { id: 'api_tierce', categorie: 'API & intégrations', label: 'Votre projet consomme-t-il une ou plusieurs API tierces externes ?' },
  { id: 'formulaires_publics', categorie: 'API & intégrations', label: 'Votre site propose-t-il des formulaires accessibles sans connexion (contact, inscription...) ?' },

  // Déploiement & qualité
  { id: 'deploiement_effectue', categorie: 'Déploiement & qualité', label: 'Avez-vous déployé votre projet en ligne (manuellement ou via une plateforme automatisée) ?' },
  { id: 'deploiement_manuel', categorie: 'Déploiement & qualité', label: 'Avez-vous géré vous-même le déploiement/hébergement (hors plateforme automatisée type Vercel/Netlify) ?' },
  { id: 'seo', categorie: 'Déploiement & qualité', label: 'Avez-vous mis en place ou allez-vous mettre en place des actions de référencement (SEO) sur votre site ?' },
  { id: 'tests_auto', categorie: 'Déploiement & qualité', label: 'Avez-vous réalisé ou allez-vous réaliser des tests automatisés sur votre projet ?' },
  { id: 'concurrence', categorie: 'Déploiement & qualité', label: 'Votre projet a-t-il des concurrents identifiables sur son marché ?' },

  // Identité visuelle
  { id: 'logo_personnalise', categorie: 'Identité visuelle', label: 'Avez-vous créé un logo personnalisé pour votre projet ?' },
]

/** Category display order for the "Personnaliser mon dossier" card. */
export const caracteristiqueCategories = [
  'Frontend',
  'Backend',
  'CMS',
  'Base de données',
  'Mobile',
  'Comptes & accès',
  'API & intégrations',
  'Déploiement & qualité',
  'Identité visuelle',
]
