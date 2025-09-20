// Script pour corriger le dashboard admin
console.log('🔧 Script de correction du dashboard admin démarré...');

// Fonction pour forcer le rechargement des données
function forceReloadAdminData() {
    console.log('🔄 Forçage du rechargement des données admin...');
    
    // Vérifier si on est sur la page admin
    if (window.location.pathname.includes('/simple-admin/dashboard')) {
        console.log('✅ Page admin détectée, rechargement des données...');
        
        // Déclencher un événement personnalisé pour forcer le rechargement
        window.dispatchEvent(new CustomEvent('forceReloadAdminData'));
        
        // Alternative: recharger la page après un délai
        setTimeout(() => {
            console.log('🔄 Rechargement de la page...');
            window.location.reload();
        }, 2000);
    } else {
        console.log('ℹ️ Redirection vers le dashboard admin...');
        window.location.href = '/simple-admin/dashboard';
    }
}

// Fonction pour vérifier et corriger l'authentification
function fixAdminAuth() {
    console.log('🔐 Vérification de l\'authentification admin...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const adminUser = localStorage.getItem('adminUser');
    
    if (!token) {
        console.log('❌ Aucun token trouvé, redirection vers la connexion...');
        window.location.href = '/admin/login';
        return false;
    }
    
    if (!user) {
        console.log('❌ Aucun utilisateur trouvé, redirection vers la connexion...');
        window.location.href = '/admin/login';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'ADMIN') {
            console.log('❌ Utilisateur non admin, redirection...');
            window.location.href = '/admin/login';
            return false;
        }
        
        console.log('✅ Authentification admin valide');
        
        // S'assurer que adminUser est défini
        if (!adminUser) {
            console.log('🔧 Définition de adminUser...');
            localStorage.setItem('adminUser', user);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur de parsing des données utilisateur:', error);
        window.location.href = '/admin/login';
        return false;
    }
}

// Fonction pour tester les endpoints API
async function testAdminEndpoints() {
    console.log('🧪 Test des endpoints admin...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ Aucun token pour tester les endpoints');
        return false;
    }
    
    const endpoints = [
        { name: 'Stats', url: '/api/admin/stats' },
        { name: 'Users', url: '/api/admin/users' },
        { name: 'Subjects', url: '/api/subjects' },
        { name: 'Flashcards', url: '/api/flashcards' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`http://localhost:8081${endpoint.url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: ${Array.isArray(data) ? data.length : 'OK'} éléments`);
            } else {
                console.log(`❌ ${endpoint.name}: Erreur ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Erreur réseau - ${error.message}`);
        }
    }
}

// Fonction principale
function fixAdminDashboard() {
    console.log('🚀 Démarrage de la correction du dashboard admin...');
    
    // 1. Vérifier l'authentification
    if (!fixAdminAuth()) {
        return;
    }
    
    // 2. Tester les endpoints
    testAdminEndpoints();
    
    // 3. Forcer le rechargement des données
    setTimeout(() => {
        forceReloadAdminData();
    }, 1000);
}

// Exécuter la correction
fixAdminDashboard();

// Exporter les fonctions pour utilisation manuelle
window.fixAdminDashboard = fixAdminDashboard;
window.forceReloadAdminData = forceReloadAdminData;
window.testAdminEndpoints = testAdminEndpoints;
window.fixAdminAuth = fixAdminAuth;

console.log('🔧 Script de correction chargé. Fonctions disponibles:');
console.log('- fixAdminDashboard()');
console.log('- forceReloadAdminData()');
console.log('- testAdminEndpoints()');
console.log('- fixAdminAuth()');

