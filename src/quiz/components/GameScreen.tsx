import { useEffect, useMemo, useRef, useState } from 'react'
import type { PartieTerminee, Question, QuestionQcm, Reponse } from '../types'
import { themeLabel } from '../lib/labels'
import { decouperQuestion, recompense, shuffle } from '../lib/quizLogic'

interface Props {
  questions: Question[]
  minuteur: number
  son: boolean
  onTerminer: (resultat: PartieTerminee) => void
  onQuitter: () => void
}

type Feedback = { kind: 'ok' | 'ko'; titre: string; pts: number; bonus: number; explication: string }
type ResultatTuiles = { correctPos: number; choisiPos: number | null } | null

const FORMES = [
  <path key="t" d="M12 3 22 20H2z" />,
  <path key="d" d="M12 2 22 12 12 22 2 12z" />,
  <circle key="c" cx="12" cy="12" r="10" />,
  <rect key="r" x="3" y="3" width="18" height="18" rx="2" />,
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

export function GameScreen({ questions, minuteur, son, onTerminer, onQuitter }: Props) {
  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [resultatTuiles, setResultatTuiles] = useState<ResultatTuiles>(null)
  const [armeAbandon, setArmeAbandon] = useState(false)

  const logRef = useRef<Reponse[]>([])
  const t0Ref = useRef(0)
  const ratioRef = useRef(1)
  const fillRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const armeTimerRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)

  const question = questions[index]
  const ordre = useMemo(() => (question.type === 'qcm' ? shuffle([0, 1, 2, 3]) : null), [question])
  const parties = useMemo(() => decouperQuestion(question), [question])
  const derniere = index === questions.length - 1

  const jouerSon = (freqs: number[], duree: number) => {
    if (!son) return
    try {
      const AC = audioRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioRef.current = AC
      const t = AC.currentTime
      freqs.forEach((f, i) => {
        const o = AC.createOscillator()
        const g = AC.createGain()
        o.type = 'sine'
        o.frequency.value = f
        g.gain.setValueAtTime(0.0001, t + i * duree)
        g.gain.exponentialRampToValueAtTime(0.18, t + i * duree + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * duree)
        o.connect(g)
        g.connect(AC.destination)
        o.start(t + i * duree)
        o.stop(t + (i + 1) * duree + 0.02)
      })
    } catch {
      /* contexte audio indisponible : tant pis pour le son */
    }
  }

  const dureeMs = () => minuteur * (question.type === 'ouverte' ? 2 : 1) * 1000

  // Minuteur : remise à zéro à chaque nouvelle question, arrêt dès qu'on verrouille la réponse.
  useEffect(() => {
    setLocked(false)
    setRevealed(false)
    setFeedback(null)
    setResultatTuiles(null)
    setArmeAbandon(false)
    t0Ref.current = performance.now()
    ratioRef.current = 1
    cancelAnimationFrame(rafRef.current)
    if (!minuteur) return
    const tick = () => {
      const r = 1 - (performance.now() - t0Ref.current) / dureeMs()
      ratioRef.current = Math.max(0, r)
      const fill = fillRef.current
      if (fill) {
        fill.style.transform = `scaleX(${Math.max(0, r)})`
        fill.classList.toggle('low', r < 0.25)
      }
      if (r <= 0) {
        declencherTimeout()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, minuteur])

  function enregistrerReponse(correcte: boolean, valeur: number | string) {
    const r = recompense(correcte, correcte ? streak + 1 : 0, minuteur, ratioRef.current)
    setStreak(correcte ? streak + 1 : 0)
    setBestStreak((b) => Math.max(b, correcte ? streak + 1 : 0))
    setScore((s) => s + r.points + r.bonus)
    logRef.current = [...logRef.current, { question, valeur, correcte, tempsEcoule: (performance.now() - t0Ref.current) / 1000 }]
    return r
  }

  function repondreQcm(pos: number) {
    if (locked || question.type !== 'qcm') return
    setLocked(true)
    cancelAnimationFrame(rafRef.current)
    const q = question as QuestionQcm
    const ci = ordre![pos]
    const correcte = ci === q.reponse
    const r = enregistrerReponse(correcte, ci)
    setResultatTuiles({ correctPos: ordre!.indexOf(q.reponse), choisiPos: pos })
    setFeedback({ kind: correcte ? 'ok' : 'ko', titre: correcte ? 'Bonne réponse' : 'Raté', pts: r.points, bonus: r.bonus, explication: q.explication })
    jouerSon(correcte ? [660, 880] : [200, 150], correcte ? 0.09 : 0.14)
  }

  function reveler() {
    if (locked || question.type !== 'ouverte') return
    setRevealed(true)
    cancelAnimationFrame(rafRef.current)
  }

  function graderOuverte(correcte: boolean) {
    if (locked) return
    setLocked(true)
    const r = enregistrerReponse(correcte, correcte ? 'maitrisait' : 'a-revoir')
    setFeedback({ kind: correcte ? 'ok' : 'ko', titre: correcte ? 'Bien joué' : 'À retravailler', pts: r.points, bonus: r.bonus, explication: '' })
    jouerSon(correcte ? [660, 880] : [200, 150], correcte ? 0.09 : 0.14)
  }

  function declencherTimeout() {
    setLocked((dejaLocked) => {
      if (dejaLocked) return dejaLocked
      const q = question
      logRef.current = [...logRef.current, { question: q, valeur: q.type === 'qcm' ? -1 : '', correcte: false, tempsEcoule: minuteur }]
      setStreak(0)
      if (q.type === 'qcm') setResultatTuiles({ correctPos: ordre!.indexOf(q.reponse), choisiPos: null })
      else setRevealed(true)
      setFeedback({ kind: 'ko', titre: 'Temps écoulé', pts: 0, bonus: 0, explication: q.type === 'qcm' ? q.explication : '' })
      jouerSon([200, 150], 0.14)
      return true
    })
  }

  function suivant() {
    if (derniere) {
      onTerminer({ reponses: logRef.current, score, meilleureSerie: bestStreak })
      return
    }
    setIndex((i) => i + 1)
  }

  function quitter() {
    if (armeAbandon) {
      clearTimeout(armeTimerRef.current)
      onQuitter()
      return
    }
    setArmeAbandon(true)
    armeTimerRef.current = window.setTimeout(() => setArmeAbandon(false), 3000)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      const surBouton = e.target instanceof HTMLElement && e.target.tagName === 'BUTTON'
      if (!locked && question.type === 'qcm') {
        let n = '1234'.indexOf(k)
        if (n < 0) n = 'abcd'.indexOf(k)
        if (n >= 0 && k.length === 1) {
          e.preventDefault()
          repondreQcm(n)
        }
      } else if (!locked && question.type === 'ouverte' && !revealed && (k === ' ' || k === 'enter') && !surBouton) {
        e.preventDefault()
        reveler()
      } else if (locked && (k === 'arrowright' || ((k === ' ' || k === 'enter') && !surBouton))) {
        e.preventDefault()
        suivant()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  return (
    <section className="quiz-game">
      <div className="quiz-hud">
        <span className="quiz-pill">
          Q {index + 1}/{questions.length}
        </span>
        {streak >= 2 && <span className="quiz-pill">Série ×{streak}</span>}
        <button type="button" className="quiz-quit" onClick={quitter}>
          {armeAbandon ? "Confirmer l'abandon" : 'Quitter'}
        </button>
        <span className="quiz-score quiz-pill">{fmt(score)} pts</span>
      </div>
      {minuteur > 0 && (
        <div className="quiz-track">
          <div className="quiz-fill" ref={fillRef} />
        </div>
      )}
      <div className="quiz-progress">
        <i style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="card quiz-qcard">
        <div className="quiz-meta">
          <span className="quiz-tag">
            {question.competence} · {themeLabel(question.theme)}
          </span>
          <span className="quiz-tag">{question.niveau}</span>
          {question.type === 'ouverte' && <span className="quiz-tag quiz-tag--open">Question ouverte</span>}
        </div>
        {parties.extrait && (
          <blockquote className="quiz-extrait" lang="en">
            {parties.extrait}
          </blockquote>
        )}
        <p className="quiz-qtext">{parties.enonce}</p>
        {parties.code && <pre className="quiz-code">{parties.code}</pre>}
      </div>

      {question.type === 'qcm' ? (
        <div className="quiz-tiles" role="group" aria-label="Réponses">
          {ordre!.map((ci, pos) => {
            const estCorrecte = resultatTuiles !== null && pos === resultatTuiles.correctPos
            const estChoisie = resultatTuiles !== null && pos === resultatTuiles.choisiPos
            const estAtone = resultatTuiles !== null && !estCorrecte && !estChoisie
            return (
              <button
                key={pos}
                type="button"
                className={`quiz-tile quiz-tile--${pos}${estCorrecte ? ' quiz-tile--right' : ''}${estAtone ? ' quiz-tile--dim' : ''}`}
                disabled={locked}
                onClick={() => repondreQcm(pos)}
              >
                <svg className="quiz-shape" viewBox="0 0 24 24" aria-hidden>
                  {FORMES[pos]}
                </svg>
                <span className="quiz-tile-txt">{question.choix[ci]}</span>
                <kbd>{pos + 1}</kbd>
                {estCorrecte && (
                  <span className="quiz-badge quiz-badge--ok" aria-hidden>
                    ✓
                  </span>
                )}
                {estChoisie && !estCorrecte && (
                  <span className="quiz-badge quiz-badge--ko" aria-hidden>
                    ✕
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="quiz-open-box">
          {!revealed && !locked && (
            <button type="button" className="btn" onClick={reveler}>
              Afficher la réponse attendue
            </button>
          )}
          {revealed && (
            <div className="quiz-answer">
              <h3>Réponse attendue</h3>
              {question.reponse_attendue}
            </div>
          )}
          {revealed && !locked && (
            <div className="quiz-row" role="group" aria-label="Auto-évaluation">
              <button type="button" className="btn quiz-btn--good" onClick={() => graderOuverte(true)} autoFocus>
                Je maîtrisais
              </button>
              <button type="button" className="btn quiz-btn--bad" onClick={() => graderOuverte(false)}>
                À revoir
              </button>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className={`card quiz-fb quiz-fb--${feedback.kind}`} aria-live="polite">
          <h2>
            {feedback.titre}
            {feedback.pts + feedback.bonus > 0 && (
              <span className="quiz-pts">
                +{fmt(feedback.pts + feedback.bonus)} pts{feedback.bonus ? ` (dont série +${feedback.bonus})` : ''}
              </span>
            )}
          </h2>
          {feedback.explication && (
            <p>
              <span className="quiz-lbl">Explication</span>
              <br />
              {feedback.explication}
            </p>
          )}
          <div className="quiz-row">
            <button type="button" className="btn" onClick={suivant} autoFocus>
              {derniere ? 'Voir le bilan' : 'Question suivante'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
