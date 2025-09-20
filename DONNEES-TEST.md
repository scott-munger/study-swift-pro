# 📊 Données de Test - Système Simplifié

## 🔐 Comptes de Connexion

### 👨‍🏫 Tuteurs
| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Dr. Carmen Vargas | `dr.carmen@test.com` | `password123` | TUTOR |
| Prof. Martin Dubois | `prof.martin@test.com` | `password123` | TUTOR |
| Dr. Sarah Johnson | `dr.sarah@test.com` | `password123` | TUTOR |

### 👨‍🎓 Étudiants
| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Carlos Rodriguez | `carlos.rodriguez@test.com` | `password123` | STUDENT |
| Maria Garcia | `maria.garcia@test.com` | `password123` | STUDENT |
| Ahmed Benali | `ahmed.benali@test.com` | `password123` | STUDENT |
| José Martinez | `jose.martinez@test.com` | `password123` | STUDENT |

### 👨‍💼 Administrateur
| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Admin System | `admin@test.com` | `password123` | ADMIN |

## 🌐 URLs d'Accès

- **Frontend** : http://localhost:8080
- **API** : http://localhost:3001
- **Base de données** : MySQL (localhost:3306)

## 🚀 Services Nécessaires

### Services Actifs
- ✅ **API Server** (Port 3001) - Authentification et données
- ✅ **Frontend** (Port 8080) - Interface utilisateur  
- ✅ **Base de données MySQL** - Stockage des données

### Services Supprimés
- ❌ **WebSocket Server** (Port 3005) - Plus nécessaire

## 🧪 Comment Tester

### 1. Connexion Tuteur
1. Allez sur http://localhost:8080
2. Connectez-vous avec `dr.carmen@test.com` / `password123`
3. Accédez au tableau de bord tuteur
4. Utilisez le forum pour communiquer avec les étudiants

### 2. Connexion Étudiant
1. Allez sur http://localhost:8080
2. Connectez-vous avec `carlos.rodriguez@test.com` / `password123`
3. Accédez au tableau de bord étudiant
4. Utilisez le forum pour poser des questions aux tuteurs

### 3. Test du Forum
1. Connectez-vous en tant que tuteur ou étudiant
2. Allez dans l'onglet "Forum"
3. Créez un nouveau post ou répondez à un post existant
4. Vérifiez que la communication fonctionne

### 4. Test des Flashcards
1. Connectez-vous en tant qu'étudiant
2. Allez dans l'onglet "Flashcards"
3. Sélectionnez une matière (Mathématiques, Physique, etc.)
4. Testez les cartes avec différents niveaux de difficulté
5. Vérifiez que les réponses s'affichent correctement

## 📋 Fonctionnalités Disponibles

### ✅ Fonctionnalités Actives
- **Authentification** : Connexion/déconnexion
- **Dashboards** : Tableaux de bord personnalisés
- **Forum** : Communication entre tuteurs et étudiants
- **Flashcards** : Système d'apprentissage avec 120+ cartes
- **Gestion des utilisateurs** : Profils et rôles
- **Base de données** : Persistance des données

### ❌ Fonctionnalités Supprimées
- **Chat en temps réel** : Supprimé
- **WebSocket** : Supprimé
- **Messages instantanés** : Supprimé
- **Notifications temps réel** : Supprimé

## 🔧 Commandes de Démarrage

```bash
# Démarrer l'API
npm run api

# Démarrer le frontend
npm run dev

# Initialiser la base de données
npm run db:seed

# Ajouter des flashcards complètes (120+ flashcards)
npm run db:flashcards
```

## 📊 Structure de la Base de Données

### Table Users
- `id` : Identifiant unique
- `email` : Email de connexion
- `password` : Mot de passe hashé
- `firstName` : Prénom
- `lastName` : Nom
- `role` : Rôle (TUTOR, STUDENT, ADMIN)
- `userClass` : Classe (pour les étudiants)
- `section` : Section
- `department` : Département

### Table Flashcards
- `id` : Identifiant unique
- `question` : Question de la flashcard
- `answer` : Réponse à la question
- `subjectId` : ID de la matière
- `userId` : ID de l'utilisateur créateur
- `difficulty` : Niveau de difficulté (easy, medium, hard)
- `createdAt` : Date de création
- `updatedAt` : Date de modification

### Table ForumPosts (si implémentée)
- `id` : Identifiant unique
- `title` : Titre du post
- `content` : Contenu du post
- `authorId` : ID de l'auteur
- `createdAt` : Date de création
- `updatedAt` : Date de modification

## 📚 Matières et Flashcards Disponibles

### 🎓 Matières Terminale
- **Mathématiques** : 101 flashcards (dérivées, équations, fonctions, etc.)
- **Physique** : 74 flashcards (lois de Newton, énergie, électricité, etc.)
- **Chimie** : 47 flashcards (acides/bases, réactions, pH, etc.)
- **Biologie** : 47 flashcards (photosynthèse, ADN, évolution, etc.)
- **SVT** : 10 flashcards (écosystème, biodiversité, tectonique, etc.)
- **LLA** : 10 flashcards (littérature, mouvements, analyse, etc.)
- **SES** : 10 flashcards (économie, sociologie, politique, etc.)
- **SMP** : 10 flashcards (vecteurs, mécanique quantique, etc.)

### 🎒 Matières 9ème
- **Français** : 74 flashcards (grammaire, littérature, figures de style, etc.)
- **Histoire-Géographie** : 37 flashcards (dates importantes, géographie, etc.)
- **Anglais** : 20 flashcards (vocabulaire, grammaire, conjugaison, etc.)
- **Sciences** : 20 flashcards (physique, chimie, biologie de base, etc.)

### 📊 Statistiques
- **Total** : 460+ flashcards
- **Niveaux de difficulté** : Easy, Medium, Hard
- **Créées par** : Utilisateur admin
- **Mise à jour** : Via `npm run db:flashcards`

## 🎯 Objectifs du Système Simplifié

1. **Simplicité** : Moins de complexité, plus facile à maintenir
2. **Stabilité** : Pas de problèmes de WebSocket ou de chat en temps réel
3. **Forum Centralisé** : Toute la communication passe par le forum
4. **Base de Données** : Toutes les données sont persistantes
5. **Moins de Bugs** : Moins de composants = moins de problèmes
6. **Apprentissage** : Système de flashcards complet pour toutes les matières

## 🚨 Dépannage

### Problème : "Failed to fetch"
- Vérifiez que l'API est démarrée (port 3001)
- Vérifiez que le frontend est démarré (port 8080)
- Vérifiez la connexion à la base de données

### Problème : Erreur de connexion
- Vérifiez les identifiants de connexion
- Vérifiez que la base de données est initialisée
- Redémarrez les services si nécessaire

### Problème : Forum ne fonctionne pas
- Vérifiez que vous êtes connecté
- Vérifiez que la base de données contient des données de test
- Vérifiez les logs de l'API pour les erreurs

