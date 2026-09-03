import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { createDefaultPresentation } from '../../data/oralDefaults'
import type { OralSection } from '../../types/oral'
import { flattenActivePresentation } from '../../lib/oralMutations'
import { assessFinalChrono, formatMinutes, slideDuration, WPM_MAX, WPM_MIN } from '../../lib/oralTime'
import './OralTrainingPage.css'

const SCROLL_WPM = (WPM_MIN + WPM_MAX) / 2

/** Where the fixed reading line sits, as a fraction of the prompter's height from the top. */
const READING_LINE_RATIO = 0.3
/** Small gap (in line-heights) the first line starts below the reading line, for each new discours. */
const START_BUFFER_RATIO = 0.15

function formatChrono(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface TrainingPageProps {
  mode: 'prompteur' | 'slides'
}

interface PrompterMeasurement {
  y0Start: number
  distance: number
  words: number
}

export function OralTrainingPage({ mode }: TrainingPageProps) {
  const { slideId } = useParams<{ slideId: string }>()
  const navigate = useNavigate()
  const [sections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const flat = flattenActivePresentation(sections)
  const index = flat.findIndex((e) => e.slide.id === slideId)
  const entry = flat[index]

  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTextRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const measurementRef = useRef<PrompterMeasurement | null>(null)

  useEffect(() => {
    if (!started || finished) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [started, finished])

  // Parks the text at rest, first line just below the reading line — this runs as soon
  // as the slide is shown, independently of the chrono, so nothing jumps when the user
  // presses "Démarrer", and resets for every new discours.
  useEffect(() => {
    measurementRef.current = null
    if (mode !== 'prompteur' || !entry) return
    const container = scrollContainerRef.current
    const text = scrollTextRef.current
    if (!container || !text) return

    const words = entry.slide.discours.trim() ? entry.slide.discours.trim().split(/\s+/).length : 0
    if (words === 0) {
      text.style.transform = 'translateY(0px)'
      return
    }

    const lineHeight = parseFloat(getComputedStyle(text).lineHeight) || 32
    const textHeight = text.offsetHeight
    const readingLineY = container.clientHeight * READING_LINE_RATIO
    const buffer = lineHeight * START_BUFFER_RATIO
    const y0Start = readingLineY + buffer
    const y0End = readingLineY - textHeight

    measurementRef.current = { y0Start, distance: y0Start - y0End, words }
    text.style.transform = `translateY(${y0Start}px)`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.slide.id, mode])

  // Animates the text up through the reading line once the chrono is started.
  useEffect(() => {
    if (!started || finished || mode !== 'prompteur') return
    const m = measurementRef.current
    const text = scrollTextRef.current
    if (!m || !text) return

    const durationMs = (m.words / SCROLL_WPM) * 60 * 1000
    const startTime = performance.now()

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / durationMs)
      text!.style.transform = `translateY(${m!.y0Start - t * m!.distance}px)`
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, finished, entry?.slide.id, mode])

  const goNext = () => {
    if (!started || finished) return
    const next = flat[index + 1]
    if (next) navigate(`/oral/entrainement/${mode}/${next.slide.id}`)
    else setFinished(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!started) setStarted(true)
        else goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  if (!entry) {
    return (
      <div>
        <p className="page-lede">Cette slide n'est plus disponible pour l'entraînement.</p>
        <Link className="btn btn-secondary" to="/oral/entrainement">
          Retour à l'entraînement
        </Link>
      </div>
    )
  }

  if (finished) {
    const assessment = assessFinalChrono(elapsed)
    return (
      <div>
        <div className="training-topbar">
          <Link className="slide-editor-back" to="/oral">
            ← Mon oral
          </Link>
        </div>
        <div className={`card training-recap-card training-recap-${assessment.status}`}>
          <div className="training-recap-label">Entraînement terminé</div>
          <div className="training-recap-chrono">{formatChrono(elapsed)}</div>
          <div className="training-recap-status">{assessment.label}</div>
          <p className="training-recap-hint">Cible : 35 à 40 minutes.</p>
          <Link className="btn btn-primary" to="/oral">
            Retour à Mon oral
          </Link>
        </div>
      </div>
    )
  }

  const est = slideDuration(entry.slide.discours)
  const isLast = index === flat.length - 1

  return (
    <div>
      <div className="training-topbar">
        <Link className="slide-editor-back" to="/oral/entrainement">
          ← Quitter l'entraînement
        </Link>
        <div className="training-chrono">Chrono : {formatChrono(elapsed)}</div>
      </div>

      <header className="page-header">
        <div>
          <div className="page-eyebrow">
            {entry.sectionTitre} — slide {index + 1} / {flat.length} · temps estimé {formatMinutes((est.minMinutes + est.maxMinutes) / 2)}
          </div>
          <h1>{entry.slide.titre || 'Sans titre'}</h1>
        </div>
      </header>

      {mode === 'prompteur' ? (
        <div className="card training-prompteur-card">
          <div className="training-scroll-container" ref={scrollContainerRef}>
            <div className="training-reading-line" aria-hidden />
            <div className="training-scroll-text" ref={scrollTextRef}>
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
        </div>
      ) : (
        <div className="card training-slide-card">
          {entry.slide.blocks.length === 0 ? (
            <p className="discours-empty">Slide sans contenu.</p>
          ) : (
            <div className="training-block-list">
              {entry.slide.blocks.map((block) =>
                block.type === 'image' ? (
                  <div className="training-block training-block-image" key={block.id}>
                    Image à insérer ici : {block.content.trim() || 'description non renseignée'}
                  </div>
                ) : (
                  <div className="training-block training-block-texte" key={block.id}>
                    {block.content}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      <div className="training-footer">
        {!started ? (
          <button className="btn btn-primary" onClick={() => setStarted(true)}>
            Démarrer le chrono
          </button>
        ) : (
          <button className="btn btn-primary" onClick={goNext}>
            {isLast ? 'Terminer l\'entraînement' : 'Slide suivante (espace)'}
          </button>
        )}
      </div>
    </div>
  )
}
