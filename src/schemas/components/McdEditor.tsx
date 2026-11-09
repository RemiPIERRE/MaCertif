import type { McdAssociationNodeData, McdEntiteNodeData, McdPropriete } from '../types'
import { nouvellePropriete } from '../lib/modele'
import { EditeurCadre } from './EditeurCadre'
import { useListeEditable } from './useListeEditable'

type Genre = 'entite' | 'association'

interface Props {
  genre: Genre
  data: McdEntiteNodeData | McdAssociationNodeData
  onChange: (patch: Partial<McdEntiteNodeData>) => void
  onClose: () => void
}

const TYPES_DOMAINE = ['Entier', 'Texte', 'Date', 'Booléen', 'Décimal', 'Heure']

/**
 * Éditeur d'une entité ou d'une association du MCD : nom et propriétés (nom, type de
 * domaine facultatif). Pour une entité, une propriété peut être cochée « identifiant »
 * (soulignée sur le schéma) ; une association n'a pas d'identifiant.
 */
export function McdEditor({ genre, data, onChange, onClose }: Props) {
  const entite = 'entite' === genre
  const proprietes = data.proprietes
  const { racineRef, ajouter, maj, supprimer, deplacer } = useListeEditable<McdPropriete>(
    proprietes,
    (suivantes) => onChange({ proprietes: suivantes }),
    () => nouvellePropriete(),
  )

  const classeLigne = `me-ligne me-ligne--mcd-${genre}`

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom={entite ? "Nom de l'entité" : "Nom de l'association"}
      placeholderNom={entite ? 'CLIENT' : 'COMMANDER'}
      nom={data.nom}
      onNom={(nom) => onChange({ nom })}
      style={data.style}
      onStyle={(style) => onChange({ style })}
      onClose={onClose}
      onAjouter={() => ajouter()}
      libelleAjout="+ Ajouter une propriété"
    >
      <div className="me-tableau" aria-label="Propriétés">
        <div className={`${classeLigne} me-ligne--titres`} aria-hidden="true">
          <span />
          <span>Nom</span>
          <span>Type</span>
          {entite && <span title="Identifiant (souligné)">Identifiant</span>}
          <span />
        </div>

        {0 === proprietes.length && <p className="me-vide">{entite ? "Aucune propriété pour l'instant." : "Aucune propriété : une association peut en avoir (ex. quantité), ou aucune."}</p>}

        {proprietes.map((p, index) => (
          <div key={p.id} className="me-bloc" data-ligne-id={p.id}>
            <div className={classeLigne}>
              <span className="me-ordre">
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacer(index, -1)} disabled={0 === index} title="Monter">
                  ↑
                </button>
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacer(index, 1)} disabled={index === proprietes.length - 1} title="Descendre">
                  ↓
                </button>
              </span>

              <input
                className="me-input"
                name="nom"
                value={p.nom}
                onChange={(e) => maj(p.id, { nom: e.target.value })}
                onKeyDown={(e) => {
                  if ('Enter' === e.key) {
                    e.preventDefault()
                    ajouter(index)
                  }
                }}
                placeholder="nom"
                aria-label="Nom"
                autoComplete="off"
                spellCheck={false}
              />

              <input
                className="me-input"
                list="merise-types-mcd"
                value={p.type}
                onChange={(e) => maj(p.id, { type: e.target.value })}
                placeholder="Type (facultatif)"
                aria-label="Type"
                autoComplete="off"
                spellCheck={false}
              />

              {entite && (
                <label className="me-case" title="Identifiant (souligné)">
                  <input type="checkbox" checked={p.identifiant} onChange={(e) => maj(p.id, { identifiant: e.target.checked })} aria-label="Identifiant" />
                </label>
              )}

              <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => supprimer(p.id)} title="Supprimer la propriété" aria-label="Supprimer la propriété">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <datalist id="merise-types-mcd">
        {TYPES_DOMAINE.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </EditeurCadre>
  )
}
