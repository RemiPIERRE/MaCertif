import { MERISE_TYPES_SQL } from './typesSql'
import { FK_ACTIONS, type FkAction, type TableColonne, type TableNodeData } from '../types'
import { nouvelleColonne } from '../lib/modele'
import { EditeurCadre } from './EditeurCadre'
import { useListeEditable } from './useListeEditable'
import type { NiveauTable } from './NiveauContext'

/** Résumé d'une table du schéma, pour proposer les clés référençables. */
export interface TableResume {
  id: string
  nom: string
  colonnes: TableColonne[]
}

interface Props {
  data: TableNodeData
  niveau: NiveauTable
  tables: TableResume[]
  onChange: (patch: Partial<TableNodeData>) => void
  onClose: () => void
}

const SEPARATEUR = '|'

/**
 * Éditeur d'une table du MLD / MPD.
 *  - MLD : nom, clé primaire (PK), clé étrangère (référence).
 *  - MPD : + type SQL, NOT NULL, UNIQUE, AUTO_INCREMENT, valeur par défaut, et les actions
 *    ON DELETE / ON UPDATE de chaque clé étrangère.
 * Une clé étrangère se définit en choisissant la colonne référencée (PK ou UNIQUE d'une table) ;
 * le trait entre les deux tables en est déduit.
 */
