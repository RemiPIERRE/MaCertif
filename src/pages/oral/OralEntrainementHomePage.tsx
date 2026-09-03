import { Link } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { createDefaultPresentation } from '../../data/oralDefaults'
import type { OralSection } from '../../types/oral'
import { flattenActivePresentation } from '../../lib/oralMutations'
import './OralEntrainementHomePage.css'

export function OralEntrainementHomePage() {
  const [sections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const flat = flattenActivePresentation(sections)
  const firstSlideId = flat[0]?.slide.id

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Entraînement</h1>
          <p className="page-lede">
            Entraînez-vous à l'oral dans les conditions du jour. Le chrono démarre uniquement quand vous le lancez ; il ne
            porte que sur les slides de la Présentation.
          </p>
        </div>
        <Link className="btn btn-secondary" to="/oral">
          ← Mon oral
        </Link>
      </header>

      {!firstSlideId ? (
        <p className="page-lede">Aucune slide active dans votre présentation pour l'instant.</p>
      ) : (
        <div className="entrainement-modes">
          <Link className="card entrainement-mode-card" to={`/oral/entrainement/prompteur/${firstSlideId}`}>
            <h3>Discours + prompteur</h3>
            <p>
              Votre discours défile automatiquement au rythme de 150 à 160 mots par minute. Calez votre débit sur le
              défilement, pas l'inverse.
            </p>
          </Link>
          <Link className="card entrainement-mode-card" to={`/oral/entrainement/slides/${firstSlideId}`}>
            <h3>Slide compilée seule</h3>
            <p>Seuls le titre et le contenu de la slide sont affichés, sans discours : entraînez-vous à parler sans lire.</p>
          </Link>
        </div>
      )}
    </div>
  )
}
