#!/bin/bash

# Script de configuration MySQL pour Study Swift Pro
# Usage: ./scripts/setup-mysql.sh

echo "🚀 Configuration MySQL pour Study Swift Pro"
echo "=============================================="

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé."
    echo "📦 Installation de MySQL..."
    
    # Détecter le système d'exploitation
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mysql
        else
            echo "❌ Homebrew n'est pas installé. Installez MySQL manuellement."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
        sudo apt install mysql-server -y
    else
        echo "❌ Système d'exploitation non supporté. Installez MySQL manuellement."
        exit 1
    fi
fi

echo "✅ MySQL est installé"

# Démarrer MySQL
echo "🔄 Démarrage de MySQL..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start mysql
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# Attendre que MySQL soit prêt
echo "⏳ Attente du démarrage de MySQL..."
sleep 5

# Créer la base de données
echo "🗄️ Création de la base de données..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS study_swift_pro;"

if [ $? -eq 0 ]; then
    echo "✅ Base de données 'study_swift_pro' créée avec succès"
else
    echo "❌ Erreur lors de la création de la base de données"
    echo "💡 Assurez-vous que le mot de passe root est correct"
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOF
# Database
DATABASE_URL="mysql://root:password@localhost:3306/study_swift_pro"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# App Configuration
NODE_ENV="development"
PORT=3000
EOF
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas de modifier le mot de passe dans .env"
else
    echo "✅ Fichier .env existe déjà"
fi

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npm run db:generate

# Pousser le schéma vers la base de données
echo "📊 Synchronisation du schéma avec la base de données..."
npm run db:push

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Modifiez le mot de passe dans le fichier .env"
echo "2. Démarrez le serveur API : npm run api"
echo "3. Démarrez l'application : npm run dev"
echo "4. Testez la connexion sur : http://localhost:8080/database-test"
echo ""
echo "🔗 URLs utiles :"
echo "- Application : http://localhost:8080"
echo "- API : http://localhost:3001"
echo "- Test DB : http://localhost:8080/database-test"

