import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Vérifier si l'utilisateur a explicitement demandé à rester connecté
    const rememberMe = localStorage.getItem('rememberMe');
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    // Ne restaurer l'utilisateur que si "Se souvenir de moi" est activé
    if (rememberMe === 'true' && savedUser && savedToken) {
      try {
        // Vérifier que le token est valide et non expiré
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          // Token expiré, nettoyer le localStorage
          console.log('Token expiré, déconnexion automatique');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('rememberMe');
        } else {
          // Token valide, charger l'utilisateur
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erreur parsing utilisateur ou token:', error);
        // Nettoyer le localStorage en cas d'erreur
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('rememberMe');
      }
    } else if (rememberMe !== 'true' && savedUser && savedToken) {
      // Si "Se souvenir de moi" n'est pas activé mais qu'il y a des données,
      // les nettoyer pour éviter l'affichage persistant
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('rememberMe');
    }
    
    // Délai minimal pour éviter les redirections flash
    const timer = setTimeout(() => {
      setLoading(false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Appel à l'API locale
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Sauvegarder les données selon le choix de l'utilisateur
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.token);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Ne pas sauvegarder si l'utilisateur ne veut pas rester connecté
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('rememberMe');
        }
        return true;
      }

      // Fallback vers le mode démo si l'API normale échoue
      console.log('Tentative de connexion en mode démo...');
      const demoResponse = await fetch('http://localhost:8081/api/demo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (demoResponse.ok) {
        const demoData = await demoResponse.json();
        setUser(demoData.user);
        
        // Sauvegarder les données selon le choix de l'utilisateur
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(demoData.user));
          localStorage.setItem('token', demoData.token);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Ne pas sauvegarder si l'utilisateur ne veut pas rester connecté
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('rememberMe');
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
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
    console.log('🔍 AuthContext - Déconnexion en cours...');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('rememberMe');
    sessionStorage.clear();
    console.log('🔍 AuthContext - localStorage et sessionStorage nettoyés');
    // La redirection sera gérée par les composants qui utilisent logout
  };


  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token d\'authentification trouvé');
        return false;
      }

      const response = await fetch('http://localhost:8081/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Erreur API:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
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
    try {
      const response = await fetch('http://localhost:8081/api/profile', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  // Charger l'utilisateur au démarrage si un token existe
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Vérifier que le token est toujours valide
        refreshUser();
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};