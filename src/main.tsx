import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { clearUserStorage } from './utils/clearStorage'
import { pwaManager } from './lib/pwaManager'
import { offlineStorage } from './lib/offlineStorage'

// Nettoyer uniquement les données utilisateur au démarrage de l'application
// pour éviter qu'un utilisateur soit connecté par défaut
console.log('Démarrage de TYALA - Nettoyage des données utilisateur...');
clearUserStorage();

// Initialiser PWA et stockage offline
const initPWA = async () => {
  try {
    // Enregistrer le Service Worker (sera ignoré en développement)
    const swRegistered = await pwaManager.register();
    if (swRegistered) {
      console.log('✅ PWA: Service Worker enregistré');
    } else {
      console.log('ℹ️ PWA: Service Worker désactivé en développement');
    }

    // Initialiser IndexedDB
    await offlineStorage.init();
    console.log('✅ PWA: Stockage offline initialisé');

    // Configurer le prompt d'installation
    pwaManager.setupInstallPrompt();

    // Afficher les stats de stockage
    const stats = await offlineStorage.getStorageStats();
    console.log('📊 PWA: Stats stockage offline:', stats);
  } catch (error) {
    console.error('❌ PWA: Erreur initialisation:', error);
  }
};

// Lancer l'initialisation PWA (en arrière-plan, ne bloque pas le rendu)
initPWA().catch(console.error);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(<App />)