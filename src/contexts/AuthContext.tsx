import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearUserStorage } from '@/utils/clearStorage';
import { API_URL } from '@/config/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  userClass?: string | null;
  section?: string | null;
  department?: string | null;
  phone?: string | null;
  address?: string | null;
  profilePhoto?: string | null;
  isProfilePrivate?: boolean;
  darkMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TutorData {
  experience: number;
  hourlyRate: number;
  bio: string;
  proofFile: File | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string, userClass?: string, section?: string, department?: string, phone?: string, address?: string, role?: string, tutorData?: TutorData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  uploadProfilePhoto: (photo: File) => Promise<boolean>;
  deleteProfilePhoto: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 AuthContext - Chargement initial...');
      
      // Charger l'utilisateur depuis localStorage
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('🔐 AuthContext - Utilisateur chargé:', userData.email, 'rôle:', userData.role);
          
          // Vérifier si le token contient le bon rôle
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const tokenRole = payload.role;
              
              // Si le rôle dans le token ne correspond pas au rôle en DB, rafraîchir
              if (tokenRole !== userData.role && (userData.role === 'ADMIN' || userData.email?.toLowerCase() === 'admin@test.com')) {
                console.log('🔄 AuthContext: Incohérence détectée - Token:', tokenRole, 'DB:', userData.role, ', rafraîchissement...');
                try {
                  const refreshResponse = await fetch('http://localhost:8081/api/auth/refresh-token', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    console.log('✅ AuthContext: Token rafraîchi, nouveau rôle:', refreshData.user.role);
                    localStorage.setItem('token', refreshData.token);
                    sessionStorage.setItem('token', refreshData.token);
                    localStorage.setItem('user', JSON.stringify(refreshData.user));
                    sessionStorage.setItem('user', JSON.stringify(refreshData.user));
                    setUser(refreshData.user);
                    setLoading(false);
                    return;
                  }
                } catch (err) {
                  console.warn('⚠️ AuthContext: Erreur rafraîchissement token:', err);
                }
              }
            }
          } catch (err) {
            console.warn('⚠️ AuthContext: Erreur décodage token:', err);
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Erreur parsing utilisateur:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      // Terminer le chargement
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      
      console.log('🔐 Tentative de connexion avec:', email);
      
      // Appel à l'API locale
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Réponse API login:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Login réussi:', data.user.email, data.user.role);
        
        // Si admin@test.com, forcer le rôle ADMIN et rafraîchir le token si nécessaire
        if (email.toLowerCase() === 'admin@test.com' && data.user.role !== 'ADMIN') {
          console.warn('⚠️ AuthContext: admin@test.com n\'a pas le rôle ADMIN, rafraîchissement du token...');
          try {
            const refreshResponse = await fetch('http://localhost:8081/api/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              console.log('✅ AuthContext: Token rafraîchi, nouveau rôle:', refreshData.user.role);
              data.user = refreshData.user;
              data.token = refreshData.token;
            }
          } catch (err) {
            console.error('❌ AuthContext: Erreur rafraîchissement token:', err);
          }
        }
        
        setUser(data.user);
        
        // Toujours persister dans les deux stockages pour éviter les 401
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        console.log('💾 Données sauvegardées dans localStorage et sessionStorage');
        console.log('🔐 Token final - Rôle:', data.user.role, ', Email:', data.user.email);
        return true;
      }

      // Fallback vers le mode démo si l'API normale échoue
      console.log('⚠️ Login normal échoué, tentative en mode démo...');
      const demoResponse = await fetch('http://localhost:8081/api/demo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Réponse API demo:', demoResponse.status, demoResponse.statusText);

      if (demoResponse.ok) {
        const demoData = await demoResponse.json();
        console.log('Login démo réussi:', demoData.user.email, demoData.user.role);
        setUser(demoData.user);
        
        // Toujours persister dans les deux stockages
        localStorage.setItem('user', JSON.stringify(demoData.user));
        localStorage.setItem('token', demoData.token);
        sessionStorage.setItem('user', JSON.stringify(demoData.user));
        sessionStorage.setItem('token', demoData.token);
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        console.log('💾 Données démo sauvegardées dans localStorage et sessionStorage');
        return true;
      }

      console.error('❌ Échec des deux méthodes de connexion');
      const errorData = await demoResponse.json().catch(() => ({}));
      console.error('❌ Détails erreur:', errorData);
      return false;
    } catch (error) {
      console.error('❌ Erreur de connexion (exception):', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, userClass?: string, section?: string, department?: string, phone?: string, address?: string, role?: string, tutorData?: TutorData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Vérifier que les champs requis sont présents
      if (!email || !password || !firstName || !lastName) {
        console.error('❌ Champs manquants pour l\'inscription:', {
          email: !!email,
          password: !!password,
          firstName: !!firstName,
          lastName: !!lastName
        });
        return false;
      }
      
      const requestBody = { 
        email: email.trim(), 
        password, 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        userClass: userClass || null, 
        section: section || null, 
        department: department || null, 
        phone: phone || null, 
        address: address || null,
        role: role || 'STUDENT',
        tutorData: tutorData || undefined
      };
      
      console.log('📤 Envoi inscription:', {
        email: requestBody.email,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        role: requestBody.role,
        hasTutorData: !!requestBody.tutorData
      });
      
      // Appel à l'API d'inscription
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        // NE PAS connecter l'utilisateur automatiquement
        // L'utilisateur doit vérifier son email avant de pouvoir se connecter
        console.log('✅ Inscription réussie:', data.message);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('❌ Erreur d\'inscription:', response.status, errorData);
        // Afficher le message d'erreur dans la console pour le débogage
        if (errorData.error) {
          console.error('❌ Message d\'erreur:', errorData.error);
        }
        if (errorData.missingFields) {
          console.error('❌ Champs manquants:', errorData.missingFields);
        }
      }

      return false;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Déconnexion complète en cours...');
    setUser(null);
    clearUserStorage();
    console.log('Déconnexion complète effectuée - données utilisateur nettoyées');
  };


  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      console.log('🔄 updateProfile - Début de la mise à jour...');
      console.log('📤 Données reçues:', profileData);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('❌ Aucun token d\'authentification trouvé');
        return false;
      }

      console.log('🔑 Token trouvé, envoi de la requête...');

      const response = await fetch('http://localhost:8081/api/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      console.log('Réponse reçue:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Mise à jour réussie:', result);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('❌ Erreur API:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8081/api/profile', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        logout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8081/api/profile/password', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    // Fonction simplifiée - ne fait rien pour éviter les déconnexions
    console.log('🔐 refreshUser - Fonction désactivée pour éviter les déconnexions');
  };

  const uploadProfilePhoto = async (photo: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Pour FormData, ne PAS inclure Content-Type - le navigateur l'ajoute automatiquement avec la boundary
      const response = await fetch('http://localhost:8081/api/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Ne pas ajouter Content-Type pour FormData
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Mettre à jour l'utilisateur avec la nouvelle photo
        if (user) {
          const updatedUser = { ...user, profilePhoto: data.user.profilePhoto };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo de profil:', error);
      return false;
    }
  };

  const deleteProfilePhoto = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8081/api/profile/photo', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Mettre à jour l'utilisateur en supprimant la photo
        if (user) {
          const updatedUser = { ...user, profilePhoto: null };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo de profil:', error);
      return false;
    }
  };


  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    updateProfile,
    deleteAccount,
    changePassword,
    refreshUser,
    uploadProfilePhoto,
    deleteProfilePhoto,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};