export function TableEditor({ data, niveau, tables, onChange, onClose }: Props) {
  const mpd = 'mpd' === niveau
  const colonnes = data.colonnes
  const { racineRef, ajouter, maj, supprimer, deplacer } = useListeEditable<TableColonne>(
    colonnes,
    (suivantes) => onChange({ colonnes: suivantes }),
    () => nouvelleColonne(),
  )

  const classeLigne = `me-ligne me-ligne--${niveau}`

  const choisirReference = (col: TableColonne, valeur: string) => {
    if ('' === valeur) {
      maj(col.id, { reference: null })
      return
    }
    const [tableId, colonneId] = valeur.split(SEPARATEUR)
    const cible = tables.find((t) => t.id === tableId)?.colonnes.find((c) => c.id === colonneId)
    // Une colonne sans type hérite de celui de la colonne référencée (même type obligatoire en SQL).
    maj(col.id, { reference: { tableId, colonneId }, type: col.type || cible?.type || '' })
  }

  const optionsReference = (col: TableColonne) =>
    tables
      .map((t) => ({
        ...t,
        colonnes: t.colonnes.filter((c) => c.pk || c.unique || (col.reference?.tableId === t.id && col.reference.colonneId === c.id)),
      }))
      .filter((t) => t.colonnes.length > 0)

  return (
    <EditeurCadre
      racineRef={racineRef}
      etiquetteNom="Nom de la table"
      placeholderNom="UTILISATEUR"
      nom={data.nom}
      onNom={(nom) => onChange({ nom })}
      style={data.style}
      onStyle={(style) => onChange({ style })}
      onClose={onClose}
      onAjouter={() => ajouter()}
      libelleAjout="+ Ajouter un élément"
    >
      <div className="me-tableau" aria-label="Éléments de la table">
        <div className={`${classeLigne} me-ligne--titres`} aria-hidden="true">
          <span />
          <span>Nom</span>
          {mpd && <span>Type</span>}
          <span title="Clé primaire">PK</span>
          {mpd && <span title="NOT NULL">NN</span>}
          {mpd && <span title="UNIQUE">UQ</span>}
          {mpd && <span title="AUTO_INCREMENT">AI</span>}
          {mpd && <span>Défaut</span>}
          <span>Clé étrangère</span>
          <span />
        </div>

        {0 === colonnes.length && <p className="me-vide">Aucun élément pour l'instant.</p>}

        {colonnes.map((c, index) => {
          const nomEnfant = data.nom || 'cette table'
          const nomParent = (c.reference && tables.find((t) => t.id === c.reference?.tableId)?.nom) || 'parent'
          return (
          <div key={c.id} className="me-bloc" data-ligne-id={c.id}>
            <div className={classeLigne}>
              <span className="me-ordre">
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacer(index, -1)} disabled={0 === index} title="Monter">
                  ↑
                </button>
                <button type="button" className="me-bouton me-bouton--icone me-bouton--mini" onClick={() => deplacer(index, 1)} disabled={index === colonnes.length - 1} title="Descendre">
                  ↓
                </button>
              </span>

              <input
                className="me-input"
                name="nom"
                value={c.nom}
                onChange={(e) => maj(c.id, { nom: e.target.value })}
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

              {mpd && (
                <input
                  className="me-input me-input--mono"
                  list="merise-types-sql"
                  value={c.type}
                  onChange={(e) => maj(c.id, { type: e.target.value })}
                  placeholder="Type"
                  aria-label="Type"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}

              <label className="me-case" title="Clé primaire">
                <input type="checkbox" checked={c.pk} onChange={(e) => maj(c.id, { pk: e.target.checked, nonNull: e.target.checked ? true : c.nonNull })} aria-label="Clé primaire" />
              </label>

              {mpd && (
                <label className="me-case" title="NOT NULL">
                  <input type="checkbox" checked={c.nonNull || c.pk} disabled={c.pk} onChange={(e) => maj(c.id, { nonNull: e.target.checked })} aria-label="NOT NULL" />
                </label>
              )}
              {mpd && (
                <label className="me-case" title="UNIQUE">
                  <input type="checkbox" checked={c.unique} onChange={(e) => maj(c.id, { unique: e.target.checked })} aria-label="UNIQUE" />
                </label>
              )}
              {mpd && (
                <label className="me-case" title="AUTO_INCREMENT">
                  <input type="checkbox" checked={c.autoIncrement} onChange={(e) => maj(c.id, { autoIncrement: e.target.checked })} aria-label="AUTO_INCREMENT" />
                </label>
              )}

              {mpd && (
                <input
                  className="me-input me-input--mono"
                  value={c.defaut}
                  onChange={(e) => maj(c.id, { defaut: e.target.value })}
                  placeholder="—"
                  aria-label="Valeur par défaut"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}

              <select
                className="me-input me-select"
                value={c.reference ? `${c.reference.tableId}${SEPARATEUR}${c.reference.colonneId}` : ''}
                onChange={(e) => choisirReference(c, e.target.value)}
                aria-label="Clé étrangère : élément référencé"
              >
                <option value="">—</option>
                {optionsReference(c).map((t) => (
                  <optgroup key={t.id} label={t.nom || '(sans nom)'}>
                    {t.colonnes.map((cible) => (
                      <option key={cible.id} value={`${t.id}${SEPARATEUR}${cible.id}`}>
                        {cible.nom || '(sans nom)'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button type="button" className="me-bouton me-bouton--icone me-bouton--danger" onClick={() => supprimer(c.id)} title="Supprimer l'élément" aria-label="Supprimer l'élément">
                ×
              </button>
            </div>

            {mpd && c.reference && (
              <div className="me-ligne-fk">
                <label title="Combien de lignes de cette table peut avoir chaque ligne de la table parent (le « ,1 » correspond à un élément UNIQUE ; le minimum 1 est documentaire : SQL ne peut pas l'imposer).">
                  <span>{nomParent} :</span>
                  <select
                    className="me-input me-select me-select--court"
                    value={valeurEnfants(c, colonnes)}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split(',')
                      maj(c.id, { enfantObligatoire: '1' === min, unique: '1' === max })
                    }}
                    aria-label={`Cardinalité côté ${nomParent}`}
                  >
                    <option value="0,N">0,N</option>
                    <option value="1,N">1,N</option>
                    <option value="0,1">0,1</option>
                    <option value="1,1">1,1</option>
                  </select>
                </label>
                <label title="Combien de lignes de la table parent référence chaque ligne de cette table : 0,1 = la clé étrangère peut être NULL ; 1,1 = NOT NULL.">
                  <span>{nomEnfant} :</span>
                  <select
                    className="me-input me-select me-select--court"
                    value={c.nonNull || c.pk ? '1,1' : '0,1'}
                    disabled={c.pk}
                    onChange={(e) => maj(c.id, { nonNull: '1,1' === e.target.value })}
                    aria-label={`Cardinalité côté ${nomEnfant}`}
                  >
                    <option value="0,1">0,1</option>
                    <option value="1,1">1,1</option>
                  </select>
                </label>
                <label>
                  <span>ON DELETE</span>
                  <select className="me-input me-select" value={c.surSuppression} onChange={(e) => maj(c.id, { surSuppression: e.target.value as FkAction })}>
                    {FK_ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>ON UPDATE</span>
                  <select className="me-input me-select" value={c.surMiseAJour} onChange={(e) => maj(c.id, { surMiseAJour: e.target.value as FkAction })}>
                    {FK_ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="me-fk-lecture">{lectureCardinalite(nomEnfant, nomParent, c, colonnes)}</p>
              </div>
            )}
          </div>
          )
        })}
      </div>

      <datalist id="merise-types-sql">
        {MERISE_TYPES_SQL.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </EditeurCadre>
  )
}

/** Valeur « min,max » du côté enfants : max 1 si la colonne est UNIQUE (ou seule clé primaire), sinon N. */
function valeurEnfants(c: TableColonne, colonnes: TableColonne[]): string {
  const unique = c.unique || (c.pk && 1 === colonnes.filter((x) => x.pk).length)
  return `${c.enfantObligatoire ? '1' : '0'},${unique ? '1' : 'N'}`
}

/** Phrase de lecture, dans l'esprit de l'encadré « Lecture des cardinalités » d'un MCD. */
function lectureCardinalite(enfant: string, parent: string, c: TableColonne, colonnes: TableColonne[]): string {
  const cote = c.nonNull || c.pk ? `exactement 1 ${parent}` : `0 ou 1 ${parent}`
  const enfants: Record<string, string> = {
    '0,N': `0 à plusieurs ${enfant}`,
    '1,N': `au moins 1 ${enfant} (et plusieurs possibles)`,
    '0,1': `0 ou 1 ${enfant}`,
    '1,1': `exactement 1 ${enfant}`,
  }
  return `Chaque ${enfant} appartient à ${cote} · Chaque ${parent} a ${enfants[valeurEnfants(c, colonnes)]}`
}