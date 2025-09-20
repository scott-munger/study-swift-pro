#!/bin/bash

# Script de test de connexion backend
# Usage: ./test-backend.sh [URL_API]

echo "🔍 Test de connexion backend"
echo "============================"

# URL par défaut
DEFAULT_URL="https://votre-api.railway.app/api"

# Utiliser l'URL fournie ou la valeur par défaut
API_URL="${1:-$DEFAULT_URL}"

echo "📡 URL testée: $API_URL"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local description="$4"
    
    echo "🧪 Test: $description"
    echo "   Endpoint: $endpoint"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    fi
    
    # Séparer le body et le status code
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
        echo "   ✅ Status: $status - SUCCÈS"
        echo "   📄 Réponse: $body"
    else
        echo "   ❌ Status: $status - ÉCHEC"
        echo "   📄 Réponse: $body"
    fi
    echo ""
}

# Test 1: Santé du serveur
test_endpoint "/health" "GET" "" "Santé du serveur"

# Test 2: Connexion admin
test_endpoint "/auth/login" "POST" '{"email":"admin@test.com","password":"admin123"}' "Connexion admin"

# Test 3: Vérifier si on peut récupérer un token
echo "🔐 Test de récupération de token..."
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"admin123"}' \
    "$API_URL/auth/login")

if echo "$login_response" | grep -q "token"; then
    echo "✅ Token récupéré avec succès"
    
    # Extraire le token
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        echo "🔑 Token: ${token:0:20}..."
        
        # Test 4: Accès aux données admin
        echo "📊 Test d'accès aux données admin..."
        stats_response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$API_URL/admin/stats")
        
        stats_body=$(echo "$stats_response" | head -n -1)
        stats_status=$(echo "$stats_response" | tail -n 1)
        
        if [ "$stats_status" -eq 200 ]; then
            echo "✅ Données admin accessibles"
            echo "📄 Stats: $stats_body"
        else
            echo "❌ Erreur accès données admin: $stats_status"
        fi
    else
        echo "❌ Impossible d'extraire le token"
    fi
else
    echo "❌ Échec de la connexion - pas de token"
fi

echo ""
echo "🎯 Résumé:"
echo "=========="
echo "URL testée: $API_URL"
echo ""

# Test de connectivité basique
if curl -s --connect-timeout 10 "$API_URL/health" > /dev/null; then
    echo "✅ Backend accessible"
else
    echo "❌ Backend non accessible"
    echo ""
    echo "🔧 Solutions possibles:"
    echo "1. Vérifier que l'URL est correcte"
    echo "2. Vérifier que Railway est déployé"
    echo "3. Vérifier les variables d'environnement"
    echo "4. Vérifier les logs Railway"
fi
