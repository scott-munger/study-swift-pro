# 🧪 Guide de Test PWA en Local

## 🎯 Méthodes pour Tester le PWA Localement

### ⚠️ Important
Les Service Workers ne fonctionnent que sur :
- **HTTPS** (en production)
- **localhost** (en développement) ✅

Donc votre environnement local est parfait pour tester !

---

## 📱 Méthode 1 : Test sur Desktop (Chrome/Edge)

### Étape 1 : Lancer l'Application
```bash
# Terminal 1 - Backend
cd /Users/munger/study-swift-pro
npx tsx src/api/server.ts

# Terminal 2 - Frontend
npm run dev
```

### Étape 2 : Ouvrir Chrome
```
URL: http://localhost:5173
```

### Étape 3 : Vérifier le Service Worker
1. Ouvrir **DevTools** (F12)
2. Aller dans l'onglet **Application**
3. Dans le menu de gauche, cliquer sur **Service Workers**
4. ✅ Vous devriez voir `/sw.js` avec le statut **activated**

### Étape 4 : Vérifier le Manifest
1. Toujours dans **Application**
2. Cliquer sur **Manifest**
3. ✅ Vérifier que toutes les infos s'affichent :
   - Name: "Tyala - Plateforme d'Apprentissage"
   - Short name: "Tyala"
   - Start URL: "/"
   - Display: "standalone"
   - Theme color: "#3B82F6"

### Étape 5 : Vérifier IndexedDB
1. Dans **Application** → **Storage** → **IndexedDB**
2. ✅ Vous devriez voir `TyalaOfflineDB`
3. Cliquer pour voir les stores :
   - flashcards
   - tests
   - testResults
   - syncQueue

### Étape 6 : Tester le Mode Offline
1. Se connecter et charger des **flashcards**
2. Aller sur **Examens** et charger des tests
3. Ouvrir **DevTools** → **Network**
4. Sélectionner **Offline** dans le menu déroulant
5. **Rafraîchir** la page (F5)
6. ✅ Les flashcards et tests doivent toujours être là !

### Étape 7 : Installer l'App (Desktop)
1. Chercher l'icône **➕** dans la barre d'adresse (à droite)
2. Cliquer dessus
3. Cliquer **Installer**
4. ✅ L'app s'ouvre dans une fenêtre standalone
5. Vérifier dans le menu démarrer / applications

---

## 📱 Méthode 2 : Test sur Mobile (Android/iOS)

### Option A : Via Tunnel (Recommandé)

#### Avec ngrok (Gratuit)
```bash
# Installer ngrok
brew install ngrok  # macOS
# ou télécharger depuis https://ngrok.com/

# Exposer votre serveur local
ngrok http 5173
```

Vous obtiendrez une URL HTTPS comme :
```
https://abc123.ngrok.io
```

**Sur votre téléphone** :
1. Ouvrir cette URL dans Chrome/Safari
2. Tester toutes les fonctionnalités PWA
3. Ajouter à l'écran d'accueil

#### Avec Cloudflare Tunnel (Gratuit)
```bash
# Installer cloudflared
brew install cloudflare/cloudflare/cloudflared  # macOS

# Créer un tunnel
cloudflared tunnel --url http://localhost:5173
```

### Option B : Via Réseau Local (Plus Simple)

#### 1. Trouver votre IP locale
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Vous obtiendrez quelque chose comme: 192.168.1.100
```

#### 2. Modifier vite.config.ts
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Écouter sur toutes les interfaces
    port: 5173
  }
});
```

#### 3. Relancer le serveur
```bash
npm run dev
```

#### 4. Sur votre téléphone (même WiFi)
```
http://192.168.1.100:5173
```

⚠️ **Limitation** : Pas de HTTPS, donc certaines fonctionnalités PWA peuvent ne pas marcher (installation, notifications push).

---

## 🔍 Méthode 3 : Audit Lighthouse

### Dans Chrome DevTools
1. Ouvrir **DevTools** (F12)
2. Aller dans l'onglet **Lighthouse**
3. Cocher **Progressive Web App**
4. Cliquer **Analyze page load**

### Résultats Attendus
✅ **Installable** : L'app peut être installée  
✅ **PWA Optimized** : Répond aux critères PWA  
✅ **Works Offline** : Fonctionne hors ligne  
✅ **Fast and Reliable** : Temps de chargement rapide  

**Score cible** : > 80/100 (100/100 avec icônes optimales)

---

## 📊 Checklist de Test Complète

### ✅ Service Worker
- [ ] Service Worker enregistré (Application → Service Workers)
- [ ] Status: **activated**
- [ ] Scope: `/`

### ✅ Manifest
- [ ] Manifest visible (Application → Manifest)
- [ ] Toutes les propriétés affichées
- [ ] Icônes chargées

### ✅ Cache
- [ ] Cache statique créé (`tyala-v1`)
- [ ] Cache de données créé (`tyala-data-v1`)
- [ ] Assets mis en cache

### ✅ IndexedDB
- [ ] Base de données créée (`TyalaOfflineDB`)
- [ ] 4 stores présents
- [ ] Données sauvegardées après chargement

### ✅ Mode Offline
- [ ] Flashcards accessibles offline
- [ ] Tests accessibles offline
- [ ] Bannière "Mode hors ligne" s'affiche
- [ ] Page offline.html accessible si erreur

### ✅ Installation
- [ ] Bouton d'installation visible (barre d'adresse)
- [ ] Bannière d'installation s'affiche
- [ ] Installation réussie
- [ ] App lance en standalone
- [ ] Icône sur écran d'accueil/menu démarrer

