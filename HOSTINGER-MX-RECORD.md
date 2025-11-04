# 📧 Guide MX Record pour Hostinger - Resend

## 🎯 Configuration MX pour Resend avec Hostinger

Vous utilisez **Hostinger** et vous devez ajouter un enregistrement **MX** pour Resend.

---

## ✅ Configuration exacte de l'enregistrement MX

| Champ | Valeur |
|-------|--------|
| **Type** | `MX` |
| **Nom** | `send` |
| **Valeur** | `feedback-smtp.us-east-1.amazonses.com` |
| **Priorité** | `10` |
| **TTL** | `Auto` ou `3600` |

---

## 🚀 Étapes dans Hostinger

### Étape 1 : Accéder à la zone DNS

1. Connectez-vous à **Hostinger** : https://www.hostinger.com
2. Menu de gauche → **"Domains"** ou **"Domaines"**
3. Cliquez sur **`tyala.online`**
4. Cliquez sur l'onglet **"DNS"** ou **"Zone DNS"**

### Étape 2 : Ajouter l'enregistrement MX

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"** (bouton **"+"**)

2. **Sélectionnez le type** :
   - Dans le menu déroulant **"Type"**, choisissez **`MX`**

3. **Remplissez le champ "Name" ou "Host"** :
   - Tapez exactement : **`send`**
   - ⚠️ **IMPORTANT** : 
     - Juste `send` (sans rien d'autre)
     - Pas `send.tyala.online`
     - Pas `www.send`
     - Pas `@send`
     - Juste : `send`

4. **Remplissez le champ "Value" ou "Points to"** :
   - Tapez exactement : **`feedback-smtp.us-east-1.amazonses.com`**
   - ⚠️ Vérifiez bien l'orthographe (pas de fautes de frappe)

5. **Remplissez le champ "Priority" ou "Priorité"** :
   - Tapez le nombre : **`10`**
   - ⚠️ Juste le chiffre `10`, pas de texte

6. **TTL** :
   - Laissez **`Auto`** ou sélectionnez **`3600`**

7. **Sauvegardez** :
   - Cliquez sur **"Sauvegarder"**, **"Save"** ou **"Ajouter"**

---

## ✅ Vérification

Après avoir ajouté l'enregistrement, vous devriez voir dans votre liste DNS :

| Type | Name | Value | Priority |
|------|------|-------|----------|
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |

**Note :** Hostinger peut afficher `send.tyala.online` dans la colonne "Name", c'est normal. L'important est que vous ayez tapé `send` lors de la création.

---

## ⚠️ Problèmes courants avec Hostinger

### Problème 1 : "Le champ Name n'accepte pas 'send'"
- **Solution** : Essayez de laisser le champ vide si l'interface le permet
- Ou utilisez `@` si l'interface le demande (mais normalement `send` devrait fonctionner)

### Problème 2 : "L'interface affiche 'send.tyala.online' au lieu de 'send'"
- **C'est normal !** Hostinger affiche parfois le nom complet
- L'important est que vous ayez tapé `send` dans le champ lors de la création
- Vérifiez dans Resend que l'enregistrement est détecté

### Problème 3 : "Je ne trouve pas le champ Priority"
- **Solution** : Cherchez un champ nommé **"Priorité"**, **"Preference"** ou **"Prio"**
- Dans certaines interfaces Hostinger, il peut être dans un menu déroulant
- La valeur doit être `10`

### Problème 4 : "Erreur lors de l'ajout"
- **Vérifiez** :
  - Que vous avez bien sélectionné le type `MX`
  - Que la valeur `feedback-smtp.us-east-1.amazonses.com` est correcte
  - Que la priorité est bien `10`
  - Que vous êtes bien dans l'onglet DNS de `tyala.online`

---

## 🔍 Comment vérifier que c'est correct

### Méthode 1 : Dans Hostinger
- Allez dans DNS → vous devriez voir l'enregistrement MX dans la liste

### Méthode 2 : Avec un outil en ligne
- Allez sur : https://mxtoolbox.com/SuperTool.aspx
- Tapez : `send.tyala.online`
- Cliquez sur **"MX Lookup"**
- Vous devriez voir : `feedback-smtp.us-east-1.amazonses.com` avec priorité 10

### Méthode 3 : Dans Resend
- Allez sur : https://resend.com/domains
- Cliquez sur `tyala.online`
- Cliquez sur **"Verify Domain"**
- L'enregistrement MX devrait être vérifié (✅)

---

## ⏱️ Propagation

- **Attendez 5-10 minutes** après l'ajout
- La propagation peut prendre jusqu'à **24 heures**
- Vérifiez dans Resend après 1 heure

---

## 📝 Résumé rapide

Pour ajouter l'enregistrement MX dans Hostinger :

1. **DNS** → **Ajouter un enregistrement**
2. **Type** : `MX`
3. **Name** : `send`
4. **Value** : `feedback-smtp.us-east-1.amazonses.com`
5. **Priority** : `10`
6. **Sauvegarder**

---

**Une fois ajouté et vérifié dans Resend, vos emails partiront de `mail@tyala.online` ! 🚀**

