// Composant pour afficher les statistiques de stockage offline
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Database, WifiOff, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { offlineStorage } from '@/lib/offlineStorage';
import { useOffline } from '@/hooks/useOffline';
import { useToast } from '@/hooks/use-toast';

export const OfflineStats = () => {
  const [stats, setStats] = useState({
    flashcards: 0,
    tests: 0,
    testResults: 0,
    syncQueue: 0
  });
  const [loading, setLoading] = useState(true);
  const { isOnline, syncOfflineData } = useOffline();
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const storageStats = await offlineStorage.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      if (!isOnline) {
        toast({
          title: "Hors ligne",
          description: "Connectez-vous à Internet pour synchroniser",
          variant: "destructive"
        });
        return;
      }

      await syncOfflineData();
      await loadStats();
      
      toast({
        title: "✅ Synchronisation réussie",
        description: "Toutes vos données ont été synchronisées",
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Voulez-vous vraiment effacer toutes les données en cache ? Vous devrez les retélécharger.')) {
      return;
    }

    try {
      await offlineStorage.clearAll();
      await loadStats();
      
      toast({
        title: "Cache vidé",
        description: "Toutes les données offline ont été supprimées",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vider le cache",
        variant: "destructive"
      });
    }
  };

  const totalItems = stats.flashcards + stats.tests + stats.testResults;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Stockage Offline
        </CardTitle>
        <CardDescription>
          Données disponibles sans connexion Internet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connexion */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'Connecté' : 'Mode offline'}
          </Badge>
        </div>

        {/* Statistiques */}
        {loading ? (
          <div className="text-center py-4 text-gray-500">
            Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            {/* Flashcards */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="font-medium text-sm">Flashcards</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Disponibles hors ligne</p>
              </div>
              <Badge variant="outline" className="text-base font-bold">
                {stats.flashcards}
              </Badge>
            </div>

            {/* Tests */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="font-medium text-sm">Tests/Examens</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Téléchargés</p>
              </div>
              <Badge variant="outline" className="text-base font-bold">
                {stats.tests}
              </Badge>
            </div>

            {/* Résultats non synchronisés */}
            {stats.testResults > 0 && (
              <div className="flex items-center justify-between p-3 border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-orange-900 dark:text-orange-200">
                    Résultats à synchroniser
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Seront envoyés à la reconnexion
                  </p>
                </div>
                <Badge variant="secondary" className="bg-orange-600 text-white text-base font-bold">
                  {stats.testResults}
                </Badge>
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total des éléments</span>
                <span className="text-2xl font-bold text-primary">{totalItems}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSync}
            disabled={!isOnline || stats.testResults === 0}
            variant="default"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser
          </Button>
          
          <Button
            onClick={handleClearCache}
            disabled={totalItems === 0}
            variant="outline"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t">
          💡 Les données sont automatiquement mises en cache pour un accès hors ligne
        </div>
      </CardContent>
    </Card>
  );
};



