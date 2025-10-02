# 🧪 GUIDE DE TEST CRUD FINAL

## 🎯 **OBJECTIF**
Valider que le système CRUD est **100% fonctionnel** pour toutes les entités (flashcards, utilisateurs, matières) avec des connexions complètes à la base de données.

---

## 🚀 **PRÉPARATION**

### **1. Démarrage du Système**
```bash
# Terminal 1 - API
cd /Users/munger/study-swift-pro
npm run api

# Terminal 2 - Frontend
cd /Users/munger/study-swift-pro
npm run dev
```

### **2. Vérification**
```bash
# API
curl http://localhost:8081/api/health
# Résultat attendu: {"status":"OK","message":"Serveur en cours d'exécution"}

# Frontend
curl -I http://localhost:8080
# Résultat attendu: HTTP/1.1 200 OK
```

---

## 🔐 **AUTHENTIFICATION**

### **Connexion Admin**
```bash
# Obtenir le token admin
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@test.com","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"
```

---

## 📝 **TEST 1: CRUD FLASHCARDS**

### **1.1 Création**
```bash
echo "=== CRÉATION FLASHCARD ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test CRUD Flashcard",
    "answer": "Réponse de test",
    "subjectId": 25,
    "difficulty": "EASY"
  }' \
  http://localhost:8081/api/admin/flashcards | jq -r '.flashcard.id'
```
**Résultat attendu** : ID de la flashcard créée (ex: 903)

### **1.2 Lecture (Toutes)**
```bash
echo "=== LECTURE TOUTES FLASHCARDS ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/flashcards | jq '.flashcards | length'
```
**Résultat attendu** : 313+ flashcards

### **1.3 Lecture (Individuelle)**
```bash
echo "=== LECTURE FLASHCARD INDIVIDUELLE ==="
FLASHCARD_ID=903  # Remplacer par l'ID créé
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/flashcards/$FLASHCARD_ID | jq '.question'
```
**Résultat attendu** : "Test CRUD Flashcard"

### **1.4 Modification**
```bash
echo "=== MODIFICATION FLASHCARD ==="
curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Flashcard Modifiée",
    "answer": "Nouvelle réponse",
    "difficulty": "MEDIUM"
  }' \
  http://localhost:8081/api/flashcards/$FLASHCARD_ID | jq '.question'
```
**Résultat attendu** : "Flashcard Modifiée"

### **1.5 Suppression**
```bash
echo "=== SUPPRESSION FLASHCARD ==="
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/flashcards/$FLASHCARD_ID
```
**Résultat attendu** : {"message":"Flashcard supprimée avec succès"}

---

## 👥 **TEST 2: CRUD UTILISATEURS**

### **2.1 Création**
```bash
echo "=== CRÉATION UTILISATEUR ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-crud@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "CRUD",
    "role": "STUDENT",
    "userClass": "Terminale",
    "section": "SMP"
  }' \
  http://localhost:8081/api/admin/users | jq -r '.user.id'
```
**Résultat attendu** : ID de l'utilisateur créé (ex: 99)

### **2.2 Lecture (Tous)**
```bash
echo "=== LECTURE TOUS UTILISATEURS ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/users | jq 'length'
```
**Résultat attendu** : 23+ utilisateurs

### **2.3 Lecture (Individuel)**
```bash
echo "=== LECTURE UTILISATEUR INDIVIDUEL ==="
USER_ID=99  # Remplacer par l'ID créé
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/users/$USER_ID | jq '.email'
```
**Résultat attendu** : "test-crud@example.com"

### **2.4 Modification**
```bash
echo "=== MODIFICATION UTILISATEUR ==="
curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Utilisateur",
    "lastName": "Modifié",
    "userClass": "9ème"
  }' \
  http://localhost:8081/api/admin/users/$USER_ID | jq '.user.firstName'
```
**Résultat attendu** : "Utilisateur"

