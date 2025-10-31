# 🎓 Comment Accéder à la Fonctionnalité Tuteurs

## ✅ Configuration Terminée

Tout est prêt ! Voici comment accéder à la nouvelle fonctionnalité :

---

## 🚀 Étapes pour Tester

### **1. Connexion**

**Se connecter en tant qu'étudiant :**
```
Email: student@tyala.com
Mot de passe: 123456
```

OU

**Via le lien direct :**
```
http://localhost:5173/login
```

---

### **2. Accéder aux Tuteurs**

**Méthode 1 : Navigation**
```
1. Une fois connecté
2. Cliquez sur l'onglet "Tuteurs" dans la barre de navigation
```

**Méthode 2 : URL Directe**
```
http://localhost:5173/tutors
```

---

## 🎨 Interface de Recherche

Vous verrez :

```
┌────────────────────────────────────────────────┐
│  🎓 Trouver un Tuteur                          │
│  Découvrez nos tuteurs qualifiés...            │
├────────────────────────────────────────────────┤
│  🔍 Rechercher...          [Filtres ▼]         │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │  👤 Jean     │  │  👤 Marie    │           │
│  │  Dupont      │  │  Martin      │           │
│  │  ⭐ 4.8 (12) │  │  ⭐ 4.9 (24) │           │
│  │  📚 Maths    │  │  📚 Physique │           │
│  │  💰 3000 XAF │  │  💰 5000 XAF │           │
│  │  [✉] [📅]   │  │  [✉] [📅]   │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 🔍 Fonctionnalités de Recherche

### **Barre de Recherche**
Tapez :
- Nom du tuteur : "Jean"
- Matière : "Mathématiques"
- Mot-clé : "algèbre"

### **Filtres Avancés**
Cliquez sur "Filtres" pour voir :
- **Matière** : Toutes les matières disponibles
- **Prix max** : Ex: 5000 XAF/heure
- **Note minimale** : 4+, 4.5+, 4.8+ étoiles
- **Disponible maintenant** : Checkbox

---

## 🎯 Actions Disponibles

### **Sur chaque carte tuteur :**

1. **Voir le Profil**
   - Cliquez n'importe où sur la carte
   - → Profil détaillé (à venir)

2. **Envoyer un Message**
   - Cliquez sur l'icône 💬
   - → Messagerie directe (à venir)

3. **Réserver une Session**
   - Cliquez sur le bouton 📅 "Réserver"
   - → Formulaire de réservation (à venir)

---

## 🧪 Créer des Données de Test

### **Devenir Tuteur (via API)**

Pour tester avec de vrais tuteurs, utilisez l'API :

**1. Connexion pour obtenir le token :**
```bash
curl -X POST http://localhost:8081/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@tyala.com",
    "password": "123456"
  }'
```

**2. Créer un profil tuteur :**
```bash
curl -X POST http://localhost:8081/api/tutors/become-tutor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "experience": 5,
    "bio": "Professeur de mathématiques avec 5 ans d'\''expérience. Spécialisé dans la préparation au BAC.",
    "hourlyRate": 3000,
    "subjects": [1, 2],
    "specialties": ["Algèbre", "Géométrie", "Analyse"],
    "languages": "Français, Anglais",
    "education": "Master en Mathématiques - Université de Yaoundé",
    "certifications": "Agrégation de Mathématiques"
  }'
```

**3. Mettre le statut en ligne :**
```bash
curl -X PUT http://localhost:8081/api/tutors/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "isOnline": true
  }'
```

---

## 📊 Endpoints API Disponibles

### **Recherche**
```
GET /api/tutors/search
    ?subject=Mathématiques
    &minRating=4.5
    &maxPrice=5000
    &isAvailable=true
```

### **Profil**
```
GET /api/tutors/:id
```

### **Réservation**
```
POST /api/sessions/book
{
  "tutorId": 1,
  "subject": "Mathématiques",
  "duration": 60,
  "scheduledAt": "2025-11-01T14:00:00",
  "notes": "Aide pour les équations du second degré"
}
```

### **Messages**
```
POST /api/messages/send
{
  "tutorId": 1,
  "content": "Bonjour, je voudrais réserver une session..."
}
```

---

## 🎨 Personnalisation

### **Mode Sombre**
- Toggle en haut à droite de la barre de navigation
- Toute l'interface s'adapte automatiquement

### **Responsive**
- Testez sur mobile : `cmd + option + M` (Chrome DevTools)
- Interface optimisée pour tous les écrans

---

## 🐛 Résolution de Problèmes

### **Page blanche ?**
```bash
# Vérifier que le serveur tourne
curl http://localhost:8081/api/health

# Si non, redémarrer
cd /Users/munger/study-swift-pro
npx tsx src/api/server.ts &
```

### **"Aucun tuteur trouvé" ?**
C'est normal ! La base est vide. Créez un tuteur via l'API (voir ci-dessus).

### **Erreur 401 Unauthorized ?**
Vous devez être connecté. Allez sur `/login` d'abord.

---

## 🔄 Workflow Complet

```
1. 👤 Se connecter
   http://localhost:5173/login
   
2. 🎓 Aller sur Tuteurs
   Navbar → Tuteurs
   OU http://localhost:5173/tutors
   
3. 🔍 Rechercher
   - Taper "Mathématiques"
   - Ajouter filtres (prix, note)
   - Cliquer sur un tuteur
   
4. 📅 Réserver (À venir)
   - Choisir date/heure
   - Confirmer
   - Payer
   
5. 💬 Échanger
   - Messagerie directe
   - Recevoir notifications
   
6. ⭐ Noter
   - Après la session
   - Laisser un avis
```

---

## 📱 Navigation Complète

**Menu Étudiant :**
```
┌─────────────────────────────────────┐
│  Tyala                        🌙 👤 │
├─────────────────────────────────────┤
│  Accueil                            │
│  Dashboard                          │
│  Flashcards                         │
│  Examens                            │
│  👉 Tuteurs ✨ (NOUVEAU)            │
│  Forum                              │
└─────────────────────────────────────┘
```

---

## 🎯 Prochaines Étapes

Pages à créer pour compléter le système :

1. **TutorProfile** (`/tutors/:id`)
   - Profil complet du tuteur
   - Avis des étudiants
   - Disponibilités
   - Groupes actifs

2. **BookSession** (`/tutors/:id/book`)
   - Calendrier de réservation
   - Sélection durée
   - Calcul prix
   - Paiement

3. **TutorMessages** (`/tutors/:id/message`)
   - Chat en temps réel
   - Historique
   - Notifications

4. **TutorDashboard** (`/tutor/dashboard`)
   - Gestion sessions
   - Créer groupes
   - Statistiques revenus

---

## ✅ Checklist de Test

- [ ] Se connecter comme étudiant
- [ ] Aller sur /tutors
- [ ] Voir l'interface de recherche
- [ ] Utiliser la barre de recherche
- [ ] Ouvrir les filtres
- [ ] Tester le mode sombre
- [ ] Tester responsive (mobile)
- [ ] Créer un tuteur via API
- [ ] Voir le tuteur apparaître
- [ ] Cliquer sur une carte tuteur

---

## 🎉 Résultat

Vous avez maintenant :
- ✅ Interface de recherche fonctionnelle
- ✅ Filtres avancés
- ✅ Design moderne et responsive
- ✅ Mode clair/sombre
- ✅ API backend complète
- ✅ Base pour toutes les fonctionnalités

**Prêt à développer le reste du système !** 🚀

---

*Guide créé le ${new Date().toLocaleDateString('fr-FR')}*
*Version 1.0 - Système de Tutorat Tyala*



