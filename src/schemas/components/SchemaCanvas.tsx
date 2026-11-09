import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addEdge,
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeMouseHandler,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { generateId } from '../../lib/id'
import type {
  ActiviteForme,
  ActiviteNodeData,
  ActeurNodeData,
  CuStructureForme,
  FlowContenu,
  FlowKind,
  LienMcdData,
  LienMcdEdgeType,
  McdAssociationNodeData,
  McdEntiteNodeData,
  McdMax,
  McdMin,
  RelationType,
  SchemaEdge,
  SchemaNode,
  TableColonne,
  TableNodeData,
} from '../types'
import { ACTIVITE_ZONES, CU_ZONES, RELATION_LABELS } from '../types'
import { aretesFk, coteDuHandle, idLigneDuHandle, nouvelleColonne, nouvellePropriete } from '../lib/modele'
import { dupliquerNoeud, TYPES_DUPLIQUABLES } from '../lib/dupliquerEntite'
import { genererPng, OPTIONS_EXPORT_DEFAUT, type OptionsExport } from '../lib/exportPng'
import { ApercuExport, signatureSchema, useZoneApercu } from './ApercuExport'
import { signatureSansEtatVisuel, useHistorique } from './useHistorique'
import { McdEntiteNode } from './McdEntiteNode'
import { McdAssociationNode } from './McdAssociationNode'
import { TableNode } from './TableNode'
import { ActeurNode } from './ActeurNode'
import { CasUtilisationNode } from './CasUtilisationNode'
import { ActiviteNode } from './ActiviteNode'
import { CuStructureNode } from './CuStructureNode'
import { FkEdge } from './FkEdge'
import { LienMcdEdge } from './LienMcdEdge'
import { RelationEdge, SchemaMarkers } from './RelationEdge'
import { McdEditor } from './McdEditor'
import { TableEditor, type TableResume } from './TableEditor'
import { LienFkEditor } from './LienFkEditor'
import { NiveauContext } from './NiveauContext'
import { EditionContext } from './EditionContext'
import './schemas.css'
import './merise.css'

const NODE_TYPES = {
  mcdEntite: McdEntiteNode,
  mcdAssociation: McdAssociationNode,
  table: TableNode,
  acteur: ActeurNode,
  casUtilisation: CasUtilisationNode,
  cuStructure: CuStructureNode,
  activite: ActiviteNode,
}
const EDGE_TYPES = { relation: RelationEdge, lienMcd: LienMcdEdge, fk: FkEdge }
const VIEWPORT_PAR_DEFAUT: Viewport = { x: 0, y: 0, zoom: 1 }

/** Relations libres (cas d'utilisation, activité) : chaque famille ne propose que ses notations. */
const RELATIONS_PAR_KIND: Partial<Record<FlowKind, RelationType[]>> = {
  casUtilisation: ['association', 'heritage', 'inclut', 'etend', 'dependance', 'lien'],
  activite: ['flux', 'interruption', 'lien'],
}

const ACTIVITE_LABELS: Record<ActiviteForme, string> = {
  debut: 'Début',
  fin: "Fin d'activité",
  finFlux: 'Fin de flux',
  decision: 'Décision',
  fusion: 'Fusion',
  barre: 'Bifurcation / synchronisation',
  connecteur: 'Connecteur',
  action: 'Action',
  appel: 'Action d’appel',
  envoi: 'Envoi de signal',
  reception: 'Réception de signal',
  temps: 'Événement temporel',
  objet: 'Nœud d’objet',
  broche: 'Broche (pin)',
  cadre: "Cadre d'activité",
  couloir: 'Couloir (partition)',
  structure: 'Nœud structuré',
  expansion: "Région d'expansion",
  interruptible: 'Région interruptible',
  note: 'Note',
}

/** Menu « + Ajouter » du diagramme d'activité : formes regroupées ; `extra` complète les données initiales. */
const ACTIVITE_MENU: ReadonlyArray<{ groupe: string; elements: ReadonlyArray<{ cle: string; forme: ActiviteForme; libelle?: string; extra?: Partial<ActiviteNodeData> }> }> = [
  {
    groupe: 'Contrôle',
    elements: [
      { cle: 'debut', forme: 'debut' },
      { cle: 'fin', forme: 'fin' },
      { cle: 'finFlux', forme: 'finFlux' },
      { cle: 'decision', forme: 'decision' },
      { cle: 'fusion', forme: 'fusion' },
      { cle: 'barre', forme: 'barre' },
      { cle: 'connecteur', forme: 'connecteur' },
    ],
  },
  {
    groupe: 'Actions',
    elements: [
      { cle: 'action', forme: 'action' },
      { cle: 'appel', forme: 'appel' },
      { cle: 'envoi', forme: 'envoi' },
      { cle: 'reception', forme: 'reception' },
      { cle: 'temps', forme: 'temps' },
    ],
  },
  {
    groupe: 'Objets',
    elements: [
      { cle: 'objet', forme: 'objet' },
      { cle: 'tampon', forme: 'objet', libelle: 'Mémoire tampon', extra: { stereotype: 'centralBuffer' } },
      { cle: 'entrepot', forme: 'objet', libelle: 'Entrepôt de données', extra: { stereotype: 'datastore' } },
      { cle: 'broche', forme: 'broche' },
    ],
  },
  {
    groupe: 'Structure',
    elements: [
      { cle: 'cadre', forme: 'cadre' },
      { cle: 'couloir', forme: 'couloir' },
      { cle: 'structure', forme: 'structure' },
      { cle: 'expansion', forme: 'expansion' },
      { cle: 'interruptible', forme: 'interruptible' },
      { cle: 'note', forme: 'note' },
    ],
  },
]

type Taille = { width: number; height?: number }

/** Taille de départ explicite par type de nœud, pour ne jamais dépendre du shrink-to-fit de
 * React Flow. `height` absent = hauteur automatique (les nœuds à lignes grandissent avec leur contenu). */
const TAILLE_ACTIVITE: Record<ActiviteForme, Taille> = {
  debut: { width: 40, height: 40 },
  fin: { width: 40, height: 40 },
  finFlux: { width: 34, height: 34 },
  decision: { width: 90, height: 90 },
  fusion: { width: 56, height: 56 },
  barre: { width: 140, height: 10 },
  connecteur: { width: 34, height: 34 },
  action: { width: 150, height: 56 },
  appel: { width: 160, height: 56 },
  envoi: { width: 150, height: 56 },
  reception: { width: 150, height: 56 },
  temps: { width: 30, height: 44 },
  objet: { width: 140, height: 52 },
  broche: { width: 16, height: 16 },
  cadre: { width: 560, height: 420 },
  couloir: { width: 260, height: 520 },
  structure: { width: 340, height: 220 },
  expansion: { width: 340, height: 220 },
  interruptible: { width: 340, height: 220 },
  note: { width: 150, height: 64 },
}

