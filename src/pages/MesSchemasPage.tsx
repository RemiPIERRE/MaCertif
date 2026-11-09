import { lazy, Suspense } from 'react'

// Chargement différé : React Flow ne doit jamais alourdir le bundle principal tant que
// cet onglet n'est pas ouvert (même discipline que « Mes extraits de code »).
const SchemasTab = lazy(() => import('../schemas').then((m) => ({ default: m.SchemasTab })))

export function MesSchemasPage() {
  return (
    <div>
      <header className="page-header">
        <div className="page-eyebrow">Ma certification</div>
        <h1>Mes schémas</h1>
        <p className="page-lede">
          Diagrammes de classes UML et modèles Merise (MCD/MLD) pour votre dossier. Reliez deux éléments par
          glisser-déposer depuis le bord d'une case, puis choisissez le type de relation.
        </p>
      </header>
      <Suspense fallback={<p className="page-lede">Chargement de l'éditeur de schémas…</p>}>
        <SchemasTab />
      </Suspense>
    </div>
  )
}
