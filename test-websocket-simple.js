import { io } from 'socket.io-client';

console.log('🔄 Test de connexion WebSocket...');

const socket = io('http://localhost:3005', {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Connexion WebSocket établie');
  console.log('🆔 Socket ID:', socket.id);
  
  // Test d'envoi de message
  socket.emit('user_connect', {
    userId: '1',
    userType: 'tutor',
    name: 'Test User'
  });
  
  console.log('📤 Message de connexion utilisateur envoyé');
  
  // Test d'envoi de message
  setTimeout(() => {
    socket.emit('send_message', {
      toUserId: '2',
      message: 'Test message',
      messageType: 'text'
    });
    console.log('📤 Message de test envoyé');
  }, 1000);
  
  // Fermer la connexion après 3 secondes
  setTimeout(() => {
    socket.disconnect();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }, 3000);
});

socket.on('disconnect', () => {
  console.log('❌ Connexion WebSocket fermée');
});

socket.on('connect_error', (error) => {
  console.log('❌ Erreur de connexion:', error.message);
  process.exit(1);
});

socket.on('new_message', (message) => {
  console.log('📨 Nouveau message reçu:', message);
});

socket.on('message_notification', (notification) => {
  console.log('🔔 Notification message:', notification);
});

socket.on('user_online', (user) => {
  console.log('👤 Utilisateur en ligne:', user);
});

socket.on('user_offline', (user) => {
  console.log('👤 Utilisateur hors ligne:', user);
});

socket.on('online_users', (users) => {
  console.log('👥 Utilisateurs en ligne:', users.length);
});

// Timeout de sécurité
setTimeout(() => {
  console.log('⏰ Timeout - Arrêt du test');
  process.exit(1);
}, 10000);
