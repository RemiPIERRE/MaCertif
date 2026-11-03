import { useMemo } from 'react'
import type { Competence, Mode, Niveau, Question, Reglages } from '../types'
import { COMPETENCES, themeKey, themeLabel } from '../lib/labels'

interface Props {
  questions: Question[]
  reglages: Reglages
  onReglages: (r: Reglages) => void
  equilibrer: boolean
  onEquilibrer: (v: boolean) => void
  son: boolean
  onSon: (v: boolean) => void
  selection: Question[]
  nombreTire: number
  meilleurScore: number
  onLancer: () => void
}

const OPTIONS_NOMBRE = [20, 25, 30]
const OPTIONS_MINUTEUR: [number, string][] = [[0, 'Sans'], [15, '15 s'], [20, '20 s'], [30, '30 s'], [60, '60 s']]
const OPTIONS_MODE: [Mode, string][] = [['qcm', 'QCM'], ['mix', 'QCM + ouvertes'], ['ouverte', 'Ouvertes']]
const OPTIONS_NIVEAU: [Niveau, string][] = [['facile', 'Facile'], ['moyen', 'Moyen'], ['difficile', 'Difficile']]
const PRESETS: [string, (c: Competence) => boolean][] = [
  ['Tout', () => true],
  ['Aucun', () => false],
  ['Front (C1 à C4)', (c) => ['C1', 'C2', 'C3', 'C4'].includes(c)],
  ['Back (C5 à C8)', (c) => ['C5', 'C6', 'C7', 'C8'].includes(c)],
]

const fmt = (n: number) => n.toLocaleString('fr-FR')

