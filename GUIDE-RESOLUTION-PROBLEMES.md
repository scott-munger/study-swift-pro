# 🚨 GUIDE DE RÉSOLUTION DE PROBLÈMES

## ❌ **PROBLÈME : "Ce site est inaccessible - localhost n'autorise pas la connexion"**

### **🔍 DIAGNOSTIC**

#### **Symptômes**
- Erreur : "Ce site est inaccessible"
- Message : "localhost n'autorise pas la connexion"
- Conseils : "Vérifier la connexion, proxy et pare-feu"

#### **Causes Possibles**
1. **Frontend non démarré** (cause la plus fréquente)
2. **API non démarrée**
3. **Ports occupés ou bloqués**
4. **Problème de configuration réseau**

---

## ✅ **SOLUTION RAPIDE**

### **Étape 1 : Vérifier les Services**
```bash
# Vérifier les processus Node.js
ps aux | grep node | grep -v grep

# Vérifier les ports
lsof -i :8080 -i :8081 -i :5173
```

### **Étape 2 : Démarrer les Services Manquants**
```bash
# Si l'API n'est pas démarrée
cd /Users/munger/study-swift-pro
npm run api

# Si le frontend n'est pas démarré
cd /Users/munger/study-swift-pro
npm run dev
```

### **Étape 3 : Vérifier le Fonctionnement**
```bash
# Test API
curl http://localhost:8081/api/health
# Résultat attendu: {"status":"OK","message":"Serveur en cours d'exécution"}

# Test Frontend
curl -I http://localhost:8080
# Résultat attendu: HTTP/1.1 200 OK
```

---

## 🔧 **SOLUTIONS DÉTAILLÉES**

### **Solution 1 : Redémarrage Complet**
```bash
# Arrêter tous les processus Node.js
pkill -f "node.*server.ts"
pkill -f "vite"

# Attendre 2 secondes
sleep 2

# Redémarrer l'API
cd /Users/munger/study-swift-pro
npm run api &

# Attendre que l'API démarre
sleep 3

# Redémarrer le frontend
npm run dev &
```

### **Solution 2 : Vérification des Ports**
```bash
# Vérifier quels ports sont utilisés
lsof -i :8080 -i :8081 -i :5173

# Si un port est occupé par un autre processus
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:8081 | xargs kill -9
```

### **Solution 3 : Configuration Réseau**
```bash
# Vérifier la configuration réseau
netstat -an | grep LISTEN | grep 8080
netstat -an | grep LISTEN | grep 8081

# Tester la connectivité locale
ping localhost
telnet localhost 8080
telnet localhost 8081
```

---

## 🚀 **DÉMARRAGE AUTOMATIQUE**

### **Script de Démarrage Complet**
```bash
#!/bin/bash
# start-system.sh

echo "🚀 Démarrage du système Study Swift Pro..."

# Arrêter les processus existants
echo "🛑 Arrêt des processus existants..."
pkill -f "node.*server.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Attendre
sleep 2

# Démarrer l'API
echo "🔧 Démarrage de l'API..."
cd /Users/munger/study-swift-pro
npm run api &
API_PID=$!

# Attendre que l'API démarre
echo "⏳ Attente du démarrage de l'API..."
sleep 5

# Vérifier l'API
if curl -s http://localhost:8081/api/health > /dev/null; then
    echo "✅ API démarrée avec succès"
else
    echo "❌ Erreur: API non accessible"
    exit 1
fi

# Démarrer le frontend
echo "🎨 Démarrage du frontend..."
npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend démarre
echo "⏳ Attente du démarrage du frontend..."
sleep 5

# Vérifier le frontend
if curl -s -I http://localhost:8080 | grep "200 OK" > /dev/null; then
    echo "✅ Frontend démarré avec succès"
else
    echo "❌ Erreur: Frontend non accessible"
    exit 1
fi

echo "🎉 Système démarré avec succès!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 API: http://localhost:8081"
echo "📊 Santé API: http://localhost:8081/api/health"

# Ouvrir le navigateur
open http://localhost:8080
```

