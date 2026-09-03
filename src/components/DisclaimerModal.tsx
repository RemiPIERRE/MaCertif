import './DisclaimerModal.css'

interface DisclaimerModalProps {
  onDismissForever: () => void
  onAcknowledge: () => void
}

export function DisclaimerModal({ onDismissForever, onAcknowledge }: DisclaimerModalProps) {
  return (
    <div className="disclaimer-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="disclaimer-modal card">
        <h2 id="disclaimer-title" className="disclaimer-title">
          À lire avant de commencer
        </h2>
        <p className="disclaimer-text">
          Ce site a pour vocation de vous aider et de vous accompagner dans la construction de vos supports en vue du
          passage des examens pour la formation DWWM. Il ne remplace en aucun cas le travail personnel à fournir pour
          la mise en page, la personnalisation de vos supports et la correction des informations qui y figurent. Les
          informations proposées ici sont non exhaustives et peuvent ne pas correspondre à 100% à votre projet.
        </p>
        <div className="disclaimer-actions">
          <button className="btn btn-secondary" onClick={onDismissForever}>
            Ne plus afficher
          </button>
          <button className="btn btn-primary" onClick={onAcknowledge}>
            Bien compris
          </button>
        </div>
      </div>
    </div>
  )
}
