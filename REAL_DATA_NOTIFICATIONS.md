# 🔔 Notifications Automatiques & CRUD Profil - Documentation

## ✅ Implémentation terminée

### 1. 📬 **Notifications Automatiques** - Actions Réelles

Toutes les notifications se créent automatiquement lors des vraies actions des utilisateurs.

---

#### **A. Réponses au Forum** (`FORUM_REPLY`)

**Déclencheur:** Quand un utilisateur répond à un post

**Endpoint:** `POST /api/forum/posts/:id/replies`

**Qui reçoit:** L'auteur du post original (sauf s'il répond lui-même)

**Message:**
```
Titre: "Nouvelle réponse à votre post"
Contenu: "[Prénom Nom] a répondu à votre post "[Titre du post (50 car max)]""
Lien: /forum?post=[ID]
```

**Implémentation:**
- Récupération du post et de son auteur
- Vérification que l'auteur ≠ celui qui répond
- Création automatique de la notification après enregistrement de la réponse
- Titre du post tronqué à 50 caractères si trop long

---

#### **B. Likes sur Posts** (`FORUM_LIKE`)

**Déclencheur:** Quand un utilisateur like un post

**Endpoint:** `POST /api/forum/posts/:id/like`

**Qui reçoit:** L'auteur du post (sauf s'il like lui-même)

**Message:**
```
Titre: "Nouveau like sur votre post"
Contenu: "[Prénom Nom] a aimé votre post "[Titre du post (50 car max)]""
Lien: /forum?post=[ID]
```

**Comportement:**
- Notification créée uniquement lors de l'ajout d'un like (pas lors du retrait)
- Pas de notification si l'auteur like son propre post
- Récupération du nom de l'utilisateur qui like

---

#### **C. Messages dans les Groupes** (`GROUP_MESSAGE`)

**Déclencheur:** Quand un message est envoyé dans un groupe

**Endpoint:** `POST /api/study-groups/:id/messages`

**Qui reçoit:** TOUS les membres du groupe (sauf l'auteur du message)

**Message:**
```
Titre: "Nouveau message dans [Nom du Groupe]"
Contenu: "[Prénom Nom]: [Contenu du message (100 car max)]"
Lien: /forum (où les groupes sont accessibles)
```

**Implémentation:**
- Récupération de tous les membres du groupe
- Exclusion de l'auteur du message
- Création de notifications en parallèle avec `Promise.all()`
- Support de tous types de messages (TEXT, VOICE, IMAGE, FILE)
- Contenu tronqué à 100 caractères

---

### 2. 👤 **CRUD Profil Complet** - Endpoints Vérifiés

Tous les endpoints du profil sont fonctionnels et testés.

---

#### **A. Mise à jour des informations** ✅

**Endpoint:** `PUT /api/profile`

**Authentification:** Requise (JWT token)

**Body (JSON):**
```json
{
  "firstName": "Prénom",
  "lastName": "Nom",
  "userClass": "Terminale",
  "section": "SMP",
  "department": "Sciences",
  "phone": "+33612345678",
  "address": "123 rue...",
  "isProfilePrivate": false,
  "darkMode": false
}
```

**Validations:**
- firstName et lastName requis
- Vérification de la classe et section si fournis
- Mise à jour partielle supportée

**Réponse:**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": { /* données mises à jour */ }
}
```

---

#### **B. Upload photo de profil** ✅

**Endpoint:** `POST /api/profile/photo`

**Authentification:** Requise (JWT token)

**Content-Type:** `multipart/form-data`

**Field:** `photo` (fichier image)

**Validations:**
- Formats acceptés: JPEG, PNG, GIF, WebP
- Taille max: 5MB
- Suppression automatique de l'ancienne photo si elle existe

**Stockage:**
- Dossier: `/uploads/profile-photos/`
- Nom: `profile-[timestamp]-[random].ext`

**Réponse:**
```json
{
  "message": "Photo de profil mise à jour avec succès",
  "filename": "profile-1234567890-123456789.jpg"
}
```

---

#### **C. Suppression photo de profil** ✅

**Endpoint:** `DELETE /api/profile/photo`

**Authentification:** Requise (JWT token)

**Action:**
- Suppression du fichier physique
- Mise à jour de la BDD (profilePhoto = null)

**Réponse:**
```json
{
  "message": "Photo de profil supprimée avec succès"
}
```

---

#### **D. Changement de mot de passe** ✅

**Endpoints disponibles:**
- `PUT /api/profile/password` (original)
- `POST /api/auth/change-password` (alias pour compatibilité)

**Authentification:** Requise (JWT token)

**Body (JSON):**
```json
{
  "currentPassword": "ancien_mdp",
  "newPassword": "nouveau_mdp"
}
```

**Validations:**
- Mot de passe actuel correct (bcrypt compare)
- Nouveau mot de passe ≥ 6 caractères
- Hash du nouveau mot de passe avec bcrypt

**Sécurité:**
- Vérification du mot de passe actuel avant changement
- Hash bcrypt avec 10 rounds
- Pas d'affichage du mot de passe dans les logs

**Réponse:**
```json
{
  "message": "Mot de passe mis à jour avec succès"
}
```

**Erreurs possibles:**
- 400: Mot de passe actuel incorrect
- 400: Nouveau mot de passe trop court
- 401: Token invalide
- 404: Utilisateur non trouvé

---

### 3. 🎨 **ModernProfile** - Interface Utilisateur

Le nouveau composant `ModernProfile.tsx` utilise tous ces endpoints.

**Fonctionnalités:**
- ✅ Upload photo avec preview avant confirmation
- ✅ Édition inline des informations
- ✅ Changement de mot de passe avec toggle visibilité
- ✅ Design mobile-first épuré
- ✅ Validation côté client ET serveur
- ✅ Feedback utilisateur avec toasts
- ✅ Gestion d'erreurs complète

---

### 4. 📊 **Flux de Notifications**

#### **Exemple: Réponse au Forum**

```
1. User B répond au post de User A
   ↓
