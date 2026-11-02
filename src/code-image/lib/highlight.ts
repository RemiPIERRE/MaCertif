import { hljs, getLangage, SOUS_ENSEMBLE_AUTO } from './languages'

export interface Colore {
  /** une entrée HTML (balises <span class="hljs-…">) par ligne */
  lignes: string[]
  /** libellé du langage trouvé par l'auto-détection, sinon null */
  langageDetecte: string | null
}

function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

/**
 * Découpe un HTML coloré en lignes en gardant les <span> équilibrés : un commentaire
 * ou une chaîne sur plusieurs lignes est refermé en fin de ligne puis rouvert à la suivante.
 */
export function decouperEnLignes(html: string): string[] {
  const lignes: string[] = []
  const pile: string[] = []
  let courante = ''
  const re = /<span[^>]*>|<\/span>|\n|[^<\n]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const tok = m[0]
    if (tok === '\n') {
      lignes.push(courante + '</span>'.repeat(pile.length))
      courante = pile.join('')
    } else if (tok === '</span>') {
      pile.pop()
      courante += tok
    } else if (tok.startsWith('<span')) {
      pile.push(tok)
      courante += tok
    } else {
      courante += tok
    }
  }
  lignes.push(courante + '</span>'.repeat(pile.length))
  return lignes
}

export function colorer(code: string, langage: string): Colore {
  const propre = code.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (propre.trim() === '') return { lignes: [], langageDetecte: null }

  let html: string
  let detecte: string | null = null
  if (langage === 'plaintext') {
    html = echapper(propre)
  } else if (langage === 'auto') {
    const r = hljs.highlightAuto(propre, SOUS_ENSEMBLE_AUTO)
    html = r.value
    const nom = r.language
    if (nom) {
      detecte = nom === 'xml' ? 'HTML' : (getLangage(nom)?.label ?? nom)
    }
  } else {
    const def = getLangage(langage)
    html = def
      ? hljs.highlight(propre, { language: def.hljs, ignoreIllegals: true }).value
      : echapper(propre)
  }
  return { lignes: decouperEnLignes(html), langageDetecte: detecte }
}

/** « 3-5, 9 » → {3,4,5,9}. Les morceaux invalides sont ignorés. Plafonné pour éviter les abus. */
export function analyserLignes(spec: string): Set<number> {
  const out = new Set<number>()
  for (const morceau of spec.split(/[,;\s]+/)) {
    if (!morceau) continue
    const m = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(morceau)
    if (!m) continue
    const a = Number(m[1])
    const b = m[2] ? Number(m[2]) : a
    const [debut, fin] = a <= b ? [a, b] : [b, a]
    for (let i = debut; i <= Math.min(fin, debut + 2000); i++) out.add(i)
  }
  return out
}

export type LigneAffichage = { type: 'ligne'; numero: number; html: string } | { type: 'masque'; debut: number; fin: number }

/**
 * Regroupe les lignes colorées pour l'affichage : les lignes masquées consécutives
 * deviennent un seul repère « N lignes masquées » plutôt que de disparaître
 * silencieusement. La numérotation des lignes visibles reste celle d'origine
 * (premiereLigne + position dans le texte complet) : masquer n'est jamais
 * renuméroter, contrairement à une suppression pure et simple du texte.
 */
export function grouperLignes(lignes: string[], premiereLigne: number, masquees: Set<number>): LigneAffichage[] {
  const out: LigneAffichage[] = []
  let debutMasque: number | null = null
  for (let i = 0; i < lignes.length; i++) {
    const numero = premiereLigne + i
    if (masquees.has(numero)) {
      if (debutMasque === null) debutMasque = numero
      continue
    }
    if (debutMasque !== null) {
      out.push({ type: 'masque', debut: debutMasque, fin: numero - 1 })
      debutMasque = null
    }
    out.push({ type: 'ligne', numero, html: lignes[i] })
  }
  if (debutMasque !== null) out.push({ type: 'masque', debut: debutMasque, fin: premiereLigne + lignes.length - 1 })
  return out
}
