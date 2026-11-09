import type { ReactNode } from 'react'

/** Les quatre couleurs proposées, dans l'ordre : jaune, rouge, bleu, vert. */
export const COULEURS_PRESET: ReadonlyArray<{ nom: string; couleur: string }> = [
  { nom: 'Jaune', couleur: '#eec643' },
  { nom: 'Rouge', couleur: '#d24f2f' },
  { nom: 'Bleu', couleur: '#3b82e0' },
  { nom: 'Vert', couleur: '#3f9a5a' },
]

interface Props {
  couleur: string | undefined
  onChange: (couleur: string | undefined) => void
  /** Boutons supplémentaires (pivoter…), après la palette. */
  children?: ReactNode
}

/**
 * Palette flottante affichée au-dessus d'une forme en édition : quatre pastilles (jaune, rouge,
 * bleu, vert), une cinquième pour une couleur libre, et « ↺ » pour revenir aux couleurs du thème.
 */
export function PaletteCouleur({ couleur, onChange, children }: Props) {
  const personnalisee = undefined !== couleur && !COULEURS_PRESET.some((c) => c.couleur.toLowerCase() === couleur.toLowerCase())
  return (
    <div className="schema-palette nodrag nopan" role="toolbar" aria-label="Couleur de la forme" onMouseDown={(e) => e.stopPropagation()}>
      {COULEURS_PRESET.map((c) => (
        <button
          key={c.nom}
          type="button"
          className={`schema-palette-pastille${couleur?.toLowerCase() === c.couleur.toLowerCase() ? ' is-active' : ''}`}
          style={{ background: c.couleur }}
          title={c.nom}
          aria-label={c.nom}
          onClick={() => onChange(c.couleur)}
        />
      ))}
      <label
        className={`schema-palette-pastille schema-palette-perso${personnalisee ? ' is-active' : ''}`}
        style={personnalisee ? { background: couleur } : undefined}
        title="Couleur personnalisée"
      >
        <input type="color" value={couleur && /^#[0-9a-fA-F]{6}$/.test(couleur) ? couleur : '#8b7cf8'} onChange={(e) => onChange(e.target.value)} aria-label="Couleur personnalisée" />
      </label>
      <button type="button" className="schema-palette-bouton" onClick={() => onChange(undefined)} disabled={undefined === couleur} title="Couleurs du thème" aria-label="Couleurs du thème">
        ↺
      </button>
      {children}
    </div>
  )
}
