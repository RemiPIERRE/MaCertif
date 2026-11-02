import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import twig from 'highlight.js/lib/languages/twig'
import plaintext from 'highlight.js/lib/languages/plaintext'

export interface LangageDef {
  id: string
  label: string
  /** nom du langage côté highlight.js */
  hljs: string
  /** extension suggérée pour le titre de la fenêtre */
  ext: string
}

/** 21 langages de la page d'origine + Dockerfile, SCSS et Twig (utiles en contexte DWWM). */
export const LANGAGES: LangageDef[] = [
  { id: 'javascript', label: 'JavaScript', hljs: 'javascript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', hljs: 'typescript', ext: 'ts' },
  { id: 'python', label: 'Python', hljs: 'python', ext: 'py' },
  { id: 'html', label: 'HTML', hljs: 'xml', ext: 'html' },
  { id: 'css', label: 'CSS', hljs: 'css', ext: 'css' },
  { id: 'scss', label: 'SCSS', hljs: 'scss', ext: 'scss' },
  { id: 'java', label: 'Java', hljs: 'java', ext: 'java' },
  { id: 'cpp', label: 'C++', hljs: 'cpp', ext: 'cpp' },
  { id: 'csharp', label: 'C#', hljs: 'csharp', ext: 'cs' },
  { id: 'go', label: 'Go', hljs: 'go', ext: 'go' },
  { id: 'rust', label: 'Rust', hljs: 'rust', ext: 'rs' },
  { id: 'php', label: 'PHP', hljs: 'php', ext: 'php' },
  { id: 'twig', label: 'Twig', hljs: 'twig', ext: 'twig' },
  { id: 'ruby', label: 'Ruby', hljs: 'ruby', ext: 'rb' },
  { id: 'swift', label: 'Swift', hljs: 'swift', ext: 'swift' },
  { id: 'kotlin', label: 'Kotlin', hljs: 'kotlin', ext: 'kt' },
  { id: 'sql', label: 'SQL', hljs: 'sql', ext: 'sql' },
  { id: 'json', label: 'JSON', hljs: 'json', ext: 'json' },
  { id: 'yaml', label: 'YAML', hljs: 'yaml', ext: 'yml' },
  { id: 'bash', label: 'Bash', hljs: 'bash', ext: 'sh' },
  { id: 'dockerfile', label: 'Dockerfile', hljs: 'dockerfile', ext: 'Dockerfile' },
  { id: 'markdown', label: 'Markdown', hljs: 'markdown', ext: 'md' },
  { id: 'xml', label: 'XML', hljs: 'xml', ext: 'xml' },
  { id: 'plaintext', label: 'Texte brut', hljs: 'plaintext', ext: 'txt' },
]

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('php', php)
hljs.registerLanguage('twig', twig)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('plaintext', plaintext)

export { hljs }

export function getLangage(id: string): LangageDef | undefined {
  return LANGAGES.find((l) => l.id === id)
}

/** Sous-ensemble utilisé par l'auto-détection (sans texte brut ni doublons de xml). */
export const SOUS_ENSEMBLE_AUTO = Array.from(
  new Set(LANGAGES.filter((l) => l.id !== 'plaintext' && l.id !== 'xml').map((l) => l.hljs)),
)
