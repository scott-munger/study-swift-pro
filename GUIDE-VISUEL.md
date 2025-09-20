# 🖼️ Guide Visuel - Déploiement Netlify

## 🎯 Vue d'ensemble

```
VOTRE ORDINATEUR
    ↓ (upload)
GITHUB (stockage du code)
    ↓ (déploiement)
NETLIFY (site web public)
```

---

## 📤 ÉTAPE 1 : GitHub - Mettre le code en ligne

### 1.1 Aller sur GitHub
```
🌐 github.com
    ↓
[Sign up] ou [Sign in]
```

### 1.2 Créer un nouveau repository
```
GitHub Dashboard
    ↓
[New] (bouton vert en haut)
    ↓
Repository name: study-swift-pro
    ↓
[Create repository]
```

### 1.3 Uploader vos fichiers
```
Repository vide
    ↓
[uploading an existing file]
    ↓
Glisser-déposer TOUS vos fichiers
    ↓
[Commit changes]
```

---

## 🌐 ÉTAPE 2 : Railway - Déployer l'API

### 2.1 Aller sur Railway
```
🌐 railway.app
    ↓
[Login with GitHub]
```

### 2.2 Créer un nouveau projet
```
Railway Dashboard
    ↓
[New Project]
    ↓
[Deploy from GitHub repo]
    ↓
Sélectionner: study-swift-pro
```

### 2.3 Configuration automatique
```
Railway détecte automatiquement:
✅ Node.js project
✅ Package.json trouvé
✅ Scripts détectés
```

---

## 🎨 ÉTAPE 3 : Netlify - Déployer le site

### 3.1 Aller sur Netlify
```
🌐 netlify.com
    ↓
[Sign up with GitHub]
```

### 3.2 Créer un nouveau site
```
Netlify Dashboard
    ↓
[New site from Git]
    ↓
[GitHub]
    ↓
Sélectionner: study-swift-pro
```

### 3.3 Configuration du build
```
Build settings:
┌─────────────────────────────────┐
│ Build command: npm run build   │
│ Publish directory: dist         │
│ Node version: 18                │
└─────────────────────────────────┘
    ↓
[Deploy site]
```

---

## ⚙️ ÉTAPE 4 : Configuration finale

### 4.1 Variables d'environnement Netlify
```
Netlify Dashboard
    ↓
Site settings
    ↓
Environment variables
    ↓
[Add variable]
    ↓
Key: VITE_API_URL
Value: https://votre-api.railway.app
```

### 4.2 Variables d'environnement Railway
```
Railway Dashboard
    ↓
Variables
    ↓
[Add variable]
    ↓
DATABASE_URL = mysql://...
JWT_SECRET = votre-secret
CORS_ORIGIN = https://votre-site.netlify.app
```

---

## 🎉 RÉSULTAT FINAL

```
✅ Frontend: https://votre-site.netlify.app
✅ Backend: https://votre-api.railway.app
✅ Admin: https://votre-site.netlify.app/simple-admin/dashboard
```

---

## 🚨 Problèmes courants et solutions

### ❌ "Build failed"
```
Solution:
1. Vérifier que package.json existe
2. Vérifier que npm run build fonctionne
3. Regarder les logs dans Netlify
```

### ❌ "API not found"
```
Solution:
1. Vérifier que Railway est déployé
2. Vérifier les variables d'environnement
3. Tester l'URL de l'API directement
```

### ❌ "CORS error"
```
Solution:
1. Ajouter CORS_ORIGIN dans Railway
2. Vérifier que l'URL Netlify est correcte
3. Redéployer le backend
```

---

## 📱 Test final

```
1. Ouvrir https://votre-site.netlify.app
2. Tester la connexion
3. Tester la navigation
4. Tester l'admin
```

**Si tout fonctionne → Félicitations ! 🎉**
