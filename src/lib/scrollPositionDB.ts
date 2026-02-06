// Efficient scroll position storage using IndexedDB
// Automatically cleans up old entries to prevent bloat

const DB_NAME = 'OpenShelfReaderDB';
const STORE_NAME = 'scrollPositions';
const DB_VERSION = 1;
const MAX_ENTRIES = 200; // Keep only the 200 most recent articles

interface ScrollPosition {
    articleId: string;
    position: number;
    timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'articleId' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });

    return dbPromise;
};

export const saveScrollPosition = async (articleId: string, position: number): Promise<void> => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const data: ScrollPosition = {
            articleId,
            position,
            timestamp: Date.now(),
        };

        await store.put(data);

        // Cleanup old entries asynchronously (don't await)
        cleanupOldEntries(db).catch(() => {
            // Silent fail for cleanup
        });
    } catch (error) {
        // Silent fail - scroll position is not critical
        console.warn('Failed to save scroll position:', error);
    }
};

export const getScrollPosition = async (articleId: string): Promise<number> => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve) => {
            const request = store.get(articleId);
            request.onsuccess = () => {
                const result = request.result as ScrollPosition | undefined;
                resolve(result?.position || 0);
            };
            request.onerror = () => resolve(0);
        });
    } catch (error) {
        return 0;
    }
};

const cleanupOldEntries = async (db: IDBDatabase): Promise<void> => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    // Get all entries sorted by timestamp
    const request = index.openCursor(null, 'prev');
    const entries: string[] = [];

    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                entries.push(cursor.primaryKey as string);
                cursor.continue();
            } else {
                // Delete entries beyond MAX_ENTRIES
                if (entries.length > MAX_ENTRIES) {
                    const toDelete = entries.slice(MAX_ENTRIES);
                    toDelete.forEach((key) => store.delete(key));
                }
                resolve();
            }
        };
        request.onerror = () => reject(request.error);
    });
};
