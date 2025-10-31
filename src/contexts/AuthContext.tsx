import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearUserStorage } from '@/utils/clearStorage';

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
    console.log('🔐 AuthContext - Chargement initial...');
    
    // Charger l'utilisateur depuis localStorage de manière simple
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔐 AuthContext - Utilisateur chargé:', userData.email);
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
    
    // Terminer le chargement immédiatement
    setLoading(false);
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
        setUser(data.user);
        
        // Toujours persister dans les deux stockages pour éviter les 401
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        console.log('💾 Données sauvegardées dans localStorage et sessionStorage');
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
      
      // Appel à l'API d'inscription
      const response = await fetch('http://localhost:8081/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName, 
          lastName, 
          userClass, 
          section, 
          department, 
          phone, 
          address,
          role: role || 'STUDENT',
          tutorData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Erreur d\'inscription:', response.status, errorData);
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

      const response = await fetch('http://localhost:8081/api/profile/photo', {
        method: 'POST',
        headers: getAuthHeaders(),
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


  const value = {
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