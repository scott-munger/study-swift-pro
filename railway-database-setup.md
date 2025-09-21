# 🔧 Configuration Base de Données Railway

## 🚨 Problème identifié
La base de données Railway n'est pas initialisée avec les données de test.

## 🔧 Solutions

### 1. Vérifier les variables d'environnement Railway
- Aller sur Railway Dashboard
- Cliquer sur votre projet "charismatic-freedom"
- Aller dans **Settings** → **Variables**
- Vérifier que ces variables existent :
  ```
  DATABASE_URL=mysql://username:password@host:port/database
  JWT_SECRET=your-secret-key
  NODE_ENV=production
  ```

### 2. Initialiser la base de données
Si la base de données est vide, vous devez :
- Créer les tables
- Insérer les données de test
- Créer les comptes par défaut

### 3. Comptes de test à créer
- **Admin** : admin@test.com / admin123
- **Étudiant** : etudiant@test.com / etudiant123  
- **Tuteur** : tuteur@test.com / tuteur123

## 🎯 Actions à faire
1. Vérifier les variables d'environnement Railway
2. Initialiser la base de données
3. Tester la connexion
4. Vérifier que les comptes fonctionnent

## 📝 Notes
- Railway utilise MySQL par défaut
- Les variables d'environnement doivent être configurées
- La base de données doit être initialisée avec Prisma
