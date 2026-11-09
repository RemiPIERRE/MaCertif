import { generateId } from './id'

/** Même forme que l'ancienne entité Visuel côté API, mais stockée uniquement dans ce navigateur (IndexedDB). */
export interface Visuel {
  id: string
  nom: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

interface VisuelEnregistre extends Visuel {
  blob: Blob
}

const DB_NAME = 'macertif-visuels'
const STORE_NAME = 'visuels'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = action(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

/** URLs objet déjà générées, indexées par id — évite de regénérer un object URL à chaque rendu. */
const urlCache = new Map<string, string>()

function metaSeule(v: VisuelEnregistre): Visuel {
  return { id: v.id, nom: v.nom, mimeType: v.mimeType, sizeBytes: v.sizeBytes, createdAt: v.createdAt }
}

export async function listerVisuels(): Promise<Visuel[]> {
  const tous = await withStore<VisuelEnregistre[]>('readonly', (store) => store.getAll())
  for (const v of tous) {
    if (!urlCache.has(v.id)) urlCache.set(v.id, URL.createObjectURL(v.blob))
  }
  return tous.map(metaSeule).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function uploaderVisuel(file: File, nom: string): Promise<Visuel> {
  const visuel: VisuelEnregistre = {
    id: generateId(),
    nom,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  }
  await withStore('readwrite', (store) => store.add(visuel))
  urlCache.set(visuel.id, URL.createObjectURL(visuel.blob))
  return metaSeule(visuel)
}

export async function supprimerVisuel(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
  const url = urlCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(id)
  }
}

/** URL du fichier image — généré localement (IndexedDB), jamais envoyé à un serveur. */
export function urlFichierVisuel(id: string): string {
  return urlCache.get(id) ?? ''
}
