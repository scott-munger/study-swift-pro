# TYALA - Plateforme d'Apprentissage en Ligne

Plateforme complète de tutorat et d'apprentissage avec système de messagerie, flashcards, forum, groupes d'étude et administration.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL (ou SQLite pour développement)
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Configurer la base de données
npm run db:generate
npm run db:push

# Démarrer le serveur de développement
npm run dev:full
```

Le serveur API démarre sur `http://localhost:8081`  
Le frontend démarre sur `http://localhost:5173`

## 📋 Comptes par Défaut

### Admin
- **Email**: `admin@test.com`
- **Mot de passe**: `admin123`
- Le compte est créé automatiquement au premier login

## 🔧 Structure du Projet

```
src/
├── api/              # API Backend (Express + Prisma)
│   └── server.ts     # Serveur principal avec toutes les routes
├── components/       # Composants React réutilisables
├── contexts/         # Contextes React (Auth, Admin, etc.)
├── hooks/            # Custom hooks
├── lib/              # Utilitaires et configuration
├── pages/            # Pages de l'application
└── config/           # Configuration (API URL, etc.)
```

## 🎯 Fonctionnalités Principales

### 👤 Authentification
- Login/Register avec JWT
- Rôles: STUDENT, TUTOR, ADMIN
- Protection des routes par rôle
- Promotion automatique admin si aucun admin n'existe

### 👨‍🏫 Système de Tutorat
- Recherche de tuteurs par matière
- Profils tuteurs avec notes et spécialités
- Réservation de sessions
- Gestion des sessions (planification, notes)

### 💬 Messagerie
- Conversations tuteur-étudiant
- Messages texte, audio (voice), images et fichiers
- Notifications en temps réel
- Messages système (broadcast admin)

### 📚 Flashcards
- Création et gestion de flashcards
- Révisions avec système de répétition espacée
- Partage entre étudiants

### 📖 Forum
- Posts et réponses
- Images dans les posts
- Likes et interactions
- Modération admin

### 👥 Groupes d'Étude
- Création et gestion de groupes
- Messages de groupe
- Membres et rôles (MEMBER, MODERATOR)

### 🎓 Contenu Pédagogique
- Matières et chapitres
- Tests de connaissances
- Suivi des progrès

### ⚙️ Administration
- Dashboard admin complet
- Gestion des utilisateurs
- Gestion des matières et flashcards
- Modération du forum
- Statistiques système
- Messages broadcast

## 🔐 Routes API Principales

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/profile` - Profil utilisateur

### Tuteurs
- `GET /api/tutors` - Liste des tuteurs
- `GET /api/tutors/search` - Recherche de tuteurs
- `GET /api/tutors/:id` - Détails d'un tuteur

### Messages
- `GET /api/conversations` - Conversations de l'utilisateur
- `POST /api/conversations` - Créer une conversation
- `GET /api/conversations/:id/messages` - Messages d'une conversation
- `POST /api/conversations/:id/messages` - Envoyer un message

### Flashcards
- `GET /api/flashcards` - Mes flashcards
- `POST /api/flashcards` - Créer une flashcard
- `PUT /api/flashcards/:id` - Modifier
- `DELETE /api/flashcards/:id` - Supprimer

### Forum
- `GET /api/forum/posts` - Liste des posts
- `POST /api/forum/posts` - Créer un post
- `GET /api/forum/posts/:id` - Détails d'un post

### Admin
- `GET /api/admin/users` - Tous les utilisateurs (require ADMIN)
- `GET /api/admin/conversations` - Toutes les conversations (require ADMIN)
- `POST /api/admin/messages/broadcast` - Message broadcast (require ADMIN)

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Frontend seulement
npm run api          # API seulement
npm run dev:full     # Frontend + API en parallèle
npm run build        # Build production
npm run db:push      # Migrer la base de données
npm run db:seed      # Seed la base de données
```

## 📦 Technologies Utilisées

### Backend
- **Express.js** - Framework web
- **Prisma** - ORM pour la base de données
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **Multer** - Upload de fichiers

### Frontend
- **React** + **TypeScript** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Composants UI
- **React Query** - Gestion d'état serveur
- **PWA** - Progressive Web App

## 🔒 Sécurité

- Authentification JWT avec expiration (7 jours)
- Hashage des mots de passe avec bcrypt
- Validation des données côté serveur
- Protection CSRF via tokens
- Gestion des rôles et permissions
- Upload de fichiers sécurisé

## 📝 Notes Importantes

- Le middleware `requireAdmin` vérifie automatiquement les droits admin
- Le compte `admin@test.com` est créé/mis à jour automatiquement au login
- Si aucun admin n'existe, le premier utilisateur est promu automatiquement
- Les messages système utilisent un tuteur système TYALA automatique

## 🐛 Débogage

En cas d'erreur 403 sur les routes admin:
1. Vérifiez que vous êtes connecté avec un compte admin
2. Utilisez `/api/debug/admin-status` pour vérifier votre statut
3. Le middleware `requireAdmin` devrait vous promouvoir automatiquement si nécessaire

## 📞 Support

Pour toute question ou problème, consultez les logs du serveur dans la console.

