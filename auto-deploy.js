#!/usr/bin/env node

/**
 * Script de déploiement automatique
 * Ce script vous guide étape par étape
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 DÉPLOIEMENT AUTOMATIQUE SUR NETLIFY');
  console.log('=====================================\n');

  // Étape 1 : Vérifications
  console.log('📋 ÉTAPE 1 : Vérifications préliminaires');
  console.log('----------------------------------------');

  // Vérifier que nous sommes dans le bon dossier
  if (!fs.existsSync('package.json')) {
    console.log('❌ Erreur : package.json non trouvé');
    console.log('   Assurez-vous d\'être dans le dossier du projet');
    process.exit(1);
  }

  console.log('✅ package.json trouvé');

  // Vérifier que le build fonctionne
  console.log('🔨 Test du build...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build réussi');
  } catch (error) {
    console.log('❌ Erreur lors du build');
    console.log('   Vérifiez que toutes les dépendances sont installées');
    process.exit(1);
  }

  // Étape 2 : Configuration
  console.log('\n📋 ÉTAPE 2 : Configuration');
  console.log('---------------------------');

  const apiUrl = await question('🌐 URL de votre API backend (ex: https://votre-api.railway.app/api) : ');
  
  if (!apiUrl.startsWith('http')) {
    console.log('❌ L\'URL doit commencer par http:// ou https://');
    process.exit(1);
  }

  // Créer le fichier .env
  const envContent = `VITE_API_URL=${apiUrl}\n`;
  fs.writeFileSync('.env', envContent);
  console.log('✅ Fichier .env créé');

  // Modifier les URLs dans le code
  console.log('🔄 Mise à jour des URLs...');
  const filesToUpdate = [
    'src/contexts/AuthContext.tsx',
    'src/pages/Login.tsx',
    'src/pages/SimpleAdminDashboard.tsx'
  ];

  filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace(/http:\/\/localhost:8081\/api/g, apiUrl);
      content = content.replace(/http:\/\/localhost:3001\/api/g, apiUrl);
      fs.writeFileSync(file, content);
      console.log(`✅ ${file} mis à jour`);
    }
  });

  // Étape 3 : Instructions
  console.log('\n📋 ÉTAPE 3 : Instructions de déploiement');
  console.log('---------------------------------------');

  console.log('\n🎯 RÉSUMÉ DE CE QUI A ÉTÉ FAIT :');
  console.log('✅ Build testé et fonctionnel');
  console.log('✅ Fichier .env créé');
  console.log('✅ URLs mises à jour dans le code');

  console.log('\n📤 PROCHAINES ÉTAPES :');
  console.log('1. Mettre votre code sur GitHub :');
  console.log('   - Aller sur github.com');
  console.log('   - Créer un nouveau repository');
  console.log('   - Uploader tous vos fichiers');

  console.log('\n2. Déployer sur Netlify :');
  console.log('   - Aller sur netlify.com');
  console.log('   - "New site from Git"');
  console.log('   - Choisir votre repository GitHub');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: dist');

  console.log('\n3. Configurer les variables d\'environnement :');
  console.log('   - Dans Netlify: Site settings > Environment variables');
  console.log(`   - Ajouter: VITE_API_URL = ${apiUrl}`);

  console.log('\n4. Déployer votre backend :');
  console.log('   - Aller sur railway.app ou heroku.com');
  console.log('   - Créer un nouveau projet');
  console.log('   - Connecter votre repository');
  console.log('   - Configurer les variables d\'environnement');

  console.log('\n🎉 VOTRE SITE SERA ACCESSIBLE SUR :');
  console.log('   https://votre-site.netlify.app');

  console.log('\n📖 GUIDES DÉTAILLÉS :');
  console.log('   - GUIDE-SIMPLE.md (guide étape par étape)');
  console.log('   - GUIDE-VISUEL.md (guide avec schémas)');
  console.log('   - DEPLOYMENT.md (guide complet)');

  rl.close();
}

main().catch(console.error);