const TAILLE_PAR_TYPE: Record<'mcdEntite' | 'mcdAssociation' | 'table' | 'acteur' | 'casUtilisation', Taille> = {
  mcdEntite: { width: 220 },
  mcdAssociation: { width: 200 },
  table: { width: 240 },
  acteur: { width: 100, height: 110 },
  casUtilisation: { width: 170, height: 80 },
}

type TypeAjoutable = keyof typeof TAILLE_PAR_TYPE

/** Éléments proposés par « + Ajouter » dans le diagramme de cas d'utilisation. */
const ELEMENTS_CU: ReadonlyArray<{ cle: string; libelle: string; ajout: 'acteur' | 'acteurSysteme' | 'casUtilisation' | CuStructureForme }> = [
  { cle: 'acteur', libelle: 'Acteur', ajout: 'acteur' },
  { cle: 'acteurSysteme', libelle: 'Acteur système', ajout: 'acteurSysteme' },
  { cle: 'casUtilisation', libelle: "Cas d'utilisation", ajout: 'casUtilisation' },
  { cle: 'systeme', libelle: 'Frontière du système', ajout: 'systeme' },
  { cle: 'paquetage', libelle: 'Paquetage', ajout: 'paquetage' },
  { cle: 'note', libelle: 'Note', ajout: 'note' },
]

const TAILLE_CU_STRUCTURE: Record<CuStructureForme, Taille> = {
  systeme: { width: 560, height: 420 },
  paquetage: { width: 320, height: 220 },
  note: { width: 160, height: 70 },
}

interface Props {
  nom: string
  contenu: FlowContenu
  onChange: (contenu: FlowContenu) => void
}

/** Remontée (via `key={diagramme.id}` posé par l'appelant, voir SchemasTab) à chaque changement de
 * schéma actif : l'état interne de React Flow repart alors de `contenu` sans qu'il
 * faille le resynchroniser manuellement, et sans boucle de ré-écriture puisque
 * onChange ne réagit plus qu'aux modifications de CE schéma.
 *
 * Un seul canevas, trois « outils » Merise selon `contenu.kind` :
 *  - mcd : entités et associations reliées par des branches à cardinalité min,max ;
 *  - mld / mpd : tables dont les clés étrangères sont portées par les colonnes (les traits sont déduits) ;
 * et les deux familles de relations libres (cas d'utilisation, activité). */
const PAS_GRILLE = 10
/** Une ligne plus marquée toutes les 4 subdivisions. */
const PAS_GRILLE_MAJEUR = PAS_GRILLE * 4

