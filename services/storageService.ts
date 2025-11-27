import { AnalysisResult, StoredScan } from "../types";

const DB_NAME = 'GlowAI_DB';
const STORE_NAME = 'scans';
const DB_VERSION = 1;

// Initialize Database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save a new scan
export const saveScan = async (image: string, result: AnalysisResult): Promise<StoredScan> => {
  const db = await initDB();
  const scan: StoredScan = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    image,
    result
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(scan);
    
    request.onsuccess = () => resolve(scan);
    request.onerror = () => reject(request.error);
  });
};

// Get all scans (sorted by newest first)
export const getHistory = async (): Promise<StoredScan[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const results = request.result as StoredScan[];
      // Sort by timestamp descending (newest first)
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

// Delete a scan
export const deleteScan = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
