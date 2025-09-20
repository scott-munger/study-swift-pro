#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du serveur WebSocket...');

// Démarrer le serveur WebSocket
const websocketServer = spawn('node', [path.join(__dirname, 'websocket-server.cjs')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    WEBSOCKET_PORT: process.env.WEBSOCKET_PORT || '3005',
    DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/tyala_education'
  }
});

websocketServer.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du serveur WebSocket:', error);
});

websocketServer.on('close', (code) => {
  console.log(`🔌 Serveur WebSocket fermé avec le code ${code}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur WebSocket...');
  websocketServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur WebSocket...');
  websocketServer.kill('SIGTERM');
  process.exit(0);
});

