import './MonOralPage.css'

export function MonOralPage() {
  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma certification</div>
        <h1>Mon oral</h1>
        <p className="page-lede">Préparation du support de présentation (PowerPoint) pour votre soutenance orale.</p>
      </header>

      <div className="card oral-placeholder">
        <span className="tag tag-amber">À venir</span>
        <h3>Bientôt disponible</h3>
        <p>
          Cette section vous guidera pour préparer vos slides de soutenance, sur le même principe que « Mon dossier »
          : une liste de sections à composer, avec conseils et progression. Concentrez-vous pour l'instant sur votre
          dossier écrit.
        </p>
      </div>
    </div>
  )
}
