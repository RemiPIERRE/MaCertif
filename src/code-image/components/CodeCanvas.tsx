import { forwardRef, type CSSProperties } from 'react'
import type { Reglages } from '../types'
import { getFond } from '../lib/backgrounds'
import { analyserLignes, grouperLignes } from '../lib/highlight'
import { POLICES_CSS } from '../lib/exportImage'
import { getTheme, themeVars } from '../lib/themes'

interface Props {
  lignes: string[]
  reglages: Reglages
}

/**
 * Le nœud capturé pour produire le PNG. Tout ce qui est dessiné ici se retrouve dans l'image :
 * ne rien y ajouter qui ne doive pas apparaître (légendes, boutons…).
 */
export const CodeCanvas = forwardRef<HTMLDivElement, Props>(function CodeCanvas({ lignes, reglages: r }, ref) {
  const theme = getTheme(r.theme)
  const fond = getFond(r.fond)
  const fixe = r.largeur !== 'auto'
  const misesEnAvant = analyserLignes(r.lignesMisesEnAvant)
  const masquees = r.numerosLignes ? analyserLignes(r.lignesMasquees) : new Set<number>()
  const groupes = grouperLignes(lignes, r.premiereLigne, masquees)
  const dernier = r.premiereLigne + Math.max(lignes.length - 1, 0)
  const chiffres = String(dernier).length

  // L'ombre est dimensionnée sur le remplissage pour ne jamais être rognée par les bords de l'image.
  const alpha = fond.clair ? 0.22 : 0.45
  const boxShadow = r.ombre
    ? `0 ${Math.round(r.remplissage * 0.3)}px ${Math.round(r.remplissage * 0.6)}px rgba(0,0,0,${alpha})`
    : 'none'

  const styleCanvas: CSSProperties = {
    background: fond.css ?? 'transparent',
    padding: r.remplissage,
    width: fixe ? (r.largeur as number) : 'max-content',
    ...themeVars(theme),
  }
  const styleCode: CSSProperties = {
    fontFamily: POLICES_CSS[r.police],
    fontSize: r.taillePolice,
  }

  return (
    <div ref={ref} className="ci-canvas" style={styleCanvas} data-testid="ci-canvas">
      <div className="ci-window" style={{ boxShadow }}>
        {r.fenetre && (
          <div className="ci-bar">
            <span className="ci-dots" aria-hidden="true">
              <i style={{ background: '#ff5f57' }} />
              <i style={{ background: '#febc2e' }} />
              <i style={{ background: '#28c840' }} />
            </span>
            <span className="ci-title" style={{ fontFamily: POLICES_CSS[r.police] }}>
              {r.nomFichier}
            </span>
          </div>
        )}
        <div className={`ci-code${fixe ? ' ci-wrap' : ''}`} style={styleCode}>
          {groupes.map((g, i) =>
            g.type === 'masque' ? (
              <div key={i} className="ci-line ci-line--masque" style={{ minWidth: `${chiffres}ch` }}>
                <span className="ci-ln" style={{ minWidth: `${chiffres}ch` }} aria-hidden="true">
                  ⋯
                </span>
                <span className="ci-lc ci-lc--masque">
                  {g.fin > g.debut ? `${g.fin - g.debut + 1} lignes masquées (${g.debut}-${g.fin})` : `ligne ${g.debut} masquée`}
                </span>
              </div>
            ) : (
              <div key={i} className={`ci-line${misesEnAvant.has(g.numero) ? ' ci-line--hl' : ''}`}>
                {r.numerosLignes && (
                  <span className="ci-ln" style={{ minWidth: `${chiffres}ch` }}>
                    {g.numero}
                  </span>
                )}
                <span className="ci-lc" dangerouslySetInnerHTML={{ __html: g.html }} />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
})
