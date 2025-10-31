# 📱 PWA & Fonctionnalité Offline - Tyala

## 🎯 Vue d'ensemble

Tyala est maintenant une **Progressive Web App (PWA)** complète avec support offline pour les flashcards et examens !

### ✨ Fonctionnalités Implémentées

#### 🔌 Mode Offline
- ✅ **Flashcards** disponibles sans connexion Internet
- ✅ **Examens** disponibles sans connexion Internet
- ✅ **Dashboard étudiant** accessible hors ligne
- ✅ **Profil utilisateur** consultable hors ligne
- ⚠️ **Forum** et **Groupes** nécessitent une connexion (fonctionnalités sociales)
- ⚠️ **Tuteurs** nécessite une connexion (recherche en temps réel)

#### 💾 Stockage Local (IndexedDB)
- Flashcards sauvegardées automatiquement
- Tests sauvegardés automatiquement
- Résultats de tests sauvegardés localement
- Synchronisation automatique à la reconnexion

#### 🔄 Synchronisation en Arrière-Plan
- Les résultats de tests passés hors ligne sont automatiquement synchronisés
- Notification de succès après synchronisation
- File d'attente pour les données non synchronisées

#### 📲 Installation PWA
- Bannière d'installation personnalisée
- Ajout à l'écran d'accueil (Android/iOS)
- Lancement en plein écran (standalone)
- Icône personnalisée sur l'écran d'accueil

## 📂 Architecture

### Fichiers Principaux

```
src/
  lib/
    pwaManager.ts          # Gestionnaire PWA principal
    offlineStorage.ts      # Gestionnaire IndexedDB
  
  hooks/
    useOffline.ts          # Hook React pour mode offline
  
  components/
    ui/
      PWAInstallBanner.tsx # Bannière d'installation PWA
  
  contexts/
    FlashcardContext.tsx   # Support offline intégré
  
  pages/
    KnowledgeTests.tsx     # Support offline intégré

public/
  manifest.json            # Manifest PWA
  sw.js                    # Service Worker
  offline.html             # Page offline de secours
```

### Base de Données IndexedDB

**Nom** : `TyalaOfflineDB`

**Stores** :
1. **flashcards** : Stockage des flashcards
   - Index : `subjectId`, `userId`, `lastSync`
   
2. **tests** : Stockage des tests/examens
   - Index : `subjectId`, `lastSync`
   
3. **testResults** : Résultats de tests (à synchroniser)
   - Index : `testId`, `userId`, `synced`, `createdAt`
   
4. **syncQueue** : File d'attente de synchronisation
   - Index : `type`, `createdAt`

## 🚀 Utilisation

### Pour les Développeurs

#### 1. Initialiser le PWA
Le PWA est initialisé automatiquement dans `src/main.tsx` :
```typescript
import { pwaManager } from './lib/pwaManager'
import { offlineStorage } from './lib/offlineStorage'

// Enregistrer le Service Worker
await pwaManager.register();

// Initialiser IndexedDB
await offlineStorage.init();
```

#### 2. Utiliser le Hook Offline
```typescript
import { useOffline } from '@/hooks/useOffline';

const MyComponent = () => {
  const { 
    isOnline,           // État de connexion
    cacheFlashcards,    // Sauvegarder flashcards
    getCachedFlashcards,// Récupérer flashcards
    cacheTests,         // Sauvegarder tests
    getCachedTests,     // Récupérer tests
    saveTestResultOffline, // Sauvegarder résultat
    syncOfflineData,    // Synchroniser manuellement
    installPWA          // Installer l'app
  } = useOffline();

  // Vérifier si online
  if (!isOnline) {
    console.log('Mode offline');
  }
};
```

#### 3. Afficher un Indicateur Offline
```tsx
{!isOnline && (
  <div className="offline-indicator">
    <WifiOff />
    <p>Mode hors ligne</p>
  </div>
)}
```

### Pour les Utilisateurs

#### 📱 Installer l'Application

**Android (Chrome)** :
1. Ouvrir Tyala dans Chrome
2. Appuyer sur les 3 points → "Ajouter à l'écran d'accueil"
3. Ou cliquer sur la bannière d'installation qui apparaît

**iOS (Safari)** :
1. Ouvrir Tyala dans Safari
2. Appuyer sur le bouton Partager (⬆️)
3. Sélectionner "Sur l'écran d'accueil"

