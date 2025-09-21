# 🚀 Solution Rapide - Base de Données Externe

## 🚨 Problème
Railway DATABASE_URL invalide - "invalid port number in database URL"

## 🎯 Solution Rapide : PlanetScale (Gratuit)

### 1. Créer un compte PlanetScale
- Aller sur [planetscale.com](https://planetscale.com)
- Créer un compte gratuit
- Créer une nouvelle base de données "studyswift"

### 2. Obtenir la DATABASE_URL
PlanetScale va donner une URL comme :
```
mysql://username:password@aws.connect.psdb.cloud/studyswift?sslaccept=strict
```

### 3. Mettre à jour Railway
- Railway Dashboard → Variables
- Remplacer DATABASE_URL par l'URL PlanetScale
- Redéployer

## 🎯 Alternative : Supabase (Gratuit)

### 1. Créer un compte Supabase
- Aller sur [supabase.com](https://supabase.com)
- Créer un nouveau projet
- Aller dans Settings → Database
- Copier la connection string

### 2. Format Supabase
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

## 🎯 Alternative : Neon (Gratuit)

### 1. Créer un compte Neon
- Aller sur [neon.tech](https://neon.tech)
- Créer une base de données
- Copier la connection string

## 🚀 Solution Immédiate
Utiliser une base de données externe gratuite pour contourner le problème Railway.
