import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Extrait, Reglages, TacheLiee } from '../types'
import { appliquerPreset, CODE_MAX_CARACTERES, SEUIL_LIGNES_LONGUES, TACHES_CODE_PAR_DEFAUT, type PresetId } from '../lib/defaults'
import { copieImageDisponible, copierImage, genererPng, POLICES_CSS, slug, telecharger } from '../lib/exportImage'
import { detecterLangageAuto } from '../lib/highlight'
import { colorerShiki } from '../lib/shikiHighlight'
import { LANGAGES, getLangage } from '../lib/languages'
import { detecterSecrets } from '../lib/secrets'
import { useExtraits } from '../lib/store'
import { getFond } from '../lib/backgrounds'
import { CodeCanvas } from './CodeCanvas'
import { CodeEditor, type PlageLignes } from './CodeEditor'
import { ExtraitsSidebar } from './ExtraitsSidebar'
import { ReglagesContenuPanel, ReglagesStylePanel } from './ReglagesPanel'

export interface CodeImageTabProps {
  /** Tâches du dossier auxquelles on peut rattacher un extrait. */
  tachesLiees?: TacheLiee[]
  /** État actuel de `site:coches` (taskId → visuel prêt), pour ne pas reproposer ce qui est déjà coché. */
  visuelsPrets?: Record<string, boolean>
  /** Appelé quand l'utilisateur clique « Marquer comme prêt » : l'hôte écrit dans `site:coches`. */
  onMarquerVisuelPret?: (tacheId: string) => void
}

type Statut = { type: 'ok' | 'info' | 'warn'; texte: string } | null

