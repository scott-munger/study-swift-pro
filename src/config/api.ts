// Configuration API centralisée
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    SUBJECTS_FLASHCARDS: `${API_BASE_URL}/subjects-flashcards`,
    SUBJECT_FLASHCARDS: (id: number) => `${API_BASE_URL}/subject-flashcards/${id}`,
    
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
    
    // Administration
    ADMIN_STATS: `${API_BASE_URL}/admin/stats`,
    ADMIN_USERS: `${API_BASE_URL}/admin/users`,
    ADMIN_FLASHCARDS: `${API_BASE_URL}/admin/flashcards`,
    ADMIN_SUBJECTS: `${API_BASE_URL}/admin/subjects`,
    
    // Santé
    HEALTH: `${API_BASE_URL}/health`,
  }
};

export default API_CONFIG;
