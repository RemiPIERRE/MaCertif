import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../lib/useLocalStorage'
import { resolveOutline, type ResolvedItem } from '../lib/resolveOutline'
import { STORAGE_KEYS, EMPTY_PROFIL, type ProfilInfos, type DossierReponses, type Questionnaire } from '../types/storage'
import './DossierCompilePage.css'

function TaskBody({ item, reponses }: { item: Extract<ResolvedItem, { kind: 'task' }>; reponses: DossierReponses }) {
  const { task, annexNumber } = item
  if (annexNumber !== null) return <p className="compiled-annex-ref">Voir Annexe {annexNumber}.</p>
  if (task.type === 'image') {
    return (
      <div className="compiled-image-box">
        Image à insérer ici : {reponses[task.id]?.text || <em>Description non renseignée</em>}
      </div>
    )
  }
  return <p>{reponses[task.id]?.text || <em>Non renseigné</em>}</p>
}

/**
 * A single item in a list gets its own body directly under the parent heading (no
 * redundant, un-numbered sub-heading repeating the same title); a list with several
 * items numbers each one `${numberPrefix}.${index}`, mirroring the Word export.
 */
function ItemList({ items, reponses, numberPrefix }: { items: ResolvedItem[]; reponses: DossierReponses; numberPrefix: string }) {
  if (items.length === 1) {
    const only = items[0]
    return only.kind === 'note' ? <p className="compiled-note">{only.note}</p> : <TaskBody item={only} reponses={reponses} />
  }
  return (
    <>
      {items.map((item, i) => {
        const number = `${numberPrefix}.${i + 1}`
        return item.kind === 'note' ? (
          <div key={i} className="compiled-task">
            <h4>
              {number} {item.title}
            </h4>
            <p className="compiled-note">{item.note}</p>
          </div>
        ) : (
          <div key={i} className="compiled-task">
            <h4>
              {number} {item.task.sectionTitle ?? item.task.title}
            </h4>
            <TaskBody item={item} reponses={reponses} />
          </div>
        )
      })}
    </>
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
      <header className="page-header">
        <div className="page-eyebrow">Ma certification</div>
        <h1>Dossier compilé</h1>
        <p className="page-lede">
          Aperçu fidèle au plan du document final : titres professionnels, regroupement thématique et annexes.
          Pensez à mettre en forme le document une fois exporté (couleurs, images) avant de le remettre au jury.
        </p>
      </header>

      <div className="compile-actions">
        <Link className="btn btn-ghost" to="/dossier">
          Retour au dossier
        </Link>
        <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Génération…' : 'Exporter au format Word'}
        </button>
      </div>

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

        <section className="compiled-chapter">
          <h2>{outline.remerciements.title}</h2>
          <ItemList items={outline.remerciements.items} reponses={reponses} numberPrefix="" />
        </section>

        <section className="compiled-chapter">
          <h2>{outline.introduction.title}</h2>
          <ItemList items={outline.introduction.items} reponses={reponses} numberPrefix="" />
        </section>

        {outline.numbered.map((section) => (
          <section key={section.title} className="compiled-chapter">
            <h2>
              {section.number}. {section.title}
            </h2>
            {section.subsections.length
              ? section.subsections.map((sub, si) => {
                  const subNumber = `${section.number}.${si + 1}`
                  return (
                    <div key={sub.title}>
                      <h3>
                        {subNumber} {sub.title}
                      </h3>
                      <ItemList items={sub.items} reponses={reponses} numberPrefix={subNumber} />
                    </div>
                  )
                })
              : <ItemList items={section.items} reponses={reponses} numberPrefix={String(section.number)} />}
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
                  Image à insérer ici : {reponses[annex.task.id]?.text || <em>Description non renseignée</em>}
                </div>
              </div>
            ))}
          </section>
        )}
      </article>
    </div>
  )
}
