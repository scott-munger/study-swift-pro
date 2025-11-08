# Guide de déploiement de la page de lancement sur VPS

## Fichiers nécessaires

Pour déployer la page de lancement sur votre VPS, vous devez transférer ces fichiers :

1. `index-launch.html` - La page principale (renommez-la en `index.html` pour la page d'accueil)
2. `Asset 1Tyala copie.png` - Le logo Tyala
3. `tyala-favicon.ico` - Le favicon (optionnel)

## Option 1 : Déploiement simple avec Nginx

### 1. Créer le répertoire sur votre VPS

```bash
sudo mkdir -p /var/www/tyala
sudo chown -R $USER:$USER /var/www/tyala
cd /var/www/tyala
```

### 2. Transférer les fichiers

Via SCP depuis votre machine locale :
```bash
scp index-launch.html user@votre-vps:/var/www/tyala/index.html
scp "Asset 1Tyala copie.png" user@votre-vps:/var/www/tyala/
scp tyala-favicon.ico user@votre-vps:/var/www/tyala/
```

### 3. Configurer Nginx

Créez ou modifiez la configuration Nginx :
```bash
sudo nano /etc/nginx/sites-available/tyala
```

Contenu du fichier :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    root /var/www/tyala;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache pour les assets statiques
    location ~* \.(png|jpg|jpeg|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compression
    gzip on;
    gzip_types text/html text/css application/javascript;
}
```

### 4. Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/tyala /etc/nginx/sites-enabled/
sudo nginx -t  # Vérifier la configuration
sudo systemctl reload nginx
```

### 5. Configurer SSL avec Let's Encrypt (recommandé)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

## Option 2 : Déploiement avec Node.js/Express

Si vous utilisez déjà Node.js sur votre VPS, ajoutez cette route dans votre `server.ts` :

```typescript
// Servir la page de lancement
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index-launch.html'));
});
```

Puis transférez les fichiers dans `public/` de votre projet.

## Option 3 : Déploiement simple avec Python HTTP Server (test)

Pour tester rapidement :

```bash
cd /var/www/tyala
python3 -m http.server 8000
```

Puis accédez à `http://votre-ip:8000`

## Structure des fichiers sur le VPS

```
/var/www/tyala/
├── index.html              (index-launch.html renommé)
├── Asset 1Tyala copie.png
└── tyala-favicon.ico
```

## Commandes utiles

- Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
- Redémarrer Nginx : `sudo systemctl restart nginx`
- Vérifier le statut : `sudo systemctl status nginx`

## Notes importantes

- Assurez-vous que les chemins dans le HTML pointent vers les bons fichiers
- Si vous utilisez un sous-domaine, adaptez la configuration Nginx
- Pour un déploiement en production, activez HTTPS (SSL)






