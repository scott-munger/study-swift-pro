#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initialisation de la base de données MySQL...');

// Configuration de la base de données
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password', // Changez selon votre configuration
  database: 'tyala_education'
};

// Fonction pour exécuter une commande MySQL
function runMySQLCommand(command) {
  try {
    const mysqlCmd = `mysql -h ${DB_CONFIG.host} -P ${DB_CONFIG.port} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} -e "${command}"`;
    execSync(mysqlCmd, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Erreur MySQL:', error.message);
    return false;
  }
}

// Créer la base de données
console.log('📦 Création de la base de données...');
if (runMySQLCommand(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)) {
  console.log('✅ Base de données créée avec succès');
} else {
  console.log('⚠️  Base de données peut-être déjà existante');
}

// Générer le client Prisma
console.log('🔧 Génération du client Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Client Prisma généré');
} catch (error) {
  console.error('❌ Erreur génération Prisma:', error.message);
}

// Appliquer les migrations
console.log('📋 Application des migrations...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Migrations appliquées');
} catch (error) {
  console.error('❌ Erreur migrations:', error.message);
}

// Seeder la base de données
console.log('🌱 Seeding de la base de données...');
try {
  execSync('npx tsx src/lib/database.ts', { stdio: 'inherit' });
  console.log('✅ Base de données seedée');
} catch (error) {
  console.error('❌ Erreur seeding:', error.message);
}

console.log('🎉 Initialisation terminée !');
console.log('📊 Base de données MySQL prête à l\'utilisation');
console.log('🔗 URL de connexion:', `mysql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
