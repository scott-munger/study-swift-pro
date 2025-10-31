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

export default API_CONFIG;
