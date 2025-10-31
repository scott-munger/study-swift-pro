# Système de Messagerie Tuteur-Élève

Ce document détaille le nouveau système de messagerie intégré dans StudySwift Pro, permettant aux étudiants de communiquer directement avec les tuteurs et de gérer leurs conversations depuis un espace centralisé.

## 🎯 Fonctionnalités Principales

### 1. Page Messages (/messages)
Une interface style WhatsApp qui regroupe toutes les conversations :
- **Filtres intelligents** : Tous / Tuteurs / Groupes
- **Recherche** : Trouver rapidement une conversation
- **Badges de notifications** : Affichage du nombre de messages non lus
- **Tri automatique** : Les conversations les plus récentes en premier
- **Statut en ligne** : Indicateur en temps réel pour les tuteurs
- **Aperçu du dernier message** : Vue d'ensemble rapide

### 2. Chat Bidirectionnel 1-à-1
Communication directe entre étudiants et tuteurs avec :
- **Messages texte** : Messagerie instantanée classique
- **Messages vocaux** : Enregistrement et lecture audio
- **Partage de fichiers** : Images, documents, PDFs
- **Accusés de lecture** : Statut "Lu" / "Non lu"
- **Horodatage** : Affichage de l'heure d'envoi
- **Indicateur de frappe** : Notification en temps réel

### 3. Profil Tuteur Complet
Les tuteurs disposent d'un profil enrichi :
- **Photo de profil** : Visible dans les recherches et conversations
- **Biographie** : Présentation personnalisée
- **Expérience** : Années d'expérience
- **Tarif horaire** : Prix affiché en HTG
- **Formation** : Parcours académique
- **Certifications** : Diplômes et qualifications
- **Langues parlées** : Liste des langues maîtrisées
- **Matières enseignées** : Sélection multiple
- **Statistiques** : Nombre de sessions, notes, avis

### 4. Formulaire d'Inscription Tuteur (/become-tutor)
Interface complète pour devenir tuteur :
- **Upload photo de profil** : Avec prévisualisation
- **Formulaire détaillé** : Tous les champs du profil
- **Sélection des matières** : Interface avec checkboxes
- **Validation en temps réel** : Vérification des données
- **Mode édition** : Mise à jour du profil existant
- **Responsive** : Adapté mobile et desktop

### 5. Intégration depuis la Recherche de Tuteurs
Bouton "Contacter" amélioré :
- **Création automatique de conversation** : Un clic pour commencer
- **Redirection vers le chat** : Ouverture directe de la conversation
- **Gestion des états** : Loading, erreurs, succès
- **Pas de duplication** : Récupération de la conversation existante

## 📊 Architecture Base de Données

### Nouveaux Modèles Prisma

#### Conversation
```prisma
model Conversation {
  id              Int      @id @default(autoincrement())
  studentId       Int      // ID de l'étudiant
  tutorId         Int      // ID du tuteur
  lastMessageAt   DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  messages        DirectMessage[]

  @@unique([studentId, tutorId])
}
```

#### DirectMessage (Amélioré)
```prisma
model DirectMessage {
  id            Int          @id @default(autoincrement())
  conversationId Int
  senderId      Int          
  receiverId    Int          
  content       String       @db.Text
  messageType   MessageType  @default(TEXT)
  audioUrl      String?      // Messages vocaux
  fileUrl       String?      // Fichiers
  fileName      String?      
  fileType      String?      
  fileSize      Int?         
  isRead        Boolean      @default(false)
  createdAt     DateTime     @default(now())
  conversation  Conversation @relation(...)
}
```

## 🔌 Routes API

### Conversations
- `GET /api/conversations` - Liste des conversations de l'utilisateur
- `POST /api/conversations` - Créer une nouvelle conversation
- `GET /api/conversations/:id/messages` - Messages d'une conversation
- `POST /api/conversations/:id/messages` - Envoyer un message texte
- `POST /api/conversations/:id/messages/audio` - Envoyer un message vocal
- `POST /api/conversations/:id/messages/file` - Envoyer un fichier
- `PUT /api/conversations/:id/mark-read` - Marquer comme lu

### Profil Tuteur
- `POST /api/tutors/register` - S'inscrire comme tuteur
- `GET /api/tutors/profile` - Récupérer son profil tuteur
- `PUT /api/tutors/profile` - Mettre à jour son profil
- `GET /api/tutors/search` - Rechercher des tuteurs (existante)

## 🎨 Composants React

