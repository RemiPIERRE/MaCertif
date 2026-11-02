import type { Extension } from '@codemirror/state'
import { StreamLanguage } from '@codemirror/language'

/**
 * Coloration en direct dans l'éditeur (CodeMirror), indépendante du rendu de
 * l'image exportée (toujours highlight.js, voir lib/highlight.ts — deux moteurs
 * séparés, par choix : l'éditeur sert au confort de frappe, highlight.js + les
 * thèmes gèrent le rendu final soigné). Une langue absente d'ici édite quand même
 * normalement, simplement sans coloration dans l'éditeur ; l'image exportée reste
 * colorée dans tous les cas via highlight.js (qui couvre les 24 langages).
 *
 * Chargé À LA DEMANDE, un seul langage à la fois (import() dynamique) : statiques,
 * les ~20 paquets de grammaire alourdissaient le chunk "Mes extraits de code" de
 * plus d'1 Mo à eux seuls, chargé entièrement même pour éditer un seul extrait en
 * JavaScript. Chaque import() ci-dessous devient son propre petit chunk, récupéré
 * uniquement quand ce langage précis est réellement sélectionné.
 *
 * Clé = id de data/languages.ts (pas le nom highlight.js).
 */
export async function extensionPourLangage(id: string): Promise<Extension | null> {
  switch (id) {
    case 'javascript':
      return (await import('@codemirror/lang-javascript')).javascript({ jsx: true })
    case 'typescript':
      return (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true })
    case 'python':
      return (await import('@codemirror/lang-python')).python()
    case 'html':
    case 'twig':
      return (await import('@codemirror/lang-html')).html()
    case 'xml':
      return (await import('@codemirror/lang-xml')).xml()
    case 'css':
    case 'scss':
      return (await import('@codemirror/lang-css')).css()
    case 'java':
      return (await import('@codemirror/lang-java')).java()
    case 'cpp':
      return (await import('@codemirror/lang-cpp')).cpp()
    case 'go':
      return (await import('@codemirror/lang-go')).go()
    case 'rust':
      return (await import('@codemirror/lang-rust')).rust()
    case 'php':
      return (await import('@codemirror/lang-php')).php()
    case 'sql':
      return (await import('@codemirror/lang-sql')).sql()
    case 'json':
      return (await import('@codemirror/lang-json')).json()
    case 'yaml':
      return (await import('@codemirror/lang-yaml')).yaml()
    case 'markdown':
      return (await import('@codemirror/lang-markdown')).markdown()
    case 'csharp':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/clike')).csharp)
    case 'kotlin':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/clike')).kotlin)
    case 'ruby':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/ruby')).ruby)
    case 'swift':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/swift')).swift)
    case 'bash':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/shell')).shell)
    case 'dockerfile':
      return StreamLanguage.define((await import('@codemirror/legacy-modes/mode/dockerfile')).dockerFile)
    default:
      return null
  }
}
