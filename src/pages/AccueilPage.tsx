import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { downloadExport, importFromFile, ImportError } from '../lib/exportImport'
import { computeProgress } from '../lib/progress'
import { questionnaireQuestions } from '../data/questionnaire'
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
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function AccueilPage() {
  const [profil, setProfil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [questionnaire, setQuestionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState(() => !(profil.nom.trim() || profil.prenom.trim()))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ProfilInfos>) => setProfil((prev) => ({ ...prev, ...patch }))
  const setQuestionAnswer = (id: string, value: boolean) => setQuestionnaire((prev) => ({ ...prev, [id]: value }))
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
        <p className="page-lede">
          Renseignez vos informations une fois : elles alimenteront la page de garde et le pied de page de votre
          dossier exporté.
        </p>
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

            <h4 className="accueil-subheading">Date d'examen</h4>
            <p className="accueil-hint">Purement informative : jamais insérée dans le document Word exporté.</p>
            <div className="field-grid">
              <DateField label="Date" value={profil.dateExamen} onChange={(v) => update({ dateExamen: v })} />
              <div />
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
                <dt>Candidat·e</dt>
                <dd>{`${profil.prenom} ${profil.nom}`.trim() || '—'}</dd>
              </div>
              <div>
                <dt>Projet</dt>
                <dd>
                  {profil.nomProjet || '—'}
                  {profil.sousTitreProjet && <span className="accueil-recap-sub"> — {profil.sousTitreProjet}</span>}
                </dd>
              </div>
              <div>
                <dt>Organisme de formation</dt>
                <dd>{profil.nomOrganisme || '—'}</dd>
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
                <dd>{formatDateFr(profil.dateExamen)}</dd>
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
            <h3>💾 Travailler sur plusieurs postes</h3>
            <p>
              Tout est stocké dans <strong>ce navigateur uniquement</strong> — rien n'est envoyé sur un serveur.
              Si vous avancez le soir chez vous et la journée en entreprise, pensez à <strong>exporter vos données en
              fin de session</strong> et à déposer le fichier JSON dans un espace personnel type OneDrive. Sur l'autre
              poste, il suffit de le réimporter pour retrouver exactement où vous en étiez.
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

      <section className="card accueil-questionnaire">
        <h3>Personnaliser mon dossier</h3>
        <p className="accueil-hint">
          Certaines tâches ne s'appliquent pas à tous les projets. Répondez « non » pour les retirer de votre
          dossier et de votre progression — vous pouvez changer d'avis à tout moment.
        </p>
        <div className="questionnaire-list">
          {questionnaireQuestions.map((q) => {
            const value = questionnaire[q.id] !== false
            return (
              <div key={q.id} className="questionnaire-item">
                <div>
                  <div className="questionnaire-label">{q.label}</div>
                  {q.helpText && <div className="questionnaire-help">{q.helpText}</div>}
                </div>
                <div className="questionnaire-toggle">
                  <button
                    className={`btn ${value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setQuestionAnswer(q.id, true)}
                  >
                    Oui
                  </button>
                  <button
                    className={`btn ${!value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setQuestionAnswer(q.id, false)}
                  >
                    Non
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
