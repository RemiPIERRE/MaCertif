import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { createDefaultAnnexes, createDefaultPresentation } from '../../data/oralDefaults'
import type { OralAnnexCategory, OralSection, Slide } from '../../types/oral'
import {
  addAnnexCategory,
  addSection,
  addSlideToCategory,
  addSlideToSection,
  moveSection,
  moveSlideInAnnexes,
  moveSlideInSections,
  removeAnnexCategory,
  removeSection,
  removeSlideFromAnnexes,
  removeSlideFromSections,
  renameAnnexCategory,
  renameSection,
  resetPresentationOrder,
  toggleSectionActive,
} from '../../lib/oralMutations'
import './OralApercuPage.css'

function SlideThumb({
  slide,
  index,
  total,
  editPath,
  onMove,
  onRemove,
}: {
  slide: Slide
  index: number
  total: number
  editPath: string
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className="apercu-slide-row">
      <Link to={editPath} className="apercu-slide-link">
        <span className="apercu-slide-index">{index + 1}</span>
        <span className="apercu-slide-body">
          <span className="apercu-slide-title">{slide.titre || 'Sans titre'}</span>
          <span className="apercu-slide-meta">
            {slide.blocks.length} bloc{slide.blocks.length !== 1 ? 's' : ''}
            {' · '}
            {slide.discours.trim() ? 'discours rédigé' : 'discours vide'}
          </span>
        </span>
      </Link>
      <div className="apercu-slide-actions">
        <button className="btn btn-ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Monter">
          ↑
        </button>
        <button className="btn btn-ghost" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Descendre">
          ↓
        </button>
        <button className="btn btn-danger" onClick={onRemove} aria-label="Supprimer la slide">
          ×
        </button>
      </div>
    </div>
  )
}

