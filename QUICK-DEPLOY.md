# 🚀 Déploiement Rapide sur Netlify

## ⚡ Déploiement en 5 minutes

### 1. Préparer votre backend
Avant de déployer le frontend, vous devez déployer votre backend sur une plateforme gratuite :

#### Option A : Heroku (Recommandé)
```bash
# Installer Heroku CLI
# Créer un compte sur heroku.com
heroku create votre-api-nom
git push heroku main
```

#### Option B : Railway
```bash
# Aller sur railway.app
# Connecter votre repository
# Configurer les variables d'environnement
```

#### Option C : Render
```bash
# Aller sur render.com
# Créer un nouveau Web Service
# Connecter votre repository
```

### 2. Déployer le frontend sur Netlify

#### Méthode 1 : Script automatique
```bash
# Remplacer par l'URL de votre API déployée
./deploy-to-netlify.sh https://votre-api.herokuapp.com/api
```

#### Méthode 2 : Manuel
```bash
# 1. Modifier les URLs de l'API
# Remplacer http://localhost:8081/api par votre URL d'API

# 2. Créer le fichier .env
echo "VITE_API_URL=https://votre-api.herokuapp.com/api" > .env

# 3. Build
npm run build

# 4. Pousser sur GitHub
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

### 3. Configuration Netlify

1. **Aller sur [netlify.com](https://netlify.com)**
2. **Cliquer sur "New site from Git"**
3. **Choisir "GitHub"**
4. **Sélectionner votre repository**
5. **Configurer :**
   - **Build command :** `npm run build`
   - **Publish directory :** `dist`
   - **Node version :** `18`

6. **Variables d'environnement :**
   - Aller dans Site settings > Environment variables
   - Ajouter : `VITE_API_URL` = `https://votre-api.herokuapp.com/api`

7. **Déployer !**

## 🔧 Configuration du backend

### Variables d'environnement requises :
```env
DATABASE_URL=mysql://username:password@host:port/database
JWT_SECRET=votre-secret-jwt-tres-securise
PORT=8081
CORS_ORIGIN=https://votre-site.netlify.app
```

### Fichier package.json pour le backend :
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "tsx src/api/index.ts"
  }
}
```

## 🧪 Test du déploiement

1. **Vérifier l'URL :** `https://votre-site.netlify.app`
2. **Tester la connexion :** Vérifier que l'API répond
3. **Tester l'authentification :** Connexion/déconnexion
4. **Tester la navigation :** Tous les liens fonctionnent

## 🚨 Problèmes courants

### CORS Error
```javascript
// Dans votre backend, ajouter :
app.use(cors({
  origin: ['https://votre-site.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Build Error
```bash
# Vérifier que toutes les dépendances sont installées
npm install

# Vérifier que le build fonctionne localement
npm run build
```

### Variables d'environnement
- Vérifier que `VITE_API_URL` est configurée dans Netlify
- Vérifier que toutes les variables backend sont configurées

## 📱 URLs finales

- **Frontend :** `https://votre-site.netlify.app`
- **Backend :** `https://votre-api.herokuapp.com`
- **Admin :** `https://votre-site.netlify.app/simple-admin/dashboard`

## 🎉 Félicitations !

Votre site est maintenant déployé et accessible gratuitement sur Netlify !
