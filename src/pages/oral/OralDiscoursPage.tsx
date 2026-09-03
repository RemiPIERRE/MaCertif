import { Link } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { createDefaultPresentation } from '../../data/oralDefaults'
import type { OralSection } from '../../types/oral'
import { flattenActivePresentation } from '../../lib/oralMutations'
import { formatMinutes, pacingStatus, presentationDuration, slideDuration } from '../../lib/oralTime'
import './OralDiscoursPage.css'

export function OralDiscoursPage() {
  const [sections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const flat = flattenActivePresentation(sections)
  const duration = presentationDuration(sections)
  const status = pacingStatus(duration)

  const sectionHeadingFlags = flat.map((entry, i) => i === 0 || entry.sectionId !== flat[i - 1].sectionId)

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Mon discours</h1>
          <p className="page-lede">Le texte de votre discours, compilé section par section, tel qu'il sera exporté en .docx.</p>
        </div>
        <Link className="btn btn-secondary" to="/oral">
          ← Mon oral
        </Link>
      </header>

      <div className={`card discours-summary discours-summary-${status}`}>
        Durée totale estimée : <strong>{formatMinutes((duration.minMinutes + duration.maxMinutes) / 2)}</strong> (cible 35 à 40 minutes)
      </div>

      {flat.length === 0 ? (
        <p className="page-lede">Aucune slide active dans la présentation pour l'instant.</p>
      ) : (
        <div className="discours-body">
          {flat.map((entry, i) => {
            const showSectionHeading = sectionHeadingFlags[i]
            const est = slideDuration(entry.slide.discours)
            return (
              <div key={entry.slide.id}>
                {showSectionHeading && <h2 className="discours-section-title">{entry.sectionTitre}</h2>}
                <div className="card discours-slide-card">
                  <div className="discours-slide-head">
                    <h3>{entry.slide.titre || 'Sans titre'}</h3>
                    <span className="discours-slide-estimate">{formatMinutes((est.minMinutes + est.maxMinutes) / 2)}</span>
                  </div>
                  {entry.slide.discours.trim() ? (
                    entry.slide.discours
                      .trim()
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((line, i) => <p key={i}>{line}</p>)
                  ) : (
                    <p className="discours-empty">Discours non rédigé pour cette slide.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
