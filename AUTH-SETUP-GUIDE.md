# Guide de Configuration - Authentification (Gratuit)

Ce guide explique comment configurer :
- ✅ Vérification d'email avec Resend (gratuit jusqu'à 3000 emails/mois)
- ✅ Réinitialisation de mot de passe

## 📋 Prérequis

Tous les packages nécessaires sont déjà installés :
- ✅ `resend` (pour les emails)
- ✅ `@react-oauth/google` (pour Google Auth côté client)
- ✅ Routes API déjà implémentées
- ✅ Pages UI déjà créées

## 📧 Configuration Email (Resend - GRATUIT)

### Étape 1 : Créer un compte Resend
1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit (3000 emails/mois)
3. Créez une API key dans le dashboard
4. Vérifiez votre domaine ou utilisez le domaine de test (`onboarding@resend.dev`)

### Étape 2 : Configurer les variables d'environnement
Ajoutez dans votre fichier `.env` (côté serveur) :
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@votre-domaine.com
# OU pour tester sans domaine :
# RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

### Étape 3 : Routes API disponibles
- ✅ `POST /api/auth/verify-email` - Vérifier l'email avec token
- ✅ `POST /api/auth/resend-verification` - Renvoyer l'email de vérification
- ✅ `POST /api/auth/forgot-password` - Demander la réinitialisation
- ✅ `POST /api/auth/reset-password` - Réinitialiser le mot de passe

### Étape 4 : Pages UI disponibles
- ✅ `/verify-email` - Page de vérification d'email
- ✅ `/forgot-password` - Page pour demander reset
- ✅ `/reset-password` - Page pour réinitialiser le mot de passe

## 🔐 Réinitialisation de Mot de Passe

### Fonctionnalités
- ✅ Token sécurisé (expire en 1 heure)
- ✅ Email automatique avec lien de réinitialisation
- ✅ Validation du mot de passe (min 6 caractères)
- ✅ Sécurité : ne révèle pas si l'email existe ou non

### Flux utilisateur
1. L'utilisateur clique sur "Mot de passe oublié" dans `/login`
2. Saisit son email sur `/forgot-password`
3. Reçoit un email avec lien de réinitialisation
4. Clique sur le lien qui mène à `/reset-password?token=...`
5. Définit un nouveau mot de passe

## 📝 Notes importantes

### Sécurité
- ✅ Les tokens expirent après 24h (vérification email) ou 1h (reset password)
- ✅ Les tokens sont générés côté serveur avec vérification
- ✅ Les mots de passe sont hachés avec bcrypt

### Coûts
- **Resend** : Gratuit jusqu'à 3000 emails/mois
- **Pas de coûts supplémentaires** pour cette implémentation

## 🚀 Utilisation

### Vérification Email
1. L'utilisateur s'inscrit
2. Un email est automatiquement envoyé avec un lien
3. L'utilisateur clique sur le lien dans l'email
4. Redirigé vers `/verify-email?token=...`
5. L'email est vérifié automatiquement

### Reset Password
1. L'utilisateur clique sur "Mot de passe oublié" dans `/login`
2. Redirigé vers `/forgot-password`
3. Entre son email et reçoit un email avec lien
4. Clique sur le lien qui mène à `/reset-password?token=...`
5. Définit un nouveau mot de passe

## ✅ Vérification de l'installation

### Vérifier que tout compile :
```bash
npm run build
```

### Variables d'environnement requises :

**Serveur (`.env` à la racine) :**
```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@votre-domaine.com
FRONTEND_URL=http://localhost:5173
```

**Client (`.env` ou `.env.local` à la racine) :**
```env
VITE_API_URL=http://localhost:8081
```

## 🐛 Dépannage

### Emails ne sont pas envoyés
- Vérifiez que `RESEND_API_KEY` est correcte
- Vérifiez les logs du serveur pour les erreurs Resend
- Utilisez `onboarding@resend.dev` pour tester sans domaine vérifié

### Tokens expirés
- Les tokens de vérification expirent après 24h (demander un renvoi)
- Les tokens de reset expirent après 1h (redemander un lien)

