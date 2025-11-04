# Guide Simple - Mettre la page HTML sur votre VPS

## 📋 Ce dont vous avez besoin :

1. L'adresse IP de votre VPS (ex: `123.45.67.89`)
2. Votre nom d'utilisateur SSH (ex: `root` ou `ubuntu`)
3. Les fichiers : `index.html` et `Asset 1Tyala copie.png`

---

## 🚀 Étapes Simples :

### ÉTAPE 1 : Connectez-vous à votre VPS
Ouvrez votre terminal et tapez :
```bash
ssh root@VOTRE_IP
```
(Remplacer `root` par votre utilisateur et `VOTRE_IP` par l'adresse IP)

### ÉTAPE 2 : Créez le dossier sur le VPS
Une fois connecté, tapez :
```bash
mkdir -p /var/www/tyala
cd /var/www/tyala
```

### ÉTAPE 3 : Ouvrez un nouveau terminal sur votre Mac
**SANS** fermer le terminal SSH, ouvrez un NOUVEAU terminal.

### ÉTAPE 4 : Transférez les fichiers
Dans le NOUVEAU terminal (sur votre Mac), allez dans le dossier :
```bash
cd /Users/munger/study-swift-pro/public
```

Puis transférez les fichiers (remplacez `root` et `VOTRE_IP`) :
```bash
scp index.html root@VOTRE_IP:/var/www/tyala/
scp "Asset 1Tyala copie.png" root@VOTRE_IP:/var/www/tyala/
```

Si on vous demande un mot de passe, tapez-le.

### ÉTAPE 5 : Retournez sur le terminal SSH du VPS
Vérifiez que les fichiers sont là :
```bash
ls -la /var/www/tyala/
```

Vous devriez voir :
- `index.html`
- `Asset 1Tyala copie.png`

### ÉTAPE 6 : Installez Nginx (si pas déjà fait)
```bash
sudo apt update
sudo apt install nginx -y
```

### ÉTAPE 7 : Configurez Nginx
Créez la configuration :
```bash
sudo nano /etc/nginx/sites-available/tyala
```

Collez ceci (appuyez sur `Ctrl+Shift+V` pour coller) :
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/tyala;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Sauvegardez : `Ctrl+X`, puis `Y`, puis `Entrée`

### ÉTAPE 8 : Activez le site
```bash
sudo ln -s /etc/nginx/sites-available/tyala /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ÉTAPE 9 : Testez !
Ouvrez votre navigateur et allez sur :
```
http://VOTRE_IP
```

La page devrait s'afficher ! 🎉

---

## 🔒 ÉTAPE 10 : Ajouter SSL (HTTPS)

### Prérequis :
Vous devez avoir un **nom de domaine** pointant vers votre VPS (ex: `tyala.com`)

### 10.1 : Installez Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 10.2 : Configurez votre domaine dans Nginx
Modifiez la configuration pour inclure votre domaine :
```bash
sudo nano /etc/nginx/sites-available/tyala
```

Remplacez `server_name _;` par votre domaine :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    root /var/www/tyala;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Sauvegardez : `Ctrl+X`, puis `Y`, puis `Entrée`

Rechargez Nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 10.3 : Obtenez le certificat SSL
```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions :
- Entrez votre email
- Acceptez les conditions (tapez `Y`)
- Partagez l'email avec EFF (optionnel, tapez `Y` ou `N`)
- Certbot va configurer automatiquement HTTPS

### 10.4 : Testez HTTPS
Ouvrez votre navigateur et allez sur :
```
https://votre-domaine.com
```

Vous devriez voir le cadenas 🔒 vert !

### 10.5 : Renouvellement automatique (déjà configuré)
Certbot renouvelle automatiquement. Testez le renouvellement :
```bash
sudo certbot renew --dry-run
```

---

## 🔧 Si ça ne marche pas :

Vérifiez les logs :
```bash
sudo tail -f /var/log/nginx/error.log
```

Redémarrez Nginx :
```bash
sudo systemctl restart nginx
```

Vérifiez que le firewall permet le port 80 :
```bash
sudo ufw allow 80
```

