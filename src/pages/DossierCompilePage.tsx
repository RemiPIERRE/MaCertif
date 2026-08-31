import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dossierChapters } from '../data/dossierContent'
import { useLocalStorage } from '../lib/useLocalStorage'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos, type DossierReponses } from '../types/storage'
import './DossierCompilePage.css'

export function DossierComplilePage() {
  const [profil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { generateDossierDocx, downloadDocxBlob } = await import('../lib/docxExport')
      const blob = await generateDossierDocx(profil, reponses)
      const filename = `dossier-projet-${(profil.nomProjet || 'macertif').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`
      downloadDocxBlob(blob, filename)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <header className="page-header compile-header">
        <div>
          <div className="page-eyebrow">Ma certification</div>
          <h1>Dossier compilé</h1>
          <p className="page-lede">
            Aperçu de toutes vos réponses, dans l'ordre du sommaire. Pensez à mettre en forme le document une fois
            exporté (couleurs, images) avant de le remettre au jury.
          </p>
        </div>
        <div className="compile-header-actions">
          <Link className="btn btn-ghost" to="/dossier">
            ← Retour au dossier
          </Link>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Génération…' : 'Exporter au format Word'}
          </button>
        </div>
      </header>

      <article className="compiled-doc card">
        <div className="compiled-doc-cover">
          <p className="compiled-doc-kicker">Dossier de Projet</p>
          <h2>{profil.nomProjet || 'Nom du projet'}</h2>
          {profil.sousTitreProjet && <p className="compiled-doc-subtitle">{profil.sousTitreProjet}</p>}
          <p>
            {profil.prenom} {profil.nom}
          </p>
          <p className="compiled-doc-meta">{profil.nomOrganisme}</p>
        </div>

        {dossierChapters.map((chapter) => (
          <section key={chapter.id} className="compiled-chapter">
            <h2>
              {chapter.number}. {chapter.title}
            </h2>
            {chapter.subchapters
              ? chapter.subchapters.map((sub) => (
                  <div key={sub.id}>
                    <h3>
                      {sub.code} {sub.title}
                    </h3>
                    {sub.tasks.map((task) => (
                      <div key={task.id} className="compiled-task">
                        <h4>{task.title}</h4>
                        {task.type === 'image' ? (
                          <div className="compiled-image-box">
                            📷 Image à insérer ici : {reponses[task.id]?.text || <em>(description non renseignée)</em>}
                          </div>
                        ) : (
                          <p>{reponses[task.id]?.text || <em>(non renseigné)</em>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              : (chapter.tasks ?? []).map((task) => (
                  <div key={task.id} className="compiled-task">
                    <h4>{task.title}</h4>
                    {task.type === 'image' ? (
                      <div className="compiled-image-box">
                        📷 Image à insérer ici : {reponses[task.id]?.text || <em>(description non renseignée)</em>}
                      </div>
                    ) : (
                      <p>{reponses[task.id]?.text || <em>(non renseigné)</em>}</p>
                    )}
                  </div>
                ))}
          </section>
        ))}
      </article>
    </div>
  )
}
