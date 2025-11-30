/**
 * Translation Cache Management using IndexedDB
 *
 * This module provides caching functionality for translated markdown content.
 * It uses SHA-256 hashing to detect content changes and avoid redundant translations.
 */

const DB_NAME = 'MarkdownTranslationCache'
const DB_VERSION = 1
const STORE_NAME = 'translations'

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })

        // Create indexes for efficient querying
        objectStore.createIndex('filePath', 'filePath', { unique: false })
        objectStore.createIndex('contentHash', 'contentHash', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Generate SHA-256 hash of content
 * @param {string} content - Content to hash
 * @returns {Promise<string>} - Hex string of hash
 */
export async function generateHash(content) {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get cached translation if it exists and content hasn't changed
 * @param {string} filePath - Path of the file
 * @param {string} contentHash - SHA-256 hash of current content
 * @returns {Promise<string|null>} - Translated content or null if not found/invalid
 */
export async function getCachedTranslation(filePath, contentHash) {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('filePath')
      const request = index.getAll(filePath)

      request.onsuccess = () => {
        const records = request.result

        // Find a record with matching content hash
        const match = records.find(record => record.contentHash === contentHash)

        if (match) {
          console.log('✅ Cache hit for:', filePath)
          resolve(match.translatedContent)
        } else {
          console.log('❌ Cache miss for:', filePath, '(content changed or not cached)')
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

/**
 * Save translated content to cache
 * @param {string} filePath - Path of the file
 * @param {string} contentHash - SHA-256 hash of original content
 * @param {string} originalContent - Original markdown content
 * @param {string} translatedContent - Translated markdown content
 * @returns {Promise<void>}
 */
export async function saveCachedTranslation(filePath, contentHash, originalContent, translatedContent) {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)

      // First, delete old cache entries for this file path
      const index = objectStore.index('filePath')
      const deleteRequest = index.openCursor(filePath)

      deleteRequest.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          // After deleting old entries, add new one
          const cacheEntry = {
            filePath,
            contentHash,
            originalContent,
            translatedContent,
            timestamp: Date.now(),
            fileSize: originalContent.length
          }

          const addRequest = objectStore.add(cacheEntry)

          addRequest.onsuccess = () => {
            console.log('💾 Translation cached for:', filePath)
            resolve()
          }

          addRequest.onerror = () => reject(addRequest.error)
        }
      }

      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
  } catch (error) {
    console.error('Error saving cache:', error)
  }
}

/**
 * Clear all cached translations
 * @returns {Promise<void>}
 */
export async function clearAllCache() {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.clear()

      request.onsuccess = () => {
        console.log('🗑️ All cache cleared')
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

/**
 * Get cache statistics
 * @returns {Promise<{count: number, totalSize: number}>}
 */
export async function getCacheStats() {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const records = request.result
        const totalSize = records.reduce((sum, record) => sum + record.fileSize, 0)

        resolve({
          count: records.length,
          totalSize
        })
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { count: 0, totalSize: 0 }
  }
}
