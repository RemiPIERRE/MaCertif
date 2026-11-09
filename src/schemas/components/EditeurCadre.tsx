import { useState, type ReactNode, type RefObject } from 'react'
import { resoudreStyle, STYLE_LABELS, THEMES, type ElementStyle } from '../types'
import './merise.css'

interface Props {
  racineRef: RefObject<HTMLDivElement | null>
  /** Étiquette du champ nom : « Nom de la table », « Nom de l'entité »… */
  etiquetteNom: string
  placeholderNom: string
  nom: string
  onNom: (nom: string) => void
  style: Partial<ElementStyle> | undefined
  onStyle: (style: Partial<ElementStyle> | undefined) => void
  onClose: () => void
  /** Pied « + Ajouter » : absent = pas de pied (diagramme de séquence : l'ajout se fait dans la liste). */
  onAjouter?: () => void
  libelleAjout?: string
  children: ReactNode
  /** Remplace le champ « nom » de l'en-tête (ex. opérateur + garde d'un fragment). */
  champEntete?: ReactNode
  /** Boutons supplémentaires de l'en-tête, avant « Apparence » (ex. Supprimer). */
  actions?: ReactNode
  /** Couleurs proposées dans Apparence (toutes par défaut). */
  cles?: (keyof ElementStyle)[]
  /** Libellés propres à un diagramme (ex. « Élément » = « Flèches et messages »). */
  libellesStyle?: Partial<Record<keyof ElementStyle, string>>
  /** Place le curseur dans le champ nom à l'ouverture de l'éditeur. */
  autoFocusNom?: boolean
}

const CLES_STYLE = Object.keys(STYLE_LABELS) as (keyof ElementStyle)[]

/**
 * Cadre commun des éditeurs du bas (table, entité, association) : en-tête fixe (nom +
 * Apparence dépliable + fermer), corps qui défile, pied fixe « + Ajouter ». La hauteur
 * suit le contenu, dans la limite de l'espace disponible (voir merise.css).
 */
export function EditeurCadre({ racineRef, etiquetteNom, placeholderNom, nom, onNom, style, onStyle, onClose, onAjouter, libelleAjout, children, champEntete, actions, cles, libellesStyle, autoFocusNom }: Props) {
  const [apparenceOuverte, setApparenceOuverte] = useState(false)
  const courant: ElementStyle = resoudreStyle(style)
  const clesAffichees = cles ?? CLES_STYLE
  const libelle = (cle: keyof ElementStyle) => libellesStyle?.[cle] ?? STYLE_LABELS[cle]

  return (
    <div ref={racineRef} className="merise-editor">
      <header className="me-entete">
        {champEntete ?? (
          <label className="me-champ-nom">
            <span className="me-etiquette">{etiquetteNom}</span>
            <input
              className="me-input me-input--titre"
              value={nom}
              onChange={(e) => onNom(e.target.value)}
              placeholder={placeholderNom}
              autoComplete="off"
              spellCheck={false}
              autoFocus={autoFocusNom}
              onFocus={autoFocusNom ? (e) => e.currentTarget.select() : undefined}
            />
          </label>
        )}

        <div className="me-entete-actions">
          {actions}
          <button
            type="button"
            className={`me-bouton me-bouton--apparence${apparenceOuverte ? ' is-ouvert' : ''}`}
            aria-expanded={apparenceOuverte}
            onClick={() => setApparenceOuverte((o) => !o)}
          >
            <span className="me-pastilles" aria-hidden="true">
              {clesAffichees.map((cle) => (
                <i key={cle} style={{ backgroundColor: courant[cle] }} />
              ))}
            </span>
            Apparence
            <span className="me-chevron" aria-hidden="true">
              ▾
            </span>
          </button>
          <button type="button" className="me-bouton me-bouton--icone" onClick={onClose} title="Fermer l'éditeur" aria-label="Fermer l'éditeur">
            ×
          </button>
        </div>
      </header>

      <div className="me-corps">
        {apparenceOuverte && (
          <section className="me-apparence" aria-label="Apparence">
            <div className="me-themes">
              <span className="me-etiquette">Thème</span>
              {Object.entries(THEMES).map(([cle, theme]) => (
                <button key={cle} type="button" className="me-bouton me-bouton--petit" onClick={() => onStyle({ ...theme.style })}>
                  {theme.label}
                </button>
              ))}
              <button
                type="button"
                className="me-bouton me-bouton--petit me-bouton--discret me-themes-reset"
                onClick={() => onStyle(undefined)}
                disabled={undefined === style}
              >
                Réinitialiser
              </button>
            </div>

            <div className="me-couleurs">
              {clesAffichees.map((cle) => (
                <label key={cle} className="me-couleur">
                  <input type="color" value={courant[cle]} onChange={(e) => onStyle({ ...style, [cle]: e.target.value })} />
                  <span className="me-couleur-texte">
                    <span>{libelle(cle)}</span>
                    <code>{courant[cle]}</code>
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {children}
      </div>

      {onAjouter && (
        <footer className="me-pied">
          <button type="button" className="me-bouton me-bouton--principal" onClick={onAjouter}>
            {libelleAjout}
          </button>
          <span className="me-astuce">Entrée dans un nom ajoute une ligne</span>
        </footer>
      )}
    </div>
  )
}