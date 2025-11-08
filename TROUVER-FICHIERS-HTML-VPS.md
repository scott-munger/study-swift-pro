# 🔍 Comment voir le chemin de vos fichiers HTML sur votre VPS

## 📋 Méthodes pour trouver vos fichiers HTML

### Méthode 1 : Vérifier la configuration Nginx (recommandé)

La configuration Nginx vous indique exactement où se trouvent vos fichiers HTML.

#### 1. Se connecter en SSH à votre VPS

```bash
ssh utilisateur@votre-ip-ou-domaine
# ou
ssh root@votre-ip-ou-domaine
```

#### 2. Vérifier la configuration Nginx

```bash
# Voir tous les sites configurés
sudo ls -la /etc/nginx/sites-available/

# Voir la configuration de votre site (remplacez "tyala" par le nom de votre site)
sudo cat /etc/nginx/sites-available/tyala

# Ou si vous avez un fichier de configuration par défaut
sudo cat /etc/nginx/sites-available/default
```

Dans la configuration, cherchez la ligne `root` :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    root /var/www/tyala;    # ← C'est ici que se trouvent vos fichiers HTML
    index index.html;
    ...
}
```

#### 3. Vérifier les sites activés

```bash
sudo ls -la /etc/nginx/sites-enabled/
```

---

### Méthode 2 : Rechercher les fichiers HTML sur le VPS

#### Recherche rapide des fichiers HTML

```bash
# Rechercher tous les fichiers .html sur le VPS
sudo find / -name "*.html" -type f 2>/dev/null

# Rechercher dans les répertoires web courants
sudo find /var/www -name "*.html" -type f 2>/dev/null
sudo find /usr/share/nginx -name "*.html" -type f 2>/dev/null
sudo find /home -name "*.html" -type f 2>/dev/null
```

#### Lister le contenu des répertoires web courants

```bash
# Répertoire web standard
ls -la /var/www/

# Si vous avez un sous-dossier tyala
ls -la /var/www/tyala/

# Répertoire Nginx par défaut
ls -la /usr/share/nginx/html/

# Répertoire Apache (si vous utilisez Apache)
ls -la /var/www/html/
```

---

### Méthode 3 : Vérifier les processus en cours

#### Voir quel serveur web est actif

```bash
# Vérifier si Nginx est actif
sudo systemctl status nginx

# Vérifier si Apache est actif
sudo systemctl status apache2
# ou
sudo systemctl status httpd
```

#### Voir la configuration principale

```bash
# Configuration principale de Nginx
sudo cat /etc/nginx/nginx.conf | grep root

# Configuration Apache
sudo cat /etc/apache2/sites-enabled/000-default.conf | grep DocumentRoot
# ou
sudo cat /etc/httpd/conf/httpd.conf | grep DocumentRoot
```

---

### Méthode 4 : Commandes pratiques pour explorer

#### Voir la structure complète d'un répertoire

```bash
# Voir tous les fichiers dans /var/www/tyala
ls -lah /var/www/tyala/

# Voir avec l'arborescence
tree /var/www/tyala/
# Si tree n'est pas installé : sudo apt install tree
```

#### Vérifier les permissions

```bash
# Voir les permissions et propriétaire
ls -la /var/www/tyala/

# Voir qui possède les fichiers
stat /var/www/tyala/index.html
```

---

## 🎯 Chemins courants selon votre configuration

### Si vous utilisez Nginx (comme dans votre projet)

**Chemin probable :** `/var/www/tyala/`

```bash
cd /var/www/tyala
ls -la
```

Vous devriez voir :
- `index.html`
- `Asset 1Tyala copie.png`
- `tyala-favicon.ico`
- Autres fichiers HTML

### Si vous utilisez Apache

**Chemin probable :** `/var/www/html/` ou `/var/www/tyala/`

```bash
cd /var/www/html
ls -la
```

### Si vous utilisez Node.js/Express

**Chemin probable :** `/home/username/projet/public/` ou `/var/www/projet/public/`

```bash
# Trouver où se trouve votre projet Node.js
ps aux | grep node

