import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { resolveOutline, type ResolvedItem } from '../lib/resolveOutline'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos, type DossierReponses, type Questionnaire } from '../types/storage'
import './DossierCompilePage.css'

function ItemBlock({ item, reponses }: { item: ResolvedItem; reponses: DossierReponses }) {
  if (item.kind === 'note') {
    return (
      <div className="compiled-task">
        <p className="compiled-note">{item.note}</p>
      </div>
    )
  }
  const { task, annexNumber } = item
  return (
    <div className="compiled-task">
      <h4>{task.sectionTitle ?? task.title}</h4>
      {annexNumber !== null ? (
        <p className="compiled-annex-ref">→ Voir Annexe {annexNumber}.</p>
      ) : task.type === 'image' ? (
        <div className="compiled-image-box">
          📷 Image à insérer ici : {reponses[task.id]?.text || <em>(description non renseignée)</em>}
        </div>
      ) : (
        <p>{reponses[task.id]?.text || <em>(non renseigné)</em>}</p>
      )}
    </div>
  )
}

export function DossierComplilePage() {
  const [profil] = useLocalStorage<ProfilInfos>(STORAGE_KEYS.profil, EMPTY_PROFIL)
  const [reponses] = useLocalStorage<DossierReponses>(STORAGE_KEYS.dossier, {})
  const [questionnaire] = useLocalStorage<Questionnaire>(STORAGE_KEYS.questionnaire, {})
  const [exporting, setExporting] = useState(false)

  const outline = resolveOutline(questionnaire)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { generateDossierDocx, downloadDocxBlob } = await import('../lib/docxExport')
      const blob = await generateDossierDocx(profil, reponses, questionnaire)
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
            Aperçu fidèle au plan du document final : titres professionnels, regroupement thématique et annexes.
            Pensez à mettre en forme le document une fois exporté (couleurs, images) avant de le remettre au jury.
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

        {outline.sections
          .filter((s) => s.number === null)
          .map((section) => (
            <section key={section.title} className="compiled-chapter">
              <h2>{section.title}</h2>
              {section.items.map((item, i) => (
                <ItemBlock key={i} item={item} reponses={reponses} />
              ))}
            </section>
          ))}

        {outline.sections
          .filter((s) => s.number !== null)
          .map((section) => (
            <section key={section.title} className="compiled-chapter">
              <h2>
                {section.number}. {section.title}
              </h2>
              {section.subsections.length
                ? section.subsections.map((sub) => (
                    <div key={sub.title}>
                      <h3>{sub.title}</h3>
                      {sub.items.map((item, i) => (
                        <ItemBlock key={i} item={item} reponses={reponses} />
                      ))}
                    </div>
                  ))
                : section.items.map((item, i) => <ItemBlock key={i} item={item} reponses={reponses} />)}
            </section>
          ))}

        {outline.annexes.length > 0 && (
          <section className="compiled-chapter">
            <h2>Annexes</h2>
            {outline.annexes.map((annex) => (
              <div key={annex.number} className="compiled-task">
                <h4>
                  Annexe {annex.number} : {annex.task.sectionTitle ?? annex.task.title}
                </h4>
                <div className="compiled-image-box">
                  📷 Image à insérer ici : {reponses[annex.task.id]?.text || <em>(description non renseignée)</em>}
                </div>
              </div>
            ))}
          </section>
        )}
      </article>
    </div>
  )
}
