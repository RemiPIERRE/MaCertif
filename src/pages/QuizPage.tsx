import { lazy, Suspense } from 'react'

// Chargé à la demande : les ~1400 questions embarquées (plusieurs centaines de Ko)
// ne doivent jamais faire partie du bundle principal, seulement de l'onglet "Quizz
// révision" une fois réellement ouvert (même discipline que "Mes extraits de code").
const QuizApp = lazy(() => import('../quiz').then((m) => ({ default: m.QuizApp })))

export function QuizPage() {
  return (
    <Suspense fallback={<p className="page-lede">Chargement du quiz…</p>}>
      <QuizApp />
    </Suspense>
  )
}
