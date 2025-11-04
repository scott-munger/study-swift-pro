// Service Worker pour Tyala PWA
const CACHE_NAME = 'tyala-v1';
const OFFLINE_CACHE = 'tyala-offline-v1';
const DATA_CACHE = 'tyala-data-v1';

// Assets à mettre en cache pour fonctionnement offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tyala-favicon.ico',
  '/offline.html'
];

// Routes qui peuvent fonctionner offline
const OFFLINE_ROUTES = [
  '/flashcards',
  '/knowledge-tests',
  '/student/dashboard',
  '/profile'
];

// Routes qui nécessitent Internet
const ONLINE_ONLY_ROUTES = [
  '/forum',
  '/tutors',
  '/api'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache statique ouvert');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== DATA_CACHE) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas cacher les requêtes vers d'autres domaines
  if (url.origin !== location.origin) {
    return;
  }

  // En développement (localhost), ne pas cacher les modules React/Vite
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Laisser passer toutes les requêtes sans cache en développement
    return;
  }

  // Stratégie pour les API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Stratégie pour les assets statiques (seulement en production)
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Stratégie pour les pages HTML
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Par défaut: réseau d'abord
  event.respondWith(networkFirstStrategy(request));
});

// Stratégie: Cache d'abord (pour assets statiques)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Depuis cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Erreur réseau:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Stratégie: Réseau d'abord (pour données dynamiques)
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Mettre en cache les réponses réussies
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Réseau échoué, tentative cache:', request.url);
    
    // Essayer de récupérer depuis le cache
    const cache = await caches.open(DATA_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Données depuis cache:', request.url);
      return cached;
    }

    // Si c'est une page, retourner la page offline
    if (request.destination === 'document') {
      const offlineCache = await caches.open(OFFLINE_CACHE);
      const offlinePage = await offlineCache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Vous êtes hors ligne. Cette fonctionnalité nécessite une connexion Internet.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation:', event.tag);
  
  if (event.tag === 'sync-flashcards') {
    event.waitUntil(syncFlashcards());
  }
  
  if (event.tag === 'sync-test-results') {
    event.waitUntil(syncTestResults());
  }
});

// Fonction pour synchroniser les flashcards
async function syncFlashcards() {
  try {
    console.log('[SW] Synchronisation des flashcards...');
    // La logique de sync sera gérée par le frontend avec IndexedDB
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Erreur sync flashcards:', error);
    return Promise.reject(error);
  }
}

// Fonction pour synchroniser les résultats de tests
async function syncTestResults() {
  try {
    console.log('[SW] Synchronisation des résultats...');
    // La logique de sync sera gérée par le frontend avec IndexedDB
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Erreur sync résultats:', error);
    return Promise.reject(error);
  }
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[SW] Service Worker Tyala chargé');




