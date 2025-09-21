# 🚀 Guide d'Initialisation Railway

## 🎯 Situation actuelle
- ✅ **Base de données MySQL** : Active et connectée
- ✅ **API Railway** : Fonctionne
- ❌ **Tables Prisma** : Pas encore créées
- ❌ **Comptes de test** : N'existent pas

## 🔧 Solution : Initialiser les tables Prisma

### Option 1 : Via Railway CLI (Recommandé)
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Initialiser les tables
railway run npm run railway:tables
```

### Option 2 : Via Railway Dashboard
1. **Railway Dashboard → Settings → Variables**
2. **Ajouter une variable temporaire** :
   - **Name** : `INIT_TABLES`
   - **Value** : `true`
3. **Modifier le code** pour exécuter l'initialisation au démarrage
4. **Redéployer** le service
5. **Supprimer** la variable `INIT_TABLES`

### Option 3 : Via l'API (Simple)
Créer un endpoint d'initialisation temporaire dans votre API.

## 🧪 Test après initialisation
```bash
# Test de connexion admin
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  https://study-swift-pro-production.up.railway.app/api/auth/login

# Test de connexion étudiant
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"etudiant@test.com","password":"etudiant123"}' \
  https://study-swift-pro-production.up.railway.app/api/auth/login

# Test de connexion tuteur
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"tuteur@test.com","password":"tuteur123"}' \
  https://study-swift-pro-production.up.railway.app/api/auth/login
```

## 📝 Comptes de test créés
- **Admin** : admin@test.com / admin123
- **Étudiant** : etudiant@test.com / etudiant123
- **Tuteur** : tuteur@test.com / tuteur123

## 🎯 Prochaines étapes
1. Initialiser les tables Prisma
2. Créer les comptes de test
3. Tester la connexion
4. Vérifier que tout fonctionne en production
