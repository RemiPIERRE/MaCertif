import type { CSSProperties } from 'react'

/** Palette d'un thème de coloration. Les couleurs sont appliquées via des variables CSS (voir code-image.css). */
export interface ThemeDef {
  id: string
  label: string
  sombre: boolean
  /** fond de la fenêtre / du bloc de code */
  bg: string
  fg: string
  /** barre de titre de la fenêtre */
  barre: string
  commentaire: string
  motCle: string
  chaine: string
  nombre: string
  fonction: string
  type: string
  variable: string
  balise: string
  attribut: string
  /**
   * Couleur d'un APPEL de fonction (`fetch(...)`), distincte d'une déclaration
   * (`function fetch() {}`) — Shiki/TextMate les distingue via l'ascendance du
   * token (`meta.function-call`), contrairement à highlight.js qui les
   * confondait. Par défaut (absent) : même couleur que `fonction`, comme le
   * font la plupart des thèmes VS Code. Certains thèmes (WebStorm) ne colorent
   * que la déclaration et laissent les appels en couleur de texte normale.
   */
  appelFonction?: string
  /**
   * Couleur d'un ACCÈS À UNE PROPRIÉTÉ (`obj.prop`), distincte d'une variable
   * ordinaire. Par défaut (absent) : même couleur que `variable`. Réutilisée
   * aussi pour les clés d'objet littéral (`{ method: ... }`).
   */
  propriete?: string
  /**
   * Couleur d'un appel de MÉTHODE (`res.json()`), distincte d'un appel de
   * fonction « nue » (`fetch()`) — ce sont le même scope TextMate, distingués
   * ici en repérant un « . » juste avant (voir shikiHighlight.ts). Par défaut
   * (absent) : même couleur que `appelFonction`.
   */
  methode?: string
  /**
   * Couleur d'un PARAMÈTRE de fonction/méthode, distincte d'une variable
   * ordinaire. Par défaut (absent) : même couleur que `variable`.
   */
  parametre?: string
  /**
   * Couleur du NOM d'une classe/interface à sa DÉCLARATION (`class Foo`,
   * `interface Bar`), distincte d'une RÉFÉRENCE à un type (`: Foo`, `extends
   * Foo`) qui garde la couleur `type`. Par défaut (absent) : même couleur que
   * `type`.
   */
  nomType?: string
}

