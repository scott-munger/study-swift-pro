import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { clearAllStorage } from './utils/clearStorage'

// Nettoyer le stockage au démarrage de l'application
console.log('Démarrage de TYALA - Nettoyage du stockage...');
clearAllStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)