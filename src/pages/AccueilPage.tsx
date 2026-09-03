import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { downloadExport, importFromFile, ImportError } from '../lib/exportImport'
import { computeProgress } from '../lib/progress'
import { filledSlidesStats, formatMinutes, pacingStatus, presentationDuration } from '../lib/oralTime'
import { createDefaultPresentation } from '../data/oralDefaults'
import { STORAGE_KEYS, EMPTY_PROFIL, type Caracteristiques, type ProfilInfos, type DossierReponses } from '../types/storage'
import type { OralSection } from '../types/oral'
import { ProgressBar } from '../components/ProgressBar'
import './AccueilPage.css'

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function formatDateFr(value: string): string {
  if (!value) return 'à définir'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function AccueilPage() {
  const [profil, setProfil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [caracteristiques] = useLocalStorage<Caracteristiques>(STORAGE_KEYS.caracteristiques, {})
  const [oralSections] = useLocalStorage<OralSection[]>(STORAGE_KEYS.oralPresentation, createDefaultPresentation())
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState(() => !(profil.nom.trim() || profil.prenom.trim()))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ProfilInfos>) => setProfil((prev) => ({ ...prev, ...patch }))
  const progress = computeProgress(reponses, caracteristiques)

  const oralStats = filledSlidesStats(oralSections)
  const oralDuration = presentationDuration(oralSections)
  const oralStatus = pacingStatus(oralDuration)
  const oralPercent = oralStats.total === 0 ? 0 : Math.round((oralStats.filled / oralStats.total) * 1000) / 10

  // Weighted by real item counts across both modules, not an average of two percentages.
  const combinedFilled = progress.completedCount + oralStats.filled
  const combinedTotal = progress.totalCount + oralStats.total
  const combinedPercent = combinedTotal === 0 ? 0 : Math.round((combinedFilled / combinedTotal) * 1000) / 10

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await importFromFile(file)
      setImportMessage({ ok: true, text: 'Données importées avec succès.' })
    } catch (error) {
      const text = error instanceof ImportError ? error.message : "Échec de l'import."
      setImportMessage({ ok: false, text })
    }
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Accueil</div>
        <h1>{profil.prenom || profil.nom ? `Bonjour ${profil.prenom || profil.nom}` : 'Bienvenue dans MaCertif'}</h1>
      </header>

      <div className="accueil-grid">
        {editing ? (
          <section className="card accueil-form">
            <h3>Mes informations</h3>
            <div className="field-grid">
              <div className="field">
                <label>Prénom</label>
                <input value={profil.prenom} onChange={(e) => update({ prenom: e.target.value })} placeholder="Sylvain" />
              </div>
              <div className="field">
                <label>Nom</label>
                <input value={profil.nom} onChange={(e) => update({ nom: e.target.value })} placeholder="DURIF" />
              </div>
            </div>

            <div className="field">
              <label>Nom du projet</label>
              <input
                value={profil.nomProjet}
                onChange={(e) => update({ nomProjet: e.target.value })}
                placeholder="Conception d'un site vitrine avec back-office"
              />
            </div>
            <div className="field">
              <label>Sous-titre du projet</label>
              <input
                value={profil.sousTitreProjet}
                onChange={(e) => update({ sousTitreProjet: e.target.value })}
                placeholder="Le P'tit Grain de Folie"
              />
            </div>
            <div className="field">
              <label>Organisme de formation</label>
              <input
                value={profil.nomOrganisme}
                onChange={(e) => update({ nomOrganisme: e.target.value })}
                placeholder="ENI"
              />
            </div>

            <h4 className="accueil-subheading">Dates de formation</h4>
            <div className="field-grid">
              <DateField label="Début" value={profil.dateDebutFormation} onChange={(v) => update({ dateDebutFormation: v })} />
              <DateField label="Fin" value={profil.dateFinFormation} onChange={(v) => update({ dateFinFormation: v })} />
            </div>

            <h4 className="accueil-subheading">Dates de stage</h4>
            <div className="field-grid">
              <DateField label="Début" value={profil.dateDebutStage} onChange={(v) => update({ dateDebutStage: v })} />
              <DateField label="Fin" value={profil.dateFinStage} onChange={(v) => update({ dateFinStage: v })} />
            </div>

            <h4 className="accueil-subheading">Dates d'examen</h4>
            <div className="field-grid">
              <DateField label="Début" value={profil.dateExamenDebut} onChange={(v) => update({ dateExamenDebut: v })} />
              <DateField label="Fin" value={profil.dateExamenFin} onChange={(v) => update({ dateExamenFin: v })} />
            </div>

            <button className="btn btn-primary" onClick={() => setEditing(false)}>
              Sauvegarder
            </button>
          </section>
        ) : (
          <section className="card accueil-form accueil-recap">
            <div className="accueil-recap-header">
              <h3>Mes informations</h3>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Modifier
              </button>
            </div>
            <dl className="accueil-recap-list">
              <div>
                <dt>Candidat</dt>
                <dd>{`${profil.prenom} ${profil.nom}`.trim() || 'à définir'}</dd>
              </div>
              <div>
                <dt>Projet</dt>
                <dd>
                  {profil.nomProjet || 'à définir'}
                  {profil.sousTitreProjet && <span className="accueil-recap-sub"> · {profil.sousTitreProjet}</span>}
                </dd>
              </div>
              <div>
                <dt>Organisme de formation</dt>
                <dd>{profil.nomOrganisme || 'à définir'}</dd>
              </div>
              <div>
                <dt>Formation</dt>
                <dd>
                  Du {formatDateFr(profil.dateDebutFormation)} au {formatDateFr(profil.dateFinFormation)}
                </dd>
              </div>
              <div>
                <dt>Stage</dt>
                <dd>
                  Du {formatDateFr(profil.dateDebutStage)} au {formatDateFr(profil.dateFinStage)}
                </dd>
              </div>
              <div>
                <dt>Examen</dt>
                <dd>
                  Du {formatDateFr(profil.dateExamenDebut)} au {formatDateFr(profil.dateExamenFin)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <div className="accueil-side">
          <section className="card accueil-progress">
            <h3>Mon avancement global</h3>
            <div className="accueil-progress-number">{combinedPercent}%</div>
            <p>
              {combinedFilled} / {combinedTotal} éléments remplis, dossier et oral confondus.
            </p>
            <ProgressBar percent={combinedPercent} />

            <div className="accueil-progress-split">
              <div className="accueil-progress-mini">
                <div className="accueil-progress-mini-label">Dossier</div>
                <div className="accueil-progress-mini-value">{progress.percent}%</div>
                <ProgressBar percent={progress.percent} />
                <p className="accueil-progress-mini-hint">
                  {progress.completedCount} / {progress.totalCount} tâches
                  {progress.incompleteCount > 0 && ` (${progress.incompleteCount} sous la cible)`}
                </p>
                <Link className="btn btn-secondary accueil-cta" to="/dossier">
                  Continuer mon dossier
                </Link>
              </div>
              <div className="accueil-progress-mini">
                <div className="accueil-progress-mini-label">Oral</div>
                <div className="accueil-progress-mini-value">{oralPercent}%</div>
                <ProgressBar percent={oralPercent} />
                <p className="accueil-progress-mini-hint">
                  {oralStats.filled} / {oralStats.total} slides
                </p>
                <p className={`accueil-oral-duration accueil-oral-duration-${oralStatus}`}>
                  Durée estimée : {formatMinutes((oralDuration.minMinutes + oralDuration.maxMinutes) / 2)}
                </p>
                <Link className="btn btn-secondary accueil-cta" to="/oral">
                  Continuer mon oral
                </Link>
              </div>
            </div>
          </section>

          <section className="card accueil-backup">
            <h3>Travailler sur plusieurs postes</h3>
            <p>
              Tout est stocké dans <strong>ce navigateur uniquement</strong>, rien n'est envoyé sur un serveur. Si
              vous avancez le soir chez vous et la journée en entreprise, pensez à{' '}
              <strong>exporter vos données en fin de session</strong> et à déposer le fichier JSON dans un espace
              personnel type OneDrive. Sur l'autre poste, il suffit de le réimporter pour retrouver exactement où
              vous en étiez.
            </p>
            <div className="accueil-backup-actions">
              <button className="btn btn-secondary" onClick={downloadExport}>
                Exporter mes données (JSON)
              </button>
              <button className="btn btn-ghost" onClick={handleImportClick}>
                Importer
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
            </div>
            {importMessage && (
              <p className={importMessage.ok ? 'accueil-import-ok' : 'accueil-import-error'}>{importMessage.text}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
