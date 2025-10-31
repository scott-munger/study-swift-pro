// Bannière pour inviter l'utilisateur à installer l'app PWA
import { useState, useEffect } from 'react';
import { Button } from './button';
import { X, Download, Smartphone } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isPWAInstalled, installPWA } = useOffline();

  useEffect(() => {
    // Afficher la bannière si PWA pas installée et pas déjà refusée
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (!isPWAInstalled && !dismissed) {
      // Écouter l'événement custom de disponibilité d'installation
      const handleInstallAvailable = () => {
        setShowBanner(true);
      };

      window.addEventListener('pwa-install-available', handleInstallAvailable);

      return () => {
        window.removeEventListener('pwa-install-available', handleInstallAvailable);
      };
    }
  }, [isPWAInstalled]);

  const handleInstall = async () => {
    const installed = await installPWA();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-white shadow-2xl border-t-4 border-white/20 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {/* Icône */}
        <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full backdrop-blur-md">
          <Smartphone className="h-6 w-6 text-white" />
        </div>

        {/* Contenu */}
        <div className="flex-1">
          <h3 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Installer Tyala sur votre appareil
          </h3>
          <p className="text-xs sm:text-sm text-white/90">
            Accédez aux flashcards et examens même sans connexion Internet ! 📱✨
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            variant="secondary"
            size="sm"
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Installer</span>
            <span className="sm:hidden">OK</span>
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};



