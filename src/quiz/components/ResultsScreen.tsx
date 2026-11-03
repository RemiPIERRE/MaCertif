import { useMemo } from 'react'
import type { Competence, PartieTerminee } from '../types'
import { COMPETENCES, themeLabel } from '../lib/labels'
import { decouperQuestion } from '../lib/quizLogic'

interface Props {
  bilan: PartieTerminee
  meilleurScore: number
  onRejouer: () => void
  onRefaireErreurs: () => void
  onModifierSelection: () => void
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

export function ResultsScreen({ bilan, meilleurScore, onRejouer, onRefaireErreurs, onModifierSelection }: Props) {
  const { reponses, score, meilleureSerie } = bilan
  const n = reponses.length
  const nOk = reponses.filter((r) => r.correcte).length
  const pct = n ? Math.round((nOk / n) * 100) : 0
  const tempsMoyen = n ? reponses.reduce((s, r) => s + r.tempsEcoule, 0) / n : 0
  const estMeilleurScore = score > 0 && score >= meilleurScore
  const verdict =
    pct >= 90 ? 'Prêt pour le jury.' : pct >= 75 ? 'Solide. Quelques points à consolider.' : pct >= 50 ? 'En bonne voie. Reprends tes erreurs ci-dessous.' : 'À retravailler. Relis les explications puis relance une partie.'

  const parCompetence = useMemo(() => {
    const out = new Map<Competence, { ok: number; total: number }>()
    for (const r of reponses) {
      const entry = out.get(r.question.competence) ?? { ok: 0, total: 0 }
      entry.total++
      if (r.correcte) entry.ok++
      out.set(r.question.competence, entry)
    }
    return [...out.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [reponses])

  const erreurs = reponses.filter((r) => !r.correcte)

  return (
    <section className="quiz-results">
      <div className="card quiz-hero">
        <div>
          <p className="quiz-eyebrow">{estMeilleurScore && meilleurScore > 0 ? 'Nouveau meilleur score' : 'Partie terminée'}</p>
          <div className="quiz-bigscore">{fmt(score)} pts</div>
          <p className="quiz-verdict">
            {pct} % de bonnes réponses. {verdict}
          </p>
        </div>
        <div className="quiz-stats">
          <div className="quiz-stat">
            <b>
              {nOk}/{n}
            </b>
            <span>bonnes réponses</span>
          </div>
          <div className="quiz-stat">
            <b>×{meilleureSerie}</b>
            <span>meilleure série</span>
          </div>
          <div className="quiz-stat">
            <b>{tempsMoyen.toFixed(1).replace('.', ',')} s</b>
            <span>temps moyen</span>
          </div>
        </div>
      </div>

      <h2 className="quiz-sec-title">Résultat par compétence</h2>
      <div className="card quiz-bars">
        {parCompetence.map(([c, { ok, total }]) => {
          const r = total ? ok / total : 0
          const couleur = r >= 0.75 ? 'var(--green)' : r >= 0.5 ? 'var(--amber)' : 'var(--red)'
          return (
            <div key={c} className="quiz-bar-row">
              <span className="quiz-bar-name">
                <b>{c}</b> {COMPETENCES[c].titre}
              </span>
              <div className="quiz-meter">
                <i style={{ width: `${Math.round(r * 100)}%`, background: couleur }} />
              </div>
              <span className="quiz-bar-val">
                {ok}/{total}
              </span>
            </div>
          )
        })}
      </div>

      <h2 className="quiz-sec-title">{erreurs.length ? `À revoir (${erreurs.length})` : 'À revoir'}</h2>
      <div className="quiz-review">
        {erreurs.length === 0 ? (
          <div className="card quiz-empty">Aucune erreur sur cette partie.</div>
        ) : (
          erreurs.map((r, i) => {
            const q = r.question
            const parties = decouperQuestion(q)
            return (
              <details key={`${q.id}-${i}`} className="card quiz-rev">
                <summary>
                  <span className="quiz-rq">{parties.enonce}</span>
                  <span className="quiz-tag">
                    {q.competence} · {themeLabel(q.theme)}
                  </span>
                </summary>
                <div className="quiz-rev-body">
                  {parties.extrait && <p lang="en">{parties.extrait}</p>}
                  {parties.code && <pre className="quiz-code">{parties.code}</pre>}
                  {q.type === 'qcm' ? (
                    <>
                      <p className="quiz-good">Bonne réponse : {q.choix[q.reponse]}</p>
                      <p className="quiz-yours">{typeof r.valeur === 'number' && r.valeur >= 0 ? `Ta réponse : ${q.choix[r.valeur]}` : 'Pas de réponse (temps écoulé)'}</p>
                      <p>{q.explication}</p>
                    </>
                  ) : (
                    <p className="quiz-good">Réponse attendue : {q.reponse_attendue}</p>
                  )}
                </div>
              </details>
            )
          })
        )}
      </div>

      <div className="quiz-actions">
        <button type="button" className="btn btn-primary" onClick={onRejouer}>
          Rejouer avec la même sélection
        </button>
        {erreurs.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={onRefaireErreurs}>
            Refaire mes erreurs
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onModifierSelection}>
          Modifier la sélection
        </button>
      </div>
    </section>
  )
}
