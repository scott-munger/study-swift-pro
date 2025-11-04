# 📧 Guide de Configuration DNS Resend pour Hostinger

## 🎯 Configuration spécifique pour Hostinger

Vous utilisez **Hostinger** comme fournisseur de nom de domaine. Voici comment configurer les enregistrements DNS pour Resend.

---

## 📋 Les 3 enregistrements à ajouter

### ✅ Enregistrement 1 : DKIM (TXT)
- **Type** : `TXT`
- **Nom** : `resend._domainkey`
- **Valeur** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB`
- **TTL** : `Auto` ou `3600`

### ✅ Enregistrement 2 : SPF (TXT)
- **Type** : `TXT`
- **Nom** : `send`
- **Valeur** : `v=spf1 include:amazonses.com ~all`
- **TTL** : `Auto` ou `3600`

### ✅ Enregistrement 3 : MX
- **Type** : `MX`
- **Nom** : `send`
- **Valeur** : `feedback-smtp.us-east-1.amazonses.com`
- **Priorité** : `10`
- **TTL** : `Auto` ou `3600`

---

## 🚀 Instructions pas à pas dans Hostinger

### Étape 1 : Accéder à la zone DNS

1. Connectez-vous à **Hostinger** : https://www.hostinger.com
2. Dans le menu de gauche, cliquez sur **"Domains"** ou **"Domaines"**
3. Cliquez sur **`tyala.online`**
4. Cliquez sur l'onglet **"DNS"** ou **"Zone DNS"** ou **"Advanced DNS"**

### Étape 2 : Ajouter l'enregistrement DKIM (TXT)

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"** ou le bouton **"+"**
2. Dans le menu déroulant **"Type"**, sélectionnez **`TXT`**
3. Dans le champ **"Name"** ou **"Host"** :
   - Tapez : `resend._domainkey`
   - **⚠️ Important** : Incluez le point (.) entre `resend` et `_domainkey`
4. Dans le champ **"Value"** ou **"Content"** ou **"TXT Value"** :
   - Collez **TOUTE** cette valeur (très longue, copiez-la entièrement) :
   ```
   p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB
   ```
5. **TTL** : Laissez `Auto` ou sélectionnez `3600`
6. Cliquez sur **"Sauvegarder"** ou **"Save"** ou **"Ajouter"**

### Étape 3 : Ajouter l'enregistrement SPF (TXT)

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"** ou le bouton **"+"**
2. Dans le menu déroulant **"Type"**, sélectionnez **`TXT`**
3. Dans le champ **"Name"** ou **"Host"** :
   - Tapez : `send`
   - **⚠️ Important** : Juste `send`, pas `send.tyala.online`
4. Dans le champ **"Value"** ou **"Content"** :
   - Tapez : `v=spf1 include:amazonses.com ~all`
5. **TTL** : Laissez `Auto` ou `3600`
6. Cliquez sur **"Sauvegarder"** ou **"Save"**

### Étape 4 : Ajouter l'enregistrement MX

**📌 Configuration exacte pour Resend :**

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"** ou le bouton **"+"**
2. Dans le menu déroulant **"Type"**, sélectionnez **`MX`**
3. Dans le champ **"Name"**, **"Host"**, **"Subdomain"** ou **"Sous-domaine"** :
   - Tapez exactement : **`send`**
   - **⚠️ TRÈS IMPORTANT** : Juste `send` (sans `www`, sans `tyala.online`, sans point)
   - Si l'interface Hostinger suggère `send.tyala.online`, ignorez-le et tapez juste `send`
4. Dans le champ **"Value"**, **"Points to"**, **"Target"**, **"Mail Server"** ou **"Serveur de messagerie"** :
   - Tapez exactement : **`feedback-smtp.us-east-1.amazonses.com`**
5. Dans le champ **"Priority"** ou **"Priorité"** :
   - Tapez le nombre : **`10`** (pas de texte, juste le chiffre)
6. **TTL** : Laissez **`Auto`** ou sélectionnez **`3600`** (1 heure)
7. Cliquez sur **"Sauvegarder"**, **"Save"** ou **"Ajouter"**

**✅ Vérification après l'ajout :**
- L'enregistrement devrait apparaître dans votre liste DNS
- Hostinger peut afficher `send.tyala.online` dans la liste, c'est normal
- L'important est que vous ayez tapé `send` dans le champ "Name"

---

## ✅ Vérification dans Hostinger

Après avoir ajouté les 3 enregistrements, vous devriez voir dans votre liste DNS :

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/...` | - |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |

---

## ⏱️ Propagation DNS

- **Attendez 5-10 minutes** après avoir ajouté les enregistrements
- La propagation peut prendre jusqu'à **24 heures** dans certains cas
- Vous pouvez vérifier avec des outils en ligne : https://mxtoolbox.com/SuperTool.aspx

---

## 🔍 Vérification dans Resend

1. Allez sur https://resend.com/domains
2. Cliquez sur **`tyala.online`**
3. Cliquez sur **"Verify Domain"** ou **"Vérifier le domaine"**
4. Resend va vérifier automatiquement les 3 enregistrements
5. Une fois vérifiés, vous verrez des ✅ verts

---

## ⚠️ Problèmes courants avec Hostinger

### Problème 1 : "Name" vs "Host"
- Certaines interfaces Hostinger utilisent "Name", d'autres "Host"
- C'est la même chose, utilisez le champ disponible

### Problème 2 : L'enregistrement apparaît comme `send.tyala.online`
- C'est normal ! Hostinger affiche parfois le nom complet
- L'important est que vous ayez tapé juste `send` dans le champ

### Problème 3 : Impossible d'ajouter l'enregistrement MX
- Vérifiez que vous avez bien sélectionné le type `MX`
- Assurez-vous que le champ "Priority" est rempli avec `10`
- Certaines interfaces Hostinger peuvent avoir un champ séparé pour la priorité

### Problème 4 : La valeur DKIM est trop longue
- Copiez TOUTE la valeur, même si elle semble très longue
- Elle commence par `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/...`
- Et se termine par `...fRpW1ewIDAQAB`

---

## 🆘 Si vous avez des difficultés

1. **Capturez une capture d'écran** de l'interface DNS de Hostinger
2. **Vérifiez** que vous êtes bien dans l'onglet DNS de `tyala.online`
3. **Contactez le support Hostinger** si l'interface est différente
4. **Attendez** au moins 1 heure après l'ajout avant de vérifier dans Resend

---

## 📞 Support

- **Hostinger Support** : https://www.hostinger.com/contact
- **Resend Support** : https://resend.com/support

---

**Bon courage ! Une fois configuré, tous vos emails partiront de `mail@tyala.online` ! 🚀**

