import { useEffect, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { foldedRanges } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { extensionPourLangage } from '../lib/codemirrorLangages'

export interface PlageLignes {
  debut: number
  fin: number
}

interface Props {
  value: string
  onChange: (value: string) => void
  langageId: string | null
  maxLength: number
  placeholder?: string
  /**
   * Appelé quand les plis (repliement de blocs) changent dans l'éditeur, avec les
   * numéros de ligne repliés (relatifs au document de l'éditeur, 1-based, bornes
   * exclues — la ligne de l'accolade ouvrante/fermante reste visible, comme dans
   * l'éditeur lui-même). L'hôte convertit vers la numérotation affichée (via
   * `premiereLigne`) et alimente `Reglages.lignesMasquees`.
   */
  onFoldedLinesChange?: (plages: PlageLignes[]) => void
}

const langageCompartment = new Compartment()

/** DecorationSet (plis) -> plages de lignes internes, bornes exclues. */
function plagesDepuisPlis(state: EditorState): PlageLignes[] {
  const plages: PlageLignes[] = []
  const cur = foldedRanges(state).iter()
  while (cur.value) {
    const debut = state.doc.lineAt(cur.from).number + 1
    const fin = state.doc.lineAt(cur.to).number - 1
    if (debut <= fin) plages.push({ debut, fin })
    cur.next()
  }
  return plages
}

/**
 * Un vrai éditeur de code (CodeMirror 6) : coloration en direct, repliement de
 * blocs, numéros de lignes, historique d'annulation. Entièrement séparé du rendu
 * de l'image exportée (toujours highlight.js + les thèmes de l'app) — voir
 * lib/codemirrorLangages.ts.
 *
 * Contrôlé "à la React" sans combattre CodeMirror : `value` ne réécrit le
 * document que lorsqu'il diffère réellement du contenu actuel de l'éditeur (donc
 * jamais lors d'une frappe normale, qui va déjà dans le même sens via onChange),
 * ce qui évite de faire sauter le curseur à chaque caractère tapé.
 */
export function CodeEditor({ value, onChange, langageId, maxLength, placeholder, onFoldedLinesChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onFoldedLinesChangeRef = useRef(onFoldedLinesChange)
  onFoldedLinesChangeRef.current = onFoldedLinesChange
  const dernieresPlagesRef = useRef<string>('')

  useEffect(() => {
    if (!hostRef.current) return
    // La grammaire du langage initial est appliquée juste après (effet ci-dessous,
    // qui tourne aussi au montage) : pas de langage ici pour ne jamais bloquer
    // l'affichage de l'éditeur sur un import() réseau.
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        oneDark,
        langageCompartment.of([]),
        EditorView.lineWrapping,
        ...(placeholder ? [placeholderExtension(placeholder)] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const next = update.state.doc.toString()
            onChangeRef.current(next.length > maxLength ? next.slice(0, maxLength) : next)
          }
          const plages = plagesDepuisPlis(update.state)
          const signature = plages.map((p) => `${p.debut}-${p.fin}`).join(',')
          if (signature === dernieresPlagesRef.current) return
          // Un remplacement intégral du document (changement d'extrait, "Effacer le
          // code") réinitialise forcément les plis — ça ne doit jamais écraser le
          // champ "Lignes à masquer" du NOUVEL extrait affiché : on resynchronise la
          // référence sans prévenir l'hôte.
          const estUneResynchronisation = update.transactions.some((tr) => tr.isUserEvent('macertif.sync'))
          dernieresPlagesRef.current = signature
          if (!estUneResynchronisation) onFoldedLinesChangeRef.current?.(plages)
        }),
      ],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => view.destroy()
    // Montée une seule fois : value/langageId initiaux suffisent, les mises à jour
    // suivantes passent par les effets ci-dessous (reconfiguration, pas recréation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (view.state.doc.toString() === value) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value }, userEvent: 'macertif.sync' })
  }, [value])

  // Grammaire chargée à la demande (voir lib/codemirrorLangages.ts) : un garde
  // d'obsolescence évite qu'un import() lent pour un langage quitté entre-temps
  // n'écrase la coloration du langage sélectionné depuis.
  useEffect(() => {
    let annule = false
    extensionPourLangage(langageId ?? '').then((ext) => {
      if (annule) return
      const view = viewRef.current
      if (!view) return
      view.dispatch({ effects: langageCompartment.reconfigure(ext ?? []) })
    })
    return () => {
      annule = true
    }
  }, [langageId])

  return <div ref={hostRef} className="ci-codemirror" />
}
