// Gestionnaire PWA pour Tyala
// Gère l'enregistrement du Service Worker et les fonctionnalités offline

export class PWAManager {
  private static instance: PWAManager;
  private sw: ServiceWorkerRegistration | null = null;
  private updateCallback: ((shouldUpdate: boolean) => void) | null = null;

  private constructor() {}

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Enregistrer le Service Worker
  async register(): Promise<boolean> {
    // NE PAS enregistrer le Service Worker en développement (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[PWA] Mode développement détecté - Service Worker désactivé');
      
      // Déregistrer les anciens Service Workers
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[PWA] Service Worker déregistré:', registration.scope);
        }
      } catch (error) {
        console.warn('[PWA] Erreur lors du déregistrement:', error);
      }
      
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker non supporté');
      return false;
    }

    try {
      console.log('[PWA] Enregistrement du Service Worker...');
      this.sw = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker enregistré:', this.sw.scope);

      // Écouter les mises à jour
      this.sw.addEventListener('updatefound', () => {
        console.log('[PWA] Mise à jour disponible');
        const newWorker = this.sw!.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nouvelle version disponible');
              this.notifyUpdate();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('[PWA] Erreur enregistrement SW:', error);
      return false;
    }
  }

  // Définir un callback pour gérer les mises à jour
  setUpdateCallback(callback: (shouldUpdate: boolean) => void) {
    this.updateCallback = callback;
  }

  // Notifier l'utilisateur d'une mise à jour
  private notifyUpdate() {
    if (this.updateCallback) {
      // Utiliser le callback React pour afficher un AlertDialog
      this.updateCallback(true);
    } else {
      // Fallback : utiliser confirm() si aucun callback n'est défini
      if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
        window.location.reload();
      }
    }
  }

  // Méthode pour confirmer la mise à jour depuis un composant React
  confirmUpdate() {
    window.location.reload();
  }

  // Vérifier si l'app est online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Demander la synchronisation en arrière-plan
  async requestSync(tag: string): Promise<boolean> {
    if (!this.sw || !('sync' in this.sw)) {
      console.warn('[PWA] Background Sync non supporté');
      return false;
    }

    try {
      await this.sw.sync.register(tag);
      console.log('[PWA] Sync enregistrée:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Erreur sync:', error);
      return false;
    }
  }

  // Mettre des URLs en cache
  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.sw) return;

    const sw = await navigator.serviceWorker.ready;
    sw.active?.postMessage({
      type: 'CACHE_URLS',
      urls
    });
  }

  // Installer prompt pour ajouter à l'écran d'accueil
  private deferredPrompt: any = null;

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] Install prompt disponible');
      
      // Afficher un bouton personnalisé pour installer l'app
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installée');
      this.deferredPrompt = null;
    });
  }

  private showInstallButton() {
    // Émettre un événement pour afficher le bouton d'installation
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] Pas de prompt disponible');
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[PWA] Choix utilisateur:', outcome);
    
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }
}

// Export singleton
export const pwaManager = PWAManager.getInstance();




