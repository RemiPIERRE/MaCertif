import raw from './questions.json'
import type { Question } from '../types'

export const QUESTIONS = raw as unknown as Question[]
