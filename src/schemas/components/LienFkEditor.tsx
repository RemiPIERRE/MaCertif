import type { CoteLienFk, TableColonne } from '../types'
import './merise.css'

interface Props {
  col: TableColonne
  nomEnfant: string
  nomParent: string
  coteEnfantEffectif: CoteLienFk
  coteParentEffectif: CoteLienFk
  onChange: (patch: Partial<Pick<TableColonne, 'styleLien' | 'cotes'>>) => void
  onClose: () => void
}

/**
 * Petit éditeur du bas pour un lien FK (MLD/MPD), ouvert par double-clic sur le trait :
 * style (cardinalité ou simple trait) et côté gauche/droite de chaque extrémité. Les côtés
 * peuvent aussi être changés directement en glissant un point de connexion sur le canevas
 * (voir onReconnect dans SchemaCanvas) — les deux agissent sur le même champ `col.cotes`.
 */
export function LienFkEditor({ col, nomEnfant, nomParent, coteEnfantEffectif, coteParentEffectif, onChange, onClose }: Props) {
  const styleLien = col.styleLien ?? 'cardinalite'

  return (
    <div className="merise-editor merise-editor--lien">
      <header className="me-entete">
        <span className="me-champ-nom">
          <span className="me-etiquette">Liaison</span>
          <span className="me-lien-titre">
            {nomEnfant || 'table'} → {nomParent || 'table'}
          </span>
        </span>
        <div className="me-entete-actions">
          <button type="button" className="me-bouton me-bouton--icone" onClick={onClose} title="Fermer l'éditeur" aria-label="Fermer l'éditeur">
            ×
          </button>
        </div>
      </header>

      <div className="me-corps me-corps--lien">
        <label className="me-champ-lien">
          <span className="me-etiquette">Style</span>
          <select
            className="me-input me-select"
            value={styleLien}
            onChange={(e) => onChange({ styleLien: e.target.value as 'cardinalite' | 'simple' })}
          >
            <option value="cardinalite">Cardinalité</option>
            <option value="simple">Simple</option>
          </select>
        </label>

        <label className="me-champ-lien">
          <span className="me-etiquette">Côté {nomEnfant || 'enfant'}</span>
          <select
            className="me-input me-select"
            value={coteEnfantEffectif}
            onChange={(e) => onChange({ cotes: { enfant: e.target.value as CoteLienFk, parent: coteParentEffectif } })}
          >
            <option value="gauche">Gauche</option>
            <option value="droite">Droite</option>
          </select>
        </label>

        <label className="me-champ-lien">
          <span className="me-etiquette">Côté {nomParent || 'parent'}</span>
          <select
            className="me-input me-select"
            value={coteParentEffectif}
            onChange={(e) => onChange({ cotes: { enfant: coteEnfantEffectif, parent: e.target.value as CoteLienFk } })}
          >
            <option value="gauche">Gauche</option>
            <option value="droite">Droite</option>
          </select>
        </label>

        {col.cotes && (
          <button type="button" className="me-bouton me-bouton--petit me-bouton--discret" onClick={() => onChange({ cotes: null })}>
            Réinitialiser (chemin le plus court automatique)
          </button>
        )}
      </div>
    </div>
  )
}