### Pages
- `Messages.tsx` - Page principale des messages
- `BecomeTutor.tsx` - Formulaire d'inscription tuteur
- `FindTutors.tsx` - Recherche de tuteurs (mis à jour)

### Composants UI
- `DirectChatDialog.tsx` - Dialogue de chat 1-à-1
- `TutorChat.tsx` - Chat de groupe (existant, utilisé pour les groupes d'étude)

## 🚀 Comment Utiliser

### Pour les Étudiants

1. **Trouver un tuteur** :
   - Aller sur `/tutors`
   - Parcourir les tuteurs disponibles
   - Cliquer sur "Contacter" pour commencer une conversation

2. **Gérer les conversations** :
   - Accéder à `/messages`
   - Utiliser les filtres pour trier
   - Cliquer sur une conversation pour ouvrir le chat
   - Envoyer messages texte, vocaux ou fichiers

### Pour les Tuteurs

1. **S'inscrire comme tuteur** :
   - Aller sur `/become-tutor`
   - Remplir le formulaire complet
   - Sélectionner les matières à enseigner
   - Upload photo de profil
   - Soumettre la candidature

2. **Mettre à jour le profil** :
   - Même page `/become-tutor`
   - Les données existantes sont pré-remplies
   - Modifier et enregistrer

3. **Répondre aux étudiants** :
   - Accéder à `/messages`
   - Voir toutes les conversations avec les étudiants
   - Répondre en temps réel

## 🔒 Sécurité

- **Authentification JWT** : Toutes les routes protégées
- **Vérification des permissions** : Accès limité aux participants
- **Upload sécurisé** : Validation des types de fichiers
- **Taille maximale** : 10 MB par fichier
- **Nettoyage des données** : Validation côté serveur

## 🌐 Responsive Design

- **Mobile-first** : Interface optimisée pour mobiles
- **Tablettes** : Layout adapté pour tablettes
- **Desktop** : Affichage en colonnes pour grands écrans
- **Dark mode** : Support du mode sombre

## 📱 PWA Support

Le système de messagerie est entièrement compatible avec la PWA :
- Fonctionne hors ligne (mode lecture)
- Notifications push (à venir)
- Installation sur mobile
- Cache intelligent

## 🔄 Mises à Jour en Temps Réel

Actuellement via polling (3 secondes) :
- Auto-refresh des messages
- Mise à jour du statut en ligne
- Compteur de messages non lus

**À venir** : WebSocket pour notifications instantanées

## 🧪 Tests

### Migration de la Base de Données
```bash
# Générer la migration
npx prisma migrate dev --name add_conversations

# Appliquer la migration
npx prisma migrate deploy
```

### Démarrage du Serveur
```bash
# Mode développement
npm run dev

# Le serveur démarre sur http://localhost:8081
```

### Test des Fonctionnalités
1. Créer un compte étudiant
2. Créer un compte tuteur (via `/become-tutor`)
3. Rechercher le tuteur depuis le compte étudiant
4. Cliquer sur "Contacter"
5. Envoyer des messages
6. Vérifier la réception côté tuteur

## 🐛 Dépannage

### Erreur "Conversation non trouvée"
- Vérifier que le tuteur existe dans la DB
- Vérifier que l'étudiant est authentifié
- Vérifier les permissions

### Messages ne se chargent pas
- Vérifier la connexion à la DB
- Vérifier le token d'authentification
- Consulter les logs serveur

### Upload de fichiers échoue
- Vérifier le dossier `uploads/` existe
- Vérifier les permissions d'écriture
- Vérifier la taille du fichier (max 10 MB)

## 📈 Améliorations Futures

- [ ] WebSocket pour temps réel
- [ ] Notifications push
- [ ] Appels vidéo intégrés
- [ ] Planification de sessions
- [ ] Système de paiement
- [ ] Calendrier de disponibilités
- [ ] Partage d'écran
- [ ] Tableau blanc collaboratif
- [ ] Historique de paiements
- [ ] Système d'évaluation après session

## 📝 Notes de Migration

Si vous mettez à jour depuis une version antérieure :

1. **Sauvegarder la base de données**
2. **Générer la migration** : `npx prisma migrate dev --name add_conversations`
3. **Vérifier le schéma** : Les modèles Conversation et DirectMessage
4. **Redémarrer le serveur**
5. **Tester les fonctionnalités**

## 🤝 Contribution

Pour contribuer à ce système :
1. Fork le projet
2. Créer une branche feature
3. Tester localement
4. Soumettre une PR

## 📧 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation API

---

**Version** : 2.0.0  
**Date** : Octobre 2025  
**Auteur** : Équipe StudySwift Pro

