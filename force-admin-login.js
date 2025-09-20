// Script pour forcer la connexion admin et charger les données
async function forceAdminLogin() {
    try {
        console.log('🔐 Connexion admin en cours...');
        
        // Connexion admin
        const response = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'admin123'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Connexion réussie:', data.user);
        
        // Stocker le token et l'utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('💾 Token stocké dans localStorage');
        
        // Charger les données du dashboard
        await loadDashboardData(data.token);
        
        // Redirection vers le dashboard
        window.location.href = 'http://localhost:8080/simple-admin/dashboard';
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur de connexion: ' + error.message);
    }
}

async function loadDashboardData(token) {
    try {
        console.log('📊 Chargement des données du dashboard...');
        
        // Charger les statistiques
        const statsResponse = await fetch('http://localhost:8081/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('📈 Statistiques:', stats);
            localStorage.setItem('dashboardStats', JSON.stringify(stats));
        }
        
        // Charger les utilisateurs
        const usersResponse = await fetch('http://localhost:8081/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log('👥 Utilisateurs:', users.length);
            localStorage.setItem('dashboardUsers', JSON.stringify(users));
        }
        
        // Charger les matières
        const subjectsResponse = await fetch('http://localhost:8081/api/admin/subjects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (subjectsResponse.ok) {
            const subjects = await subjectsResponse.json();
            console.log('📚 Matières:', subjects.length);
            localStorage.setItem('dashboardSubjects', JSON.stringify(subjects));
        }
        
        // Charger les flashcards
        const flashcardsResponse = await fetch('http://localhost:8081/api/admin/flashcards', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (flashcardsResponse.ok) {
            const flashcards = await flashcardsResponse.json();
            console.log('🎴 Flashcards:', flashcards.length);
            localStorage.setItem('dashboardFlashcards', JSON.stringify(flashcards));
        }
        
        console.log('✅ Toutes les données chargées');
        
    } catch (error) {
        console.error('❌ Erreur chargement données:', error);
    }
}

// Exécution automatique
console.log('🚀 Script de connexion admin démarré');
forceAdminLogin();