export interface CompetenceDefinition {
  id: string
  code: string
  label: string
}

/**
 * The 8 competencies of the DWWM referential (C1-C8). Purely self-declarative in
 * "Mon dossier": a checkbox ("validée pendant le projet") plus a free-text passage
 * the candidate writes themselves — never computed from the other tasks.
 */
export const competences: CompetenceDefinition[] = [
  { id: 'c1', code: 'C1', label: 'Installer et configurer son environnement de travail en fonction du projet' },
  { id: 'c2', code: 'C2', label: 'Maquetter des interfaces utilisateur' },
  { id: 'c3', code: 'C3', label: 'Réaliser des interfaces utilisateur statiques' },
  { id: 'c4', code: 'C4', label: 'Développer la partie dynamique des interfaces utilisateur' },
  { id: 'c5', code: 'C5', label: 'Mettre en place une base de données relationnelle' },
  { id: 'c6', code: 'C6', label: "Développer des composants d'accès aux données SQL et NoSQL" },
  { id: 'c7', code: 'C7', label: 'Développer des composants métier côté serveur' },
  { id: 'c8', code: 'C8', label: 'Documenter le déploiement d\'une application dynamique' },
]
