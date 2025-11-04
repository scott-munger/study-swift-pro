# 🔧 Correction DKIM dans Hostinger

## ❌ Problème identifié

Dans Resend, le DKIM n'est pas vérifié car :
- **Resend demande** : `resend._domainkey`
- **Vous avez actuellement** : `resend._axxvtwpc_3ewdfwzkuzfswnmqmxfrphxs`

## ✅ Solution

### Étape 1 : Supprimer l'ancien enregistrement DKIM

1. Dans Hostinger, allez dans **DNS** → **`tyala.online`**
2. Trouvez l'enregistrement TXT avec le nom :
   - `resend._axxvtwpc_3ewdfwzkuzfswnmqmxfrphxs`
3. Cliquez sur **"Delete"** ou **"Supprimer"** pour le supprimer

### Étape 2 : Ajouter le bon enregistrement DKIM

1. Cliquez sur **"Ajouter un enregistrement"** ou **"Add Record"**
2. **Type** : Sélectionnez `TXT`
3. **Name** : Tapez exactement **`resend._domainkey`**
   - ⚠️ **IMPORTANT** : Incluez le point (.) entre `resend` et `_domainkey`
4. **Content** ou **Value** : Collez cette valeur complète :
   ```
   p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdYB1Z/ypd87+UuRhKp2rGU5K5xbzyi8xmwNKqOpGyhVToArnEc7nV5JJE1ozPIIX72Nu2iYCCHEf+Kctvyon1aJXh3kDm5jHCbOdB/PPUTZsV6mICkQpRGDhCMnrgDWjfE70S0HguD66mqNd4wKqUZReWZucVHwxw221fRpW1ewIDAQAB
   ```
5. **TTL** : `Auto` ou `3600`
6. Cliquez sur **"Sauvegarder"** ou **"Save"**

---

## ✅ Vérification SPF

Resend montre aussi que l'SPF n'est pas vérifié. Vérifiez que vous avez :

- **Type** : `TXT`
- **Name** : `send`
- **Content** : `v=spf1 include:amazonses.com ~all`

D'après votre liste DNS, vous avez déjà cet enregistrement. Si Resend ne le détecte pas :
- Attendez 10-15 minutes pour la propagation
- Vérifiez que la valeur est exactement : `v=spf1 include:amazonses.com ~all` (sans espaces supplémentaires)

---

## 📋 Résumé des actions

| Action | État | Instructions |
|--------|------|--------------|
| Supprimer `resend._axxvtwpc_...` | ⏳ | Supprimez l'ancien enregistrement DKIM |
| Ajouter `resend._domainkey` | ⏳ | Créez le nouvel enregistrement avec le bon nom |
| Vérifier SPF `send` | ✅ | Déjà configuré, attendez la propagation |
| Vérifier MX `send` | ✅ | Déjà configuré |

---

## 🕐 Après les modifications

1. **Attendez 5-10 minutes** pour la propagation DNS
2. Retournez dans **Resend** → **Domains** → **`tyala.online`**
3. Cliquez sur **"Verify Domain"** ou **"Vérifier le domaine"**
4. Les 3 enregistrements devraient être vérifiés (✅)

---

## ⚠️ Points importants

- **Le nom doit être exactement** : `resend._domainkey` (avec le point)
- **La valeur doit être complète** : Commence par `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...` et se termine par `...fRpW1ewIDAQAB`
- **Ne gardez pas les deux enregistrements** : Supprimez l'ancien avant de créer le nouveau

---

**Une fois corrigé, le DKIM sera vérifié et tous vos emails partiront de `mail@tyala.online` ! 🚀**