### **2.5 Suppression**
```bash
echo "=== SUPPRESSION UTILISATEUR ==="
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/users/$USER_ID
```
**Résultat attendu** : {"message":"Utilisateur supprimé avec succès"}

---

## 📚 **TEST 3: CRUD MATIÈRES**

### **3.1 Création**
```bash
echo "=== CRÉATION MATIÈRE ==="
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test CRUD Matière",
    "level": "9ème",
    "description": "Matière de test pour CRUD"
  }' \
  http://localhost:8081/api/admin/subjects | jq -r '.subject.id'
```
**Résultat attendu** : ID de la matière créée (ex: 53)

### **3.2 Lecture (Toutes)**
```bash
echo "=== LECTURE TOUTES MATIÈRES ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/subjects | jq 'length'
```
**Résultat attendu** : 24+ matières

### **3.3 Modification**
```bash
echo "=== MODIFICATION MATIÈRE ==="
SUBJECT_ID=53  # Remplacer par l'ID créé
curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matière Modifiée",
    "level": "Terminale",
    "description": "Description modifiée"
  }' \
  http://localhost:8081/api/admin/subjects/$SUBJECT_ID | jq '.subject.name'
```
**Résultat attendu** : "Matière Modifiée"

### **3.4 Suppression**
```bash
echo "=== SUPPRESSION MATIÈRE ==="
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/subjects/$SUBJECT_ID
```
**Résultat attendu** : {"message":"Matière supprimée avec succès"}

---

## 🌐 **TEST 4: INTERFACE WEB**

### **4.1 Test Admin**
1. Ouvrir **http://localhost:8080**
2. Se connecter avec : `admin2@test.com` / `admin123`
3. Aller dans **"Flashcards"** → Vérifier 313+ flashcards
4. Aller dans **"Utilisateurs"** → Vérifier 23+ utilisateurs
5. Aller dans **"Matières"** → Vérifier 24+ matières

### **4.2 Test Étudiant**
1. Se connecter avec : `etudiant@test.com` / `etudiant123`
2. Aller dans **"Flashcards"** → Vérifier 188 flashcards (niveau Terminale)
3. Tester la création d'une flashcard
4. Tester la modification d'une flashcard

### **4.3 Test Navigation**
1. Cliquer sur le logo **"Tyala"** → Vérifier redirection correcte
2. Tester la navigation entre les sections
3. Vérifier que les données sont synchronisées

---

## ✅ **VALIDATION FINALE**

### **Critères de Réussite**
- [ ] **Flashcards** : Création, lecture, modification, suppression ✅
- [ ] **Utilisateurs** : Création, lecture, modification, suppression ✅
- [ ] **Matières** : Création, lecture, modification, suppression ✅
- [ ] **Interface Web** : Toutes les fonctionnalités accessibles ✅
- [ ] **Base de Données** : Toutes les actions connectées ✅

### **Résultat Attendu**
```
🎉 SYSTÈME CRUD 100% FONCTIONNEL
✅ Toutes les entités gérées
✅ Toutes les opérations connectées à la base de données
✅ Interface web opérationnelle
✅ Prêt pour la production
```

---

## 🚨 **DÉPANNAGE**

### **Problèmes Courants**
1. **API non accessible** → Vérifier `npm run api`
2. **Frontend non accessible** → Vérifier `npm run dev`
3. **Erreur d'authentification** → Vérifier les identifiants
4. **Données manquantes** → Exécuter `npm run db:seed`

### **Commandes de Diagnostic**
```bash
# Vérifier les processus
ps aux | grep node

# Vérifier les ports
lsof -i :8080  # Frontend
lsof -i :8081  # API

# Vérifier la base de données
npm run db:seed
```

---

## 🎯 **CONCLUSION**

Si tous les tests passent, le système CRUD est **100% fonctionnel** et prêt pour l'utilisation en production ! 🚀