### ✅ Synchronisation
- [ ] Résultats sauvegardés offline
- [ ] Toast "Connexion rétablie" à la reconnexion
- [ ] Synchronisation automatique fonctionne

---

## 🐛 Résolution de Problèmes

### ❌ Service Worker ne s'enregistre pas
**Solution** :
```bash
# Vérifier la console pour les erreurs
# Vider le cache et recharger
# Application → Clear storage → Clear site data
```

### ❌ Manifest ne charge pas
**Vérifier** :
```bash
curl http://localhost:5173/manifest.json
# Doit retourner le JSON du manifest
```

### ❌ IndexedDB vide
**Vérifier** :
```javascript
// Dans la console
offlineStorage.getStorageStats().then(console.log)
// Doit retourner: { flashcards: X, tests: Y, ... }
```

### ❌ Mode offline ne fonctionne pas
**Actions** :
1. Charger les données EN LIGNE d'abord
2. Vérifier IndexedDB (doit contenir des données)
3. Passer en mode offline
4. Rafraîchir

### ❌ Installation impossible
**Causes possibles** :
- Manifest invalide
- Service Worker pas activé
- Déjà installé (désinstaller d'abord)
- Navigateur non compatible

---

## 📱 Test sur Vrais Appareils

### Android (Chrome)
1. Activer **USB Debugging** sur le téléphone
2. Connecter via USB
3. Dans Chrome Desktop : `chrome://inspect`
4. Sélectionner votre appareil
5. Ouvrir l'URL et tester

### iOS (Safari)
1. Activer **Web Inspector** dans Réglages → Safari → Avancé
2. Connecter iPhone/iPad via USB
3. Dans Safari Desktop : Développement → [Votre appareil]
4. Inspecter et tester

---

## 🎯 Scénarios de Test Recommandés

### Scénario 1 : Premier Chargement
1. Ouvrir l'app (première fois)
2. ✅ Service Worker s'installe
3. ✅ Bannière d'installation apparaît
4. Se connecter
5. Charger des flashcards
6. ✅ Données mises en cache

### Scénario 2 : Mode Offline
1. Charger flashcards et tests (online)
2. Passer en mode offline
3. Rafraîchir la page
4. ✅ Flashcards toujours là
5. ✅ Tests toujours là
6. ✅ Bannière orange "Mode hors ligne"
7. Passer un test
8. ✅ Résultat sauvegardé localement

### Scénario 3 : Synchronisation
1. En mode offline, passer un test
2. Résultat sauvegardé localement
3. Revenir en ligne
4. ✅ Toast "Connexion rétablie"
5. ✅ Toast "Synchronisation terminée"
6. Vérifier dans l'admin que le résultat est là

### Scénario 4 : Installation
1. Cliquer sur le bouton d'installation
2. ✅ App s'installe
3. Fermer et relancer depuis l'icône
4. ✅ Lance en standalone (pas de barre d'adresse)
5. Tester toutes les fonctionnalités

---

## 📸 Screenshots Attendus

### Console au Démarrage
```
✅ PWA: Service Worker enregistré
✅ PWA: Stockage offline initialisé
📊 PWA: Stats stockage offline: { flashcards: 0, tests: 0, testResults: 0, syncQueue: 0 }
```

### Après Chargement de Données
```
✅ Flashcards mises en cache pour usage offline
✅ 25 flashcards chargées depuis le cache
✅ Tests mis en cache pour usage offline
✅ 5 tests chargés depuis le cache
```

### En Mode Offline
```
⚠️ Mode offline - Chargement depuis le cache
✅ 25 flashcards chargées depuis le cache
✅ 5 tests chargés depuis le cache
```

### À la Reconnexion
```
✅ Connexion rétablie
🔄 Synchronisation des données en cours...
✅ Synchronisation terminée : 2 résultat(s) synchronisé(s)
```

---

## 🚀 Commandes Rapides

### Lancer l'App
```bash
# Terminal 1
npx tsx src/api/server.ts

# Terminal 2
npm run dev
```

### Vérifier le Service Worker
```bash
# Dans la console navigateur
navigator.serviceWorker.getRegistrations().then(console.log)
```

### Vérifier IndexedDB
```bash
# Dans la console navigateur
offlineStorage.getStorageStats().then(console.log)
```

### Tester Offline
```bash
# DevTools → Network → Offline → Refresh
```

### Audit Lighthouse
```bash
# DevTools → Lighthouse → PWA → Analyze
```

---

## ✅ Validation Finale

Avant de déployer, vérifier :
- [ ] Service Worker fonctionne
- [ ] Manifest valide
- [ ] IndexedDB sauvegarde les données
- [ ] Mode offline fonctionne
- [ ] Installation possible
- [ ] Synchronisation fonctionne
- [ ] Score Lighthouse > 80
- [ ] Testé sur mobile (via tunnel)
- [ ] Pas d'erreurs dans la console
- [ ] Toutes les fonctionnalités marchent

---

## 🎉 Résultat Attendu

Si tout fonctionne :
- ✅ App installable sur desktop et mobile
- ✅ Fonctionne offline (flashcards + tests)
- ✅ Synchronisation automatique
- ✅ Expérience native-like
- ✅ Rapide et responsive
- ✅ Score Lighthouse élevé

**Vous êtes prêt pour l'hébergement ! 🚀**

---

## 📚 Ressources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Testing Service Workers](https://developer.chrome.com/docs/workbox/service-worker-overview/)
- [Chrome DevTools PWA](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [ngrok Documentation](https://ngrok.com/docs)



