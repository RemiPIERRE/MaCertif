import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { findTaskContext } from '../lib/taskLookup'
import { STORAGE_KEYS, type CustomSiteRef } from '../types/storage'
import { listerVisuels, supprimerVisuel, uploaderVisuel, urlFichierVisuel, type Visuel } from '../lib/visuelsApi'
import './MonSitePage.css'

const KIND_LABEL: Record<CustomSiteRef['kind'], string> = {
  annexe: 'Annexe',
  inline: 'Image inline',
}

const FORMATS_ACCEPTES = 'image/jpeg,image/png,image/webp'
const QUOTA_OCTETS = 100 * 1024 * 1024

function formaterMo(octets: number): string {
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

function messageErreurUpload(): string {
  return "Échec de l'enregistrement de l'image (stockage du navigateur indisponible ou saturé)."
}

export function MonSitePage() {
  const [customRefs, setCustomRefs] = useLocalStorage<CustomSiteRef[]>(STORAGE_KEYS.siteCustomRefs, [])

  const readyCount = customRefs.filter((r) => r.ready).length

  const toggleCustom = (id: string) =>
    setCustomRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ready: !r.ready } : r)))
  const removeCustom = (id: string) => setCustomRefs((prev) => prev.filter((r) => r.id !== id))

  const [visuels, setVisuels] = useState<Visuel[]>([])
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreurUpload, setErreurUpload] = useState<string | null>(null)
  const inputFichierRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let annule = false
    listerVisuels()
      .then((liste) => {
        if (!annule) setVisuels(liste)
      })
      .catch((error: unknown) => console.warn('Impossible de charger les visuels', error))
    return () => {
      annule = true
    }
  }, [])

  const octetsUtilises = visuels.reduce((total, v) => total + v.sizeBytes, 0)

  const handleFichierChoisi = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setErreurUpload(null)
    setEnvoiEnCours(true)
    uploaderVisuel(file, file.name)
      .then((visuel) => setVisuels((prev) => [...prev, visuel]))
      .catch(() => setErreurUpload(messageErreurUpload()))
      .finally(() => setEnvoiEnCours(false))
  }

  const handleSupprimerVisuel = (id: string) => {
    setVisuels((prev) => prev.filter((v) => v.id !== id))
    supprimerVisuel(id).catch((error: unknown) => console.warn('Impossible de supprimer le visuel', error))
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma certification</div>
        <h1>Mes visuels</h1>
        <p className="page-lede">
          Les visuels que vous choisissez de préparer pour votre dossier : captures d'écran, code, schémas,
          arborescences. Ajoutez-en depuis le panneau « Annexe / Image » d'une tâche dans « Mon dossier », puis
          cochez-les ici au fur et à mesure que vous les préparez. Vous les insérerez vous-même dans le document
          Word après export.
        </p>
      </header>

      <div className="card site-summary">
        <strong>
          {readyCount} / {customRefs.length}
        </strong>{' '}
        images prêtes
      </div>

      {customRefs.length === 0 ? (
        <div className="card site-empty">
          Aucun visuel pour l'instant. Depuis une tâche de « Mon dossier », utilisez le panneau « Annexe / Image »
          pour en ajouter un.
        </div>
      ) : (
        <div className="site-list">
          {customRefs.map((ref) => {
            const context = findTaskContext(ref.taskId)
            return (
              <div key={ref.id} className={`card site-item${ref.ready ? ' ready' : ''}`}>
                <label className="site-item-checkbox">
                  <input type="checkbox" checked={ref.ready} onChange={() => toggleCustom(ref.id)} />
                </label>
                <div className="site-item-body">
                  <div className="site-item-chapter">
                    {context ? `${context.chapter.number}. ${context.chapter.title}` : 'Tâche introuvable'}
                    {' · '}
                    <span className="tag tag-violet">{KIND_LABEL[ref.kind]}</span>
                  </div>
                  <div className="site-item-title">{ref.label}</div>
                  <p className="site-item-description empty">À préparer.</p>
                </div>
                <Link className="btn btn-ghost site-item-link" to={`/dossier/${ref.taskId}`}>
                  Voir la tâche
                </Link>
                <button className="btn-icon-delete" onClick={() => removeCustom(ref.id)} aria-label="Supprimer">
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <header className="page-header visuels-header">
        <h2>Visuels enregistrés</h2>
        <p className="page-lede">
          Importez directement vos captures d'écran, schémas ou maquettes (JPEG, PNG ou WebP). Elles restent
          stockées dans ce navigateur, sur cet appareil : elles ne sont jamais envoyées ailleurs.
        </p>
      </header>

      <div className="card site-summary">
        <strong>{formaterMo(octetsUtilises)}</strong> / {formaterMo(QUOTA_OCTETS)} utilisés
      </div>

      {erreurUpload && <div className="card visuels-erreur">{erreurUpload}</div>}

      <input
        ref={inputFichierRef}
        type="file"
        accept={FORMATS_ACCEPTES}
        onChange={handleFichierChoisi}
        className="visuels-input-fichier"
      />
      <button className="btn btn-primary" onClick={() => inputFichierRef.current?.click()} disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours…' : 'Importer un visuel'}
      </button>

      {visuels.length === 0 ? (
        <div className="card site-empty">Aucun visuel importé pour l'instant.</div>
      ) : (
        <div className="visuels-grid">
          {visuels.map((visuel) => (
            <div key={visuel.id} className="card visuel-item">
              <img src={urlFichierVisuel(visuel.id)} alt={visuel.nom} className="visuel-item-image" />
              <div className="visuel-item-nom" title={visuel.nom}>
                {visuel.nom}
              </div>
              <div className="visuel-item-taille">{formaterMo(visuel.sizeBytes)}</div>
              <button
                className="btn-icon-delete"
                onClick={() => handleSupprimerVisuel(visuel.id)}
                aria-label="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
