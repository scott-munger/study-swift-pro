// Configuration API centralisée
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Export de l'URL de base pour un usage simple
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Authentification
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    DEMO_LOGIN: `${API_BASE_URL}/demo/login`,
    
    // Profil
    PROFILE: `${API_BASE_URL}/profile`,
    
    // Matières
    SUBJECTS: `${API_BASE_URL}/subjects`,
    SUBJECT_CHAPTERS: (id: number) => `${API_BASE_URL}/subject-chapters/${id}`,
    
    // Flashcards
    FLASHCARDS: (subjectId: number) => `${API_BASE_URL}/flashcards/${subjectId}`,
    FLASHCARD_ATTEMPT: `${API_BASE_URL}/flashcard-attempt`,
    STATS_FLASHCARDS: `${API_BASE_URL}/stats-flashcards`,
    SUBJECTS_FLASHCARDS: `${API_BASE_URL}/subjects-flashcards`,
    SUBJECT_FLASHCARDS: (id: number) => `${API_BASE_URL}/subject-flashcards/${id}`,
    USER_FLASHCARDS: `${API_BASE_URL}/user/flashcards`,
    
    // Forum
    FORUM_POSTS: `${API_BASE_URL}/forum/posts`,
    FORUM_POST: (id: number) => `${API_BASE_URL}/forum/posts/${id}`,
    FORUM_REPLIES: (id: number) => `${API_BASE_URL}/forum/posts/${id}/replies`,
    
    // Tests de Connaissances
    KNOWLEDGE_TESTS: (subjectId: number) => `${API_BASE_URL}/knowledge-tests/${subjectId}`,
    KNOWLEDGE_TEST: (testId: number) => `${API_BASE_URL}/knowledge-tests/test/${testId}`,
    KNOWLEDGE_TEST_SUBMIT: (testId: number) => `${API_BASE_URL}/knowledge-tests/${testId}/submit`,
    KNOWLEDGE_TEST_RESULTS: (userId: number) => `${API_BASE_URL}/knowledge-tests/results/${userId}`,
    
    // Administration
    ADMIN_STATS: `${API_BASE_URL}/admin/stats`,
    ADMIN_USERS: `${API_BASE_URL}/admin/users`,
    ADMIN_FLASHCARDS: `${API_BASE_URL}/admin/flashcards`,
    ADMIN_SUBJECTS: `${API_BASE_URL}/admin/subjects`,
    ADMIN_KNOWLEDGE_TESTS: `${API_BASE_URL}/admin/knowledge-tests`,
    
    // Santé
    HEALTH: `${API_BASE_URL}/health`,
  }
};

// Helper function pour les requêtes admin avec gestion d'erreur correcte
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token non trouvé. Veuillez vous reconnecter.');
  }

  // Note: On ne vérifie PAS le rôle dans le token ici car le rôle peut avoir changé en DB
  // Le serveur vérifiera le rôle réel dans la base de données via requireAdmin
  // On fait juste un décodage pour le log
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔐 adminFetch: Rôle dans token JWT:', payload.role);
      // Ne pas bloquer même si le rôle dans le token n'est pas ADMIN
      // Le serveur vérifiera le rôle réel en DB
    }
  } catch (err) {
    console.warn('⚠️ adminFetch: Impossible de décoder le token JWT:', err);
  }

  console.log(`📡 adminFetch: Requête vers ${url}`);
  console.log(`📡 adminFetch: Token présent: ${!!token}, longueur: ${token.length}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  console.log(`📡 adminFetch: Réponse ${response.status} ${response.statusText}`);

  // Gérer les erreurs correctement pour éviter "Unexpected token '<'"
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    console.error(`❌ adminFetch: Erreur ${response.status}, Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      // Réponse JSON normale
      const errorData = await response.json();
      console.error('❌ adminFetch: Erreur JSON:', errorData);
      throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
    } else {
      // Réponse HTML (erreur serveur) - essayer de parser comme JSON quand même
      const text = await response.text();
      console.error('❌ adminFetch: Erreur texte:', text.substring(0, 200));
      let errorData;
      try {
        errorData = JSON.parse(text);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    }
  }

  // Vérifier que la réponse est bien JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    try {
      return new Response(JSON.stringify(JSON.parse(text)), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch {
      throw new Error('Réponse serveur invalide (pas JSON)');
    }
  }

  return response;
}

export default API_CONFIG;