# Puis explorer le répertoire public
cd /chemin/vers/votre/projet/public
ls -la
```

---

## 🔧 Commandes utiles pour naviguer

### Se déplacer dans les répertoires

```bash
# Aller dans le répertoire web
cd /var/www/tyala

# Voir où vous êtes
pwd

# Voir le contenu
ls -la

# Voir le contenu d'un fichier HTML
cat index.html
# ou
less index.html  # Pour naviguer dans le fichier (q pour quitter)
```

### Rechercher un fichier spécifique

```bash
# Chercher index.html
find /var/www -name "index.html"

# Chercher tous les fichiers HTML dans un répertoire
find /var/www/tyala -name "*.html"
```

---

## 📝 Exemple complet : Trouver vos fichiers

```bash
# 1. Se connecter au VPS
ssh root@votre-ip

# 2. Vérifier la configuration Nginx
sudo cat /etc/nginx/sites-available/tyala | grep root

# 3. Aller dans le répertoire indiqué (exemple : /var/www/tyala)
cd /var/www/tyala

# 4. Lister tous les fichiers
ls -lah

# 5. Voir le chemin complet
pwd

# Résultat attendu : /var/www/tyala
```

---

## 🆘 Si vous ne trouvez pas vos fichiers

### Vérifier les logs Nginx

```bash
# Voir les logs d'erreur
sudo tail -f /var/log/nginx/error.log

# Voir les logs d'accès
sudo tail -f /var/log/nginx/access.log
```

Les logs peuvent indiquer quel chemin Nginx essaie d'utiliser.

### Vérifier tous les répertoires web possibles

```bash
# Recherche exhaustive
sudo find / -type d -name "www" 2>/dev/null
sudo find / -type d -name "html" 2>/dev/null
sudo find / -type d -name "tyala" 2>/dev/null
```

---

## 🖼️ Trouver le logo Tyala

Le logo Tyala se trouve dans le même répertoire que vos fichiers HTML.

### ⚠️ Important : Il y a DEUX fichiers logo différents !

Vos fichiers HTML utilisent **deux logos différents** :

1. **`Asset 1Tyala copie.png`** 
   - Utilisé dans `index-launch.html` (page de lancement)
   - Référencé comme : `<img src="./Asset 1Tyala copie.png">`

2. **`Asset 2Tyala copie.png`**
   - Utilisé dans les meta tags (Open Graph, Twitter Card, SEO)
   - Référencé comme : `https://tyala.online/Asset 2Tyala copie.png`
   - Utilisé pour les aperçus sur les réseaux sociaux (Facebook, Twitter, etc.)

### Noms des fichiers logo

- **Logo principal (page de lancement)** : `Asset 1Tyala copie.png`
- **Logo meta tags (réseaux sociaux)** : `Asset 2Tyala copie.png`

### Commandes pour trouver le logo

#### Méthode rapide

```bash
# Aller dans le répertoire web
cd /var/www/tyala

# Voir tous les fichiers, y compris les logos
ls -lah

# Chercher spécifiquement les deux logos
ls -lah "Asset 1Tyala copie.png"
ls -lah "Asset 2Tyala copie.png"

# Voir tous les fichiers Asset (les deux logos en une fois)
ls -lah "Asset"*
```

#### Rechercher les logos sur tout le VPS

```bash
# Rechercher tous les logos Tyala partout
sudo find / -name "*Tyala*.png" -type f 2>/dev/null
sudo find / -name "*Asset*.png" -type f 2>/dev/null

# Rechercher dans les répertoires web
find /var/www -name "*Tyala*.png" 2>/dev/null
find /var/www -name "*Asset*.png" 2>/dev/null

# Rechercher spécifiquement les deux logos
find /var/www -name "Asset 1Tyala copie.png" 2>/dev/null
find /var/www -name "Asset 2Tyala copie.png" 2>/dev/null
```

#### Voir les informations des logos

```bash
# Voir les détails du logo 1 (page de lancement)
ls -lh "/var/www/tyala/Asset 1Tyala copie.png"

# Voir les détails du logo 2 (meta tags)
ls -lh "/var/www/tyala/Asset 2Tyala copie.png"

# Voir le chemin complet des deux logos
realpath "/var/www/tyala/Asset 1Tyala copie.png"
realpath "/var/www/tyala/Asset 2Tyala copie.png"

# Voir la taille et les permissions
stat "/var/www/tyala/Asset 1Tyala copie.png"
stat "/var/www/tyala/Asset 2Tyala copie.png"
```

