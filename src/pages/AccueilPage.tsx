import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { downloadExport, importFromFile, ImportError } from '../lib/exportImport'
import { computeProgress } from '../lib/progress'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos, type DossierReponses } from '../types/storage'
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

export function AccueilPage() {
  const [profil, setProfil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ProfilInfos>) => setProfil((prev) => ({ ...prev, ...patch }))
  const progress = computeProgress(reponses)
  const hasIdentity = profil.nom.trim() || profil.prenom.trim()

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
        <h1>{hasIdentity ? `Bonjour ${profil.prenom || profil.nom}` : 'Bienvenue dans MaCertif'}</h1>
        <p className="page-lede">
          Renseignez vos informations une fois : elles alimenteront la page de garde et le pied de page de votre
          dossier exporté.
        </p>
      </header>

      <div className="accueil-grid">
        <section className="card accueil-form">
          <h3>Mes informations</h3>
          <div className="field-grid">
            <div className="field">
              <label>Prénom</label>
              <input value={profil.prenom} onChange={(e) => update({ prenom: e.target.value })} placeholder="Camille" />
            </div>
            <div className="field">
              <label>Nom</label>
              <input value={profil.nom} onChange={(e) => update({ nom: e.target.value })} placeholder="Dupont" />
            </div>
          </div>

          <div className="field">
            <label>Nom du projet</label>
            <input
              value={profil.nomProjet}
              onChange={(e) => update({ nomProjet: e.target.value })}
              placeholder="Association Fidelia"
            />
          </div>
          <div className="field">
            <label>Sous-titre du projet</label>
            <input
              value={profil.sousTitreProjet}
              onChange={(e) => update({ sousTitreProjet: e.target.value })}
              placeholder="Site vitrine associatif"
            />
          </div>
          <div className="field">
            <label>Organisme de formation</label>
            <input
              value={profil.nomOrganisme}
              onChange={(e) => update({ nomOrganisme: e.target.value })}
              placeholder="Certif Academy"
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
        </section>

        <div className="accueil-side">
          <section className="card accueil-progress">
            <h3>Mon avancement</h3>
            <div className="accueil-progress-number">{progress.percent}%</div>
            <p>
              {progress.completedCount} / {progress.totalCount} tâches complétées dans votre dossier.
            </p>
            <ProgressBar percent={progress.percent} />
            <Link className="btn btn-primary accueil-cta" to="/dossier">
              Continuer mon dossier
            </Link>
          </section>

          <section className="card accueil-backup">
            <h3>Sauvegarde</h3>
            <p>
              Tout est stocké dans ce navigateur. Exportez régulièrement vos données pour vous prémunir d'un
              nettoyage du navigateur ou d'un changement de machine.
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
