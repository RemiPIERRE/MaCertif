export interface QuestionnaireQuestion {
  id: string
  label: string
  helpText?: string
}

/**
 * Personalisation questionnaire: disables tasks that only make sense for some
 * stacks/projects. Answering "non" excludes the linked task(s) from the dossier,
 * Mon site and the progress calculation. Unanswered = treated as "oui" (shown).
 */
export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'seo',
    label: 'Avez-vous mis en place des actions de référencement (SEO) sur votre site ?',
  },
  {
    id: 'logo',
    label: 'Avez-vous créé un logo personnalisé pour votre projet ?',
  },
  {
    id: 'architectureDossiers',
    label:
      "Votre projet backend a-t-il une architecture de dossiers dédiée (ex : public / src / templates) ?",
    helpText: "Répondez « non » si votre stack n'a pas cette organisation (ex : MERN, Node seul).",
  },
]
