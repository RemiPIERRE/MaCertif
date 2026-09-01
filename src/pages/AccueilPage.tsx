import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { downloadExport, importFromFile, ImportError } from '../lib/exportImport'
import { computeProgress } from '../lib/progress'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos, type DossierReponses, type Questionnaire } from '../types/storage'
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
  const [questionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState(() => !(profil.nom.trim() || profil.prenom.trim()))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ProfilInfos>) => setProfil((prev) => ({ ...prev, ...patch }))
  const progress = computeProgress(reponses, questionnaire)

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
                <input value={profil.prenom} onChange={(e) => update({ prenom: e.target.value })} placeholder="Camille" />
              </div>
              <div className="field">
                <label>Nom</label>
                <input value={profil.nom} onChange={(e) => update({ nom: e.target.value })} placeholder="PIERRE" />
              </div>
            </div>

            <div className="field">
              <label>Nom du projet</label>
              <input
                value={profil.nomProjet}
                onChange={(e) => update({ nomProjet: e.target.value })}
                placeholder="Le P'tit Grain de Folie"
              />
            </div>
            <div className="field">
              <label>Sous-titre du projet</label>
              <input
                value={profil.sousTitreProjet}
                onChange={(e) => update({ sousTitreProjet: e.target.value })}
                placeholder="Site vitrine de restaurant"
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
            <h3>Mon avancement</h3>
            <div className="accueil-progress-number">{progress.percent}%</div>
            <p>
              {progress.completedCount} / {progress.totalCount} tâches complétées
              {progress.incompleteCount > 0 && ` (${progress.incompleteCount} en dessous du minimum indicatif)`}.
            </p>
            <ProgressBar percent={progress.percent} />
            <Link className="btn btn-primary accueil-cta" to="/dossier">
              Continuer mon dossier
            </Link>
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
