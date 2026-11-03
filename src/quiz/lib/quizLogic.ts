import type { Niveau, Question, Reglages } from '../types'
import { themeKey } from './labels'

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Questions correspondant aux réglages courants (thèmes, niveaux, type). */
export function pool(questions: Question[], r: Reglages): Question[] {
  return questions.filter(
    (q) => r.themes.has(themeKey(q.competence, q.theme)) && r.niveaux.has(q.niveau) && (r.mode === 'mix' || (r.mode === 'qcm') === (q.type === 'qcm')),
  )
}

/**
 * Tire `n` questions. En mode équilibré (par défaut) : répartition en tour de
 * rôle entre thèmes pour éviter qu'un thème très fourni n'écrase les autres ;
 * sinon tirage purement aléatoire.
 */
export function draw(p: Question[], n: number, equilibre: boolean): Question[] {
  if (!equilibre) return shuffle(p).slice(0, n)
  const buckets = new Map<string, Question[]>()
  for (const q of shuffle(p)) {
    const k = themeKey(q.competence, q.theme)
    const liste = buckets.get(k) ?? []
    liste.push(q)
    buckets.set(k, liste)
  }
  let lists = shuffle([...buckets.values()])
  const out: Question[] = []
  while (out.length < n && lists.length) {
    lists = lists.filter((l) => l.length > 0)
    for (let i = 0; i < lists.length && out.length < n; i++) out.push(lists[i].shift()!)
  }
  return shuffle(out)
}

export interface Recompense {
  points: number
  bonus: number
}

/**
 * Barème : 1000 pts si correct sans minuteur, sinon dégressif selon le temps
 * restant (entre 500 et 1000 pts) ; bonus de série de +100 pts par réponse
 * consécutive correcte au-delà de la première, plafonné à +500.
 */
export function recompense(correcte: boolean, serieEnCours: number, minuteurSecondes: number, ratioTempsRestant: number): Recompense {
  if (!correcte) return { points: 0, bonus: 0 }
  const points = minuteurSecondes ? Math.round(1000 * (0.5 + 0.5 * ratioTempsRestant)) : 1000
  const bonus = serieEnCours >= 2 ? Math.min(serieEnCours - 1, 5) * 100 : 0
  return { points, bonus }
}

export interface QuestionDecoupee {
  extrait?: string
  enonce: string
  code?: string
}

/**
 * Certaines questions embarquent un extrait (anglais technique) ou un bloc de
 * code (thèmes « lecture-… ») séparé de l'énoncé par une ligne vide.
 */
export function decouperQuestion(q: Question): QuestionDecoupee {
  const t = q.question
  const i = t.indexOf('\n\n')
  if (i < 0) return { enonce: t }
  const a = t.slice(0, i)
  const b = t.slice(i + 2)
  if (q.theme === 'anglais') return { extrait: a.replace(/^Extrait\s*:\s*/, ''), enonce: b }
  if (q.theme.startsWith('lecture-')) return { enonce: a, code: b }
  return { enonce: t }
}

export const NIVEAUX: Niveau[] = ['facile', 'moyen', 'difficile']
