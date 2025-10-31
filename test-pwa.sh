#!/bin/bash

# Script de test rapide pour PWA Tyala
# Usage: ./test-pwa.sh

echo "🧪 Test PWA Tyala - Vérification Rapide"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si le serveur backend est lancé
echo "1️⃣  Vérification du backend..."
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend actif sur port 8081${NC}"
else
    echo -e "${RED}❌ Backend non actif${NC}"
    echo "   Lancer: npx tsx src/api/server.ts"
    exit 1
fi

# Vérifier si le frontend est lancé
echo ""
echo "2️⃣  Vérification du frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend actif sur port 5173${NC}"
else
    echo -e "${RED}❌ Frontend non actif${NC}"
    echo "   Lancer: npm run dev"
    exit 1
fi

# Vérifier le manifest
echo ""
echo "3️⃣  Vérification du manifest PWA..."
if curl -s http://localhost:5173/manifest.json | grep -q "Tyala"; then
    echo -e "${GREEN}✅ Manifest PWA accessible${NC}"
else
    echo -e "${RED}❌ Manifest PWA non accessible${NC}"
    exit 1
fi

# Vérifier le Service Worker
echo ""
echo "4️⃣  Vérification du Service Worker..."
if curl -s http://localhost:5173/sw.js | grep -q "Service Worker"; then
    echo -e "${GREEN}✅ Service Worker accessible${NC}"
else
    echo -e "${RED}❌ Service Worker non accessible${NC}"
    exit 1
fi

# Vérifier la page offline
echo ""
echo "5️⃣  Vérification de la page offline..."
if curl -s http://localhost:5173/offline.html | grep -q "Hors ligne"; then
    echo -e "${GREEN}✅ Page offline accessible${NC}"
else
    echo -e "${RED}❌ Page offline non accessible${NC}"
    exit 1
fi

# Résumé
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Tous les tests passent !${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Ouvrir http://localhost:5173 dans Chrome"
echo "   2. Ouvrir DevTools (F12) → Application"
echo "   3. Vérifier Service Workers (doit être 'activated')"
echo "   4. Vérifier Manifest (toutes les infos présentes)"
echo "   5. Vérifier IndexedDB (TyalaOfflineDB créée)"
echo ""
echo "🧪 Test offline :"
echo "   1. Se connecter et charger des flashcards"
echo "   2. DevTools → Network → Offline"
echo "   3. Rafraîchir la page"
echo "   4. Les flashcards doivent toujours être là !"
echo ""
echo "📱 Installation :"
echo "   1. Chercher l'icône ➕ dans la barre d'adresse"
echo "   2. Cliquer pour installer"
echo "   3. L'app s'ouvre en standalone"
echo ""
echo "🔍 Audit Lighthouse :"
echo "   DevTools → Lighthouse → PWA → Analyze"
echo "   Score attendu : > 80/100"
echo ""
echo "========================================"



