import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { createDefaultPresentation, createDefaultAnnexes } from '../../data/oralDefaults'
import type { OralAnnexCategory, OralSection, Slide } from '../../types/oral'
import { MAX_BLOCKS_PER_SLIDE } from '../../types/oral'
import {
  addBlock,
  addSlideToCategory,
  addSlideToSection,
  flattenAnnexes,
  flattenPresentation,
  removeBlock,
  removeSlideFromAnnexes,
  removeSlideFromSections,
  updateBlock,
  updateSlideInAnnexes,
  updateSlideInSections,
} from '../../lib/oralMutations'
import { countWords, formatMinutes, pacingStatus, presentationDuration, slideDuration } from '../../lib/oralTime'
import './SlideEditorPage.css'

interface SlideEditorPageProps {
  kind: 'presentation' | 'annexe'
}

const WORDS_PER_LINE_HINT = 6

export function SlideEditorPage({ kind }: SlideEditorPageProps) {
  const { slideId } = useParams<{ slideId: string }>()
  const navigate = useNavigate()

  const [sections, setSections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const [annexes, setAnnexes] = useLocalStorage<OralAnnexCategory[]>(STORAGE_KEYS.oralAnnexes, createDefaultAnnexes())

  const basePath = kind === 'presentation' ? '/oral/presentation' : '/oral/annexes'
  const flatPresentation = flattenPresentation(sections)
  const flatAnnexes = flattenAnnexes(annexes)

  const index = kind === 'presentation' ? flatPresentation.findIndex((e) => e.slide.id === slideId) : flatAnnexes.findIndex((e) => e.slide.id === slideId)
  const entry = kind === 'presentation' ? flatPresentation[index] : flatAnnexes[index]

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slideId])

  if (!entry) {
    return (
      <div>
        <p className="page-lede">Cette slide n'existe pas (ou plus).</p>
        <Link className="btn btn-secondary" to="/oral">
          Retour à Mon oral
        </Link>
      </div>
    )
  }

  const groupId = kind === 'presentation' ? flatPresentation[index].sectionId : flatAnnexes[index].categoryId
  const groupTitre = kind === 'presentation' ? flatPresentation[index].sectionTitre : flatAnnexes[index].categoryTitre
  const slide = entry.slide

  const prevEntry = index > 0 ? (kind === 'presentation' ? flatPresentation[index - 1] : flatAnnexes[index - 1]) : null
  const flatLength = kind === 'presentation' ? flatPresentation.length : flatAnnexes.length
  const nextEntry = index < flatLength - 1 ? (kind === 'presentation' ? flatPresentation[index + 1] : flatAnnexes[index + 1]) : null

  function mutateSlide(mutator: (s: Slide) => Slide) {
    if (kind === 'presentation') {
      setSections((prev) => {
        const current = flattenPresentation(prev).find((e) => e.slide.id === slideId)
        if (!current) return prev
        return updateSlideInSections(prev, slideId!, mutator(current.slide))
      })
    } else {
      setAnnexes((prev) => {
        const current = flattenAnnexes(prev).find((e) => e.slide.id === slideId)
        if (!current) return prev
        return updateSlideInAnnexes(prev, slideId!, mutator(current.slide))
      })
    }
  }

  const handleAddSlide = () => {
    if (kind === 'presentation') {
      const { sections: next, newSlideId } = addSlideToSection(sections, groupId)
      setSections(next)
      navigate(`${basePath}/${newSlideId}`)
    } else {
      const { categories: next, newSlideId } = addSlideToCategory(annexes, groupId)
      setAnnexes(next)
      navigate(`${basePath}/${newSlideId}`)
    }
  }

  const handleRemoveSlide = () => {
    if (!window.confirm('Supprimer cette slide ? Cette action est irréversible.')) return
    const fallback = prevEntry ?? nextEntry
    if (kind === 'presentation') setSections((prev) => removeSlideFromSections(prev, slide.id))
    else setAnnexes((prev) => removeSlideFromAnnexes(prev, slide.id))
    navigate(fallback ? `${basePath}/${fallback.slide.id}` : '/oral')
  }

  const duration = presentationDuration(sections)
  const status = pacingStatus(duration)
  const slideWords = countWords(slide.discours)
  const slideEstimate = slideDuration(slide.discours)

  return (
    <div>
      <div className="slide-editor-topbar">
        <Link className="slide-editor-back" to="/oral">
          ← Mon oral
        </Link>
        {kind === 'presentation' && (
          <div className={`slide-editor-global-badge slide-editor-global-${status}`}>
            Durée totale du discours : {formatMinutes((duration.minMinutes + duration.maxMinutes) / 2)}
            <span className="slide-editor-global-hint"> (cible 35-40 min)</span>
          </div>
        )}
      </div>

      <header className="page-header">
        <div>
          <div className="page-eyebrow">
            {groupTitre} — slide {index + 1} / {flatLength}
          </div>
          <input
            className="slide-editor-title-input"
            value={slide.titre}
            onChange={(e) => mutateSlide((s) => ({ ...s, titre: e.target.value }))}
            placeholder="Titre de la slide"
          />
        </div>
      </header>

      <section className="card slide-editor-blocks-card">
        <div className="slide-editor-blocks-header">
          <h3>Contenu de la slide</h3>
          <span className="slide-editor-block-count">
            {slide.blocks.length} / {MAX_BLOCKS_PER_SLIDE} blocs
          </span>
        </div>

        <div className="slide-editor-blocks-actions">
          <button
            className="btn btn-secondary"
            disabled={slide.blocks.length >= MAX_BLOCKS_PER_SLIDE}
            onClick={() => mutateSlide((s) => addBlock(s, 'texte'))}
          >
            + Ajouter un bloc Texte
          </button>
          <button
            className="btn btn-secondary"
            disabled={slide.blocks.length >= MAX_BLOCKS_PER_SLIDE}
            onClick={() => mutateSlide((s) => addBlock(s, 'image'))}
          >
            + Ajouter un bloc Image
          </button>
        </div>

        {slide.blocks.length === 0 && <p className="slide-editor-empty">Aucun bloc pour l'instant. Ajoutez un bloc texte ou image.</p>}

        <div className="slide-editor-block-list">
          {slide.blocks.map((block, blockIndex) => (
            <div className={`slide-editor-block slide-editor-block-${block.type}`} key={block.id}>
              <div className="slide-editor-block-head">
                <span className="tag tag-violet">{block.type === 'texte' ? 'Texte' : 'Image'}</span>
                <span className="slide-editor-block-number">Bloc {blockIndex + 1}</span>
                <button className="btn btn-ghost slide-editor-block-remove" onClick={() => mutateSlide((s) => removeBlock(s, block.id))}>
                  Supprimer
                </button>
              </div>
              {block.type === 'image' && <p className="slide-editor-block-image-hint">Décrivez l'image à insérer manuellement après export.</p>}
              <textarea
                className="slide-editor-block-textarea"
                value={block.content}
                onChange={(e) => mutateSlide((s) => updateBlock(s, block.id, e.target.value))}
                placeholder={block.type === 'texte' ? 'Texte du bloc…' : 'Description de l\'image à insérer…'}
                rows={block.type === 'texte' ? 4 : 2}
              />
              {block.type === 'texte' && <BlockLineHint content={block.content} />}
            </div>
          ))}
        </div>
      </section>

      <section className="card slide-editor-discours-card">
        <div className="slide-editor-blocks-header">
          <h3>Discours pour cette slide</h3>
          <span className="slide-editor-block-count">
            {slideWords} mots — environ {formatMinutes((slideEstimate.minMinutes + slideEstimate.maxMinutes) / 2)}
          </span>
        </div>
        <textarea
          className="slide-editor-discours-textarea"
          value={slide.discours}
          onChange={(e) => mutateSlide((s) => ({ ...s, discours: e.target.value }))}
          placeholder="Ce que vous direz à voix haute pendant cette slide…"
          rows={8}
        />
      </section>

      <div className="slide-editor-footer">
        <div className="slide-editor-footer-manage">
          <button className="btn btn-secondary" onClick={handleAddSlide}>
            + Nouvelle slide dans « {groupTitre} »
          </button>
          <button className="btn btn-danger" onClick={handleRemoveSlide}>
            Supprimer cette slide
          </button>
        </div>
        <div className="slide-editor-footer-nav">
          <button className="btn btn-secondary" disabled={!prevEntry} onClick={() => prevEntry && navigate(`${basePath}/${prevEntry.slide.id}`)}>
            ← Slide précédente
          </button>
          <button className="btn btn-primary" disabled={!nextEntry} onClick={() => nextEntry && navigate(`${basePath}/${nextEntry.slide.id}`)}>
            Slide suivante →
          </button>
        </div>
      </div>
    </div>
  )
}

/** Non-blocking readability guidance: flags lines longer than ~6 words, the rule of thumb for a legible slide. */
function BlockLineHint({ content }: { content: string }) {
  const lines = content.split(/\n+/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return null
  const longLines = lines.filter((l) => countWords(l) > WORDS_PER_LINE_HINT).length
  if (longLines === 0) return <p className="slide-editor-line-hint slide-editor-line-hint-ok">Lisibilité : lignes courtes, parfait pour une slide.</p>
  return (
    <p className="slide-editor-line-hint slide-editor-line-hint-warn">
      {longLines} ligne{longLines > 1 ? 's' : ''} dépasse{longLines > 1 ? 'nt' : ''} ~{WORDS_PER_LINE_HINT} mots — pensez à raccourcir pour rester lisible en slide.
    </p>
  )
}
