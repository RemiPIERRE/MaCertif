import { useRef } from 'react'
import { VISIBILITE_LABELS, type ClasseAttribut, type ClasseMethode, type ClasseNodeData, type ClasseVisibilite } from '../types'
import { nouvelAttribut, nouvelleMethode } from '../lib/modele'
import { EditeurCadre } from './EditeurCadre'
import { useListeEditable } from './useListeEditable'

interface Props {
  data: ClasseNodeData
  onChange: (patch: Partial<ClasseNodeData>) => void
  onClose: () => void
}

const VISIBILITES = Object.keys(VISIBILITE_LABELS) as ClasseVisibilite[]

/**
 * Éditeur d'une classe UML (même cadre que les tables MLD/MPD et les entités MCD) : nom,
 * stéréotype, apparence, puis deux listes indépendantes — attributs et méthodes.
 */
export function ClasseEditor({ data, onChange, onClose }: Props) {
  const racineRef = useRef<HTMLDivElement | null>(null)
  const attributs = data.attributs
  const methodes = data.methodes

  const {
    racineRef: racineAttributs,
    ajouter: ajouterAttribut,
    maj: majAttribut,
    supprimer: supprimerAttribut,
    deplacer: deplacerAttribut,
  } = useListeEditable<ClasseAttribut>(attributs, (suivants) => onChange({ attributs: suivants }), () => nouvelAttribut())

  const {
    racineRef: racineMethodes,
    ajouter: ajouterMethode,
    maj: majMethode,
    supprimer: supprimerMethode,
    deplacer: deplacerMethode,
  } = useListeEditable<ClasseMethode>(methodes, (suivants) => onChange({ methodes: suivants }), () => nouvelleMethode())

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom="Nom de la classe"
      placeholderNom="Commande"
      nom={data.nom}
      onNom={(nom) => onChange({ nom })}
      style={data.style}
      onStyle={(style) => onChange({ style })}
      onClose={onClose}
    >
      <div className="me-tableau sequence-editor">
        <div className="me-ligne me-ligne--portee sequence-identite">
          <span className="me-etiquette">Stéréotype</span>
          <input
            className="me-input"
            value={data.stereotype ?? ''}
            onChange={(e) => onChange({ stereotype: e.target.value || undefined })}
            placeholder="interface, enumeration… (facultatif)"
            autoComplete="off"
            spellCheck={false}
          />
          <label className="me-case" title="Nom affiché en italique">
            <input type="checkbox" checked={Boolean(data.abstraite)} onChange={(e) => onChange({ abstraite: e.target.checked })} aria-label="Classe abstraite" />
            <span>Abstraite</span>
          </label>
        </div>
      </div>

      <div className="me-tableau" aria-label="Attributs" ref={racineAttributs}>
        <div className="me-ligne me-ligne--classe-attribut me-ligne--titres" aria-hidden="true">
          <span />
          <span title="Visibilité">Vis.</span>
          <span>Nom</span>
          <span>Type</span>
          <span />
        </div>

        {0 === attributs.length && <p className="me-vide">Aucun attribut pour l'instant.</p>}

        {attributs.map((a, index) => (
          <div key={a.id} className="me-bloc" data-ligne-id={a.id}>
            <div className="me-ligne me-ligne--classe-attribut">
              <span className="me-ordre">
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacerAttribut(index, -1)} disabled={0 === index} title="Monter">
                  ↑
                </button>
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacerAttribut(index, 1)} disabled={index === attributs.length - 1} title="Descendre">
                  ↓
                </button>
              </span>

              <select className="me-input me-select" value={a.visibilite} onChange={(e) => majAttribut(a.id, { visibilite: e.target.value as ClasseVisibilite })} aria-label="Visibilité">
                {VISIBILITES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITE_LABELS[v]}
                  </option>
                ))}
              </select>

              <input
                className="me-input"
                name="nom"
                value={a.nom}
                onChange={(e) => majAttribut(a.id, { nom: e.target.value })}
                onKeyDown={(e) => {
                  if ('Enter' === e.key) {
                    e.preventDefault()
                    ajouterAttribut(index)
                  }
                }}
                placeholder="nom"
                aria-label="Nom"
                autoComplete="off"
                spellCheck={false}
              />

              <input
                className="me-input me-input--mono"
                value={a.type}
                onChange={(e) => majAttribut(a.id, { type: e.target.value })}
                placeholder="Type (facultatif)"
                aria-label="Type"
                autoComplete="off"
                spellCheck={false}
              />

              <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => supprimerAttribut(a.id)} title="Supprimer l'attribut" aria-label="Supprimer l'attribut">
                ×
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="me-bouton me-bouton--petit me-nouveau-message" onClick={() => ajouterAttribut()}>
          + Ajouter un attribut
        </button>
      </div>

      <div className="me-tableau" aria-label="Méthodes" ref={racineMethodes}>
        <div className="me-ligne me-ligne--classe-methode me-ligne--titres" aria-hidden="true">
          <span />
          <span title="Visibilité">Vis.</span>
          <span>Nom</span>
          <span>Paramètres</span>
          <span>Retour</span>
          <span />
        </div>

        {0 === methodes.length && <p className="me-vide">Aucune méthode pour l'instant.</p>}

        {methodes.map((m, index) => (
          <div key={m.id} className="me-bloc" data-ligne-id={m.id}>
            <div className="me-ligne me-ligne--classe-methode">
              <span className="me-ordre">
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacerMethode(index, -1)} disabled={0 === index} title="Monter">
                  ↑
                </button>
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacerMethode(index, 1)} disabled={index === methodes.length - 1} title="Descendre">
                  ↓
                </button>
              </span>

              <select className="me-input me-select" value={m.visibilite} onChange={(e) => majMethode(m.id, { visibilite: e.target.value as ClasseVisibilite })} aria-label="Visibilité">
                {VISIBILITES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITE_LABELS[v]}
                  </option>
                ))}
              </select>

              <input
                className="me-input"
                name="nom"
                value={m.nom}
                onChange={(e) => majMethode(m.id, { nom: e.target.value })}
                onKeyDown={(e) => {
                  if ('Enter' === e.key) {
                    e.preventDefault()
                    ajouterMethode(index)
                  }
                }}
                placeholder="nom"
                aria-label="Nom"
                autoComplete="off"
                spellCheck={false}
              />

              <input
                className="me-input me-input--mono"
                value={m.parametres}
                onChange={(e) => majMethode(m.id, { parametres: e.target.value })}
                placeholder="id: int, nom: string"
                aria-label="Paramètres"
                autoComplete="off"
                spellCheck={false}
              />

              <input
                className="me-input me-input--mono"
                value={m.typeRetour}
                onChange={(e) => majMethode(m.id, { typeRetour: e.target.value })}
                placeholder="void"
                aria-label="Type de retour"
                autoComplete="off"
                spellCheck={false}
              />

              <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => supprimerMethode(m.id)} title="Supprimer la méthode" aria-label="Supprimer la méthode">
                ×
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="me-bouton me-bouton--petit me-nouveau-message" onClick={() => ajouterMethode()}>
          + Ajouter une méthode
        </button>
      </div>
    </EditeurCadre>
  )
}