export function SetupScreen({ questions, reglages: r, onReglages, equilibrer, onEquilibrer, son, onSon, selection, nombreTire, meilleurScore, onLancer }: Props) {
  const parComp = useMemo(() => {
    const out = new Map<Competence, Map<string, number>>()
    for (const q of questions) {
      const parTheme = out.get(q.competence) ?? new Map<string, number>()
      parTheme.set(q.theme, (parTheme.get(q.theme) ?? 0) + 1)
      out.set(q.competence, parTheme)
    }
    return out
  }, [questions])

  const patch = (p: Partial<Reglages>) => onReglages({ ...r, ...p })

  const toggleTheme = (key: string) => {
    const next = new Set(r.themes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    patch({ themes: next })
  }
  const toggleNiveau = (n: Niveau) => {
    const next = new Set(r.niveaux)
    if (next.has(n)) {
      if (next.size > 1) next.delete(n)
    } else next.add(n)
    patch({ niveaux: next })
  }
  const appliquerPreset = (filtre: (c: Competence) => boolean) => {
    const next = new Set<string>()
    for (const [c, parTheme] of parComp) if (filtre(c)) for (const t of parTheme.keys()) next.add(themeKey(c, t))
    patch({ themes: next })
  }
  const toggleCompetence = (c: Competence, themes: string[]) => {
    const cles = themes.map((t) => themeKey(c, t))
    const toutesCochees = cles.every((k) => r.themes.has(k))
    const next = new Set(r.themes)
    cles.forEach((k) => (toutesCochees ? next.delete(k) : next.add(k)))
    patch({ themes: next })
  }

  return (
    <section className="quiz-setup">
      <header className="page-header quiz-setup-top">
        <div>
          <div className="page-eyebrow">Titre professionnel DWWM · RNCP 37674</div>
          <h1>Quizz révision</h1>
          <p className="page-lede">{fmt(questions.length)} questions sur les 8 compétences. Choisis tes thèmes : le tirage mélange le tout.</p>
        </div>
        {meilleurScore > 0 && (
          <div className="quiz-best">
            Meilleur score <b>{fmt(meilleurScore)} pts</b>
          </div>
        )}
      </header>

      <div className="card quiz-settings">
        <div className="quiz-group">
          <h2>Questions</h2>
          <div className="quiz-seg">
            {OPTIONS_NOMBRE.map((n) => (
              <button key={n} type="button" aria-pressed={r.nombre === n} onClick={() => patch({ nombre: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="quiz-group">
          <h2>Minuteur</h2>
          <div className="quiz-seg">
            {OPTIONS_MINUTEUR.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={r.minuteur === v} onClick={() => patch({ minuteur: v })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="quiz-group">
          <h2>Types</h2>
          <div className="quiz-seg">
            {OPTIONS_MODE.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={r.mode === v} onClick={() => patch({ mode: v })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="quiz-group">
          <h2>Niveaux</h2>
          <div className="quiz-seg">
            {OPTIONS_NIVEAU.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={r.niveaux.has(v)} onClick={() => toggleNiveau(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="quiz-group">
          <div className="quiz-lbl">Options</div>
          <div className="quiz-switches">
            <label className="quiz-switch">
              <input type="checkbox" checked={equilibrer} onChange={(e) => onEquilibrer(e.target.checked)} />
              <span className="quiz-switch-box" />
              Équilibrer les thèmes dans le tirage
            </label>
            <label className="quiz-switch">
              <input type="checkbox" checked={son} onChange={(e) => onSon(e.target.checked)} />
              <span className="quiz-switch-box" />
              Effets sonores
            </label>
          </div>
        </div>
      </div>

      <div className="quiz-presets">
        <span className="quiz-lbl">Thèmes</span>
        {PRESETS.map(([label, filtre]) => (
          <button key={label} type="button" className="quiz-chip-btn" onClick={() => appliquerPreset(filtre)}>
            {label}
          </button>
        ))}
      </div>

      <div className="quiz-comps">
        {Object.keys(COMPETENCES).map((cId) => {
          const c = cId as Competence
          const parTheme = parComp.get(c)
          if (!parTheme) return null
          const themes = [...parTheme.keys()].sort((a, b) => parTheme.get(b)! - parTheme.get(a)!)
          const cles = themes.map((t) => themeKey(c, t))
          const nSelection = cles.filter((k) => r.themes.has(k)).length
          const nQuestions = themes.filter((t) => r.themes.has(themeKey(c, t))).reduce((s, t) => s + (parTheme.get(t) ?? 0), 0)
          const etat = nSelection === 0 ? 'off' : nSelection === cles.length ? 'on' : 'some'
          return (
            <article key={c} className={`card quiz-comp quiz-comp--${etat}`}>
              <button
                type="button"
                className="quiz-comp-head"
                role="checkbox"
                aria-checked={etat === 'on' ? 'true' : etat === 'some' ? 'mixed' : 'false'}
                aria-label={`${c} ${COMPETENCES[c].titre}`}
                onClick={() => toggleCompetence(c, themes)}
              >
                <span className="quiz-cid">{c}</span>
                <span>
                  <span className="quiz-ctitle">{COMPETENCES[c].titre}</span>
                  <br />
                  <span className="quiz-csub">
                    {nSelection}/{cles.length} thèmes · {fmt(nQuestions)} questions
                  </span>
                </span>
                <span className="quiz-cstate" aria-hidden>
                  {etat === 'on' && '✓'}
                  {etat === 'some' && '–'}
                </span>
              </button>
              <div className="quiz-chips" role="group" aria-label={`Thèmes ${c}`}>
                {themes.map((t) => {
                  const k = themeKey(c, t)
                  return (
                    <button key={k} type="button" className="quiz-chip" aria-pressed={r.themes.has(k)} onClick={() => toggleTheme(k)}>
                      {themeLabel(t)} <i>{parTheme.get(t)}</i>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>

      <div className="quiz-launch">
        <div className="card quiz-launch-inner">
          <div className="quiz-sum">
            <b>{fmt(selection.length)}</b> {selection.length > 1 ? 'questions dans la sélection' : 'question dans la sélection'}
            <small>
              {selection.length
                ? `Tirage de ${fmt(nombreTire)} au hasard · ${r.minuteur ? `${r.minuteur} s par question` : 'sans minuteur'}`
                : 'Choisis au moins un thème (ou élargis les types et niveaux).'}
            </small>
          </div>
          <button type="button" className="btn btn-primary quiz-go" disabled={selection.length === 0} onClick={onLancer}>
            Lancer la partie
          </button>
        </div>
      </div>
    </section>
  )
}