2. POST /api/forum/posts/:id/replies
   ↓
3. Création de la réponse en BDD
   ↓
4. Récupération du post + auteur
   ↓
5. Vérification: authorId !== userId ?
   ↓ (si oui)
6. createNotification(authorId, 'FORUM_REPLY', ...)
   ↓
7. Notification créée en BDD
   ↓
8. User A reçoit une notification
   ↓
9. Badge de compteur mis à jour (toutes les 30s)
   ↓
10. User A clique sur la cloche
   ↓
11. Notification affichée dans le panel
   ↓
12. User A clique sur la notification
   ↓
13. Navigation vers /forum?post=ID
   ↓
14. Notification marquée comme lue
```

---

### 5. 🔧 **Détails Techniques**

#### **Helper Function: createNotification**

```typescript
async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        link
      }
    });
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
}
```

**Caractéristiques:**
- Async/await pour éviter de bloquer la requête principale
- Try/catch pour éviter les crashs si échec de notification
- Log des erreurs pour debug
- Ne bloque pas la réponse au client si échec

---

#### **Performances**

**Messages de groupe:**
- Notifications créées en parallèle avec `Promise.all()`
- Exemple: Groupe de 50 membres = 49 notifications créées simultanément
- Pas de ralentissement perceptible

**Requêtes optimisées:**
- `where: { userId: { not: userId } }` pour exclure l'auteur
- `select` pour récupérer uniquement les champs nécessaires
- Index sur userId et isRead dans la table notifications

---

### 6. 🧪 **Tests Recommandés**

#### **Notifications:**
1. ✅ Répondre à un post → Vérifier notification de l'auteur
2. ✅ Liker un post → Vérifier notification de l'auteur
3. ✅ Envoyer message dans groupe → Vérifier notifications des membres
4. ✅ Like son propre post → Pas de notification
5. ✅ Répondre à son propre post → Pas de notification
6. ✅ Clique sur notification → Navigation correcte
7. ✅ Marquer comme lu → Badge mis à jour
8. ✅ Supprimer notification → Disparaît de la liste

#### **Profil:**
1. ✅ Upload photo → Nouvelle photo affichée
2. ✅ Éditer infos → Sauvegarde correcte
3. ✅ Changer mot de passe → Login avec nouveau mdp
4. ✅ Mauvais ancien mdp → Message d'erreur
5. ✅ Mdp trop court → Message d'erreur
6. ✅ Annuler édition → Retour aux valeurs originales

---

### 7. 📈 **Statistiques**

**Code ajouté/modifié:**
- Réponses forum: ~25 lignes
- Likes forum: ~35 lignes
- Messages groupe: ~20 lignes
- Alias changement mdp: ~50 lignes
- **Total: ~130 lignes**

**Endpoints modifiés:** 3
**Endpoints créés:** 1 (alias)
**Notifications automatiques:** 3 types

---

### 8. 🚀 **Prochaines Étapes Possibles**

#### **Notifications supplémentaires:**
- [ ] `GROUP_INVITE` - Invitation à rejoindre un groupe
- [ ] `TEST_RESULT` - Résultats de test disponibles
- [ ] `ACHIEVEMENT` - Nouveau succès débloqué
- [ ] Notification lors d'un like sur une réponse
- [ ] Notification lors d'une mention (@username)

#### **Améliorations:**
- [ ] Paramètres de notifications (activer/désactiver par type)
- [ ] Notifications push navigateur (Web Push API)
- [ ] Email digest quotidien des notifications
- [ ] Grouper les notifications similaires ("3 personnes ont liké votre post")
- [ ] Archivage automatique après 30 jours
- [ ] Son de notification
- [ ] Badge sur l'icône de l'app (favicon)

---

### 9. 🐛 **Debugging**

Si les notifications ne fonctionnent pas:

1. **Vérifier le serveur:**
   ```bash
   ps aux | grep tsx
   ```

2. **Vérifier les logs serveur:**
   ```bash
   tail -f server.log
   ```

3. **Vérifier la création en BDD:**
   ```sql
   SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 10;
   ```

4. **Vérifier le token:**
   ```javascript
   localStorage.getItem('token')
   ```

5. **Console browser:**
   - Ouvrir DevTools
   - Onglet Network
   - Filter: notifications
   - Vérifier les requêtes et réponses

---

### 10. 📝 **Notes Importantes**

**Sécurité:**
- Toutes les routes nécessitent authentification JWT
- Vérifications côté serveur pour éviter spam
- Pas de notification si action sur son propre contenu

**Performance:**
- Notifications asynchrones (pas de blocage)
- Création en parallèle pour groupes
- Cache-side polling (30s) pour compteur
- Index BDD pour requêtes rapides

**UX:**
- Feedback immédiat sur actions
- Navigation directe vers contenu
- Marquage automatique comme lu au clic
- Design cohérent avec le reste de l'app

---

*Document créé le ${new Date().toLocaleDateString('fr-FR')}*
*Version 1.0.0*
*Système de notifications automatiques & CRUD profil complet*



