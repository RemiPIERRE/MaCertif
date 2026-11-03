import { useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { STORAGE_KEYS } from '../../types/storage'
import { QUESTIONS } from '../data/questions'
import { themeKey } from '../lib/labels'
import { draw, pool } from '../lib/quizLogic'
import type { PartieTerminee, Question, Reglages } from '../types'
import { SetupScreen } from './SetupScreen'
import { GameScreen } from './GameScreen'
import { ResultsScreen } from './ResultsScreen'
import '../quiz.css'

type Ecran = 'reglages' | 'jeu' | 'bilan'

function reglagesParDefaut(questions: Question[]): Reglages {
  return {
    themes: new Set(questions.map((q) => themeKey(q.competence, q.theme))),
    nombre: 25,
    minuteur: 20,
    mode: 'mix',
    niveaux: new Set(['facile', 'moyen', 'difficile']),
  }
}

export function QuizApp() {
  const [meilleurScore, setMeilleurScore] = useLocalStorage<number>(STORAGE_KEYS.quiz, 0)
  const [reglages, setReglages] = useState<Reglages>(() => reglagesParDefaut(QUESTIONS))
  const [equilibrer, setEquilibrer] = useState(true)
  const [son, setSon] = useState(false)
  const [ecran, setEcran] = useState<Ecran>('reglages')
  const [partie, setPartie] = useState<Question[] | null>(null)
  const [bilan, setBilan] = useState<PartieTerminee | null>(null)

  const selection = useMemo(() => pool(QUESTIONS, reglages), [reglages])

  function lancerAvec(questions: Question[]) {
    setPartie(questions)
    setBilan(null)
    setEcran('jeu')
  }
  const lancerPartie = () => lancerAvec(draw(selection, Math.min(reglages.nombre, selection.length), equilibrer))

  function terminerPartie(resultat: PartieTerminee) {
    if (resultat.score > meilleurScore) setMeilleurScore(resultat.score)
    setBilan(resultat)
    setEcran('bilan')
  }
  function abandonnerPartie() {
    setPartie(null)
    setEcran('reglages')
  }
  function modifierSelection() {
    setBilan(null)
    setEcran('reglages')
  }

  return (
    <div className="quiz-root">
      {ecran === 'reglages' && (
        <SetupScreen
          questions={QUESTIONS}
          reglages={reglages}
          onReglages={setReglages}
          equilibrer={equilibrer}
          onEquilibrer={setEquilibrer}
          son={son}
          onSon={setSon}
          selection={selection}
          nombreTire={Math.min(reglages.nombre, selection.length)}
          meilleurScore={meilleurScore}
          onLancer={lancerPartie}
        />
      )}
      {ecran === 'jeu' && partie && (
        <GameScreen questions={partie} minuteur={reglages.minuteur} son={son} onTerminer={terminerPartie} onQuitter={abandonnerPartie} />
      )}
      {ecran === 'bilan' && bilan && (
        <ResultsScreen
          bilan={bilan}
          meilleurScore={meilleurScore}
          onRejouer={lancerPartie}
          onRefaireErreurs={() => lancerAvec(bilan.reponses.filter((r) => !r.correcte).map((r) => r.question))}
          onModifierSelection={modifierSelection}
        />
      )}
    </div>
  )
}
