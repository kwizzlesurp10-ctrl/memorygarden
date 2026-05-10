/**
 * IndexedDB-backed blob storage for memory photos.
 *
 * The garden's localStorage was filling its quota at ~5 large photos
 * because Memory.photoUrl was a Base64 Data URL stored inline. We move
 * the photo bytes to IndexedDB and persist a lightweight `idb://<id>`
 * reference inside the Memory record so the metadata stays compact.
 *
 * Public API:
 *   putPhoto(id, dataUrl) → idb://<id>
 *   getPhoto(idbRef)      → original data URL or null if missing
 *   deletePhoto(idbRef)
 *   isPhotoRef(string)
 *
 * Falls back to a no-op (just returns the original data URL) when
 * IndexedDB is unavailable (private browsing, very old browsers).
 */

const DB_NAME = 'memorygarden-photos'
const DB_VERSION = 1
const STORE = 'photos'
const REF_PREFIX = 'idb://'

let _dbPromise: Promise<IDBDatabase | null> | null = null

function openDB(): Promise<IDBDatabase | null> {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return _dbPromise
}

export function isPhotoRef(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(REF_PREFIX)
}

function refToId(ref: string): string {
  return ref.slice(REF_PREFIX.length)
}

function makeRef(id: string): string {
  return `${REF_PREFIX}${id}`
}

/** Approximate decoded byte length of a data URL. */
function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return dataUrl.length
  const b64 = dataUrl.slice(comma + 1)
  return Math.floor((b64.length * 3) / 4)
}

/** Photos under this size stay inline; above it, they spill to IDB. */
const INLINE_LIMIT_BYTES = 32 * 1024

/**
 * Persist a photo to IDB and return a reference. Small photos and
 * non-data-URL strings (already a ref, or an external URL) are
 * returned unchanged.
 */
export async function putPhoto(id: string, dataUrl: string): Promise<string> {
  if (!dataUrl) return dataUrl
  if (isPhotoRef(dataUrl)) return dataUrl
  if (!dataUrl.startsWith('data:')) return dataUrl
  if (dataUrlByteLength(dataUrl) <= INLINE_LIMIT_BYTES) return dataUrl
  const db = await openDB()
  if (!db) return dataUrl
  return new Promise<string>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, id)
      tx.oncomplete = () => resolve(makeRef(id))
      tx.onerror = () => resolve(dataUrl)
      tx.onabort = () => resolve(dataUrl)
    } catch {
      resolve(dataUrl)
    }
  })
}

export async function getPhoto(ref: string): Promise<string | null> {
  if (!isPhotoRef(ref)) return ref
  const db = await openDB()
  if (!db) return null
  return new Promise<string | null>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(refToId(ref))
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function deletePhoto(ref: string): Promise<void> {
  if (!isPhotoRef(ref)) return
  const db = await openDB()
  if (!db) return
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(refToId(ref))
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}