**Desktop (Chrome/Edge)** :
1. Ouvrir Tyala
2. Cliquer sur l'icône ➕ dans la barre d'adresse
3. Ou utiliser Menu → "Installer Tyala"

#### 📚 Utiliser les Flashcards Hors Ligne

1. **Connectez-vous** à Internet au moins une fois
2. **Visitez** la page Flashcards et sélectionnez une matière
3. Les flashcards sont **automatiquement sauvegardées**
4. **Déconnectez-vous** : les flashcards restent accessibles !
5. À la reconnexion, les données sont **synchronisées**

#### 📝 Passer des Examens Hors Ligne

1. **Connectez-vous** et visitez la page Tests
2. **Sélectionnez** une matière pour charger les tests
3. Les tests sont **automatiquement sauvegardés**
4. **Passez un test hors ligne**
5. Votre résultat est **sauvegardé localement**
6. À la reconnexion, le résultat est **envoyé au serveur**

## 🔧 Configuration

### Service Worker (`public/sw.js`)

**Stratégies de Cache** :
- **Cache First** : Assets statiques (images, CSS, JS)
- **Network First** : Pages HTML et API
- **Offline Fallback** : Page `/offline.html`

**Caches** :
- `tyala-v1` : Cache statique
- `tyala-offline-v1` : Cache offline
- `tyala-data-v1` : Cache des données

### Manifest (`public/manifest.json`)

```json
{
  "name": "Tyala - Plateforme d'Apprentissage",
  "short_name": "Tyala",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "offline_enabled": true
}
```

## 📊 Statistiques de Stockage

Vérifiez l'utilisation du stockage dans la console :
```typescript
const stats = await offlineStorage.getStorageStats();
console.log(stats);
// {
//   flashcards: 150,
//   tests: 12,
//   testResults: 5,
//   syncQueue: 2
// }
```

## 🐛 Debugging

### Vérifier le Service Worker
```javascript
// Dans la console du navigateur
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Vérifier IndexedDB
```javascript
// Dans Chrome DevTools
// Application → Storage → IndexedDB → TyalaOfflineDB
```

### Simuler Mode Offline
```javascript
// Dans Chrome DevTools
// Network → Online → Offline
```

## ⚠️ Limitations

1. **Taille de Stockage** :
   - IndexedDB : ~50 MB sur mobile, illimité sur desktop
   - Cache Storage : Variable selon navigateur

2. **Fonctionnalités Nécessitant Internet** :
   - Forum et messagerie
   - Recherche de tuteurs
   - Mise à jour en temps réel
   - Upload de fichiers

3. **Compatibilité** :
   - ✅ Chrome/Edge (Desktop & Mobile)
   - ✅ Firefox (Desktop & Mobile)
   - ✅ Safari (iOS 11.3+)
   - ⚠️ Safari Desktop (limité)
   - ❌ Internet Explorer

## 🎯 Roadmap / Améliorations Futures

- [ ] Notifications push pour synchronisation
- [ ] Synchronisation périodique en arrière-plan
- [ ] Préchargement intelligent des données
- [ ] Mode offline pour le profil complet
- [ ] Cache des images de profil
- [ ] Statistiques de l'utilisation offline
- [ ] Mode "Télécharger tout" pour voyage

## 📈 Métriques PWA

Vérifier le score PWA avec **Lighthouse** :
```bash
# Audit complet
npm run audit:pwa

# Ou manuellement :
# Chrome DevTools → Lighthouse → PWA
```

**Objectifs** :
- ✅ Installable
- ✅ PWA optimisée
- ✅ Fonctionne hors ligne
- ✅ Configuration HTTPS
- ✅ Responsive design
- ✅ Temps de chargement < 3s

## 🔐 Sécurité

- Service Worker uniquement en HTTPS (sauf localhost)
- Données stockées localement chiffrées par le navigateur
- Token JWT stocké dans localStorage (comme avant)
- Synchronisation sécurisée avec Bearer token

## 📚 Ressources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web App Manifest](https://web.dev/add-manifest/)

---

## ✅ Test Rapide

1. **Ouvrir** Tyala dans Chrome
2. **Se connecter** et charger des flashcards
3. **Ouvrir DevTools** → Network → Offline
4. **Rafraîchir** la page
5. **Vérifier** que les flashcards sont toujours là !

🎉 **Félicitations !** Votre app fonctionne hors ligne !



