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
}

export const THEMES: ThemeDef[] = [
  // — Sombres —
  { id: 'one-dark', label: 'One Dark', sombre: true, bg: '#282c34', fg: '#abb2bf', barre: '#21252b', commentaire: '#7f848e', motCle: '#c678dd', chaine: '#98c379', nombre: '#d19a66', fonction: '#61afef', type: '#e5c07b', variable: '#e06c75', balise: '#e06c75', attribut: '#d19a66' },
  { id: 'monokai', label: 'Monokai', sombre: true, bg: '#272822', fg: '#f8f8f2', barre: '#1e1f1c', commentaire: '#88846f', motCle: '#f92672', chaine: '#e6db74', nombre: '#ae81ff', fonction: '#a6e22e', type: '#66d9ef', variable: '#fd971f', balise: '#f92672', attribut: '#a6e22e' },
  { id: 'dracula', label: 'Dracula', sombre: true, bg: '#282a36', fg: '#f8f8f2', barre: '#21222c', commentaire: '#7082b6', motCle: '#ff79c6', chaine: '#f1fa8c', nombre: '#bd93f9', fonction: '#50fa7b', type: '#8be9fd', variable: '#ffb86c', balise: '#ff79c6', attribut: '#50fa7b' },
  { id: 'github-dark', label: 'GitHub Dark', sombre: true, bg: '#0d1117', fg: '#c9d1d9', barre: '#161b22', commentaire: '#8b949e', motCle: '#ff7b72', chaine: '#a5d6ff', nombre: '#79c0ff', fonction: '#d2a8ff', type: '#ffa657', variable: '#ffa657', balise: '#7ee787', attribut: '#79c0ff' },
  { id: 'nord', label: 'Nord', sombre: true, bg: '#2e3440', fg: '#d8dee9', barre: '#272c36', commentaire: '#7b88a1', motCle: '#81a1c1', chaine: '#a3be8c', nombre: '#b48ead', fonction: '#88c0d0', type: '#8fbcbb', variable: '#d8dee9', balise: '#81a1c1', attribut: '#8fbcbb' },
  { id: 'night-owl', label: 'Night Owl', sombre: true, bg: '#011627', fg: '#d6deeb', barre: '#010e1a', commentaire: '#637777', motCle: '#c792ea', chaine: '#ecc48d', nombre: '#f78c6c', fonction: '#82aaff', type: '#ffcb8b', variable: '#addb67', balise: '#7fdbca', attribut: '#addb67' },
  { id: 'solarized-dark', label: 'Solarized Dark', sombre: true, bg: '#002b36', fg: '#93a1a1', barre: '#00212b', commentaire: '#657b83', motCle: '#859900', chaine: '#2aa198', nombre: '#d33682', fonction: '#268bd2', type: '#b58900', variable: '#cb4b16', balise: '#268bd2', attribut: '#93a1a1' },
  { id: 'tokyo-night', label: 'Tokyo Night', sombre: true, bg: '#1a1b26', fg: '#a9b1d6', barre: '#16161e', commentaire: '#6b739e', motCle: '#bb9af7', chaine: '#9ece6a', nombre: '#ff9e64', fonction: '#7aa2f7', type: '#2ac3de', variable: '#c0caf5', balise: '#f7768e', attribut: '#e0af68' },
  // — Clairs (pensés pour l'impression papier : contrastes marqués, peu d'encre) —
  { id: 'github-light', label: 'GitHub Light', sombre: false, bg: '#ffffff', fg: '#1f2328', barre: '#f3f4f6', commentaire: '#59636e', motCle: '#cf222e', chaine: '#0a3069', nombre: '#0550ae', fonction: '#8250df', type: '#953800', variable: '#953800', balise: '#116329', attribut: '#0550ae' },
  { id: 'one-light', label: 'One Light', sombre: false, bg: '#fafafa', fg: '#383a42', barre: '#eceded', commentaire: '#696c77', motCle: '#a626a4', chaine: '#3f7f3c', nombre: '#8a5a00', fonction: '#2f61d4', type: '#9a6700', variable: '#c8372b', balise: '#c8372b', attribut: '#8a5a00' },
  { id: 'solarized-light', label: 'Solarized Light', sombre: false, bg: '#fdf6e3', fg: '#586e75', barre: '#eee8d5', commentaire: '#7a8b8e', motCle: '#738500', chaine: '#1f8a83', nombre: '#c02a73', fonction: '#1f77b4', type: '#9a7300', variable: '#c04410', balise: '#1f77b4', attribut: '#586e75' },
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
    '--ci-type': t.type,
    '--ci-var': t.variable,
    '--ci-tag': t.balise,
    '--ci-attr': t.attribut,
    '--ci-hl': t.sombre ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
  } as CSSProperties
}
