# Installation Nginx selon votre distribution Linux

## 🔍 D'abord, identifiez votre distribution :

```bash
cat /etc/os-release
```

ou

```bash
uname -a
```

---

## 📦 Selon votre distribution :

### Si vous utilisez **Ubuntu/Debian** :
```bash
sudo apt update
sudo apt install nginx -y
```

### Si vous utilisez **CentOS/RHEL/Fedora (ancien)** :
```bash
sudo yum update -y
sudo yum install nginx -y
```

### Si vous utilisez **Fedora récent** :
```bash
sudo dnf update -y
sudo dnf install nginx -y
```

### Si vous utilisez **Alpine Linux** :
```bash
sudo apk update
sudo apk add nginx
```

### Si vous utilisez **Arch Linux** :
```bash
sudo pacman -Syu
sudo pacman -S nginx
```

---

## 🚀 Après l'installation, démarrez Nginx :

### Ubuntu/Debian/CentOS/Fedora/Alpine :
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Arch Linux :
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## ⚙️ Ensuite, configurez Nginx (même commande pour toutes les distributions) :

```bash
sudo nano /etc/nginx/sites-available/tyala
```

Si le dossier `sites-available` n'existe pas (certaines distributions), créez-le :
```bash
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
```

Puis ajoutez dans `/etc/nginx/nginx.conf` dans le bloc `http {}` :
```nginx
include /etc/nginx/sites-enabled/*;
```



