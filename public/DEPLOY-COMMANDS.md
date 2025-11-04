# Commandes SCP pour transférer les fichiers sur votre VPS

## ⚠️ IMPORTANT : Remplacez les valeurs suivantes :

- `USERNAME` = Votre nom d'utilisateur sur le VPS (ex: `root`, `ubuntu`, `admin`)
- `IP_OU_DOMAINE` = L'adresse IP de votre VPS (ex: `123.45.67.89`) ou votre domaine (ex: `vps.example.com`)
- `PORT_SSH` = Le port SSH (généralement `22`, mais peut être différent)

## 📍 Depuis votre Mac, dans le terminal :

### 1. Naviguez vers le dossier public
```bash
cd /Users/munger/study-swift-pro/public
```

### 2. Transférez les fichiers

#### Option A : Si votre SSH est sur le port 22 (défaut)
```bash
# Transfert du fichier HTML (renommé en index.html)
scp index-launch.html USERNAME@IP_OU_DOMAINE:/var/www/tyala/index.html

# Transfert du logo
scp "Asset 1Tyala copie.png" USERNAME@IP_OU_DOMAINE:/var/www/tyala/

# Transfert du favicon
scp tyala-favicon.ico USERNAME@IP_OU_DOMAINE:/var/www/tyala/
```

#### Option B : Si votre SSH utilise un port différent
```bash
scp -P PORT_SSH index-launch.html USERNAME@IP_OU_DOMAINE:/var/www/tyala/index.html
scp -P PORT_SSH "Asset 1Tyala copie.png" USERNAME@IP_OU_DOMAINE:/var/www/tyala/
scp -P PORT_SSH tyala-favicon.ico USERNAME@IP_OU_DOMAINE:/var/www/tyala/
```

## 📝 Exemples concrets :

### Exemple 1 : VPS avec utilisateur `root` et IP `192.168.1.100`
```bash
cd /Users/munger/study-swift-pro/public
scp index-launch.html root@192.168.1.100:/var/www/tyala/index.html
scp "Asset 1Tyala copie.png" root@192.168.1.100:/var/www/tyala/
scp tyala-favicon.ico root@192.168.1.100:/var/www/tyala/
```

### Exemple 2 : VPS avec utilisateur `ubuntu` et domaine `vps.example.com`
```bash
cd /Users/munger/study-swift-pro/public
scp index-launch.html ubuntu@vps.example.com:/var/www/tyala/index.html
scp "Asset 1Tyala copie.png" ubuntu@vps.example.com:/var/www/tyala/
scp tyala-favicon.ico ubuntu@vps.example.com:/var/www/tyala/
```

### Exemple 3 : VPS avec port SSH personnalisé (ex: 2222)
```bash
cd /Users/munger/study-swift-pro/public
scp -P 2222 index-launch.html root@192.168.1.100:/var/www/tyala/index.html
scp -P 2222 "Asset 1Tyala copie.png" root@192.168.1.100:/var/www/tyala/
scp -P 2222 tyala-favicon.ico root@192.168.1.100:/var/www/tyala/
```

## 🔐 Authentification

Si vous utilisez une clé SSH, elle sera utilisée automatiquement.

Si vous utilisez un mot de passe, on vous le demandera lors de chaque commande SCP.

## ✅ Vérification après transfert

Connectez-vous à votre VPS et vérifiez :
```bash
ssh USERNAME@IP_OU_DOMAINE
ls -la /var/www/tyala/
```

Vous devriez voir les 3 fichiers :
- index.html
- Asset 1Tyala copie.png
- tyala-favicon.ico



