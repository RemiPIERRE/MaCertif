import type { Echelle, PoliceId, Reglages } from '../types'
import { FONDS } from '../lib/backgrounds'
import type { PresetId } from '../lib/defaults'
import { LANGAGES } from '../lib/languages'
import { THEMES } from '../lib/themes'

const POLICES: { id: PoliceId; label: string }[] = [
  { id: 'jetbrains', label: 'JetBrains Mono' },
  { id: 'fira', label: 'Fira Code' },
  { id: 'source', label: 'Source Code Pro' },
]

interface ContenuProps {
  reglages: Reglages
  langageDetecte: string | null
  extensionSuggeree: string
  onChange: (patch: Partial<Reglages>) => void
}

/**
 * Réglages liés au CONTENU affiché (ce qui s'écrit dans la fenêtre de code) :
 * placé sous "Mes extraits", dans la colonne de gauche.
 */
export function ReglagesContenuPanel({ reglages: r, langageDetecte, extensionSuggeree, onChange }: ContenuProps) {
  const fixe = r.largeur !== 'auto'
  return (
    <section className="ci-panel" aria-label="Réglages du contenu">
      <h3 className="ci-panel-title">Contenu de l'image</h3>

      <label className="ci-field">
        <span>Nom de fichier affiché</span>
        <input
          type="text"
          value={r.nomFichier}
          maxLength={80}
          placeholder={`ex. extrait.${extensionSuggeree}`}
          onChange={(e) => onChange({ nomFichier: e.target.value })}
        />
      </label>

      <label className="ci-field">
        <span>Langage</span>
        <select value={r.langage} onChange={(e) => onChange({ langage: e.target.value })}>
          <option value="auto">Détection automatique{r.langage === 'auto' && langageDetecte ? ` (${langageDetecte})` : ''}</option>
          {LANGAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ci-field">
        <span>Police</span>
        <select value={r.police} onChange={(e) => onChange({ police: e.target.value as PoliceId })}>
          {POLICES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ci-field">
        <span>Taille du texte : {r.taillePolice} px</span>
        <input type="range" min={10} max={24} step={1} value={r.taillePolice} onChange={(e) => onChange({ taillePolice: Number(e.target.value) })} />
      </label>

      <label className="ci-field">
        <span>Remplissage : {r.remplissage} px</span>
        <input type="range" min={8} max={96} step={4} value={r.remplissage} onChange={(e) => onChange({ remplissage: Number(e.target.value) })} />
      </label>

      <div className="ci-field">
        <span>Largeur de l'image</span>
        <div className="ci-inline">
          <select
            aria-label="Mode de largeur"
            value={fixe ? 'fixe' : 'auto'}
            onChange={(e) => onChange({ largeur: e.target.value === 'auto' ? 'auto' : 800 })}
          >
            <option value="auto">Auto (ligne la plus longue)</option>
            <option value="fixe">Fixe (retour à la ligne)</option>
          </select>
          {fixe && (
            <>
              <input
                type="range"
                aria-label="Largeur en pixels"
                min={300}
                max={1200}
                step={20}
                value={r.largeur as number}
                onChange={(e) => onChange({ largeur: Number(e.target.value) })}
              />
              <output>{r.largeur} px</output>
            </>
          )}
        </div>
      </div>

      <label className="ci-field">
        <span>Première ligne affichée</span>
        <input
          type="number"
          min={1}
          max={99999}
          disabled={!r.numerosLignes}
          value={r.premiereLigne}
          onChange={(e) => onChange({ premiereLigne: Math.max(1, Math.min(99999, Math.round(Number(e.target.value) || 1))) })}
        />
        <small>Utile si l'extrait vient du milieu d'un fichier (ex. ligne 42).</small>
      </label>

      <label className="ci-field">
        <span>Lignes à mettre en évidence</span>
        <input
          type="text"
          value={r.lignesMisesEnAvant}
          maxLength={120}
          placeholder="ex. 3-5, 9"
          disabled={!r.numerosLignes}
          onChange={(e) => onChange({ lignesMisesEnAvant: e.target.value })}
        />
        <small>Numéros tels qu'affichés : vous pourrez écrire « lignes 3 à 5 » dans votre explication.</small>
      </label>

      <div className="ci-field">
        <label className="ci-field">
          <span>Lignes à masquer</span>
          <input
            type="text"
            value={r.lignesMasquees}
            maxLength={300}
            placeholder="ex. 10-45, 80-120"
            disabled={!r.numerosLignes}
            onChange={(e) => onChange({ lignesMasquees: e.target.value })}
          />
          <small>
            Collez un fichier entier et n'en montrez qu'un extrait : les lignes masquées disparaissent de l'image,
            mais les lignes visibles gardent leur numéro d'origine. Rempli automatiquement si vous repliez des
            blocs dans l'éditeur (icône ⌄ dans la marge) — vous pouvez aussi l'écrire vous-même.
          </small>
        </label>
        <label className="ci-field-check">
          <input
            type="checkbox"
            checked={r.afficherRepereMasquage}
            disabled={!r.numerosLignes || !r.lignesMasquees}
            onChange={(e) => onChange({ afficherRepereMasquage: e.target.checked })}
          />
          Afficher un repère « N lignes masquées » dans l'aperçu
        </label>
      </div>
    </section>
  )
}

interface StyleProps {
  reglages: Reglages
  onChange: (patch: Partial<Reglages>) => void
  onPreset: (p: PresetId) => void
}

/**
 * Réglages liés au STYLE visuel de l'image (thème, fond, échelle d'export...) :
 * placé juste sous l'aperçu, dans la colonne principale.
 */
export function ReglagesStylePanel({ reglages: r, onChange, onPreset }: StyleProps) {
  return (
    <section className="ci-panel" aria-label="Réglages du style">
      <h3 className="ci-panel-title">Style de l'image</h3>

      <div className="ci-field">
        <span>Préréglage</span>
        <div className="ci-seg" role="radiogroup" aria-label="Préréglage">
          <button type="button" role="radio" aria-checked={r.theme === 'github-light' && r.fond === 'blanc'} onClick={() => onPreset('impression')} title="Thème clair, fond blanc, sans ombre : économe en encre et lisible en noir et blanc">
            🖨 Impression
          </button>
          <button type="button" role="radio" aria-checked={r.theme === 'one-dark' && r.fond === 'ocean'} onClick={() => onPreset('ecran')} title="Thème sombre sur fond dégradé, pour le support oral">
            🖥 Écran
          </button>
        </div>
      </div>

      <label className="ci-field">
        <span>Thème</span>
        <select value={r.theme} onChange={(e) => onChange({ theme: e.target.value })}>
          <optgroup label="Clairs (impression)">
            {THEMES.filter((t) => !t.sombre).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sombres">
            {THEMES.filter((t) => t.sombre).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label className="ci-field">
        <span>Fond</span>
        <select value={r.fond} onChange={(e) => onChange({ fond: e.target.value })}>
          <optgroup label="Impression">
            {FONDS.filter((f) => f.groupe === 'impression').map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Dégradés">
            {FONDS.filter((f) => f.groupe === 'degrade').map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <fieldset className="ci-checks">
        <legend>Affichage</legend>
        <label>
          <input type="checkbox" checked={r.numerosLignes} onChange={(e) => onChange({ numerosLignes: e.target.checked })} /> Numéros de lignes
        </label>
        <label>
          <input type="checkbox" checked={r.fenetre} onChange={(e) => onChange({ fenetre: e.target.checked })} /> Fenêtre
        </label>
        <label>
          <input type="checkbox" checked={r.ombre} onChange={(e) => onChange({ ombre: e.target.checked })} /> Ombre
        </label>
      </fieldset>

      <div className="ci-field">
        <span>Échelle de l'image</span>
        <div className="ci-seg" role="radiogroup" aria-label="Échelle de l'image">
          {([1, 2, 3] as Echelle[]).map((e) => (
            <button key={e} type="button" role="radio" aria-checked={r.echelle === e} className={r.echelle === e ? 'is-on' : ''} onClick={() => onChange({ echelle: e })}>
              {e}x
            </button>
          ))}
        </div>
        <small>2x convient à la plupart des usages (Word, PowerPoint, impression).</small>
      </div>
    </section>
  )
}
