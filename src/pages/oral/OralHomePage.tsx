import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { useDisclaimer } from '../../lib/useDisclaimer'
import { flattenActivePresentation } from '../../lib/oralMutations'
import { filledSlidesStats, formatMinutes, presentationDuration, pacingStatus } from '../../lib/oralTime'
import { createDefaultPresentation, createDefaultAnnexes } from '../../data/oralDefaults'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos } from '../../types/storage'
import { DisclaimerModal } from '../../components/DisclaimerModal'
import type { OralSection, OralAnnexCategory } from '../../types/oral'
import './OralHomePage.css'

export function OralHomePage() {
  const [sections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const [annexes] = useLocalStorage<OralAnnexCategory[]>(STORAGE_KEYS.oralAnnexes, createDefaultAnnexes())
  const [profil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const navigate = useNavigate()
  const disclaimer = useDisclaimer('disclaimer:oral')
  const [exporting, setExporting] = useState(false)
  const [exportingPptx, setExportingPptx] = useState(false)

  const stats = filledSlidesStats(sections)
  const duration = presentationDuration(sections)
  const status = pacingStatus(duration)

  const goToPresentation = () => {
    const flat = flattenActivePresentation(sections)
    if (flat.length === 0) return
    const firstUnfilled = flat.find((e) => e.slide.discours.trim().length === 0)
    navigate(`/oral/presentation/${(firstUnfilled ?? flat[0]).slide.id}`)
  }

  const handleExportSpeech = async () => {
    setExporting(true)
    try {
      const [{ generateSpeechDocx }, { downloadDocxBlob }] = await Promise.all([
        import('../../lib/oralSpeechExport'),
        import('../../lib/docxExport'),
      ])
      const blob = await generateSpeechDocx(sections)
      downloadDocxBlob(blob, 'discours-soutenance.docx')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPptx = async () => {
    setExportingPptx(true)
    try {
      const { exportOralPptx } = await import('../../lib/oralPptxExport')
      await exportOralPptx(sections, annexes, profil, 'presentation-soutenance.pptx')
    } finally {
      setExportingPptx(false)
    }
  }

  const annexSlideCount = annexes.reduce((n, c) => n + c.slides.length, 0)

  return (
    <div>
      {disclaimer.visible && <DisclaimerModal onDismissForever={disclaimer.dismissForever} onAcknowledge={disclaimer.acknowledge} />}
      <header className="page-header oral-home-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Mon oral</h1>
          <p className="page-lede">
            Préparez le support de votre soutenance : {TARGET_TEXT}. Seules les slides de la Présentation comptent
            dans le temps ; les Annexes sont consultées librement pendant les questions du jury.
          </p>
        </div>
        <div className="oral-home-export-actions">
          <button className="btn btn-secondary" onClick={handleExportSpeech} disabled={exporting}>
            {exporting ? 'Génération…' : 'Exporter mon discours (.docx)'}
          </button>
          <button className="btn btn-secondary" onClick={handleExportPptx} disabled={exportingPptx}>
            {exportingPptx ? 'Génération…' : 'Exporter ma présentation (.pptx)'}
          </button>
        </div>
      </header>

      <div className="oral-home-stats">
        <div className="card oral-stat-card">
          <div className="oral-stat-label">Slides remplies</div>
          <div className="oral-stat-value">
            {stats.filled} / {stats.total}
          </div>
        </div>
        <div className={`card oral-stat-card oral-stat-${status}`}>
          <div className="oral-stat-label">Temps estimé du discours</div>
          <div className="oral-stat-value">{formatMinutes((duration.minMinutes + duration.maxMinutes) / 2)}</div>
          <div className="oral-stat-hint">Cible : 35 à 40 minutes</div>
        </div>
        <div className="card oral-stat-card">
          <div className="oral-stat-label">Slides en annexe</div>
          <div className="oral-stat-value">{annexSlideCount}</div>
        </div>
      </div>

      <div className="oral-home-actions">
        <button className="card oral-action-card" onClick={goToPresentation}>
          <h3>Commencer / reprendre ma présentation</h3>
          <p>Rédigez vos slides et votre discours, section par section.</p>
        </button>
        <Link className="card oral-action-card" to="/oral/apercu">
          <h3>Voir mon support visuel</h3>
          <p>Aperçu de toutes vos slides ; gérez aussi vos sections et vos annexes ici.</p>
        </Link>
        <Link className="card oral-action-card" to="/oral/discours">
          <h3>Voir mon discours</h3>
          <p>Le texte de votre discours, compilé section par section.</p>
        </Link>
        <Link className="card oral-action-card" to="/oral/entrainement">
          <h3>Entraînement</h3>
          <p>Prompteur au rythme de votre discours, ou slides seules.</p>
        </Link>
      </div>
    </div>
  )
}

const TARGET_TEXT = 'entre 35 et 40 minutes'
