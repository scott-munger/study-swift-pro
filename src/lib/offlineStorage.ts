// Gestionnaire de stockage offline avec IndexedDB
// Permet de sauvegarder flashcards et examens pour usage hors ligne

const DB_NAME = 'TyalaOfflineDB';
const DB_VERSION = 1;

// Stores
const STORES = {
  FLASHCARDS: 'flashcards',
  TESTS: 'tests',
  TEST_RESULTS: 'testResults',
  SYNC_QUEUE: 'syncQueue'
};

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private static instance: OfflineStorage;

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Initialiser la base de données
  async init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[DB] Erreur ouverture:', request.error);
        reject(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[DB] Base de données ouverte');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[DB] Mise à jour schéma...');

        // Store pour les flashcards
        if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
          const flashcardsStore = db.createObjectStore(STORES.FLASHCARDS, { keyPath: 'id' });
          flashcardsStore.createIndex('subjectId', 'subjectId', { unique: false });
          flashcardsStore.createIndex('userId', 'userId', { unique: false });
          flashcardsStore.createIndex('lastSync', 'lastSync', { unique: false });
        }

        // Store pour les tests
        if (!db.objectStoreNames.contains(STORES.TESTS)) {
          const testsStore = db.createObjectStore(STORES.TESTS, { keyPath: 'id' });
          testsStore.createIndex('subjectId', 'subjectId', { unique: false });
          testsStore.createIndex('lastSync', 'lastSync', { unique: false });
        }

        // Store pour les résultats de tests
        if (!db.objectStoreNames.contains(STORES.TEST_RESULTS)) {
          const resultsStore = db.createObjectStore(STORES.TEST_RESULTS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          resultsStore.createIndex('testId', 'testId', { unique: false });
          resultsStore.createIndex('userId', 'userId', { unique: false });
          resultsStore.createIndex('synced', 'synced', { unique: false });
          resultsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store pour la file de synchronisation
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // FLASHCARDS

  async saveFlashcards(flashcards: any[]): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.FLASHCARDS], 'readwrite');
      const store = transaction.objectStore(STORES.FLASHCARDS);

      flashcards.forEach(flashcard => {
        store.put({
          ...flashcard,
          lastSync: Date.now()
        });
      });

      transaction.oncomplete = () => {
        console.log('[DB] Flashcards sauvegardées:', flashcards.length);
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('[DB] Erreur sauvegarde flashcards:', transaction.error);
        reject(false);
      };
    });
  }

  async getFlashcards(subjectId?: number): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.FLASHCARDS], 'readonly');
      const store = transaction.objectStore(STORES.FLASHCARDS);

      let request;
      if (subjectId) {
        const index = store.index('subjectId');
        request = index.getAll(subjectId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        console.log('[DB] Flashcards récupérées:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[DB] Erreur lecture flashcards:', request.error);
        reject([]);
      };
    });
  }

  // TESTS

  async saveTests(tests: any[]): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TESTS], 'readwrite');
      const store = transaction.objectStore(STORES.TESTS);

      tests.forEach(test => {
        store.put({
          ...test,
          lastSync: Date.now()
        });
      });

      transaction.oncomplete = () => {
        console.log('[DB] Tests sauvegardés:', tests.length);
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('[DB] Erreur sauvegarde tests:', transaction.error);
        reject(false);
      };
    });
  }

  async getTests(subjectId?: number): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TESTS], 'readonly');
      const store = transaction.objectStore(STORES.TESTS);

      let request;
      if (subjectId) {
        const index = store.index('subjectId');
        request = index.getAll(subjectId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        console.log('[DB] Tests récupérés:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[DB] Erreur lecture tests:', request.error);
        reject([]);
      };
    });
  }

  // RÉSULTATS DE TESTS

  async saveTestResult(result: any): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TEST_RESULTS], 'readwrite');
      const store = transaction.objectStore(STORES.TEST_RESULTS);

      const request = store.add({
        ...result,
        synced: false,
        createdAt: Date.now()
      });

      request.onsuccess = () => {
        console.log('[DB] Résultat sauvegardé');
        
        // Ajouter à la file de synchronisation
        this.addToSyncQueue({
          type: 'test-result',
          data: result,
          createdAt: Date.now()
        });
        
        resolve(true);
      };

      request.onerror = () => {
        console.error('[DB] Erreur sauvegarde résultat:', request.error);
        reject(false);
      };
    });
  }

  async getUnsyncedTestResults(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TEST_RESULTS], 'readonly');
      const store = transaction.objectStore(STORES.TEST_RESULTS);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        console.log('[DB] Résultats non synchronisés:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[DB] Erreur lecture résultats:', request.error);
        reject([]);
      };
    });
  }

  async markTestResultAsSynced(id: number): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.TEST_RESULTS], 'readwrite');
      const store = transaction.objectStore(STORES.TEST_RESULTS);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          result.synced = true;
          store.put(result);
          resolve(true);
        } else {
          reject(false);
        }
      };

      request.onerror = () => {
        console.error('[DB] Erreur mise à jour résultat:', request.error);
        reject(false);
      };
    });
  }

  // FILE DE SYNCHRONISATION

  async addToSyncQueue(item: any): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);

      store.add(item);

      transaction.oncomplete = () => {
        console.log('[DB] Ajouté à la file de sync');
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('[DB] Erreur ajout sync queue:', transaction.error);
        reject(false);
      };
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[DB] Erreur lecture sync queue:', request.error);
        reject([]);
      };
    });
  }

  async clearSyncQueue(): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[DB] File de sync vidée');
        resolve(true);
      };

      request.onerror = () => {
        console.error('[DB] Erreur vidage sync queue:', request.error);
        reject(false);
      };
    });
  }

  // UTILITAIRES

  async clearAll(): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORES.FLASHCARDS, STORES.TESTS, STORES.TEST_RESULTS, STORES.SYNC_QUEUE],
        'readwrite'
      );

      Object.values(STORES).forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });

      transaction.oncomplete = () => {
        console.log('[DB] Toutes les données effacées');
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('[DB] Erreur effacement:', transaction.error);
        reject(false);
      };
    });
  }

  async getStorageStats(): Promise<{
    flashcards: number;
    tests: number;
    testResults: number;
    syncQueue: number;
  }> {
    if (!this.db) await this.init();

    const stats = {
      flashcards: 0,
      tests: 0,
      testResults: 0,
      syncQueue: 0
    };

    for (const [key, storeName] of Object.entries(STORES)) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      stats[key.toLowerCase() as keyof typeof stats] = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    }

    return stats;
  }
}

// Export singleton
export const offlineStorage = OfflineStorage.getInstance();