### Chemins probables des logos

**Les logos se trouvent probablement dans :**
- `/var/www/tyala/Asset 1Tyala copie.png` (logo page de lancement)
- `/var/www/tyala/Asset 2Tyala copie.png` (logo meta tags)

C'est le même répertoire que vos fichiers HTML.

### Vérifier que les logos sont accessibles

```bash
# Vérifier que le logo 1 existe
test -f "/var/www/tyala/Asset 1Tyala copie.png" && echo "Logo 1 trouvé !" || echo "Logo 1 non trouvé"

# Vérifier que le logo 2 existe
test -f "/var/www/tyala/Asset 2Tyala copie.png" && echo "Logo 2 trouvé !" || echo "Logo 2 non trouvé"

# Vérifier les deux en une fois
test -f "/var/www/tyala/Asset 1Tyala copie.png" && test -f "/var/www/tyala/Asset 2Tyala copie.png" && echo "Les deux logos sont présents !" || echo "Un ou plusieurs logos manquent"

# Voir tous les fichiers images dans le répertoire
ls -lah /var/www/tyala/*.png
ls -lah /var/www/tyala/*.jpg
ls -lah /var/www/tyala/*.jpeg
```

### Accéder aux logos via le navigateur

Si votre site est configuré sur `tyala.online`, les logos devraient être accessibles à :

**Logo 1 (page de lancement) :**
- `http://tyala.online/Asset%201Tyala%20copie.png`
- `https://tyala.online/Asset%201Tyala%20copie.png` (si SSL est activé)

**Logo 2 (meta tags) :**
- `http://tyala.online/Asset%202Tyala%20copie.png`
- `https://tyala.online/Asset%202Tyala%20copie.png` (si SSL est activé)

### Où sont utilisés les logos dans vos fichiers HTML ?

**Dans `index-launch.html` (ligne 78 ou 173) :**
```html
<img src="./Asset 1Tyala copie.png" alt="TYALA Logo" class="logo">
```

**Dans `index.html` (meta tags, lignes 28, 41, 61, 72) :**
```html
<meta property="og:image" content="https://tyala.online/Asset 2Tyala copie.png" />
<meta name="twitter:image" content="https://tyala.online/Asset 2Tyala copie.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/Asset 2Tyala copie.png" />
"logo": "https://tyala.online/Asset 2Tyala copie.png"
```

---

## ✅ Résumé rapide

**La commande la plus rapide :**

```bash
# 1. Voir la config Nginx
sudo cat /etc/nginx/sites-available/tyala | grep root

# 2. Aller dans ce répertoire
cd /var/www/tyala  # (remplacez par le chemin trouvé)

# 3. Voir vos fichiers (HTML et logo)
ls -lah

# 4. Voir spécifiquement les logos
ls -lah "Asset 1Tyala copie.png"
ls -lah "Asset 2Tyala copie.png"

# 5. Voir tous les fichiers Asset (les deux logos)
ls -lah "Asset"*
```

**Le chemin de vos fichiers HTML et des logos est probablement :**
- `/var/www/tyala/` (selon votre configuration)
- Fichiers HTML : `/var/www/tyala/index.html` et `/var/www/tyala/index-launch.html`
- Logo 1 (page de lancement) : `/var/www/tyala/Asset 1Tyala copie.png`
- Logo 2 (meta tags) : `/var/www/tyala/Asset 2Tyala copie.png`
- Ou le chemin indiqué dans la ligne `root` de votre configuration Nginx

---

## 📞 Commandes de diagnostic

Si vous avez des doutes, exécutez ces commandes :

```bash
# Voir tous les sites Nginx configurés
sudo nginx -T | grep -A 5 "server_name"

# Voir tous les chemins root dans Nginx
sudo nginx -T | grep "root"

# Voir les processus qui écoutent sur le port 80
sudo netstat -tlnp | grep :80
# ou
sudo ss -tlnp | grep :80
```

Ces commandes vous donneront une vue complète de votre configuration.

