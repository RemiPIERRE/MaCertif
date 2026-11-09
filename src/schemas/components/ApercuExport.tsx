import { useEffect, useRef, useState, type RefObject } from 'react'
import { telechargerPng, type FondExport, type ImageExportee, type OptionsExport } from '../lib/exportPng'
import './merise.css'

interface Props {
  /** Produit l'image avec les options choisies — propre à chaque type de diagramme. */
  generer: (options: OptionsExport) => Promise<ImageExportee>
  /** Représentation du contenu du diagramme : l'aperçu est régénéré quand elle change. */
  contenu: string
  nom: string
  options: OptionsExport
  onOptions: (options: OptionsExport) => void
  ouvert: boolean
  onOuvert: (ouvert: boolean) => void
}

const FONDS: Array<[FondExport, string]> = [
  ['blanc', 'Blanc'],
  ['sombre', 'Sombre'],
  ['transparent', 'Transparent'],
]

const ECHELLES = [1, 2, 3]

/** Délai avant de régénérer l'image après une modification (évite de la refaire à chaque pixel déplacé). */
const DELAI_MS = 500

/** Contenu d'un schéma de nœuds/arêtes sans l'état purement visuel (sélection, glissement) :
 * sélectionner une table ne relance pas la génération. */
export function signatureSchema(nodes: unknown[], edges: unknown[]): string {
  const sansEtatVisuel = (liste: unknown[]) =>
    liste.map((el) => {
      const { selected: _selected, dragging: _dragging, ...reste } = el as Record<string, unknown>
      return reste
    })
  return JSON.stringify([sansEtatVisuel(nodes), sansEtatVisuel(edges)])
}

/**
 * Le cadre « Aperçu de l'export » est un cadre à part : il s'affiche SOUS la mise en page
 * « Mes schémas » + diagramme (.schema-tab), sur toute la largeur. Un conteneur est inséré juste
 * après .schema-tab ; l'aperçu y est rendu par portail (createPortal) et disparaît avec le diagramme.
 * Commun à tous les diagrammes : `ancre` est un élément du diagramme (à l'intérieur de .schema-tab).
 */
export function useZoneApercu(ancre: RefObject<HTMLElement | null>): HTMLElement | null {
  const [cible, setCible] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const onglet = ancre.current?.closest('.schema-tab')
    if (!onglet) return
    const conteneur = document.createElement('div')
    conteneur.className = 'schema-apercu-zone'
    onglet.after(conteneur)
    setCible(conteneur)
    return () => {
      conteneur.remove()
      setCible(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return cible
}

export function ApercuExport({ generer, contenu, nom, options, onOptions, ouvert, onOuvert }: Props) {
  const [image, setImage] = useState<ImageExportee | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const compteur = useRef(0)

  useEffect(() => {
    if (!ouvert) return
    const numero = ++compteur.current
    setEnCours(true)
    const minuteur = window.setTimeout(() => {
      generer(options)
        .then((resultat) => {
          if (numero !== compteur.current) return // une génération plus récente a pris le relais
          setImage(resultat)
          setErreur(null)
        })
        .catch((e: unknown) => {
          if (numero !== compteur.current) return
          setImage(null)
          setErreur(e instanceof Error ? e.message : "Échec de la génération de l'aperçu.")
        })
        .finally(() => {
          if (numero === compteur.current) setEnCours(false)
        })
    }, DELAI_MS)
    return () => window.clearTimeout(minuteur)
    // `generer` change à chaque rendu : seuls le contenu et les options déclenchent la régénération.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, contenu, options.fond, options.echelle])

  return (
    <section className="me-apercu" aria-label="Aperçu de l'export">
      <header className="me-apercu-entete">
        <button
          type="button"
          className="me-apercu-titre"
          onClick={() => onOuvert(!ouvert)}
          aria-expanded={ouvert}
        >
          <span aria-hidden="true">{ouvert ? '▾' : '▸'}</span> Aperçu de l'export
        </button>

        {ouvert && (
          <div className="me-apercu-actions">
            <label>
              Fond
              <select value={options.fond} onChange={(e) => onOptions({ ...options, fond: e.target.value as FondExport })}>
                {FONDS.map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>
                    {libelle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Qualité
              <select value={options.echelle} onChange={(e) => onOptions({ ...options, echelle: Number(e.target.value) })}>
                {ECHELLES.map((echelle) => (
                  <option key={echelle} value={echelle}>
                    ×{echelle}
                  </option>
                ))}
              </select>
            </label>
            {image && (
              <span className="me-apercu-taille">
                {Math.round(image.largeur * image.echelle)} × {Math.round(image.hauteur * image.echelle)} px
              </span>
            )}
            <button
              type="button"
              className="me-apercu-bouton"
              disabled={!image || enCours}
              onClick={() => image && telechargerPng(image.dataUrl, nom)}
            >
              Télécharger le PNG
            </button>
          </div>
        )}
      </header>

      {ouvert && (
        <div className={`me-apercu-corps${options.fond === 'transparent' ? ' is-transparent' : ''}`}>
          {erreur && <p className="me-apercu-message me-apercu-message--erreur">{erreur}</p>}
          {!erreur && !image && <p className="me-apercu-message">Génération de l'aperçu…</p>}
          {image && !erreur && (
            <img
              className={`me-apercu-image${enCours ? ' is-en-cours' : ''}`}
              src={image.dataUrl}
              alt={`Aperçu de l'image exportée : ${nom || 'schéma'}`}
            />
          )}
        </div>
      )}
    </section>
  )
}