# 🌐 Guide pour obtenir l'URL publique Railway

## 🔍 Problème actuel
Votre API Railway utilise l'URL interne : `study-swift-pro.railway.internal`
Cette URL n'est **PAS accessible** depuis l'extérieur (Netlify, mobile, etc.)

## ✅ Solution : Obtenir l'URL publique

### Méthode 1 : Vérifier dans Railway Dashboard
1. Aller sur [railway.app](https://railway.app)
2. Cliquer sur votre projet "study-swift-pro"
3. Chercher une section "Domains" ou "URL"
4. L'URL publique ressemble à : `https://study-swift-pro-production-xxxx.up.railway.app`

### Méthode 2 : Générer un domaine public
1. Dans Railway → Votre projet
2. Aller dans "Settings"
3. Chercher "Domains" ou "Public URL"
4. Cliquer sur "Generate Domain" ou "Create Public URL"

### Méthode 3 : Vérifier les logs
1. Aller dans "Logs" de votre service
2. Chercher une ligne qui contient l'URL publique
3. Elle devrait apparaître au démarrage du serveur

## 🎯 URL publique typique
```
https://study-swift-pro-production-xxxx.up.railway.app
```

## 🔧 Une fois l'URL publique obtenue
1. Tester avec : `https://votre-url.up.railway.app/test`
2. Configurer Netlify avec cette URL
3. Tester la connexion depuis votre site

## 🆘 Si pas d'URL publique
Railway peut avoir des limitations sur le plan gratuit. Dans ce cas :
1. Vérifier les settings de votre projet
2. Chercher les options de domaine public
3. Ou considérer un autre service (Render, Heroku, etc.)
