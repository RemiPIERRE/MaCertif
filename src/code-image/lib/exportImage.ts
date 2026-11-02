import { toBlob } from 'html-to-image'

/** Limites de sécurité : au-delà, certains navigateurs (surtout mobiles) renvoient une image vide. */
const COTE_MAX = 16000
const PIXELS_MAX = 32_000_000

export interface ResultatPng {
  blob: Blob
  largeur: number
  hauteur: number
  echelle: number
  /** vrai si l'échelle demandée a dû être réduite pour respecter les limites */
  reduite: boolean
}

export function echelleEffective(largeur: number, hauteur: number, demandee: number): number {
  let e = demandee
  while (e > 1 && (largeur * e > COTE_MAX || hauteur * e > COTE_MAX || largeur * e * hauteur * e > PIXELS_MAX)) e -= 1
  return e
}

const estSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)

export async function genererPng(
  noeud: HTMLElement,
  echelleDemandee: number,
  police: { famille: string; taille: number },
): Promise<ResultatPng> {
  // La police doit être chargée AVANT la capture, sinon l'image sort avec une police de secours.
  try {
    await Promise.all([
      document.fonts.load(`400 ${police.taille}px ${police.famille}`, 'Aéè{}()=>'),
      document.fonts.load(`700 ${police.taille}px ${police.famille}`, 'Aé'),
    ])
    await document.fonts.ready
  } catch {
    /* on tente quand même la capture */
  }

  const largeur = noeud.offsetWidth
  const hauteur = noeud.offsetHeight
  const echelle = echelleEffective(largeur, hauteur, echelleDemandee)
  const options = { pixelRatio: echelle, cacheBust: false, style: { transform: 'none', margin: '0' } }

  // Safari rate parfois la première capture (polices / images pas encore décodées).
  if (estSafari()) await toBlob(noeud, options)
  const blob = await toBlob(noeud, options)
  if (!blob) throw new Error("La génération de l'image a échoué.")
  return { blob, largeur, hauteur, echelle, reduite: echelle < echelleDemandee }
}

export function telecharger(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function copieImageDisponible(): boolean {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write && window.isSecureContext
}

/**
 * Copie l'image dans le presse-papiers. La Promise est passée au ClipboardItem (et non le Blob résolu)
 * pour que Safari accepte une génération asynchrone dans le geste de l'utilisateur.
 */
export async function copierImage(blobPromise: Promise<Blob>): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })])
}

export function slug(s: string): string {
  const base = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'extrait'
}

export const POLICES_CSS: Record<string, string> = {
  jetbrains: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  fira: '"Fira Code", ui-monospace, Menlo, Consolas, monospace',
  source: '"Source Code Pro", ui-monospace, Menlo, Consolas, monospace',
}
