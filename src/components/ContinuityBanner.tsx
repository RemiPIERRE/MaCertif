import { useState } from 'react'
import { downloadExport } from '../lib/exportImport'
import './ContinuityBanner.css'

const DISMISS_KEY = 'macertif:continuity-banner-dismissed'

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function ContinuityBanner() {
  const [dismissed, setDismissed] = useState(readDismissed)

  if (dismissed) return null

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  return (
    <div className="continuity-banner">
      <span>
        Vous alternez entre plusieurs postes (maison, entreprise) ? Vos données ne vivent que dans ce navigateur.
        Exportez-les en fin de session, déposez le fichier sur un espace type OneDrive, puis réimportez-le sur
        l'autre poste.
      </span>
      <div className="continuity-banner-actions">
        <button className="btn btn-secondary continuity-banner-export" onClick={downloadExport}>
          Exporter maintenant
        </button>
        <button className="continuity-banner-dismiss" onClick={dismiss} aria-label="Fermer">
          ×
        </button>
      </div>
    </div>
  )
}
