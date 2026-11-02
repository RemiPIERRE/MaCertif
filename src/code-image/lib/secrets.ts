/**
 * Détection (heuristique, NON bloquante) de secrets collés par erreur dans un extrait.
 * Le dossier est imprimé et remis au jury : mieux vaut prévenir avant de produire l'image.
 * Des faux positifs sont possibles ; l'alerte est un conseil, jamais une interdiction.
 */

export interface AlerteSecret {
  /** numéro de ligne (1 = première ligne du code collé, pas le numéro affiché) */
  ligne: number
  type: string
  /** début de la valeur, le reste est masqué */
  apercu: string
}

interface Regle {
  type: string
  re: RegExp
  /** index du groupe de capture contenant la valeur secrète (0 = match entier) */
  groupe: number
}

const MOT_SECRET = '(?:pass(?:word|wd)?|pwd|passphrase|secret|token|api[_-]?key|apikey|auth[_-]?key|private[_-]?key|access[_-]?key|client[_-]?secret|db[_-]?pass(?:word)?)'

const REGLES: Regle[] = [
  { type: 'clé privée', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, groupe: 0 },
  { type: 'clé AWS', re: /\b(AKIA[0-9A-Z]{16})\b/, groupe: 1 },
  { type: 'clé API Google', re: /\b(AIza[0-9A-Za-z_-]{35})\b/, groupe: 1 },
  { type: 'jeton GitHub', re: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/, groupe: 1 },
  { type: 'jeton Slack', re: /\b(xox[baprs]-[A-Za-z0-9-]{10,})/, groupe: 1 },
  { type: 'clé Stripe', re: /\b([sr]k_(?:live|test)_[0-9a-zA-Z]{16,})/, groupe: 1 },
  { type: 'clé API (sk-…)', re: /\b(sk-[A-Za-z0-9_-]{20,})/, groupe: 1 },
  { type: 'jeton JWT', re: /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/, groupe: 1 },
  { type: 'identifiants dans une URL', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/'"]+:([^\s@/'"]{3,})@/i, groupe: 1 },
  // password = "valeur" / 'secret': 'valeur'
  { type: 'secret écrit en dur', re: new RegExp(`${MOT_SECRET}\\w*["']?\\s*[:=]>?\\s*(["'\`])([^"'\`\\n]{4,})\\1`, 'i'), groupe: 2 },
  // fichier .env : API_KEY=abcdef123 (sans guillemets)
  { type: 'secret dans un fichier .env', re: /^\s*(?:export\s+)?[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API_?KEY|PRIVATE_?KEY)[A-Z0-9_]*\s*=\s*([^\s'"#$]{6,})/, groupe: 1 },
]

/** Valeurs manifestement factices ou lues ailleurs : on ne prévient pas. */
const FACTICE = /^(?:x{3,}|\*{3,}|\.{3,}|•+|your[_ -].*|<.*>|\$\{.*\}|\{\{.*\}\}|%.*%|ma_?cl[eé].*|exemple?|example|changeme|change_me|todo|null|none|undefined|placeholder|\$[A-Za-z_].*|process\.env.*|getenv.*)$/i

function masquer(v: string): string {
  const debut = v.slice(0, Math.min(4, Math.ceil(v.length / 3)))
  return `${debut}••••`
}

export function detecterSecrets(code: string): AlerteSecret[] {
  const alertes: AlerteSecret[] = []
  const lignes = code.replace(/\r\n?/g, '\n').split('\n')
  lignes.forEach((texte, i) => {
    if (texte.length > 2000) return
    for (const regle of REGLES) {
      const m = regle.re.exec(texte)
      if (!m) continue
      const valeur = m[regle.groupe] ?? m[0]
      if (FACTICE.test(valeur.trim())) continue
      alertes.push({ ligne: i + 1, type: regle.type, apercu: regle.groupe === 0 ? '' : masquer(valeur) })
      break // une alerte par ligne suffit
    }
  })
  return alertes
}
