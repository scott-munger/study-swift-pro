# 🧪 Guide de Test - Système de Notifications

## 🎯 Vue d'ensemble

Le système de notifications est maintenant implémenté pour :
- ✅ **Forum** : Réponses et likes
- ✅ **Groupes** : Nouveaux messages
- ⚠️ **Messages privés** : Backend prêt (à tester quand implémenté)

---

## 🚀 Préparation

### 1. Lancer l'Application
```bash
# Terminal 1 - Backend
cd /Users/munger/study-swift-pro
npx tsx src/api/server.ts

# Terminal 2 - Frontend
npm run dev
```

### 2. Créer 2 Comptes de Test
- **Compte 1** : `student1@test.com` / `password123`
- **Compte 2** : `student2@test.com` / `password123`

---

## 📝 Test 1 : Notifications Forum (Réponses)

### Étapes
1. **Compte 1** : Se connecter
2. Aller sur **Forum**
3. Créer un nouveau post
4. **Se déconnecter**

5. **Compte 2** : Se connecter
6. Aller sur **Forum**
7. Trouver le post du Compte 1
8. **Répondre** au post
9. **Se déconnecter**

10. **Compte 1** : Se reconnecter
11. ✅ **Vérifier** : Badge rouge sur l'icône 🔔
12. ✅ **Vérifier** : Compteur "1 nouvelle"
13. Cliquer sur l'icône 🔔
14. ✅ **Vérifier** : Notification "Nouvelle réponse à votre post"
15. Cliquer sur la notification
16. ✅ **Vérifier** : Redirige vers le post
17. ✅ **Vérifier** : Notification marquée comme lue

### Résultat Attendu
```
🔔 Badge rouge avec "1"
📋 Notification :
   - Icône : Reply (flèche)
   - Titre : "Nouvelle réponse à votre post"
   - Message : "[Nom] a répondu à votre post..."
   - Point bleu (non lue)
```

---

## ❤️ Test 2 : Notifications Forum (Likes)

### Étapes
1. **Compte 1** : Créer un post
2. **Se déconnecter**

3. **Compte 2** : Se connecter
4. **Liker** le post du Compte 1
5. **Se déconnecter**

6. **Compte 1** : Se reconnecter
7. ✅ **Vérifier** : Badge rouge sur 🔔
8. Cliquer sur 🔔
9. ✅ **Vérifier** : Notification "Nouveau like sur votre post"

### Résultat Attendu
```
🔔 Badge rouge
📋 Notification :
   - Icône : Check (cœur)
   - Titre : "Nouveau like sur votre post"
   - Message : "[Nom] a aimé votre post..."
   - Couleur : Rose
```

---

## 👥 Test 3 : Notifications Groupes

### Étapes
1. **Compte 1** : Se connecter
2. Aller sur **Forum** → **Groupes d'étude**
3. Créer un nouveau groupe
4. Ajouter **Compte 2** comme membre
5. **Se déconnecter**

6. **Compte 2** : Se connecter
7. ✅ **Vérifier** : Notification d'ajout au groupe (si implémenté)

8. **Compte 1** : Se reconnecter
9. Ouvrir le groupe
10. Envoyer un message : "Bonjour tout le monde !"
11. **Se déconnecter**

12. **Compte 2** : Rafraîchir ou attendre 30s
13. ✅ **Vérifier** : Badge rouge sur 🔔
14. Cliquer sur 🔔
15. ✅ **Vérifier** : Notification "Nouveau message dans [Nom du groupe]"
16. Cliquer sur la notification
17. ✅ **Vérifier** : Redirige vers le forum/groupe

### Résultat Attendu
```
🔔 Badge rouge
📋 Notification :
   - Icône : Users (groupe)
   - Titre : "Nouveau message dans [Groupe]"
   - Message : "[Nom]: Bonjour tout le monde !"
   - Couleur : Violet
```

---

## 🔄 Test 4 : Rafraîchissement Automatique

### Étapes
1. **Compte 1** : Se connecter
2. Ouvrir 🔔 → Vide
3. **Ne pas fermer** le dropdown

4. **Compte 2** (autre navigateur/onglet) :
5. Répondre à un post du Compte 1

6. **Compte 1** : Attendre 30 secondes
7. ✅ **Vérifier** : Badge se met à jour automatiquement
8. ✅ **Vérifier** : Nouvelle notification apparaît

### Résultat Attendu
```
⏰ Après 30 secondes max :
   - Badge mis à jour
   - Compteur actualisé
   - Nouvelle notification visible
```

---

## ⚙️ Test 5 : Actions sur les Notifications

