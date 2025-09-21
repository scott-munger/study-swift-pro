# 🔧 Correction DATABASE_URL Railway

## 🚨 Problème identifié
```
The provided database string is invalid. Error parsing connection string: invalid port number in database URL.
```

## 🎯 Solution : Corriger la DATABASE_URL

### 1. Aller dans Railway Dashboard
- [railway.app](https://railway.app)
- Projet "charismatic-freedom"
- Service "study-swift-pro"
- **Settings → Variables**

### 2. Vérifier la DATABASE_URL actuelle
La variable `DATABASE_URL` doit ressembler à :
```
mysql://root:password@mysql.railway.internal:3306/railway
```

### 3. Si la DATABASE_URL est incorrecte
**Option A : Utiliser les variables Railway automatiques**
1. Cliquer sur **"> 8 Railway Provided Variables available"**
2. Chercher `DATABASE_URL` dans les variables automatiques
3. Copier la vraie valeur

**Option B : Créer une nouvelle base de données**
1. Railway Dashboard → **"New" → "Database"**
2. Choisir **"MySQL"**
3. Railway va créer la vraie `DATABASE_URL`

### 4. Format correct de DATABASE_URL
```
mysql://username:password@host:port/database
```

Exemples valides :
```
mysql://root:abc123@mysql.railway.internal:3306/railway
mysql://root:password@containers-us-west-xxx.railway.app:3306/railway
```

### 5. Vérifier après correction
```bash
curl -X POST https://study-swift-pro-production.up.railway.app/api/init
```

## 🧪 Test
Une fois corrigée, l'initialisation devrait créer :
- ✅ admin@test.com / admin123
- ✅ etudiant@test.com / etudiant123
- ✅ tuteur@test.com / tuteur123

## 🎯 Actions immédiates
1. Vérifier Railway Dashboard → Variables
2. Corriger la DATABASE_URL
3. Tester l'initialisation
4. Vérifier la connexion
