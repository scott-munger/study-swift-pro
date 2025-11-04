# 📧 Configuration DNS Resend pour tyala.online chez Hostinger

## 🎯 Objectif
Configurer les enregistrements DNS nécessaires pour que Resend puisse envoyer des emails depuis `mail@tyala.online`.

---

## 📋 Enregistrements à ajouter

Vous devez ajouter **3 enregistrements DNS** dans votre panneau Hostinger :

### 1. **DKIM (Domain Verification)**
- **Type** : `TXT`
- **Nom/Host** : `resend._domainkey`
- **Valeur/Content** : 
  ```
  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB
  ```
- **TTL** : `Auto` ou `3600`

### 2. **SPF (Sending)**
- **Type** : `TXT`
- **Nom/Host** : `send`
- **Valeur/Content** : 
  ```
  v=spf1 include:amazonses.com ~all
  ```
- **TTL** : `Auto` ou `3600`

### 3. **MX (Sending - Feedback)**
- **Type** : `MX`
- **Nom/Host** : `send`
- **Valeur/Content** : `feedback-smtp.us-east-1.amazonses.com`
- **Priorité** : `10`
- **TTL** : `Auto` ou `3600`

---

## 🚀 Étapes détaillées dans Hostinger

### Étape 1 : Accéder au gestionnaire DNS

1. Connectez-vous à votre compte **Hostinger** : https://www.hostinger.com
2. Allez dans **"Domains"** ou **"Domaines"** dans le menu de gauche
3. Cliquez sur votre domaine **`tyala.online`**
4. Cliquez sur l'onglet **"DNS / Zone DNS"** ou **"DNS"**
5. Si vous ne voyez pas l'option DNS, cherchez **"Advanced DNS"** ou **"DNS avancé"**

### Étape 2 : Ajouter l'enregistrement DKIM (TXT)

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"**
2. Sélectionnez le type **`TXT`**
3. Dans le champ **"Name"** ou **"Host"** : tapez `resend._domainkey`
4. Dans le champ **"Value"** ou **"Content"** : collez cette valeur complète :
   ```
   p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB
   ```
5. **TTL** : Laissez `Auto` ou mettez `3600`
6. Cliquez sur **"Sauvegarder"** ou **"Save"**

### Étape 3 : Ajouter l'enregistrement SPF (TXT)

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"**
2. Sélectionnez le type **`TXT`**
3. Dans le champ **"Name"** ou **"Host"** : tapez `send`
4. Dans le champ **"Value"** ou **"Content"** : tapez :
   ```
   v=spf1 include:amazonses.com ~all
   ```
5. **TTL** : Laissez `Auto` ou mettez `3600`
6. Cliquez sur **"Sauvegarder"** ou **"Save"**

### Étape 4 : Ajouter l'enregistrement MX

**⚠️ IMPORTANT pour Hostinger :** Dans l'interface Hostinger, l'enregistrement MX peut être un peu différent :

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"** ou le bouton **"+"**
2. Sélectionnez le type **`MX`** dans le menu déroulant
3. Dans le champ **"Name"**, **"Host"**, **"Subdomain"** ou **"Sous-domaine"** : 
   - Tapez **`send`** (sans `www` ni `tyala.online`)
   - Ou laissez vide si l'interface le demande pour l'enregistrement racine
4. Dans le champ **"Value"**, **"Points to"**, **"Points vers"** ou **"Target"** : tapez :
   ```
   feedback-smtp.us-east-1.amazonses.com
   ```
5. Dans le champ **"Priority"** ou **"Priorité"** : tapez **`10`**
6. **TTL** : Laissez **`Auto`** ou **`3600`** (1 heure)
7. Cliquez sur **"Sauvegarder"**, **"Save"** ou **"Ajouter"**

**Note :** Si l'interface Hostinger affiche l'enregistrement comme `send.tyala.online` après l'ajout, c'est normal. L'important est que le nom soit `send`.

---

## ✅ Vérification

### Après avoir ajouté les enregistrements :

1. **Attendez 5-10 minutes** pour la propagation DNS
2. Retournez dans votre **dashboard Resend**
3. Allez dans **"Domains"** → **"tyala.online"**
4. Cliquez sur **"Verify Domain"** ou **"Vérifier le domaine"**
5. Resend va vérifier automatiquement les enregistrements

### Si la vérification échoue :

- Vérifiez que vous avez bien copié **TOUTE** la valeur DKIM (elle est très longue)
- Vérifiez que le nom de l'enregistrement est exactement `resend._domainkey` (avec le point)
- Vérifiez que le nom pour SPF et MX est bien `send` (sans `www` ou `tyala.online`)
- Attendez jusqu'à 24 heures pour la propagation complète du DNS

---

## 🔍 Comment vérifier vos enregistrements DNS

Vous pouvez vérifier si vos enregistrements sont correctement configurés avec ces commandes :

### Vérifier DKIM :
```bash
dig TXT resend._domainkey.tyala.online
```

### Vérifier SPF :
```bash
dig TXT send.tyala.online
```

### Vérifier MX :
```bash
dig MX send.tyala.online
```

Ou utilisez un outil en ligne : https://mxtoolbox.com/SuperTool.aspx

---

## 📝 Résumé des enregistrements

| Type | Nom | Valeur | Priorité |
|------|-----|--------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB` | - |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |

---

## ⚠️ Notes importantes

1. **Propagation DNS** : Les changements DNS peuvent prendre de 5 minutes à 48 heures pour se propager partout dans le monde.

2. **TTL** : Le TTL (Time To Live) détermine combien de temps les serveurs DNS cachent vos enregistrements. `Auto` ou `3600` (1 heure) est généralement recommandé.

3. **Pas de sous-domaine** : Les enregistrements doivent être ajoutés au niveau racine du domaine ou avec le nom exact (`resend._domainkey` et `send`), **pas** `www.send.tyala.online`.

4. **Vérification** : Une fois configurés, Resend vérifiera automatiquement vos enregistrements. Vous recevrez un email de confirmation quand tout sera prêt.

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que tous les enregistrements sont correctement saisis
2. Attendez au moins 1 heure après l'ajout
3. Contactez le support Hostinger si nécessaire
4. Vérifiez les logs dans Resend pour voir les erreurs spécifiques

---

**Bon courage ! 🚀**