export const THEMES: ThemeDef[] = [
  // — Sombres —
  { id: 'one-dark', label: 'One Dark', sombre: true, bg: '#282c34', fg: '#abb2bf', barre: '#21252b', commentaire: '#7f848e', motCle: '#c678dd', chaine: '#98c379', nombre: '#d19a66', fonction: '#61afef', type: '#e5c07b', variable: '#e06c75', balise: '#e06c75', attribut: '#d19a66' },
  { id: 'dracula', label: 'Dracula', sombre: true, bg: '#282a36', fg: '#f8f8f2', barre: '#21222c', commentaire: '#7082b6', motCle: '#ff79c6', chaine: '#f1fa8c', nombre: '#bd93f9', fonction: '#50fa7b', type: '#8be9fd', variable: '#ffb86c', balise: '#ff79c6', attribut: '#50fa7b' },
  { id: 'github-dark', label: 'GitHub Dark', sombre: true, bg: '#0d1117', fg: '#c9d1d9', barre: '#161b22', commentaire: '#8b949e', motCle: '#ff7b72', chaine: '#a5d6ff', nombre: '#79c0ff', fonction: '#d2a8ff', type: '#ffa657', variable: '#ffa657', balise: '#7ee787', attribut: '#79c0ff' },
  { id: 'night-owl', label: 'Night Owl', sombre: true, bg: '#011627', fg: '#d6deeb', barre: '#010e1a', commentaire: '#637777', motCle: '#c792ea', chaine: '#ecc48d', nombre: '#f78c6c', fonction: '#82aaff', type: '#ffcb8b', variable: '#addb67', balise: '#7fdbca', attribut: '#addb67' },
  // Couleurs reprises du vrai thème Shiki (node_modules/@shikijs/themes), pas d'une approximation à la main.
  { id: 'monokai', label: 'Monokai', sombre: true, bg: '#272822', fg: '#f8f8f2', barre: '#1e1f1a', commentaire: '#88846f', motCle: '#f92672', chaine: '#e6db74', nombre: '#ae81ff', fonction: '#a6e22e', type: '#66d9ef', variable: '#f8f8f2', balise: '#f92672', attribut: '#a6e22e' },
  { id: 'nord', label: 'Nord', sombre: true, bg: '#2e3440', fg: '#d8dee9', barre: '#272c36', commentaire: '#616e88', motCle: '#81a1c1', chaine: '#a3be8c', nombre: '#b48ead', fonction: '#88c0d0', type: '#8fbcbb', variable: '#d8dee9', balise: '#81a1c1', attribut: '#8fbcbb' },
  // — Clairs (pensés pour l'impression papier : contrastes marqués, peu d'encre) —
  { id: 'github-light', label: 'GitHub Light', sombre: false, bg: '#ffffff', fg: '#1f2328', barre: '#f3f4f6', commentaire: '#59636e', motCle: '#cf222e', chaine: '#0a3069', nombre: '#0550ae', fonction: '#8250df', type: '#953800', variable: '#953800', balise: '#116329', attribut: '#0550ae' },
  { id: 'one-light', label: 'One Light', sombre: false, bg: '#fafafa', fg: '#383a42', barre: '#eceded', commentaire: '#696c77', motCle: '#a626a4', chaine: '#3f7f3c', nombre: '#8a5a00', fonction: '#2f61d4', type: '#9a6700', variable: '#c8372b', balise: '#c8372b', attribut: '#8a5a00' },
  { id: 'solarized-light', label: 'Solarized Light', sombre: false, bg: '#fdf6e3', fg: '#657b83', barre: '#eee8d5', commentaire: '#93a1a1', motCle: '#859900', chaine: '#2aa198', nombre: '#d33682', fonction: '#268bd2', type: '#cb4b16', variable: '#657b83', balise: '#268bd2', attribut: '#93a1a1' },
  { id: 'catppuccin-latte', label: 'Catppuccin Latte', sombre: false, bg: '#eff1f5', fg: '#4c4f69', barre: '#e6e9ef', commentaire: '#7c7f93', motCle: '#fe640b', chaine: '#40a02b', nombre: '#fe640b', fonction: '#1e66f5', type: '#8839ef', variable: '#4c4f69', balise: '#8839ef', attribut: '#d20f39' },
  // Fidèle au schéma "Light" (Island Light) de WebStorm, couleurs reprises de l'export .icls fourni par l'utilisateur.
  // Vérifié au pixel sur une vraie capture : un appel de fonction « nue » (setErrors(...), navigate(...))
  // prend la MÊME couleur que la déclaration — pas de distinction appel/déclaration pour ce thème
  // (appelFonction n'est donc pas surchargé, il reprend "fonction" par défaut).
  {
    id: 'webstorm-light',
    label: 'Island Light',
    sombre: false,
    bg: '#ffffff',
    fg: '#080808',
    barre: '#f3f4f6',
    commentaire: '#8c8c8c',
    motCle: '#0033b3',
    chaine: '#067d17',
    nombre: '#1750eb',
    fonction: '#00627a',
    type: '#174be6',
    variable: '#2a8c7c',
    balise: '#0033b3',
    attribut: '#174ad4',
    propriete: '#871094',
    // Non trouvé dans l'export .icls (hérite du thème parent, non exporté) : estimé par
    // échantillonnage sur la capture fournie — à ajuster si besoin.
    methode: '#ad6339',
    // Confirmé sur la page Settings → Editor → Color Scheme → Language Defaults :
    // "paramètre" et "nom de classe/interface" ne sont PAS colorés (texte normal).
    parametre: '#080808',
    nomType: '#080808',
  },
]

export const THEME_PAR_DEFAUT = 'github-light'

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === THEME_PAR_DEFAUT)!
}

/** Variables CSS consommées par code-image.css */
export function themeVars(t: ThemeDef): CSSProperties {
  return {
    '--ci-bg': t.bg,
    '--ci-fg': t.fg,
    '--ci-barre': t.barre,
    '--ci-com': t.commentaire,
    '--ci-kw': t.motCle,
    '--ci-str': t.chaine,
    '--ci-num': t.nombre,
    '--ci-fn': t.fonction,
    '--ci-fn-call': t.appelFonction ?? t.fonction,
    '--ci-type': t.type,
    '--ci-var': t.variable,
    '--ci-prop': t.propriete ?? t.variable,
    '--ci-fn-call-method': t.methode ?? t.appelFonction ?? t.fonction,
    '--ci-param': t.parametre ?? t.variable,
    '--ci-type-name': t.nomType ?? t.type,
    '--ci-tag': t.balise,
    '--ci-attr': t.attribut,
    '--ci-hl': t.sombre ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
  } as CSSProperties
}
