import type { HighlighterCore, LanguageRegistration, ThemeRegistration } from 'shiki/core'
import { echapper } from './highlight'

/**
 * Coloration de l'export/aperçu : moteur Shiki, qui réutilise les vraies
 * grammaires TextMate de VS Code (précision bien supérieure à highlight.js,
 * notamment en JSX/TSX où les attributs restent correctement reconnus quelle
 * que soit la profondeur d'imbrication). L'éditeur en direct (CodeMirror)
 * reste un moteur séparé, voir codemirrorLangages.ts.
 *
 * Thème personnalisé : chaque catégorie TextMate pointe directement vers une
 * de nos 9 variables CSS --ci-* existantes (lib/themes.ts) plutôt que d'utiliser
 * createCssVariablesTheme() de Shiki, dont le regroupement par défaut mélange
 * par exemple les attributs JSX/HTML avec les noms de fonctions.
 */
const THEME_VARIABLES: ThemeRegistration = {
  name: 'macertif-css-variables',
  type: 'dark',
  colors: {},
  fg: 'var(--ci-fg)',
  tokenColors: [
    { scope: ['comment'], settings: { foreground: 'var(--ci-com)', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control'], settings: { foreground: 'var(--ci-kw)' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: 'var(--ci-str)' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: 'var(--ci-num)' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: 'var(--ci-fn)' } },
    // Appel de fonction (`fetch(...)`) : scope plus spécifique que la règle générale ci-dessus
    // (ancêtre meta.function-call), donc prioritaire sur elle pour ce cas précis uniquement —
    // une déclaration (`function fetch() {}`) n'a pas cet ancêtre et reste sur --ci-fn.
    { scope: ['meta.function-call entity.name.function'], settings: { foreground: 'var(--ci-fn-call)' } },
    { scope: ['entity.name.type', 'support.type', 'entity.other.inherited-class'], settings: { foreground: 'var(--ci-type)' } },
    // Nom d'une classe/interface à sa DÉCLARATION (`class Foo`, `interface Bar`) : scope plus
    // spécifique (entity.name.type.class / .interface), prioritaire sur la règle « type » ci-dessus
    // pour ce cas précis — une RÉFÉRENCE à ce type ailleurs (`: Foo`, `extends Foo`) reste sur --ci-type.
    { scope: ['entity.name.type.class', 'entity.name.type.interface'], settings: { foreground: 'var(--ci-type-name)' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: 'var(--ci-var)' } },
    // Paramètre de fonction/méthode : couleur distincte d'une variable ordinaire.
    { scope: ['variable.parameter'], settings: { foreground: 'var(--ci-param)' } },
    // Accès à une propriété (`obj.prop`) : scope plus spécifique (variable.other.property),
    // prioritaire sur la règle « variable » générale ci-dessus pour ce cas précis.
    { scope: ['variable.other.property'], settings: { foreground: 'var(--ci-prop)' } },
    // Clé d'un objet littéral (`{ method: ... }`) : même couleur que l'accès à une propriété.
    { scope: ['meta.object-literal.key'], settings: { foreground: 'var(--ci-prop)' } },
    { scope: ['entity.name.tag'], settings: { foreground: 'var(--ci-tag)' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: 'var(--ci-attr)' } },
  ],
}

/**
 * Clé = id de lib/languages.ts → nom de la grammaire côté Shiki (identique ici,
 * mais distinct de l'id pour rester cohérent avec codemirrorLangages.ts).
 */
const BUNDLE_SHIKI: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  python: 'python',
  html: 'html',
  css: 'css',
  scss: 'scss',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  twig: 'twig',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  sql: 'sql',
  json: 'json',
  yaml: 'yaml',
  bash: 'bash',
  dockerfile: 'dockerfile',
  markdown: 'markdown',
  xml: 'xml',
}

/**
 * Charge le module de grammaire Shiki correspondant. Spécificateurs littéraux
 * un par un (pas de template dynamique `@shikijs/langs/${bundle}`) : pour un
 * sous-chemin d'export d'un paquet npm, Vite ne peut créer un chunk séparé que
 * pour un import() dont le chemin est connu statiquement — un chemin construit
 * à l'exécution reste un spécificateur « nu » non résolvable par le navigateur
 * et casserait l'export en production (voir la note équivalente dans
 * codemirrorLangages.ts, déjà corrigée pour la même raison côté CodeMirror).
 */
async function importerGrammaire(bundle: string): Promise<{ default: LanguageRegistration[] }> {
  switch (bundle) {
    case 'javascript':
      return import('@shikijs/langs/javascript')
    case 'typescript':
      return import('@shikijs/langs/typescript')
    case 'jsx':
      return import('@shikijs/langs/jsx')
    case 'tsx':
      return import('@shikijs/langs/tsx')
    case 'python':
      return import('@shikijs/langs/python')
    case 'html':
      return import('@shikijs/langs/html')
    case 'css':
      return import('@shikijs/langs/css')
    case 'scss':
      return import('@shikijs/langs/scss')
    case 'java':
      return import('@shikijs/langs/java')
    case 'cpp':
      return import('@shikijs/langs/cpp')
    case 'csharp':
      return import('@shikijs/langs/csharp')
    case 'go':
      return import('@shikijs/langs/go')
    case 'rust':
      return import('@shikijs/langs/rust')
    case 'php':
      return import('@shikijs/langs/php')
    case 'twig':
      return import('@shikijs/langs/twig')
    case 'ruby':
      return import('@shikijs/langs/ruby')
    case 'swift':
      return import('@shikijs/langs/swift')
    case 'kotlin':
      return import('@shikijs/langs/kotlin')
    case 'sql':
      return import('@shikijs/langs/sql')
    case 'json':
      return import('@shikijs/langs/json')
    case 'yaml':
      return import('@shikijs/langs/yaml')
    case 'bash':
      return import('@shikijs/langs/bash')
    case 'dockerfile':
      return import('@shikijs/langs/dockerfile')
    case 'markdown':
      return import('@shikijs/langs/markdown')
    case 'xml':
      return import('@shikijs/langs/xml')
    default:
      throw new Error(`Grammaire Shiki inconnue : ${bundle}`)
  }
}

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
      ])
      return createHighlighterCore({
        themes: [THEME_VARIABLES],
        langs: [],
        engine: createJavaScriptRegexEngine(),
      })
    })()
  }
  return highlighterPromise
}

