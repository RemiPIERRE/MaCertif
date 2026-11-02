import { hljs, getLangage, SOUS_ENSEMBLE_AUTO } from './languages'

export function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

/**
 * Détection automatique du langage (option « auto ») : on garde highlight.js
 * pour cette seule tâche (sa détection heuristique reste utile) mais on jette
 * sa coloration HTML — la coloration de l'export/aperçu passe par Shiki, voir
 * shikiHighlight.ts, pour une bien meilleure fidélité (notamment en JSX/TSX).
 */
export function detecterLangageAuto(code: string): { id: string; label: string } | null {
  const propre = code.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (propre.trim() === '') return null
  const r = hljs.highlightAuto(propre, SOUS_ENSEMBLE_AUTO)
  const nom = r.language
  if (!nom) return null
  if (nom === 'xml') return { id: 'html', label: 'HTML' }
  const def = getLangage(nom)
  return def ? { id: def.id, label: def.label } : { id: nom, label: nom }
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

export type LigneAffichage =
  | { type: 'ligne'; numero: number; html: string }
  | { type: 'masque'; debut: number; fin: number }
  | { type: 'ligne-jointe'; numero: number; html: string; numeroFin: number; htmlFin: string }

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

/**
 * Retire l'indentation de début de ligne (espaces/tabulations avant le premier
 * caractère visible) d'un HTML coloré, en traversant les balises <span>/</span>
 * sans y toucher. Utilisé pour la ligne qui suit un « … » en mode compact :
 * son indentation d'origine (pensée pour sa propre ligne, à son propre niveau
 * d'imbrication) n'a plus de sens une fois recollée juste après un « … » sur
 * la même rangée — sans ce nettoyage, un grand vide apparaît avant la balise
 * fermante.
 */
function retirerIndentationDebut(html: string): string {
  let sortie = ''
  let enIndentation = true
  for (let i = 0; i < html.length; i++) {
    const c = html[i]
    if (c === '<') {
      const fin = html.indexOf('>', i)
      if (fin === -1) {
        sortie += html.slice(i)
        break
      }
      sortie += html.slice(i, fin + 1)
      i = fin
      continue
    }
    if (enIndentation && (c === ' ' || c === '\t')) continue
    enIndentation = false
    sortie += c
  }
  return sortie
}

/**
 * Mode compact (façon éditeur de code) : remplace chaque repère « N lignes
 * masquées » par la fusion de la ligne visible juste avant et juste après sur
 * une seule rangée, séparées par un « … » — identique au pli d'un bloc dans
 * CodeMirror (`<select defaultValue="user">…</select>`). Un masquage en tout
 * début ou toute fin d'extrait (sans ligne de part et d'autre) n'a rien à
 * fusionner : il disparaît silencieusement, comme avant l'ajout de ce mode.
 */
export function compacterMasquage(groupes: LigneAffichage[]): LigneAffichage[] {
  const out: LigneAffichage[] = []
  for (let i = 0; i < groupes.length; i++) {
    const g = groupes[i]
    if (g.type !== 'masque') {
      out.push(g)
      continue
    }
    const avant = out[out.length - 1]
    const apres = groupes[i + 1]
    if (avant?.type === 'ligne' && apres?.type === 'ligne') {
      out.pop()
      out.push({
        type: 'ligne-jointe',
        numero: avant.numero,
        html: avant.html,
        numeroFin: apres.numero,
        htmlFin: retirerIndentationDebut(apres.html),
      })
      i++ // la ligne « après » est consommée dans la fusion
    }
  }
  return out
}
