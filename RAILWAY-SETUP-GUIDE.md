# 🚀 Guide de Configuration Railway

## 🚨 Problème actuel
La base de données Railway n'est pas initialisée avec les données de test.

## 🔧 Solutions

### 1. Vérifier les variables d'environnement Railway
- Aller sur [railway.app](https://railway.app)
- Cliquer sur votre projet "charismatic-freedom"
- Aller dans **Settings** → **Variables**
- Vérifier que ces variables existent :
  ```
  DATABASE_URL=mysql://username:password@host:port/database
  JWT_SECRET=your-secret-key
  NODE_ENV=production
  ```

### 2. Initialiser la base de données
Si la base de données est vide, vous devez :

#### Option A: Via Railway Dashboard
1. Aller dans **Settings** → **Variables**
2. Ajouter `DATABASE_URL` si manquante
3. Redéployer le projet

#### Option B: Via Railway CLI
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Initialiser la base de données
railway run npm run railway:init
```

### 3. Comptes de test à créer
- **Admin** : admin@test.com / admin123
- **Étudiant** : etudiant@test.com / etudiant123  
- **Tuteur** : tuteur@test.com / tuteur123

## 🎯 Actions à faire
1. ✅ Vérifier les variables d'environnement Railway
2. ⏳ Initialiser la base de données
3. ⏳ Tester la connexion
4. ⏳ Vérifier que les comptes fonctionnent

## 📝 Notes
- Railway utilise MySQL par défaut
- Les variables d'environnement doivent être configurées
- La base de données doit être initialisée avec Prisma

## 🔍 Vérification
Une fois configuré, testez avec :
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  https://tyala-platform-production.up.railway.app/api/auth/login
```

## 🆘 Si problème persiste
1. Vérifier les logs Railway
2. Vérifier la connexion à la base de données
3. Vérifier les variables d'environnement
4. Redéployer le projet