const langagesCharges = new Set<string>()

/**
 * Charge la grammaire d'un langage à la demande (un seul petit chunk par
 * langage réellement utilisé, comme pour l'éditeur CodeMirror — voir la note
 * dans codemirrorLangages.ts sur le coût d'imports statiques groupés).
 */
async function chargerLangage(highlighter: HighlighterCore, id: string): Promise<string | null> {
  const bundle = BUNDLE_SHIKI[id]
  if (!bundle) return null
  if (!langagesCharges.has(bundle)) {
    const module = await importerGrammaire(bundle)
    await highlighter.loadLanguage(...module.default)
    langagesCharges.add(bundle)
  }
  return bundle
}

/** fontStyle est un masque de bits TextMate : 1=italique, 2=gras, 4=souligné. */
function styleToken(color: string | undefined, fontStyle: number | undefined): string {
  const regles: string[] = []
  if (color) regles.push(`color:${color}`)
  if (fontStyle) {
    if (fontStyle & 1) regles.push('font-style:italic')
    if (fontStyle & 2) regles.push('font-weight:bold')
    if (fontStyle & 4) regles.push('text-decoration:underline')
  }
  return regles.join(';')
}

/**
 * Colore le code via Shiki et renvoie une entrée HTML par ligne, dans le même
 * format que produisait highlight.js (compatible avec grouperLignes/analyserLignes,
 * qui restent inchangés). `langageId` doit être un id de lib/languages.ts
 * couvert par BUNDLE_SHIKI (sinon le texte est simplement échappé).
 */
export async function colorerShiki(code: string, langageId: string): Promise<string[]> {
  const propre = code.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (propre.trim() === '') return []
  if (propre === '') return []

  const bundle = BUNDLE_SHIKI[langageId]
  if (!bundle) return propre.split('\n').map((l) => echapper(l))

  const highlighter = await getHighlighter()
  await chargerLangage(highlighter, langageId)

  const lignesTokens = highlighter.codeToTokensBase(propre, { lang: bundle, theme: THEME_VARIABLES.name })
  return lignesTokens.map((ligne) =>
    ligne
      .map((t, i) => {
        // Shiki/TextMate donne le même scope à un appel de fonction « nu » (fetch(...)) et à
        // un appel de méthode (res.json()) : rien ne les distingue dans l'ascendance du token
        // lui-même. On les différencie ici en repérant un « . » juste avant sur la même ligne
        // (fiable : l'accesseur est toujours son propre token, de contenu exactement ".").
        const estAppelMethode = t.color === 'var(--ci-fn-call)' && ligne[i - 1]?.content === '.'
        const couleur = estAppelMethode ? 'var(--ci-fn-call-method)' : t.color
        const style = styleToken(couleur, t.fontStyle)
        return style ? `<span style="${style}">${echapper(t.content)}</span>` : echapper(t.content)
      })
      .join(''),
  )
}

/** Langages dont l'export bénéficie de Shiki (sinon : texte simplement échappé). */
export function supporteShiki(langageId: string): boolean {
  return langageId in BUNDLE_SHIKI
}
