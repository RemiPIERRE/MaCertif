/**
 * Modèle de données de l'onglet « Mes extraits de code ».
 *
 * Deux clés localStorage, toutes deux incluses dans l'export global MaCertif :
 *   - `code:extraits` : Extrait[]        (la bibliothèque)
 *   - `code:reglages` : Reglages         (réglages appliqués aux NOUVEAUX extraits)
 *
 * Aucune image n'est stockée : seuls le code et les réglages le sont, le PNG
 * se régénère à la demande.
 */

export const POLICES = ['jetbrains', 'fira', 'source'] as const
export type PoliceId = (typeof POLICES)[number]

export type Echelle = 1 | 2 | 3

export interface Reglages {
  /** 'auto' ou l'id d'un langage de lib/languages.ts */
  langage: string
  /** id d'un thème de lib/themes.ts */
  theme: string
  /** id d'un fond de lib/backgrounds.ts */
  fond: string
  police: PoliceId
  /** 10 à 24 px */
  taillePolice: number
  /** 8 à 96 px autour de la fenêtre */
  remplissage: number
  /** Titre affiché dans la barre de la fenêtre (ex. LoginController.php) */
  nomFichier: string
  numerosLignes: boolean
  /** Numéro affiché sur la première ligne (extrait venant du milieu d'un fichier) */
  premiereLigne: number
  /** Numéros affichés à mettre en évidence, ex. « 3-5, 9 » */
  lignesMisesEnAvant: string
  /**
   * Numéros à MASQUER à l'export, ex. « 10-45, 80-120 » (même format que
   * lignesMisesEnAvant). Les lignes visibles restantes gardent leur numéro
   * d'origine (pas de renumérotation) — utile pour coller un fichier entier et
   * n'en montrer qu'un extrait pertinent, sans que le code masqué soit jamais
   * récupérable par un copier-coller de l'image (contrairement au repliement
   * d'un éditeur classique, qui est purement visuel).
   */
  lignesMasquees: string
  /** Si faux, les lignes masquées disparaissent sans aucun repère visuel (numérotation qui saute directement). */
  afficherRepereMasquage: boolean
  fenetre: boolean
  ombre: boolean
  /** Largeur totale de l'image en px (300–1200) ou 'auto' */
  largeur: 'auto' | number
  echelle: Echelle
}

export interface Extrait {
  id: string
  nom: string
  /** Tâche du dossier à laquelle l'image est rattachée (nom du fichier + « visuel prêt »), ou null */
  tacheId: string | null
  code: string
  reglages: Reglages
  creeLe: string
  modifieLe: string
}

export interface TacheLiee {
  id: string
  label: string
}
