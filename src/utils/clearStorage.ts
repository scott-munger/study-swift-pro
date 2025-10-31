// Utilitaire pour nettoyer uniquement les données utilisateur (pas admin)
export const clearUserStorage = () => {
  console.log('Nettoyage des données utilisateur...');
  
  // Nettoyer uniquement les données utilisateur
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('rememberMe');
  
  // Nettoyer sessionStorage utilisateur
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  console.log('Nettoyage des données utilisateur terminé');
};

// Utilitaire pour nettoyer complètement le localStorage et sessionStorage (y compris admin)
export const clearAllStorage = () => {
  console.log('Nettoyage complet du localStorage et sessionStorage...');
  
  // Nettoyer localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('rememberMe');
  
  // Nettoyer sessionStorage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.clear();
  
  console.log('Nettoyage terminé - aucune donnée persistée');
};

// Fonction pour vérifier s'il y a des données persistées
export const hasPersistedData = (): boolean => {
  const hasLocalData = !!(
    localStorage.getItem('user') ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminUser') ||
    localStorage.getItem('adminToken')
  );
  
  const hasSessionData = !!(
    sessionStorage.getItem('user') ||
    sessionStorage.getItem('token')
  );
  
  return hasLocalData || hasSessionData;
};