export function CodeImageTab({ tachesLiees = TACHES_CODE_PAR_DEFAUT, visuelsPrets, onMarquerVisuelPret }: CodeImageTabProps) {
  const { extraits, actif, actifId, setActifId, modifier, modifierReglages, creer, dupliquer, supprimer } = useExtraits()

  const canvasRef = useRef<HTMLDivElement>(null)
  const cadreRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ echelle: 1, largeur: 0, hauteur: 0 })
  const [occupe, setOccupe] = useState<'telecharger' | 'copier' | null>(null)
  const [statut, setStatut] = useState<Statut>(null)
  const [dernierTelechargement, setDernierTelechargement] = useState<{ extraitId: string; tacheId: string } | null>(null)
  const [pleinEcran, setPleinEcran] = useState(false)

  const code = actif?.code ?? ''
  const langage = actif?.reglages.langage ?? 'auto'
  const [colore, setColore] = useState<{ lignes: string[]; langageDetecte: string | null }>({ lignes: [], langageDetecte: null })

  // Coloration asynchrone (moteur Shiki, voir lib/shikiHighlight.ts). On garde
  // l'aperçu précédent affiché pendant le chargement plutôt que de le vider,
  // et on ignore les résultats d'un appel devenu obsolète (code/langage déjà
  // changés entre-temps).
  useEffect(() => {
    let annule = false
    const detecte = langage === 'auto' ? detecterLangageAuto(code) : null
    const langageResolu = langage !== 'auto' ? langage : (detecte?.id ?? 'plaintext')
    colorerShiki(code, langageResolu).then((lignes) => {
      if (!annule) setColore({ lignes, langageDetecte: detecte?.label ?? null })
    })
    return () => {
      annule = true
    }
  }, [code, langage])

  const secrets = useMemo(() => detecterSecrets(code), [code])
  const nbLignes = colore.lignes.length
  const vide = nbLignes === 0

  // Changer d'extrait efface les messages de l'extrait précédent.
  useEffect(() => {
    setStatut(null)
    setDernierTelechargement(null)
  }, [actifId])

  // Plein écran de l'éditeur : fermeture au clavier, défilement de la page bloqué pendant.
  useEffect(() => {
    if (!pleinEcran) return
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPleinEcran(false)
    }
    document.addEventListener('keydown', surEchap)
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surEchap)
      document.body.style.overflow = precedent
    }
  }, [pleinEcran])

  // L'aperçu s'adapte à la largeur disponible sans toucher à la taille réelle de l'image exportée.
  useLayoutEffect(() => {
    const cadre = cadreRef.current
    const canvas = canvasRef.current
    if (!cadre || !canvas) return
    const mesurer = () => {
      const l = canvas.offsetWidth
      const h = canvas.offsetHeight
      const dispo = Math.max(cadre.clientWidth - 24, 120)
      const echelle = l > 0 ? Math.min(1, dispo / l) : 1
      setFit((p) => (p.echelle === echelle && p.largeur === l && p.hauteur === h ? p : { echelle, largeur: l, hauteur: h }))
    }
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(cadre)
    // box: 'border-box' est indispensable ici : en largeur auto (width: 'max-content'),
    // la content-box (observée par défaut) ne change pas quand seul le remplissage
    // (padding) varie — seule la border-box grandit, donc un ResizeObserver par défaut
    // ne se redéclencherait jamais au changement du curseur « Remplissage ».
    ro.observe(canvas, { box: 'border-box' })
    return () => ro.disconnect()
  }, [actifId, vide])

  if (!actif) return <div className="ci-root">Chargement…</div>

  const r = actif.reglages
  const fond = getFond(r.fond)
  const nomPng = actif.tacheId ? `${actif.tacheId}.png` : `${slug(actif.nom)}.png`
  const extensionSuggeree =
    (r.langage !== 'auto' ? getLangage(r.langage)?.ext : LANGAGES.find((l) => l.label === colore.langageDetecte)?.ext) ?? 'txt'
  // Coloration en direct dans l'éditeur : même langage que l'export si choisi
  // manuellement ; sinon celui détecté automatiquement par highlight.js (une fois
  // du code présent), sinon aucune coloration tant que rien n'est détectable.
  const langageEditeur =
    r.langage !== 'auto' ? r.langage : (LANGAGES.find((l) => l.label === colore.langageDetecte)?.id ?? null)
  const copieOk = copieImageDisponible()
  const police = { famille: POLICES_CSS[r.police], taille: r.taillePolice }
  const tacheLabel = actif.tacheId ? (tachesLiees.find((t) => t.id === actif.tacheId)?.label ?? actif.tacheId) : null

  const onReglage = (patch: Partial<Reglages>) => modifierReglages(actif.id, patch)
  const onPreset = (p: PresetId) => modifierReglages(actif.id, appliquerPreset(r, p))
  const onMeta = (patch: Partial<Pick<Extrait, 'nom' | 'tacheId' | 'code'>>) => modifier(actif.id, patch)

  // L'aperçu doit plier ce que l'utilisateur plie dans l'éditeur : les plages
  // repliées (relatives au document de l'éditeur) sont converties vers la
  // numérotation affichée (premiereLigne) et remplacent "Lignes à masquer".
  const onPliChange = (plages: PlageLignes[]) => {
    const spec = plages
      .map((p) => {
        const debut = r.premiereLigne + p.debut - 1
        const fin = r.premiereLigne + p.fin - 1
        return debut === fin ? `${debut}` : `${debut}-${fin}`
      })
      .join(', ')
    onReglage({ lignesMasquees: spec })
  }

  async function telechargerPng() {
    if (!canvasRef.current) return
    setOccupe('telecharger')
    setStatut(null)
    try {
      const res = await genererPng(canvasRef.current, r.echelle, police)
      telecharger(res.blob, nomPng)
      const dim = `${Math.round(res.largeur * res.echelle)} × ${Math.round(res.hauteur * res.echelle)} px`
      setStatut({
        type: res.reduite ? 'warn' : 'ok',
        texte: res.reduite
          ? `Image téléchargée (${nomPng}, ${dim}). L'échelle a été réduite à ${res.echelle}x : l'image demandée était trop grande pour le navigateur.`
          : `Image téléchargée : ${nomPng} (${dim}).`,
      })
      if (actif && actif.tacheId) setDernierTelechargement({ extraitId: actif.id, tacheId: actif.tacheId })
    } catch (e) {
      setStatut({ type: 'warn', texte: e instanceof Error ? e.message : "La génération de l'image a échoué." })
    } finally {
      setOccupe(null)
    }
  }

  async function copier() {
    if (!canvasRef.current) return
    const noeud = canvasRef.current
    setOccupe('copier')
    setStatut(null)
    try {
      let reduite = false
      const blobPromise = genererPng(noeud, r.echelle, police).then((res) => {
        reduite = res.reduite
        return res.blob
      })
      await copierImage(blobPromise)
      setStatut({
        type: reduite ? 'warn' : 'ok',
        texte: reduite ? "Image copiée (échelle réduite : image trop grande pour le navigateur)." : 'Image copiée dans le presse-papiers : collez-la dans Word, PowerPoint, Slack…',
      })
    } catch (e) {
      setStatut({
        type: 'warn',
        texte: e instanceof Error && e.name === 'NotAllowedError' ? "Le navigateur a refusé l'accès au presse-papiers." : "La copie a échoué : utilisez « Télécharger PNG ».",
      })
    } finally {
      setOccupe(null)
    }
  }

  const peutMarquer =
    !!onMarquerVisuelPret &&
    !!dernierTelechargement &&
    dernierTelechargement.extraitId === actif.id &&
    dernierTelechargement.tacheId === actif.tacheId &&
    !visuelsPrets?.[dernierTelechargement.tacheId]

  return (
    <div className="ci-root">
      <header className="ci-head">
        <h2>Mes extraits de code</h2>
        <p>
          Transformez vos extraits de code en images propres pour votre dossier (extraits de code, sécurité, annexes) et votre support oral. Tout reste dans votre navigateur : le code n'est envoyé nulle part.
        </p>
      </header>

      <div className="ci-grid">
        <div className="ci-left">
          <ExtraitsSidebar
            extraits={extraits}
            actifId={actifId}
            taches={tachesLiees}
            onSelect={setActifId}
            onCreate={creer}
            onDuplicate={dupliquer}
            onDelete={supprimer}
          />

          <ReglagesContenuPanel reglages={r} langageDetecte={colore.langageDetecte} extensionSuggeree={extensionSuggeree} onChange={onReglage} />
        </div>

        <div className="ci-main">
          <div className="ci-fields ci-fields--meta">
            <label className="ci-field">
              <span>Nom de l'extrait</span>
              <input type="text" value={actif.nom} maxLength={80} onChange={(e) => onMeta({ nom: e.target.value })} />
            </label>
            <label className="ci-field">
              <span>Rattaché à la tâche</span>
              <select value={actif.tacheId ?? ''} onChange={(e) => onMeta({ tacheId: e.target.value || null })}>
                <option value="">Aucune (autre extrait / annexe)</option>
                {tachesLiees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <small>Le fichier téléchargé portera le nom de la tâche.</small>
            </label>
          </div>

          <div className={`ci-field ci-field--code${pleinEcran ? ' ci-code-pleinecran' : ''}`}>
            <span className="ci-code-head">
              <span>
                Code <em>{code.length.toLocaleString('fr-FR')} / {CODE_MAX_CARACTERES.toLocaleString('fr-FR')}</em>
              </span>
              <button
                type="button"
                className="ci-mini ci-fullscreen-btn"
                onClick={() => setPleinEcran((v) => !v)}
                title={pleinEcran ? 'Quitter le plein écran (Échap)' : 'Afficher le code en plein écran'}
              >
                {pleinEcran ? '⤡ Quitter le plein écran' : '⛶ Plein écran'}
              </button>
            </span>
            <CodeEditor
              value={code}
              onChange={(v) => onMeta({ code: v })}
              langageId={langageEditeur}
              maxLength={CODE_MAX_CARACTERES}
              placeholder="Collez ici l'extrait de code à transformer en image…"
              onFoldedLinesChange={onPliChange}
            />
          </div>
          {pleinEcran && <div className="ci-code-pleinecran-backdrop" onClick={() => setPleinEcran(false)} />}
          <div className="ci-code-actions">
            <button type="button" className="ci-btn ci-btn--ghost" disabled={!code} onClick={() => onMeta({ code: '' })}>
              Effacer le code
            </button>
          </div>

          <div className="ci-alerts" aria-live="polite">
            {secrets.length > 0 && (
              <div className="ci-alert ci-alert--secret" role="alert">
                <strong>⚠ Secret possible dans cet extrait</strong>
                <ul>
                  {secrets.slice(0, 4).map((s) => (
                    <li key={`${s.ligne}-${s.type}`}>
                      Ligne {s.ligne} : {s.type}
                      {s.apercu ? ` (${s.apercu})` : ''}
                    </li>
                  ))}
                  {secrets.length > 4 && <li>… et {secrets.length - 4} autre(s)</li>}
                </ul>
                <p>
                  Le dossier est imprimé et remis au jury. Remplacez la valeur par un exemple (ex. <code>process.env.API_KEY</code>) avant d'exporter.
                </p>
              </div>
            )}
            {nbLignes > SEUIL_LIGNES_LONGUES && (
              <div className="ci-alert ci-alert--info">
                Extrait long ({nbLignes} lignes) : au-delà d'environ {SEUIL_LIGNES_LONGUES} lignes, le texte devient petit à l'impression. Montrez l'essentiel et mettez le reste en annexe.
              </div>
            )}
          </div>

          <div className="ci-preview-head">
            <h3>Aperçu</h3>
            {!vide && (
              <span className="ci-dim">
                {Math.round(fit.largeur * r.echelle)} × {Math.round(fit.hauteur * r.echelle)} px ({r.echelle}x)
              </span>
            )}
          </div>

          <div className={`ci-frame${fond.css === null ? ' is-checker' : ''}`} ref={cadreRef}>
            {vide ? (
              <p className="ci-empty">L'aperçu apparaît dès que vous collez du code.</p>
            ) : (
              <div className="ci-stage" style={{ width: fit.largeur * fit.echelle, height: fit.hauteur * fit.echelle }}>
                <div style={{ transform: `scale(${fit.echelle})`, transformOrigin: 'top left', width: fit.largeur }}>
                  <CodeCanvas ref={canvasRef} lignes={colore.lignes} reglages={r} />
                </div>
              </div>
            )}
          </div>

          <ReglagesStylePanel reglages={r} onChange={onReglage} onPreset={onPreset} />

          <div className="ci-export">
            <button type="button" className="ci-btn ci-btn--primary" disabled={vide || occupe !== null} onClick={telechargerPng}>
              {occupe === 'telecharger' ? 'Génération…' : 'Télécharger PNG'}
            </button>
            <button
              type="button"
              className="ci-btn"
              disabled={vide || occupe !== null || !copieOk}
              onClick={copier}
              title={copieOk ? 'Copier l’image dans le presse-papiers' : 'Copie indisponible : nécessite HTTPS et un navigateur récent (utilisez Télécharger PNG)'}
            >
              {occupe === 'copier' ? 'Copie…' : 'Copier l’image'}
            </button>
            <span className="ci-fname">{nomPng}</span>
          </div>
          {!copieOk && <p className="ci-hint">La copie dans le presse-papiers n'est pas disponible dans ce navigateur : utilisez « Télécharger PNG ».</p>}

          <div aria-live="polite">
            {statut && <p className={`ci-status ci-status--${statut.type}`}>{statut.texte}</p>}
            {peutMarquer && dernierTelechargement && (
              <p className="ci-status ci-status--info">
                Cette image correspond à « {tacheLabel} ».{' '}
                <button
                  type="button"
                  className="ci-linkbtn"
                  onClick={() => {
                    onMarquerVisuelPret?.(dernierTelechargement.tacheId)
                    setStatut({ type: 'ok', texte: 'Visuel marqué comme prêt dans « Mes visuels ».' })
                    setDernierTelechargement(null)
                  }}
                >
                  Marquer ce visuel comme prêt dans « Mes visuels »
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