function PresentationOutline({ sections, setSections }: { sections: OralSection[]; setSections: (u: (prev: OralSection[]) => OralSection[]) => void }) {
  const [newTitre, setNewTitre] = useState('')

  const handleAddSection = () => {
    const titre = newTitre.trim()
    if (!titre) return
    setSections((prev) => addSection(prev, titre, false))
    setNewTitre('')
  }

  return (
    <div className="oral-apercu-outline">
      {sections.map((section, si) => (
        <details className="card chapter-card" key={section.id} open>
          <summary className="chapter-summary">
            <span className="chapter-number">{si + 1}</span>
            <input
              className="apercu-section-title-input"
              value={section.titre}
              onClick={(e) => e.preventDefault()}
              onChange={(e) => setSections((prev) => renameSection(prev, section.id, e.target.value))}
            />
            {section.optionnelle && <span className="tag tag-amber">Optionnelle</span>}
            <span className="chapter-count">{section.slides.length} slides</span>
          </summary>

          <div className="apercu-section-controls">
            {section.optionnelle && (
              <label className="apercu-toggle-active">
                <input type="checkbox" checked={section.activee} onChange={() => setSections((prev) => toggleSectionActive(prev, section.id))} />
                Inclure cette section dans la présentation
              </label>
            )}
            <div className="apercu-section-move">
              <button className="btn btn-ghost" disabled={si === 0} onClick={() => setSections((prev) => moveSection(prev, section.id, -1))}>
                ↑ Section
              </button>
              <button
                className="btn btn-ghost"
                disabled={si === sections.length - 1}
                onClick={() => setSections((prev) => moveSection(prev, section.id, 1))}
              >
                ↓ Section
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Supprimer la section « ${section.titre} » et toutes ses slides ?`)) {
                    setSections((prev) => removeSection(prev, section.id))
                  }
                }}
              >
                Supprimer la section
              </button>
            </div>
          </div>

          <div className="task-rows apercu-slide-rows">
            {section.slides.map((slide, i) => (
              <SlideThumb
                key={slide.id}
                slide={slide}
                index={i}
                total={section.slides.length}
                editPath={`/oral/presentation/${slide.id}`}
                onMove={(direction) => setSections((prev) => moveSlideInSections(prev, section.id, slide.id, direction))}
                onRemove={() => {
                  if (window.confirm('Supprimer cette slide ?')) setSections((prev) => removeSlideFromSections(prev, slide.id))
                }}
              />
            ))}
            <button className="btn btn-secondary apercu-add-slide" onClick={() => setSections((prev) => addSlideToSection(prev, section.id).sections)}>
              + Ajouter une slide
            </button>
          </div>
        </details>
      ))}

      <div className="card apercu-add-section">
        <input
          className="apercu-add-section-input"
          value={newTitre}
          onChange={(e) => setNewTitre(e.target.value)}
          placeholder="Titre de la nouvelle section…"
          onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
        />
        <button className="btn btn-secondary" onClick={handleAddSection}>
          + Ajouter une section
        </button>
      </div>
    </div>
  )
}

function AnnexesOutline({
  annexes,
  setAnnexes,
}: {
  annexes: OralAnnexCategory[]
  setAnnexes: (u: (prev: OralAnnexCategory[]) => OralAnnexCategory[]) => void
}) {
  const [newCategorie, setNewCategorie] = useState('')

  const handleAddCategory = () => {
    const categorie = newCategorie.trim()
    if (!categorie) return
    setAnnexes((prev) => addAnnexCategory(prev, categorie))
    setNewCategorie('')
  }

  return (
    <div className="oral-apercu-outline">
      {annexes.map((category, ci) => (
        <details className="card chapter-card" key={category.id} open={category.slides.length > 0}>
          <summary className="chapter-summary">
            <span className="chapter-number">{ci + 1}</span>
            <input
              className="apercu-section-title-input"
              value={category.categorie}
              onClick={(e) => e.preventDefault()}
              onChange={(e) => setAnnexes((prev) => renameAnnexCategory(prev, category.id, e.target.value))}
            />
            <span className="chapter-count">{category.slides.length} slides</span>
          </summary>

          <div className="apercu-section-controls">
            <div className="apercu-section-move">
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Supprimer la catégorie « ${category.categorie} » et toutes ses slides ?`)) {
                    setAnnexes((prev) => removeAnnexCategory(prev, category.id))
                  }
                }}
              >
                Supprimer la catégorie
              </button>
            </div>
          </div>

          <div className="task-rows apercu-slide-rows">
            {category.slides.map((slide, i) => (
              <SlideThumb
                key={slide.id}
                slide={slide}
                index={i}
                total={category.slides.length}
                editPath={`/oral/annexes/${slide.id}`}
                onMove={(direction) => setAnnexes((prev) => moveSlideInAnnexes(prev, category.id, slide.id, direction))}
                onRemove={() => {
                  if (window.confirm('Supprimer cette slide ?')) setAnnexes((prev) => removeSlideFromAnnexes(prev, slide.id))
                }}
              />
            ))}
            <button
              className="btn btn-secondary apercu-add-slide"
              onClick={() => setAnnexes((prev) => addSlideToCategory(prev, category.id).categories)}
            >
              + Ajouter une slide
            </button>
          </div>
        </details>
      ))}

      <div className="card apercu-add-section">
        <input
          className="apercu-add-section-input"
          value={newCategorie}
          onChange={(e) => setNewCategorie(e.target.value)}
          placeholder="Nom de la nouvelle catégorie d'annexes…"
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <button className="btn btn-secondary" onClick={handleAddCategory}>
          + Ajouter une catégorie
        </button>
      </div>
    </div>
  )
}

export function OralApercuPage() {
  const [sections, setSections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const [annexes, setAnnexes] = useLocalStorage<OralAnnexCategory[]>(STORAGE_KEYS.oralAnnexes, createDefaultAnnexes())
  const [tab, setTab] = useState<'presentation' | 'annexes'>('presentation')

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Mon support visuel</h1>
          <p className="page-lede">
            Aperçu de toutes vos slides, dans l'ordre de présentation. Réorganisez, ajoutez ou supprimez des sections et des
            slides ; cliquez sur une slide pour la rédiger.
          </p>
        </div>
        <Link className="btn btn-secondary" to="/oral">
          ← Mon oral
        </Link>
      </header>

      <div className="apercu-tabs">
        <button className={`btn ${tab === 'presentation' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('presentation')}>
          Présentation
        </button>
        <button className={`btn ${tab === 'annexes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('annexes')}>
          Annexes
        </button>
        {tab === 'presentation' && (
          <button
            className="btn btn-secondary apercu-reset-order"
            onClick={() => {
              if (
                window.confirm(
                  "Réinitialiser l'ordre des slides ? Les sections par défaut retrouvent leur ordre et leur activation d'origine, et vos slides et sections ajoutées sont regroupées dans une section « Sans catégorie » à la fin. Les titres, blocs et discours ne sont pas modifiés.",
                )
              ) {
                setSections((prev) => resetPresentationOrder(prev))
              }
            }}
          >
            Réinitialiser l'ordre des slides
          </button>
        )}
      </div>

      {tab === 'presentation' ? (
        <PresentationOutline sections={sections} setSections={setSections} />
      ) : (
        <AnnexesOutline annexes={annexes} setAnnexes={setAnnexes} />
      )}
    </div>
  )
}
