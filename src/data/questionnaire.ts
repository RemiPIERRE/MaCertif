export interface QuestionnaireOption {
  value: string
  label: string
}

export interface QuestionnaireQuestion {
  id: string
  label: string
  helpText?: string
  /** Presence turns this into a multi-choice question instead of a plain oui/non toggle. */
  options?: QuestionnaireOption[]
}

/**
 * Personalisation questionnaire: disables (or adapts) tasks that only make sense
 * for some stacks/projects. Unanswered = treated as active (nothing hides until
 * the user actively narrows it down).
 */
export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'hasFrontend',
    label: 'Votre projet propose-t-il une interface web dédiée (pages visibles par un utilisateur) ?',
    helpText: "Répondez « non » pour un projet 100% API/backend consommé par une application tierce.",
  },
  {
    id: 'hasVisiteurPublic',
    label: 'Votre site a-t-il une partie accessible sans connexion (visiteur non enregistré) ?',
    helpText: "Répondez « non » si l'accès est entièrement restreint dès la page d'accueil (intranet, outil interne).",
  },
  {
    id: 'roles',
    label: 'Quels rôles utilisateurs votre projet gère-t-il ?',
    options: [
      { value: 'admin-only', label: 'Administrateur seul' },
      { value: 'admin-user', label: 'Administrateur + utilisateur' },
      { value: 'multi-role', label: 'Plusieurs rôles' },
    ],
  },
  {
    id: 'surMesure',
    label: "Avez-vous développé votre projet sur-mesure (code métier propre), plutôt qu'avec un CMS clé-en-main (WordPress, etc.) ?",
    helpText: 'Répondez « non » si votre projet repose sur un CMS : les tâches sur le framework, l\'architecture de code et la conception de base de données ne s\'appliquent alors pas.',
  },
  {
    id: 'concurrence',
    label: 'Votre projet a-t-il des concurrents identifiables sur son marché ?',
    helpText: "Répondez « non » pour un projet sans marché concurrentiel (ex : site vitrine associatif).",
  },
  {
    id: 'html',
    label: 'Votre site repose-t-il sur du HTML classique (page web traditionnelle) ?',
  },
  {
    id: 'css',
    label: 'Utilisez-vous du CSS (ou un préprocesseur/framework CSS) pour la mise en forme ?',
  },
  {
    id: 'javascript',
    label: 'Utilisez-vous JavaScript ou TypeScript côté frontend ?',
  },
  {
    id: 'maquettage',
    label: 'Avez-vous fait ou allez-vous faire du maquettage pour votre projet ?',
  },
  {
    id: 'logo',
    label: 'Avez-vous créé ou allez-vous créer un logo personnalisé pour votre projet ?',
  },
  {
    id: 'bdd',
    label: 'Avez-vous conçu ou allez-vous concevoir une base de données pour votre projet ?',
  },
  {
    id: 'architectureDossiers',
    label: 'Votre projet backend a-t-il une architecture de dossiers dédiée (séparation vues / logique métier / modèles) ?',
    helpText: "Répondez « non » si votre stack n'a pas cette organisation (ex : MERN, Node seul).",
  },
  {
    id: 'auth',
    label: 'Avez-vous mis en place ou allez-vous mettre en place une authentification / gestion des utilisateurs ?',
  },
  {
    id: 'api',
    label: 'Avez-vous développé ou allez-vous développer une API pour votre projet ?',
  },
  {
    id: 'apiExterne',
    label: 'Votre projet appelle-t-il des services externes ou des API tierces (paiement, cartographie, météo...) ?',
  },
  {
    id: 'formulairesPublics',
    label: 'Votre site propose-t-il des formulaires accessibles sans connexion (contact, inscription...) ?',
  },
  {
    id: 'seo',
    label: 'Avez-vous mis en place ou allez-vous mettre en place des actions de référencement (SEO) sur votre site ?',
  },
  {
    id: 'testsAuto',
    label: 'Avez-vous réalisé ou allez-vous réaliser des tests automatisés sur votre projet ?',
  },
  {
    id: 'deploiement',
    label: 'Avez-vous déployé ou allez-vous déployer votre projet en ligne ?',
  },
]