---

## 🔍 **DIAGNOSTIC AVANCÉ**

### **Vérification Complète du Système**
```bash
#!/bin/bash
# diagnose-system.sh

echo "🔍 DIAGNOSTIC COMPLET DU SYSTÈME"
echo "================================"

# 1. Vérifier les processus Node.js
echo "1. Processus Node.js:"
ps aux | grep node | grep -v grep | wc -l
echo "   Processus trouvés: $(ps aux | grep node | grep -v grep | wc -l)"

# 2. Vérifier les ports
echo "2. Ports utilisés:"
lsof -i :8080 -i :8081 -i :5173

# 3. Tester l'API
echo "3. Test API:"
if curl -s http://localhost:8081/api/health > /dev/null; then
    echo "   ✅ API accessible"
    curl -s http://localhost:8081/api/health
else
    echo "   ❌ API non accessible"
fi

# 4. Tester le frontend
echo "4. Test Frontend:"
if curl -s -I http://localhost:8080 | grep "200 OK" > /dev/null; then
    echo "   ✅ Frontend accessible"
else
    echo "   ❌ Frontend non accessible"
fi

# 5. Vérifier la configuration réseau
echo "5. Configuration réseau:"
ping -c 1 localhost > /dev/null && echo "   ✅ localhost accessible" || echo "   ❌ localhost non accessible"

# 6. Vérifier les logs
echo "6. Logs récents:"
tail -n 5 /Users/munger/study-swift-pro/logs/*.log 2>/dev/null || echo "   Aucun log trouvé"

echo "================================"
echo "🔍 Diagnostic terminé"
```

---

## 🛠️ **MAINTENANCE PRÉVENTIVE**

### **Vérifications Régulières**
```bash
# Vérification quotidienne
#!/bin/bash
# daily-check.sh

echo "🔍 Vérification quotidienne du système..."

# Vérifier que les services fonctionnent
if ! curl -s http://localhost:8081/api/health > /dev/null; then
    echo "⚠️  API non accessible, redémarrage..."
    pkill -f "node.*server.ts"
    sleep 2
    cd /Users/munger/study-swift-pro && npm run api &
fi

if ! curl -s -I http://localhost:8080 | grep "200 OK" > /dev/null; then
    echo "⚠️  Frontend non accessible, redémarrage..."
    pkill -f "vite"
    sleep 2
    cd /Users/munger/study-swift-pro && npm run dev &
fi

echo "✅ Vérification terminée"
```

---

## 📞 **SUPPORT**

### **En Cas de Problème Persistant**
1. **Vérifier les logs** : `tail -f /Users/munger/study-swift-pro/logs/*.log`
2. **Redémarrer complètement** : Utiliser le script de démarrage automatique
3. **Vérifier la configuration** : `cat vite.config.ts` et `cat package.json`
4. **Tester les ports** : `netstat -an | grep LISTEN`

### **Commandes de Dépannage**
```bash
# Nettoyer les processus
pkill -f "node.*server.ts"
pkill -f "vite"
pkill -f "tsx"

# Nettoyer les ports
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:8081 | xargs kill -9

# Redémarrer proprement
cd /Users/munger/study-swift-pro
npm run api &
sleep 5
npm run dev &
```

---

## 🎯 **RÉSUMÉ**

### **✅ SOLUTION RAPIDE**
1. Vérifier les processus : `ps aux | grep node`
2. Vérifier les ports : `lsof -i :8080 -i :8081`
3. Démarrer les services manquants : `npm run api` et `npm run dev`
4. Tester l'accès : `curl http://localhost:8080`

### **🚀 PRÉVENTION**
- Utiliser le script de démarrage automatique
- Effectuer des vérifications régulières
- Maintenir les logs pour le debugging

**Le système devrait maintenant être accessible sur http://localhost:8080 !** 🎉
