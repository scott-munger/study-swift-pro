// Hook pour gérer le mode offline et la synchronisation
import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { pwaManager } from '@/lib/pwaManager';
import { useToast } from './use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "✅ Connexion rétablie",
        description: "Synchronisation des données en cours...",
      });
      
      // Lancer la synchronisation
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "⚠️ Mode hors ligne",
        description: "Vos données seront synchronisées à la reconnexion",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier si PWA est installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchroniser les données offline
  const syncOfflineData = async () => {
    if (!isOnline) return;

    try {
      // Récupérer les résultats de tests non synchronisés
      const unsyncedResults = await offlineStorage.getUnsyncedTestResults();
      
      if (unsyncedResults.length > 0) {
        console.log(`[Sync] ${unsyncedResults.length} résultats à synchroniser`);
        
        // Synchroniser chaque résultat
        for (const result of unsyncedResults) {
          try {
            // Envoyer au serveur
            const response = await fetch('http://localhost:8081/api/tests/results', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(result.data)
            });

            if (response.ok) {
              // Marquer comme synchronisé
              await offlineStorage.markTestResultAsSynced(result.id);
              console.log(`[Sync] Résultat ${result.id} synchronisé`);
            }
          } catch (error) {
            console.error(`[Sync] Erreur résultat ${result.id}:`, error);
          }
        }

        toast({
          title: "✅ Synchronisation terminée",
          description: `${unsyncedResults.length} résultat(s) synchronisé(s)`,
        });
      }

      // Vider la file de synchronisation
      await offlineStorage.clearSyncQueue();
    } catch (error) {
      console.error('[Sync] Erreur synchronisation:', error);
      toast({
        title: "❌ Erreur de synchronisation",
        description: "Certaines données n'ont pas pu être synchronisées",
        variant: "destructive"
      });
    }
  };

  // Sauvegarder les flashcards pour usage offline
  const cacheFlashcards = async (flashcards: any[]) => {
    try {
      await offlineStorage.saveFlashcards(flashcards);
      console.log(`[Offline] ${flashcards.length} flashcards mises en cache`);
      return true;
    } catch (error) {
      console.error('[Offline] Erreur cache flashcards:', error);
      return false;
    }
  };

  // Récupérer les flashcards depuis le cache
  const getCachedFlashcards = async (subjectId?: number) => {
    try {
      const flashcards = await offlineStorage.getFlashcards(subjectId);
      console.log(`[Offline] ${flashcards.length} flashcards récupérées du cache`);
      return flashcards;
    } catch (error) {
      console.error('[Offline] Erreur lecture flashcards:', error);
      return [];
    }
  };

  // Sauvegarder les tests pour usage offline
  const cacheTests = async (tests: any[]) => {
    try {
      await offlineStorage.saveTests(tests);
      console.log(`[Offline] ${tests.length} tests mis en cache`);
      return true;
    } catch (error) {
      console.error('[Offline] Erreur cache tests:', error);
      return false;
    }
  };

  // Récupérer les tests depuis le cache
  const getCachedTests = async (subjectId?: number) => {
    try {
      const tests = await offlineStorage.getTests(subjectId);
      console.log(`[Offline] ${tests.length} tests récupérés du cache`);
      return tests;
    } catch (error) {
      console.error('[Offline] Erreur lecture tests:', error);
      return [];
    }
  };

  // Sauvegarder un résultat de test (sera synchronisé plus tard)
  const saveTestResultOffline = async (result: any) => {
    try {
      await offlineStorage.saveTestResult(result);
      console.log('[Offline] Résultat sauvegardé (sera synchronisé)');
      
      if (isOnline) {
        // Si online, synchroniser immédiatement
        syncOfflineData();
      }
      
      return true;
    } catch (error) {
      console.error('[Offline] Erreur sauvegarde résultat:', error);
      return false;
    }
  };

  // Installer l'app PWA
  const installPWA = async () => {
    const installed = await pwaManager.promptInstall();
    if (installed) {
      setIsPWAInstalled(true);
      toast({
        title: "✅ Application installée",
        description: "Tyala est maintenant disponible sur votre écran d'accueil",
      });
    }
    return installed;
  };

  return {
    isOnline,
    isPWAInstalled,
    cacheFlashcards,
    getCachedFlashcards,
    cacheTests,
    getCachedTests,
    saveTestResultOffline,
    syncOfflineData,
    installPWA
  };
};



