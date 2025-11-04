# Commandes CP pour copier les fichiers sur le VPS

## Une fois connecté à votre VPS via SSH :

```bash
# 1. Créer le dossier (si pas déjà créé)
sudo mkdir -p /var/www/tyala

# 2. Copier le fichier HTML
cp /chemin/vers/index-launch.html /var/www/tyala/index.html

# 3. Copier le logo
cp "/chemin/vers/Asset 1Tyala copie.png" /var/www/tyala/

# 4. Copier le favicon
cp /chemin/vers/tyala-favicon.ico /var/www/tyala/
```

## Ou si vous avez déjà les fichiers dans un dossier :

```bash
cd /chemin/vers/dossier/contenant/les/fichiers

cp index-launch.html /var/www/tyala/index.html
cp "Asset 1Tyala copie.png" /var/www/tyala/
cp tyala-favicon.ico /var/www/tyala/
```

## Donner les permissions :

```bash
sudo chown -R www-data:www-data /var/www/tyala
sudo chmod -R 755 /var/www/tyala
```



