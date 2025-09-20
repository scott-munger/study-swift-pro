# 🚀 Guide de déploiement sur Netlify

## 📋 Prérequis

1. **Compte Netlify** (gratuit) : [netlify.com](https://netlify.com)
2. **Compte GitHub** (gratuit) : [github.com](https://github.com)
3. **Node.js** installé localement

## 🔧 Étapes de déploiement

### 1. Préparation du code

#### A. Modifier les URLs de l'API
Avant de déployer, vous devez modifier les URLs de l'API dans votre code pour pointer vers votre backend déployé.

**Fichiers à modifier :**
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`
- `src/pages/SimpleAdminDashboard.tsx`
- Tous les autres fichiers qui utilisent `http://localhost:8081/api`

**Remplacez :**
```typescript
const API_BASE = 'http://localhost:8081/api';
```

**Par :**
```typescript
const API_BASE = process.env.VITE_API_URL || 'https://votre-api.herokuapp.com/api';
```

#### B. Créer un fichier .env
Créez un fichier `.env` à la racine du projet :
```env
VITE_API_URL=https://votre-api.herokuapp.com/api
```

### 2. Build de production

```bash
# Installer les dépendances
npm install

# Build de production
npm run build
```

### 3. Déploiement sur Netlify

#### Option A : Déploiement via GitHub (Recommandé)

1. **Pousser le code sur GitHub :**
   ```bash
   git add .
   git commit -m "Préparation pour déploiement Netlify"
   git push origin main
   ```

2. **Connecter à Netlify :**
   - Aller sur [netlify.com](https://netlify.com)
   - Cliquer sur "New site from Git"
   - Choisir "GitHub"
   - Sélectionner votre repository
   - Configurer :
     - **Build command :** `npm run build`
     - **Publish directory :** `dist`
     - **Node version :** `18`

3. **Variables d'environnement :**
   - Aller dans Site settings > Environment variables
   - Ajouter : `VITE_API_URL` = `https://votre-api.herokuapp.com/api`

#### Option B : Déploiement manuel

1. **Build local :**
   ```bash
   npm run build
   ```

2. **Upload sur Netlify :**
   - Aller sur [netlify.com](https://netlify.com)
   - Glisser-déposer le dossier `dist` sur la zone de déploiement

### 4. Configuration du backend

#### Option A : Heroku (Gratuit)
1. Créer un compte sur [heroku.com](https://heroku.com)
2. Créer une nouvelle app
3. Connecter votre repository GitHub
4. Configurer les variables d'environnement :
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`
   - `CORS_ORIGIN`

#### Option B : Railway (Gratuit)
1. Créer un compte sur [railway.app](https://railway.app)
2. Connecter votre repository
3. Configurer les variables d'environnement

#### Option C : Render (Gratuit)
1. Créer un compte sur [render.com](https://render.com)
2. Créer un nouveau Web Service
3. Connecter votre repository
4. Configurer les variables d'environnement

## 🔧 Configuration avancée

### Redirections SPA
Le fichier `netlify.toml` est déjà configuré pour les redirections SPA.

### Headers de sécurité
Les headers de sécurité sont configurés dans `netlify.toml`.

### Cache
Le cache est configuré pour les assets statiques.

## 🧪 Test du déploiement

1. **Vérifier l'URL :** Votre site sera disponible sur `https://votre-site.netlify.app`
2. **Tester la connexion :** Vérifier que l'API fonctionne
3. **Tester l'authentification :** Vérifier la connexion/déconnexion
4. **Tester la navigation :** Vérifier tous les liens

## 🚨 Problèmes courants

### CORS
Si vous avez des erreurs CORS, vérifiez que `CORS_ORIGIN` dans votre backend pointe vers votre URL Netlify.

### Variables d'environnement
Assurez-vous que toutes les variables d'environnement sont configurées dans Netlify.

### Build échoue
Vérifiez que toutes les dépendances sont dans `dependencies` et non `devDependencies`.

## 📞 Support

- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Vite](https://vitejs.dev/guide/build.html)
- [Documentation React Router](https://reactrouter.com/en/main/guides/deployment)
