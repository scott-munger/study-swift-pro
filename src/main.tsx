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
    // Enregistrer le Service Worker
    const swRegistered = await pwaManager.register();
    if (swRegistered) {
      console.log('✅ PWA: Service Worker enregistré');
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

// Lancer l'initialisation PWA
initPWA();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)