export function SchemaCanvas({ nom, contenu, onChange }: Props) {
  const kind = contenu.kind
  const mcd = 'mcd' === kind
  const sql = 'mld' === kind || 'mpd' === kind

  const [nodes, setNodes, onNodesChangeBrut] = useNodesState<SchemaNode>(contenu.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<SchemaEdge>(contenu.edges)
  const [viewport, setViewport] = useState<Viewport>(contenu.viewport ?? VIEWPORT_PAR_DEFAUT)
  const [menuAjoutOuvert, setMenuAjoutOuvert] = useState(false)
  // Catégorie dépliée du menu « + Ajouter » (diagramme d'activité) : une seule à la fois.
  const [groupeOuvert, setGroupeOuvert] = useState<string | null>(null)
  const [pleinEcran, setPleinEcran] = useState(false)
  // Grille magnétique : placement et redimensionnement par pas de PAS_GRILLE px (préférence mémorisée).
  const [grille, setGrille] = useState<boolean>(() => {
    try {
      return 'oui' === localStorage.getItem('macertif.schema.grille')
    } catch {
      return false
    }
  })
  const basculerGrille = () =>
    setGrille((g) => {
      try {
        localStorage.setItem('macertif.schema.grille', g ? 'non' : 'oui')
      } catch {
        /* stockage indisponible : la préférence ne sera pas mémorisée */
      }
      return !g
    })

  // Le placement est aimanté par ReactFlow (snapToGrid) ; le redimensionnement l'est ici : le bord déplacé
  // tombe sur la grille (position et taille sont ajustées ensemble, l'autre bord ne bouge pas).
  const onNodesChange = (changes: NodeChange<SchemaNode>[]) => {
    if (!grille) return onNodesChangeBrut(changes)
    const pos = new Map<string, { x: number; y: number }>()
    for (const c of changes) if ('position' in c && c.type === 'position' && c.position) pos.set(c.id, c.position)
    const ajustes = changes.map((c) => {
      if (c.type !== 'dimensions' || !c.resizing || !c.dimensions) return c
      const n = nodes.find((x) => x.id === c.id)
      if (!n) return c
      const p = pos.get(c.id) ?? n.position
      const x1 = Math.round(p.x / PAS_GRILLE) * PAS_GRILLE
      const y1 = Math.round(p.y / PAS_GRILLE) * PAS_GRILLE
      const x2 = Math.round((p.x + c.dimensions.width) / PAS_GRILLE) * PAS_GRILLE
      const y2 = Math.round((p.y + c.dimensions.height) / PAS_GRILLE) * PAS_GRILLE
      pos.set(c.id, { x: x1, y: y1 })
      return { ...c, dimensions: { width: Math.max(PAS_GRILLE, x2 - x1), height: Math.max(PAS_GRILLE, y2 - y1) } }
    })
    onNodesChangeBrut(
      ajustes.map((c) => (c.type === 'position' && c.position && pos.has(c.id) ? { ...c, position: pos.get(c.id)! } : c)),
    )
  }
  const [optionsExport, setOptionsExport] = useState<OptionsExport>(OPTIONS_EXPORT_DEFAUT)
  const [apercuOuvert, setApercuOuvert] = useState(true)
  // Élément en édition (ouvert par un double-clic) : texte et apparence. Un clic ne fait que sélectionner.
  const [editionId, setEditionId] = useState<string | null>(null)
  const editionRef = useRef<string | null>(null)
  editionRef.current = editionId
  // Lien FK en édition (ouvert par un double-clic sur le trait) : style + côtés gauche/droite.
  const [edgeEditionId, setEdgeEditionId] = useState<string | null>(null)
  const edgeEditionRef = useRef<string | null>(null)
  edgeEditionRef.current = edgeEditionId
  const menuAjoutRef = useRef<HTMLDivElement>(null)
  const canevasRef = useRef<HTMLDivElement>(null)
  const instance = useReactFlow()
  const { fitView } = instance

  /* Annuler / rétablir (Ctrl+Z, Ctrl+Y) : un instantané des nœuds et arêtes, sans sélection ni
     mesures. Rien n'est enregistré tant qu'un nœud est en cours de glissement. */
  const etatHistorique = useMemo(() => ({ nodes, edges }), [nodes, edges])
  const signatureHistorique = useMemo(() => signatureSansEtatVisuel(nodes, edges), [nodes, edges])
  useHistorique({
    valeur: etatHistorique,
    signature: signatureHistorique,
    occupe: () => instance.getNodes().some((n) => n.dragging),
    appliquer: (instantane) => {
      // La sélection et les mesures restent celles de l'écran : on ne rouvre pas d'éditeur par surprise.
      setNodes((actuels) => {
        const parId = new Map(actuels.map((n) => [n.id, n]))
        return instantane.nodes.map((n) => {
          const courant = parId.get(n.id)
          return { ...n, selected: courant?.selected ?? false, dragging: false, ...(courant?.measured ? { measured: courant.measured } : {}) } as SchemaNode
        })
      })
      setEdges((actuelles) => {
        const selectionnees = new Set(actuelles.filter((e) => e.selected).map((e) => e.id))
        return instantane.edges.map((e) => ({ ...e, selected: selectionnees.has(e.id) }) as SchemaEdge)
      })
    },
  })

  // Cadre « Aperçu de l'export » : zone sous .schema-tab (voir useZoneApercu).
  const contenuApercu = useMemo(() => signatureSchema(nodes, edges), [nodes, edges])
  const cibleApercu = useZoneApercu(canevasRef)

  useEffect(() => {
    if (!menuAjoutOuvert) return
    const fermerSiExterieur = (e: MouseEvent) => {
      if (menuAjoutRef.current && !menuAjoutRef.current.contains(e.target as globalThis.Node)) setMenuAjoutOuvert(false)
    }
    document.addEventListener('mousedown', fermerSiExterieur)
    return () => document.removeEventListener('mousedown', fermerSiExterieur)
  }, [menuAjoutOuvert])

  useEffect(() => {
    onChange({ kind, nodes, edges, viewport })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, viewport])

  // Plein écran : le conteneur passe en position fixe sur toute la fenêtre (voir CSS
  // .is-plein-ecran) ; Échap le quitte, et la page derrière ne défile plus.
  useEffect(() => {
    if (!pleinEcran) return
    const quitter = (e: KeyboardEvent) => {
      if ('Escape' !== e.key) return
      if (null !== editionRef.current) setEditionId(null) // Échap ferme d'abord l'édition
      else if (null !== edgeEditionRef.current) setEdgeEditionId(null)
      else setPleinEcran(false)
    }
    const overflowInitial = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', quitter)
    return () => {
      window.removeEventListener('keydown', quitter)
      document.body.style.overflow = overflowInitial
    }
  }, [pleinEcran])

  // L'édition se ferme dès que la sélection quitte l'élément (clic ailleurs, autre forme, fond).
  useEffect(() => {
    if (null === editionId) return
    const selection = nodes.filter((n) => n.selected)
    if (1 !== selection.length || selection[0].id !== editionId) setEditionId(null)
  }, [nodes, editionId])

  // Échap ferme l'édition (hors plein écran, où le gestionnaire ci-dessus s'en charge).
  useEffect(() => {
    if (null === editionId || pleinEcran) return
    const fermerEdition = (e: KeyboardEvent) => {
      if ('Escape' === e.key) setEditionId(null)
    }
    window.addEventListener('keydown', fermerEdition)
    return () => window.removeEventListener('keydown', fermerEdition)
  }, [editionId, pleinEcran])

  // Échap ferme l'éditeur de lien FK (même logique que l'édition de nœud ci-dessus).
  useEffect(() => {
    if (null === edgeEditionId || pleinEcran) return
    const fermer = (e: KeyboardEvent) => {
      if ('Escape' === e.key) setEdgeEditionId(null)
    }
    window.addEventListener('keydown', fermer)
    return () => window.removeEventListener('keydown', fermer)
  }, [edgeEditionId, pleinEcran])

  // Le conteneur change de taille : on recadre pour garder le schéma visible.
  useEffect(() => {
    // Activité en plein écran : la barre d'outils à plat occupe le haut, on garde le schéma dessous.
    const padding = 'activite' === kind && pleinEcran ? { top: '200px' as const, right: '60px' as const, bottom: '60px' as const, left: '60px' as const } : 0.3
    const id = window.requestAnimationFrame(() => fitView({ padding, maxZoom: 1.2, duration: 200 }))
    return () => window.cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pleinEcran])

  // Copier / coller (Ctrl/Cmd + C puis V) d'une ou plusieurs formes ; en activité, les liens entre
  // les formes copiées sont copiés avec. Ignoré pendant la saisie dans un champ pour ne pas voler
  // le copier/coller du texte.
  const presseRef = useRef<{ noeuds: SchemaNode[]; aretes: SchemaEdge[]; collages: number } | null>(null)
  useEffect(() => {
    const surClavier = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      const cible = e.target as HTMLElement | null
      if (cible?.closest('input, textarea, select, [contenteditable="true"]')) return
      const touche = e.key.toLowerCase()

      if ('c' === touche) {
        const selection = (instance.getNodes() as SchemaNode[]).filter((n) => n.selected && TYPES_DUPLIQUABLES.has(String(n.type)))
        if (0 === selection.length) return
        const ids = new Set(selection.map((n) => n.id))
        const aretes = 'activite' === kind ? (instance.getEdges() as SchemaEdge[]).filter((a) => ids.has(a.source) && ids.has(a.target)) : []
        presseRef.current = { noeuds: selection, aretes, collages: 0 }
      } else if ('v' === touche && presseRef.current) {
        e.preventDefault()
        presseRef.current.collages += 1
        const { noeuds, aretes, collages } = presseRef.current
        const copies = noeuds.map((n) => dupliquerNoeud(n, 40 * collages))
        const nouveauxIds = new Map(noeuds.map((n, i) => [n.id, copies[i].id]))
        const liens = aretes.map((a) => ({ ...a, id: generateId(), source: nouveauxIds.get(a.source) as string, target: nouveauxIds.get(a.target) as string, selected: false }) as SchemaEdge)
        setNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), ...copies])
        if (liens.length > 0) setEdges((eds) => [...eds, ...liens])
      }
    }
    window.addEventListener('keydown', surClavier)
    return () => window.removeEventListener('keydown', surClavier)
  }, [instance, setNodes, setEdges, kind])

  /* ───── Ajout d'éléments ───── */

  const placerEtAjouter = (nouveau: Omit<SchemaNode, 'position' | 'selected'>, taille: Taille, selectionner = false, positionImposee?: { x: number; y: number }) => {
    // Grille large (les nœuds font ~220px de large une fois leurs sections dépliées) pour
    // qu'un nouveau nœud n'apparaisse jamais superposé aux précédents.
    const position = positionImposee ?? { x: 60 + 300 * (nodes.length % 4), y: 60 + 260 * Math.floor(nodes.length / 4) }
    // Une largeur/hauteur initiale explicite est nécessaire pour les formes à champ en
    // pourcentage (losange de décision) ; les nœuds à lignes n'ont qu'une largeur.
    // `selectionner` : le nouveau nœud devient la seule sélection (ouvre son éditeur du bas).
    setNodes((nds) => [
      ...(selectionner ? nds.map((n) => (n.selected ? { ...n, selected: false } : n)) : nds),
      { ...nouveau, position, selected: selectionner, ...taille } as SchemaNode,
    ])
    // Table / entité / association ajoutée : son éditeur s'ouvre aussitôt.
    if (selectionner) setEditionId(String((nouveau as { id: string }).id))
    // Un nœud ajouté hors de la zone visible serait introuvable : on recadre.
    window.requestAnimationFrame(() => fitView({ padding: 0.3, maxZoom: 1.2, duration: 200 }))
    setMenuAjoutOuvert(false)
  }

  const ajouterNoeud = (type: TypeAjoutable) => {
    const id = generateId()
    const taille = TAILLE_PAR_TYPE[type]
    switch (type) {
      case 'mcdEntite':
        placerEtAjouter({ id, type, data: { nom: '', proprietes: [nouvellePropriete({ nom: 'id', identifiant: true })] } }, taille, true)
        break
      case 'mcdAssociation':
        placerEtAjouter({ id, type, data: { nom: '', proprietes: [] } }, taille, true)
        break
      case 'table':
        placerEtAjouter(
          {
            id,
            type,
            data: { nom: '', colonnes: [nouvelleColonne({ nom: 'id', pk: true, nonNull: true, ...('mpd' === kind ? { type: 'BIGINT', autoIncrement: true } : {}) })] },
          },
          taille,
          true,
        )
        break
      case 'acteur':
      case 'casUtilisation':
        placerEtAjouter({ id, type, data: { nom: '' } }, taille)
        break
    }
  }

  const ajouterCu = (ajout: (typeof ELEMENTS_CU)[number]['ajout']) => {
    const id = generateId()
    switch (ajout) {
      case 'acteur':
      case 'casUtilisation':
        return ajouterNoeud(ajout)
      case 'acteurSysteme':
        return placerEtAjouter({ id, type: 'acteur', data: { nom: '', forme: 'rectangle', stereotype: 'system' } as ActeurNodeData }, { width: 120, height: 64 })
      default: {
        const zone = CU_ZONES.has(ajout)
        placerEtAjouter(
          { id, type: 'cuStructure', data: { forme: ajout, texte: '' }, ...(zone ? { zIndex: -1 } : {}) } as Omit<SchemaNode, 'position' | 'selected'>,
          TAILLE_CU_STRUCTURE[ajout],
        )
      }
    }
  }

  const ajouterActivite = (forme: ActiviteForme, extra: Partial<ActiviteNodeData> = {}) => {
    const zone = ACTIVITE_ZONES.has(forme)
    let position: { x: number; y: number } | undefined
    if ('couloir' === forme) {
      // Un nouveau couloir se pose contre le dernier : à sa droite (colonnes) ou dessous (lignes).
      const couloirs = (nodes as SchemaNode[]).filter((n) => 'activite' === n.type && 'couloir' === n.data.forme)
      const dernier = couloirs.sort((a, b) => a.position.x + (a.width ?? 0) - (b.position.x + (b.width ?? 0)))[couloirs.length - 1]
      if (dernier) {
        const l = dernier.width ?? dernier.measured?.width ?? 260
        const h = dernier.height ?? dernier.measured?.height ?? 520
        const horizontal = 'horizontal' === (dernier.data as ActiviteNodeData).orientation
        position = horizontal ? { x: dernier.position.x, y: dernier.position.y + h } : { x: dernier.position.x + l, y: dernier.position.y }
        const taille = horizontal ? { width: l, height: Math.min(h, 200) } : { width: Math.min(l, 260), height: h }
        placerEtAjouter(
          { id: generateId(), type: 'activite', data: { forme, texte: '', ...(horizontal ? { orientation: 'horizontal' } : {}), ...extra }, zIndex: -1 } as Omit<SchemaNode, 'position' | 'selected'>,
          taille,
          false,
          position,
        )
        return
      }
    }
    placerEtAjouter(
      { id: generateId(), type: 'activite', data: { forme, texte: '', ...extra }, ...(zone ? { zIndex: -1 } : {}) } as Omit<SchemaNode, 'position' | 'selected'>,
      TAILLE_ACTIVITE[forme],
    )
  }

  /* ───── Connexions ───── */

  const validerConnexion = (c: Connection | SchemaEdge) => {
    const a = instance.getNode(c.source)
    const b = instance.getNode(c.target)
    if (!a || !b) return false
    if (sql) return 'table' === a.type && 'table' === b.type
    // MCD : toujours une association d'un côté et une entité de l'autre.
    if (mcd) return ('mcdAssociation' === a.type) !== ('mcdAssociation' === b.type)
    return true
  }

  /** MCD : crée la branche, orientée association (source) → entité (cible). */
  const connecterMcd = (c: Connection) => {
    const source = instance.getNode(c.source)
    if (!source || !validerConnexion(c)) return
    const sensDirect = 'mcdAssociation' === source.type
    const lien: LienMcdEdgeType = {
      id: generateId(),
      type: 'lienMcd',
      source: sensDirect ? c.source : c.target,
      target: sensDirect ? c.target : c.source,
      sourceHandle: sensDirect ? c.sourceHandle : c.targetHandle,
      targetHandle: sensDirect ? c.targetHandle : c.sourceHandle,
      data: { min: '0', max: 'N' },
    }
    setEdges((eds) => addEdge<SchemaEdge>(lien, eds))
  }

  /**
   * MLD / MPD : tirer un trait de la table enfant vers la table parent crée la clé étrangère.
   *  - départ sur une ligne : cette colonne devient la FK ;
   *  - départ sur le bord de la table : une nouvelle colonne FK est ajoutée à l'enfant.
   * Arrivée sur une ligne : cette colonne est la cible ; sinon la clé primaire de la table parent.
   */
  const connecterTables = (c: Connection) => {
    const enfant = nodes.find((n) => n.id === c.source)
    const parent = nodes.find((n) => n.id === c.target)
    if (!enfant || !parent || 'table' !== enfant.type || 'table' !== parent.type) return

    const idColonneCible = idLigneDuHandle(c.targetHandle)
    const colonneCible = idColonneCible ? parent.data.colonnes.find((col) => col.id === idColonneCible) : parent.data.colonnes.find((col) => col.pk)
    if (!colonneCible) return
    const reference = { tableId: parent.id, colonneId: colonneCible.id }

    const idColonneSource = idLigneDuHandle(c.sourceHandle)
    const existante = idColonneSource ? enfant.data.colonnes.find((col) => col.id === idColonneSource) : undefined

    const colonnes = existante
      ? enfant.data.colonnes.map((col) => (col.id === existante.id ? { ...col, reference, type: col.type || colonneCible.type } : col))
      : [...enfant.data.colonnes, nouvelleColonne({ nom: `${(parent.data.nom || 'table').toLowerCase()}_${colonneCible.nom || 'id'}`, type: colonneCible.type, reference })]
    majTable(enfant.id, { colonnes })
  }

  const onConnect = (c: Connection) => {
    if (sql) return connecterTables(c)
    if (mcd) return connecterMcd(c)
    const relationType = RELATIONS_PAR_KIND[kind]?.[0] ?? 'association'
    setEdges((eds) => addEdge<SchemaEdge>({ ...c, id: generateId(), type: 'relation', data: { relationType } }, eds))
  }

  /* ───── Liens affichés ───── */

  const aretesAffichees = useMemo<SchemaEdge[]>(() => {
    if (sql) {
      const brutes = aretesFk(nodes, 'mpd' === kind ? 'patte' : 'fleche')
      return edgeEditionId ? brutes.map((e) => (e.id === edgeEditionId ? ({ ...e, selected: true } as SchemaEdge) : e)) : brutes
    }
    if (!mcd) return edges
    // Liens parallèles (même paire association/entité) : écartés les uns des autres.
    const groupes = new Map<string, number[]>()
    edges.forEach((e, i) => {
      const cle = [e.source, e.target].sort().join('|')
      groupes.set(cle, [...(groupes.get(cle) ?? []), i])
    })
    return edges.map((e, i) => {
      const indices = groupes.get([e.source, e.target].sort().join('|')) ?? [i]
      if (1 === indices.length || 'lienMcd' !== e.type) return e
      const decalage = (indices.indexOf(i) - (indices.length - 1) / 2) * 22
      return { ...e, data: { ...e.data, decalage } } as SchemaEdge
    })
  }, [sql, mcd, kind, nodes, edges, edgeEditionId])

  /* ───── Éditeur du bas : élément sélectionné ───── */

  // Éditeur du bas : l'élément ouvert par un double-clic (et non plus le simple sélectionné).
  const selectionUnique = null === editionId ? undefined : nodes.find((n) => n.id === editionId)

  const tablesResume: TableResume[] = useMemo(
    () => nodes.flatMap((n) => ('table' === n.type ? [{ id: n.id, nom: n.data.nom, colonnes: n.data.colonnes }] : [])),
    [nodes],
  )

  /** Hauteur automatique : une hauteur figée (posée par le redimensionnement) rognerait les lignes ajoutées. */
  const reinitialiserHauteur = (idNoeud: string) =>
    setNodes((nds) => nds.map((n) => (n.id === idNoeud && undefined !== n.height ? { ...n, height: undefined } : n)))

  /** Une FK ne peut pas pointer vers une colonne ou une table qui n'existe plus. */
  const retirerReferences = (cible: (tableId: string, colonneId: string) => boolean) =>
    setNodes((nds) =>
      nds.map((n) => {
        if ('table' !== n.type || !n.data.colonnes.some((c) => c.reference && cible(c.reference.tableId, c.reference.colonneId))) return n
        return { ...n, data: { ...n.data, colonnes: n.data.colonnes.map((c) => (c.reference && cible(c.reference.tableId, c.reference.colonneId) ? { ...c, reference: null } : c)) } }
      }),
    )

  const majTable = (idNoeud: string, patch: Partial<TableNodeData>) => {
    instance.updateNodeData(idNoeud, patch)
    if (!patch.colonnes) return
    const avant = nodes.find((n) => n.id === idNoeud)
    if (avant && 'table' === avant.type) {
      const restantes = new Set(patch.colonnes.map((c) => c.id))
      const retirees = new Set(avant.data.colonnes.filter((c) => !restantes.has(c.id)).map((c) => c.id))
      if (retirees.size > 0) retirerReferences((_t, colonneId) => retirees.has(colonneId))
    }
    reinitialiserHauteur(idNoeud)
  }

  /**
   * Glisser-déposer un point de connexion d'un lien FK sur l'autre côté (gauche/droite) de la
   * même ligne : ne change que le côté choisi, jamais la colonne/table référencée (ce geste
   * n'est pas un moyen de rebrancher la FK ailleurs — ça reste le rôle du sélecteur dans
   * TableEditor). Le résultat est mémorisé sur la colonne (col.cotes), pris en compte par
   * aretesFk au prochain rendu.
   */
  const onReconnectFk = (ancienne: SchemaEdge, nouvelle: Connection) => {
    if ('fk' !== ancienne.type) return
    if (nouvelle.source !== ancienne.source || nouvelle.target !== ancienne.target) return
    const idColEnfant = idLigneDuHandle(ancienne.sourceHandle)
    const idColParent = idLigneDuHandle(ancienne.targetHandle)
    if (!idColEnfant || !idColParent) return
    if (idLigneDuHandle(nouvelle.sourceHandle) !== idColEnfant || idLigneDuHandle(nouvelle.targetHandle) !== idColParent) return
    const coteEnfant = coteDuHandle(nouvelle.sourceHandle)
    const coteParent = coteDuHandle(nouvelle.targetHandle)
    if (!coteEnfant || !coteParent) return
    const enfant = nodes.find((n) => n.id === ancienne.source)
    if (!enfant || 'table' !== enfant.type) return
    majTable(enfant.id, { colonnes: enfant.data.colonnes.map((c) => (c.id === idColEnfant ? { ...c, cotes: { enfant: coteEnfant, parent: coteParent } } : c)) })
  }

  /** Modifie le style/les côtés du lien FK actuellement ouvert dans LienFkEditor. */
  const majLienFk = (idTableEnfant: string, idCol: string, patch: Partial<Pick<TableColonne, 'styleLien' | 'cotes'>>) => {
    const enfant = nodes.find((n) => n.id === idTableEnfant)
    if (!enfant || 'table' !== enfant.type) return
    majTable(idTableEnfant, { colonnes: enfant.data.colonnes.map((c) => (c.id === idCol ? { ...c, ...patch } : c)) })
  }

  const majMcd = (idNoeud: string, patch: Partial<McdEntiteNodeData & McdAssociationNodeData>) => {
    instance.updateNodeData(idNoeud, patch)
    if (patch.proprietes) reinitialiserHauteur(idNoeud)
  }

  const fermerEditeur = () => {
    setEditionId(null)
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)))
  }

  /** Supprimer une table : les FK des autres tables qui la référençaient sont vidées. */
  const surSuppressionNoeuds = (supprimes: Node[]) => {
    if (!sql) return
    const ids = new Set(supprimes.map((n) => n.id))
    retirerReferences((tableId) => ids.has(tableId))
  }

  /* ───── Relations libres et branches MCD ───── */

  const arete = edges.find((e) => e.selected) ?? null

  const majDonneesArete = (patch: Record<string, unknown>) => {
    if (!arete) return
    setEdges((eds) => eds.map((e) => (e.id === arete.id ? ({ ...e, data: { ...e.data, ...patch } } as SchemaEdge) : e)))
  }

  const relations = RELATIONS_PAR_KIND[kind] ?? []

  /** Échange la source et la cible d'une relation (ainsi que les multiplicités). */
  const inverserArete = () => {
    if (!arete) return
    setEdges((eds) =>
      eds.map((e) =>
        e.id !== arete.id || 'relation' !== e.type
          ? e
          : ({
              ...e,
              source: e.target,
              target: e.source,
              sourceHandle: e.targetHandle,
              targetHandle: e.sourceHandle,
              data: { ...e.data, cardinaliteSource: e.data?.cardinaliteCible, cardinaliteCible: e.data?.cardinaliteSource },
            } as SchemaEdge),
      ),
    )
  }

  /** Double-clic sur une forme : ouvre son édition (éditeur du bas pour les tables et le MCD ; texte et palette pour l'activité). */
  const surDoubleClicNoeud: NodeMouseHandler = (_e, noeud) => {
    if (!['table', 'mcdEntite', 'mcdAssociation', 'activite', 'acteur', 'casUtilisation', 'cuStructure'].includes(String(noeud.type))) return
    setEdgeEditionId(null)
    setNodes((nds) => nds.map((n) => (n.id === noeud.id ? { ...n, selected: true } : n.selected ? { ...n, selected: false } : n)))
    setEditionId(noeud.id)
  }

  /** Double-clic sur un lien FK : ouvre son petit éditeur du bas (style, côtés). */
  const surDoubleClicArete: EdgeMouseHandler<SchemaEdge> = (_e, edge) => {
    if ('fk' !== edge.type) return
    setEditionId(null)
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)))
    setEdgeEditionId(edge.id)
  }

  /* ───── Éditeur du bas : lien FK en édition ───── */

  const areteFkEditee = sql && edgeEditionId ? aretesAffichees.find((e) => e.id === edgeEditionId && 'fk' === e.type) : undefined
  const idColFkEditee = areteFkEditee ? idLigneDuHandle(areteFkEditee.sourceHandle) : null
  const tableEnfantFk = idColFkEditee ? nodes.find((n): n is Extract<SchemaNode, { type: 'table' }> => 'table' === n.type && n.data.colonnes.some((c) => c.id === idColFkEditee)) : undefined
  const colFk = tableEnfantFk?.data.colonnes.find((c) => c.id === idColFkEditee)
  const tableParentFk = colFk?.reference
    ? nodes.find((n): n is Extract<SchemaNode, { type: 'table' }> => 'table' === n.type && n.id === colFk.reference?.tableId)
    : undefined
  const coteEnfantEffectif = areteFkEditee ? (coteDuHandle(areteFkEditee.sourceHandle) ?? 'droite') : 'droite'
  const coteParentEffectif = areteFkEditee ? (coteDuHandle(areteFkEditee.targetHandle) ?? 'gauche') : 'gauche'

  /* Une zone (cadre, couloir, région) emporte avec elle les formes qu'elle contient : elles sont
     relevées au début du glissement (centre dans la zone) puis suivent le même déplacement. */
  const portageRef = useRef<{ id: string; origine: { x: number; y: number }; porte: Map<string, { x: number; y: number }> } | null>(null)
  const taille = (n: Node) => ({ l: n.measured?.width ?? n.width ?? 0, h: n.measured?.height ?? n.height ?? 0 })
  const estZone = (n: Node) => {
    const forme = String((n.data as { forme?: unknown }).forme)
    return ('activite' === n.type && ACTIVITE_ZONES.has(forme)) || ('cuStructure' === n.type && CU_ZONES.has(forme))
  }
  const surDebutGlissement: OnNodeDrag<SchemaNode> = (_e, noeud) => {
    portageRef.current = null
    if (!estZone(noeud)) return
    const { l, h } = taille(noeud)
    const porte = new Map<string, { x: number; y: number }>()
    instance.getNodes().forEach((n) => {
      if (n.id === noeud.id || n.selected) return // les nœuds sélectionnés bougent déjà avec la zone
      const t = taille(n)
      const cx = n.position.x + t.l / 2
      const cy = n.position.y + t.h / 2
      if (cx >= noeud.position.x && cx <= noeud.position.x + l && cy >= noeud.position.y && cy <= noeud.position.y + h) porte.set(n.id, { ...n.position })
    })
    if (porte.size > 0) portageRef.current = { id: noeud.id, origine: { ...noeud.position }, porte }
  }
  const surGlissement: OnNodeDrag<SchemaNode> = (_e, noeud) => {
    const p = portageRef.current
    if (!p || p.id !== noeud.id) return
    const dx = noeud.position.x - p.origine.x
    const dy = noeud.position.y - p.origine.y
    setNodes((nds) => nds.map((n) => (p.porte.has(n.id) ? { ...n, position: { x: (p.porte.get(n.id) as { x: number }).x + dx, y: (p.porte.get(n.id) as { y: number }).y + dy } } : n)))
  }
  const surFinGlissement: OnNodeDrag<SchemaNode> = () => {
    portageRef.current = null
  }

  return (
    <div className={`schema-canvas-wrap${pleinEcran ? ' is-plein-ecran' : ''}`}>
      <div className="schema-canvas" ref={canevasRef}>
        <SchemaMarkers />
        <NiveauContext.Provider value={'mld' === kind ? 'mld' : 'mpd'}>
         <EditionContext.Provider value={{ editionId, fermer: () => setEditionId(null) }}>
          <ReactFlow
            nodes={nodes}
            edges={aretesAffichees}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={validerConnexion}
            onNodesDelete={surSuppressionNoeuds}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            connectionMode={ConnectionMode.Loose}
            viewport={viewport}
            onViewportChange={setViewport}
            deleteKeyCode={['Backspace', 'Delete']}
            onNodeDoubleClick={surDoubleClicNoeud}
            onEdgeDoubleClick={surDoubleClicArete}
            onReconnect={onReconnectFk}
            onNodeDragStart={surDebutGlissement}
            onNodeDrag={surGlissement}
            onNodeDragStop={surFinGlissement}
            zoomOnDoubleClick={false}
            snapToGrid={grille}
            snapGrid={[PAS_GRILLE, PAS_GRILLE]}
            fitView
          >
            {grille ? (
              <>
                <Background id="grille-fine" variant={BackgroundVariant.Lines} gap={PAS_GRILLE} lineWidth={0.5} className="schema-grille-fine" />
                <Background id="grille-majeure" variant={BackgroundVariant.Lines} gap={PAS_GRILLE_MAJEUR} lineWidth={1} className="schema-grille-majeure" />
              </>
            ) : (
              <Background />
            )}
            <Controls>
              <ControlButton
                onClick={basculerGrille}
                title={grille ? 'Désactiver la grille magnétique' : 'Activer la grille magnétique'}
                aria-label="Grille magnétique"
                aria-pressed={grille}
                className={grille ? 'schema-grille-active' : undefined}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" style={{ fill: 'none' }} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M5.5 1.5v13M10.5 1.5v13M1.5 5.5h13M1.5 10.5h13" />
                </svg>
              </ControlButton>
            </Controls>
            {pleinEcran && <MiniMap pannable zoomable className="schema-minimap" style={{ width: 110, height: 76 }} />}

            <Panel position="top-left" className="schema-toolbar">
              {'casUtilisation' === kind && pleinEcran ? (
                <div className="schema-add-plat">
                  <div className="schema-add-plat-elements">
                    {ELEMENTS_CU.map((e) => (
                      <button key={e.cle} type="button" className="schema-btn" onClick={() => ajouterCu(e.ajout)}>
                        + {e.libelle}
                      </button>
                    ))}
                  </div>
                </div>
              ) : 'activite' === kind && pleinEcran ? (
                <div className="schema-add-plat">
                  <div className="schema-add-plat-categories">
                    {ACTIVITE_MENU.map((g) => (
                      <button
                        key={g.groupe}
                        type="button"
                        className={`schema-btn schema-add-plat-cat${groupeOuvert === g.groupe ? ' is-ouvert' : ''}`}
                        aria-expanded={groupeOuvert === g.groupe}
                        onClick={() => setGroupeOuvert(groupeOuvert === g.groupe ? null : g.groupe)}
                      >
                        {g.groupe} {groupeOuvert === g.groupe ? '▾' : '▸'}
                      </button>
                    ))}
                  </div>
                  {ACTIVITE_MENU.filter((g) => g.groupe === groupeOuvert).map((g) => (
                    <div key={g.groupe} className="schema-add-plat-elements">
                      {g.elements.map((e) => (
                        <button key={e.cle} type="button" className="schema-btn" onClick={() => ajouterActivite(e.forme, e.extra)}>
                          + {e.libelle ?? ACTIVITE_LABELS[e.forme]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
              <div className="schema-add-menu" ref={menuAjoutRef}>
                <button type="button" className="schema-btn" onClick={() => setMenuAjoutOuvert((o) => !o)}>
                  + Ajouter ▾
                </button>
                {menuAjoutOuvert && (
                  <div className="schema-add-menu-dropdown">
                    {mcd && (
                      <>
                        <button type="button" onClick={() => ajouterNoeud('mcdEntite')}>
                          Entité
                        </button>
                        <button type="button" onClick={() => ajouterNoeud('mcdAssociation')}>
                          Association
                        </button>
                      </>
                    )}
                    {sql && (
                      <button type="button" onClick={() => ajouterNoeud('table')}>
                        Table
                      </button>
                    )}
                    {'casUtilisation' === kind &&
                      ELEMENTS_CU.map((e) => (
                        <button key={e.cle} type="button" onClick={() => { ajouterCu(e.ajout); setMenuAjoutOuvert(false) }}>
                          {e.libelle}
                        </button>
                      ))}
                    {'activite' === kind &&
                      ACTIVITE_MENU.map((g) => {
                        const ouvert = groupeOuvert === g.groupe
                        return (
                          <div key={g.groupe} className="schema-add-menu-categorie">
                            <button type="button" className={`schema-add-menu-entete${ouvert ? ' is-ouvert' : ''}`} aria-expanded={ouvert} onClick={() => setGroupeOuvert(ouvert ? null : g.groupe)}>
                              <span>{g.groupe}</span>
                              <span aria-hidden="true">{ouvert ? '▾' : '▸'}</span>
                            </button>
                            {ouvert && (
                              <div className="schema-add-menu-sous">
                                {g.elements.map((e) => (
                                  <button key={e.cle} type="button" onClick={() => { ajouterActivite(e.forme, e.extra); setMenuAjoutOuvert(false) }}>
                                    {e.libelle ?? ACTIVITE_LABELS[e.forme]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
              )}
            </Panel>

            <Panel position="top-right" className="schema-toolbar">
              <button
                type="button"
                className="schema-btn"
                onClick={() => setPleinEcran((p) => !p)}
                title={pleinEcran ? 'Quitter le plein écran (Échap)' : 'Plein écran'}
                aria-label={pleinEcran ? 'Quitter le plein écran' : 'Passer en plein écran'}
              >
                {pleinEcran ? '⤡ Quitter' : '⤢ Plein écran'}
              </button>
            </Panel>

            {/* Relation libre sélectionnée (cas d'utilisation, activité) */}
            {arete && 'relation' === arete.type && (
              <Panel position="bottom-center" className="schema-relation-panel">
                <div className="schema-relation-panel-row">
                  <span>Relation :</span>
                  {relations.map((relationType) => (
                    <button
                      key={relationType}
                      type="button"
                      className={`schema-mini${arete.data?.relationType === relationType ? ' is-active' : ''}`}
                      onClick={() => majDonneesArete({ relationType })}
                    >
                      {RELATION_LABELS[relationType]}
                    </button>
                  ))}
                </div>
                <div className="schema-relation-panel-row">
                  <label>
                    Libellé
                    <input
                      className="schema-relation-input"
                      value={arete.data?.label ?? ''}
                      onChange={(e) => majDonneesArete({ label: e.target.value })}
                      placeholder={'activite' === kind ? 'Garde (oui) ou poids ({weight = 2})' : 'Libellé'}
                    />
                  </label>
                  <button type="button" className="schema-mini" onClick={inverserArete} title="Inverser le sens de la relation">
                    ⇄ Inverser
                  </button>
                </div>
                {'casUtilisation' === kind && 'association' === arete.data?.relationType && (
                  <div className="schema-relation-panel-row">
                    <label>
                      Multiplicité côté source
                      <input className="schema-relation-input schema-relation-input--court" value={arete.data?.cardinaliteSource ?? ''} onChange={(e) => majDonneesArete({ cardinaliteSource: e.target.value || undefined })} placeholder="1, 0..*" />
                    </label>
                    <label>
                      côté cible
                      <input className="schema-relation-input schema-relation-input--court" value={arete.data?.cardinaliteCible ?? ''} onChange={(e) => majDonneesArete({ cardinaliteCible: e.target.value || undefined })} placeholder="0..*" />
                    </label>
                  </div>
                )}
                {'casUtilisation' === kind && 'etend' === arete.data?.relationType && (
                  <div className="schema-relation-panel-row">
                    <label>
                      Condition
                      <input className="schema-relation-input" value={arete.data?.condition ?? ''} onChange={(e) => majDonneesArete({ condition: e.target.value || undefined })} placeholder="ex. panier > 100 €" />
                    </label>
                    <label>
                      Point d'extension
                      <input className="schema-relation-input" value={arete.data?.pointExtension ?? ''} onChange={(e) => majDonneesArete({ pointExtension: e.target.value || undefined })} placeholder="ex. paiement" />
                    </label>
                  </div>
                )}
                {'casUtilisation' === kind && ('inclut' === arete.data?.relationType || 'etend' === arete.data?.relationType) && (
                  <div className="schema-relation-panel-row schema-relation-aide">
                    {'inclut' === arete.data?.relationType ? 'Sens : du cas de base vers le cas inclus.' : 'Sens : du cas qui étend vers le cas de base.'}
                  </div>
                )}
              </Panel>
            )}

            {/* Branche MCD sélectionnée : cardinalité côté entité + rôle */}
            {arete && 'lienMcd' === arete.type && (
              <Panel position="bottom-center" className="schema-relation-panel">
                <div className="schema-relation-panel-row">
                  <label>
                    Cardinalité (côté entité)
                    <span className="schema-cardinalite-choix">
                      <select value={arete.data?.min ?? '0'} onChange={(e) => majDonneesArete({ min: e.target.value as McdMin })} aria-label="Minimum">
                        <option value="0">0</option>
                        <option value="1">1</option>
                      </select>
                      <span aria-hidden="true">,</span>
                      <select value={arete.data?.max ?? 'N'} onChange={(e) => majDonneesArete({ max: e.target.value as McdMax })} aria-label="Maximum">
                        <option value="1">1</option>
                        <option value="N">N</option>
                      </select>
                    </span>
                  </label>
                  <label>
                    Rôle
                    <input
                      className="schema-relation-input"
                      value={(arete.data as LienMcdData | undefined)?.role ?? ''}
                      onChange={(e) => majDonneesArete({ role: e.target.value || undefined })}
                      placeholder="facultatif"
                    />
                  </label>
                </div>
              </Panel>
            )}
          </ReactFlow>
         </EditionContext.Provider>
        </NiveauContext.Provider>
      </div>

      {'table' === selectionUnique?.type && (
        <TableEditor
          key={selectionUnique.id}
          data={selectionUnique.data}
          niveau={'mld' === kind ? 'mld' : 'mpd'}
          tables={tablesResume}
          onChange={(patch) => majTable(selectionUnique.id, patch)}
          onClose={fermerEditeur}
        />
      )}
      {('mcdEntite' === selectionUnique?.type || 'mcdAssociation' === selectionUnique?.type) && (
        <McdEditor
          key={selectionUnique.id}
          genre={'mcdEntite' === selectionUnique.type ? 'entite' : 'association'}
          data={selectionUnique.data}
          onChange={(patch) => majMcd(selectionUnique.id, patch)}
          onClose={fermerEditeur}
        />
      )}
      {areteFkEditee && tableEnfantFk && colFk && (
        <LienFkEditor
          key={areteFkEditee.id}
          col={colFk}
          nomEnfant={tableEnfantFk.data.nom}
          nomParent={tableParentFk?.data.nom ?? ''}
          coteEnfantEffectif={coteEnfantEffectif}
          coteParentEffectif={coteParentEffectif}
          onChange={(patch) => majLienFk(tableEnfantFk.id, colFk.id, patch)}
          onClose={() => setEdgeEditionId(null)}
        />
      )}


      {!pleinEcran &&
        cibleApercu &&
        createPortal(
          <ApercuExport
            generer={(options) => {
              const racine = canevasRef.current
              return racine ? genererPng(instance, racine, options) : Promise.reject(new Error('Canevas introuvable.'))
            }}
            contenu={contenuApercu}
            nom={nom || 'schema'}
            options={optionsExport}
            onOptions={setOptionsExport}
            ouvert={apercuOuvert}
            onOuvert={setApercuOuvert}
          />,
          cibleApercu,
        )}
    </div>
  )
}