import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

/**
 * Zone de texte qui grandit avec son contenu (une ligne au départ). Entrée = retour à la ligne,
 * comme dans un libellé de message sur plusieurs lignes. La hauteur est recalculée quand le
 * contenu change ET quand la largeur change (redimensionnement, mise en page qui se stabilise) :
 * sinon une hauteur mesurée à l'étroit resterait énorme une fois le champ élargi.
 */
export function ChampTexteAuto({ value, ...reste }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const ajuster = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useLayoutEffect(ajuster, [value])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || 'undefined' === typeof ResizeObserver) return
    let largeur = el.offsetWidth
    const observateur = new ResizeObserver(() => {
      if (el.offsetWidth === largeur) return // seule la largeur nous intéresse (la hauteur, c'est nous)
      largeur = el.offsetWidth
      ajuster()
    })
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])
  return <textarea ref={ref} rows={1} value={value} {...reste} />
}