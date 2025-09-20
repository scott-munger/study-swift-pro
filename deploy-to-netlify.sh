#!/bin/bash

# Script de déploiement rapide sur Netlify
# Usage: ./deploy-to-netlify.sh [URL_API]

echo "🚀 Déploiement sur Netlify..."

# Vérifier si l'URL API est fournie
if [ -z "$1" ]; then
    echo "❌ Veuillez fournir l'URL de votre API backend"
    echo "Usage: ./deploy-to-netlify.sh https://votre-api.herokuapp.com/api"
    exit 1
fi

API_URL="$1"
echo "📡 URL API: $API_URL"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Créer le fichier .env
echo "🔧 Configuration des variables d'environnement..."
cat > .env << EOF
VITE_API_URL=$API_URL
EOF

# Modifier les URLs dans le code
echo "🔄 Mise à jour des URLs de l'API..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|http://localhost:8081/api|$API_URL|g"
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|http://localhost:3001/api|$API_URL|g"

# Nettoyer les fichiers de sauvegarde
find src -name "*.bak" -delete

# Build de production
echo "🔨 Build de production..."
npm run build

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
    echo "❌ Le build a échoué"
    exit 1
fi

echo "✅ Build réussi !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Pousser le code sur GitHub :"
echo "   git add ."
echo "   git commit -m 'Deploy to Netlify'"
echo "   git push origin main"
echo ""
echo "2. Aller sur netlify.com et :"
echo "   - Cliquer sur 'New site from Git'"
echo "   - Choisir votre repository GitHub"
echo "   - Configurer :"
echo "     * Build command: npm run build"
echo "     * Publish directory: dist"
echo "     * Node version: 18"
echo ""
echo "3. Dans les variables d'environnement de Netlify :"
echo "   - Ajouter VITE_API_URL = $API_URL"
echo ""
echo "4. Déployer !"
echo ""
echo "🎉 Votre site sera disponible sur https://votre-site.netlify.app"
