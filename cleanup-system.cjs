#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage du système...');

// Fonction pour nettoyer un fichier
function cleanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Nettoyer les références Supabase
    const supabasePatterns = [
      /import.*supabase.*from.*['"]@supabase\/supabase-js['"];?\s*/gi,
      /import.*createClient.*from.*['"]@supabase\/supabase-js['"];?\s*/gi,
      /const.*supabase.*=.*createClient\([^)]*\);?\s*/gi,
      /supabase\./gi
    ];

    supabasePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });

    // Nettoyer les références aux anciens ports
    content = content.replace(/localhost:3002/gi, 'localhost:3005');
    content = content.replace(/localhost:3003/gi, 'localhost:3005');
    
    // Nettoyer les références aux anciens systèmes
    content = content.replace(/EduPrep/gi, 'Tyala');
    content = content.replace(/eduprep/gi, 'tyala');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Nettoyé: ${filePath}`);
    } else {
      console.log(`ℹ️  Aucun changement: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
  }
}

// Fonction pour nettoyer un répertoire récursivement
function cleanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        cleanDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        cleanFile(itemPath);
      }
    });
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage du répertoire ${dirPath}:`, error.message);
  }
}

// Nettoyer les fichiers de configuration
console.log('📁 Nettoyage des fichiers de configuration...');
const configFiles = [
  'src/contexts/AuthContext.tsx',
  'src/hooks/useSocket.ts',
  'src/components/ui/tutor-inbox.tsx',
  'src/pages/Tutors.tsx',
  'src/pages/TutorDashboard.tsx',
  'src/components/ui/chat-simple.tsx'
];

configFiles.forEach(cleanFile);

// Nettoyer le répertoire src
console.log('📁 Nettoyage du répertoire src...');
cleanDirectory('src');

// Nettoyer les fichiers de documentation
console.log('📁 Nettoyage des fichiers de documentation...');
const docFiles = [
  'README.md',
  'GUIDE_TEST_FINAL_DESIGN_CORRIGE.md'
];

docFiles.forEach(cleanFile);

// Supprimer les anciens fichiers de guide
console.log('🗑️  Suppression des anciens fichiers de guide...');
const oldGuides = [
  'GUIDE_TEST_CARLOS_ANA.md',
  'GUIDE_TEST_FINAL.md',
  'GUIDE_TEST_TUTEUR_MESSAGES.md',
  'GUIDE_TEST_MESSAGES.md',
  'GUIDE_TEST_CHAT_CORRIGE.md',
  'GUIDE_TEST_CHAT.md',
  'GUIDE_TEST_FINAL_CORRIGE.md',
  'GUIDE_TEST_FINAL_UI_CORRIGE.md'
];

oldGuides.forEach(guide => {
  try {
    if (fs.existsSync(guide)) {
      fs.unlinkSync(guide);
      console.log(`🗑️  Supprimé: ${guide}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de ${guide}:`, error.message);
  }
});

console.log('🎉 Nettoyage terminé !');
console.log('✨ Système nettoyé et prêt pour MySQL');
