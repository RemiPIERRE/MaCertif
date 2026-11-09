import { NodeToolbar, Position, useReactFlow } from '@xyflow/react'
import type { SchemaNode } from '../types'
import { dupliquerNoeud } from '../lib/dupliquerEntite'

/** Petit bouton "Dupliquer" au-dessus d'un nœud sélectionné (visible quand il est le seul sélectionné). */
export function BarreDupliquer({ id }: { id: string }) {
  const { getNode, setNodes } = useReactFlow<SchemaNode>()

  const dupliquer = () => {
    const source = getNode(id)
    if (!source) return
    const copie = dupliquerNoeud(source)
    // La copie devient la seule sélection : son éditeur s'ouvre, l'original se désélectionne.
    setNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), copie])
  }

  return (
    <NodeToolbar position={Position.Top} offset={10}>
      <button type="button" className="me-dupliquer nodrag nopan" onClick={dupliquer} title="Dupliquer (Ctrl+C puis Ctrl+V)">
        <span aria-hidden="true">⧉</span> Dupliquer
      </button>
    </NodeToolbar>
  )
}
