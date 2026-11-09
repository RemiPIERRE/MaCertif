import { ReactFlowProvider } from '@xyflow/react'
import { useDiagrammes } from '../lib/store'
import { SchemasSidebar } from './SchemasSidebar'
import { SchemaCanvas } from './SchemaCanvas'
import { SequenceCanvas } from './SequenceCanvas'

export function SchemasTab() {
  const { diagrammes, actif, actifId, chargement, setActifId, renommer, remplacerContenu, creer, dupliquer, supprimer } =
    useDiagrammes()

  return (
    <div className="schema-tab">
      <SchemasSidebar
        diagrammes={diagrammes}
        actifId={actifId}
        onSelect={setActifId}
        onRename={renommer}
        onCreate={creer}
        onDuplicate={dupliquer}
        onDelete={supprimer}
      />
      <div className="schema-main">
        {chargement ? (
          <p className="page-lede">Chargement…</p>
        ) : actif ? (
          'sequence' === actif.contenu.kind ? (
            <SequenceCanvas
              key={actif.id}
              nom={actif.nom}
              contenu={actif.contenu}
              onChange={(contenu) => remplacerContenu(actif.id, contenu)}
            />
          ) : (
            <ReactFlowProvider>
              <SchemaCanvas
                key={actif.id}
                nom={actif.nom}
                contenu={actif.contenu}
                onChange={(contenu) => remplacerContenu(actif.id, contenu)}
              />
            </ReactFlowProvider>
          )
        ) : (
          <p className="page-lede">Aucun schéma pour l'instant — créez-en un depuis le panneau de gauche.</p>
        )}
      </div>
    </div>
  )
}