### A. Marquer comme Lue
1. Avoir une notification non lue
2. Cliquer sur le bouton ✓ (Check)
3. ✅ **Vérifier** : Point bleu disparaît
4. ✅ **Vérifier** : Fond bleu disparaît
5. ✅ **Vérifier** : Compteur décrémente

### B. Marquer Toutes comme Lues
1. Avoir plusieurs notifications non lues
2. Cliquer sur **"Tout lire"**
3. ✅ **Vérifier** : Toutes marquées comme lues
4. ✅ **Vérifier** : Badge disparaît
5. ✅ **Vérifier** : Toast de confirmation

### C. Supprimer une Notification
1. Cliquer sur le bouton ✕ (X)
2. ✅ **Vérifier** : Notification supprimée
3. ✅ **Vérifier** : Toast de confirmation

### D. Effacer les Lues
1. Avoir des notifications lues et non lues
2. Cliquer sur **"Effacer"**
3. ✅ **Vérifier** : Seules les lues sont supprimées
4. ✅ **Vérifier** : Les non lues restent
5. ✅ **Vérifier** : Toast de confirmation

---

## 🎨 Test 6 : Interface & Design

### Vérifications Visuelles
- [ ] Badge rouge bien visible
- [ ] Compteur lisible (1, 2, 3... 9+)
- [ ] Dropdown s'ouvre en douceur
- [ ] Scroll fonctionne si > 5 notifications
- [ ] Icônes colorées par type
- [ ] Point bleu pour non lues
- [ ] Hover change le fond
- [ ] Animations fluides
- [ ] Responsive (mobile/tablet/desktop)

### Dark Mode
1. Activer le dark mode
2. ✅ **Vérifier** : Fond sombre
3. ✅ **Vérifier** : Texte lisible
4. ✅ **Vérifier** : Couleurs adaptées
5. ✅ **Vérifier** : Hover visible

---

## 🐛 Tests d'Erreur

### A. Pas de Connexion Internet
1. Passer en mode offline (DevTools → Network → Offline)
2. Cliquer sur 🔔
3. ✅ **Vérifier** : Affiche les notifications en cache (si implémenté)
4. ✅ **Vérifier** : Pas d'erreur console

### B. Token Expiré
1. Modifier le token dans localStorage
2. Cliquer sur 🔔
3. ✅ **Vérifier** : Gestion d'erreur appropriée
4. ✅ **Vérifier** : Redirection vers login (si implémenté)

### C. Aucune Notification
1. Compte sans notifications
2. Cliquer sur 🔔
3. ✅ **Vérifier** : Message "Aucune notification"
4. ✅ **Vérifier** : Icône et texte explicatif

---

## 📊 Checklist Complète

### Fonctionnalités
- [ ] Badge avec compteur
- [ ] Dropdown moderne
- [ ] Liste des notifications
- [ ] Rafraîchissement auto (30s)
- [ ] Marquer comme lue
- [ ] Marquer toutes comme lues
- [ ] Supprimer notification
- [ ] Effacer toutes les lues
- [ ] Redirection vers contenu
- [ ] Toast de confirmation

### Types de Notifications
- [ ] Forum - Réponses
- [ ] Forum - Likes
- [ ] Groupes - Messages
- [ ] Messages privés (à implémenter)
- [ ] Mentions (à implémenter)

### Design
- [ ] Badge visible
- [ ] Icônes colorées
- [ ] Point bleu (non lue)
- [ ] Hover effects
- [ ] Responsive
- [ ] Dark mode

### Performance
- [ ] Chargement rapide
- [ ] Scroll fluide
- [ ] Pas de lag
- [ ] Rafraîchissement efficace

---

## 🔍 Vérification Backend

### Endpoints à Tester
```bash
# Token de test
TOKEN="votre_token_ici"

# 1. Récupérer les notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications

# 2. Compteur non lues
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications/unread-count

# 3. Marquer comme lue
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications/1/read

# 4. Marquer toutes comme lues
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications/mark-all-read

# 5. Supprimer une notification
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications/1

# 6. Effacer les lues
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/notifications/clear-read
```

---

## ✅ Résultat Attendu

Si tous les tests passent :
- ✅ Notifications créées automatiquement
- ✅ Badge mis à jour en temps réel
- ✅ Interface moderne et intuitive
- ✅ Actions fonctionnelles
- ✅ Redirections correctes
- ✅ Design responsive et dark mode
- ✅ Performance optimale

**🎉 Le système de notifications est opérationnel !**

---

## 📚 Documentation

Pour plus de détails, consultez :
- `NOTIFICATION_SYSTEM.md` - Documentation complète
- `src/components/ui/NotificationCenter.tsx` - Code du composant
- `src/api/server.ts` - Endpoints API (lignes 2391+, 2455+, 7407+)

---

**Temps de test estimé : 15-20 minutes** ⏱️



