import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  lastLogin: Date;
  isActive: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTutors: number;
  verifiedTutors: number;
  totalMessages: number;
  totalSessions: number;
  revenue: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface AdminActivity {
  id: string;
  type: 'user_action' | 'system_event' | 'security_alert' | 'moderation';
  action: string;
  user: string;
  details: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  stats: AdminStats;
  activities: AdminActivity[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshStats: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  
  // CRUD Users
  getUsers: () => Promise<any[]>;
  createUser: (userData: any) => Promise<any>;
  updateUser: (userId: number, userData: any) => Promise<any>;
  deleteUser: (userId: number) => Promise<boolean>;
  changeUserPassword: (userId: number, newPassword: string) => Promise<boolean>;
  
  // CRUD Tutors
  createTutor: (tutorData: any) => Promise<any>;
  updateTutor: (tutorId: number, tutorData: any) => Promise<any>;
  deleteTutor: (tutorId: number) => Promise<boolean>;
  
  // CRUD Forum
  moderatePost: (postId: number, action: string, data?: any) => Promise<boolean>;
  
  // CRUD Subjects
  getSubjects: () => Promise<any[]>;
  createSubject: (subjectData: any) => Promise<any>;
  updateSubject: (subjectId: number, subjectData: any) => Promise<any>;
  deleteSubject: (subjectId: number) => Promise<boolean>;
  
  // CRUD Flashcards
  getFlashcards: (subjectId?: number, page?: number) => Promise<any>;
  deleteFlashcard: (flashcardId: number) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTutors: 0,
    verifiedTutors: 0,
    totalMessages: 0,
    totalSessions: 0,
    revenue: 0,
    systemHealth: 'good'
  });
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = adminUser !== null;

  // Permissions par rôle
  const getRolePermissions = (role: string): string[] => {
    const permissions = {
      super_admin: [
        'users.read', 'users.create', 'users.update', 'users.delete',
        'tutors.read', 'tutors.create', 'tutors.update', 'tutors.delete',
        'messages.read', 'messages.moderate', 'messages.delete',
        'sessions.read', 'sessions.manage',
        'system.config', 'system.maintenance',
        'analytics.read', 'reports.generate',
        'admin.manage', 'logs.read'
      ],
      admin: [
        'users.read', 'users.update',
        'tutors.read', 'tutors.update', 'tutors.verify',
        'messages.read', 'messages.moderate',
        'sessions.read', 'sessions.manage',
        'analytics.read', 'reports.generate'
      ],
      moderator: [
        'users.read',
        'tutors.read',
        'messages.read', 'messages.moderate',
        'sessions.read'
      ],
      support: [
        'users.read',
        'messages.read',
        'sessions.read'
      ]
    };
    return permissions[role as keyof typeof permissions] || [];
  };

  // Vérifier les permissions
  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    return adminUser.permissions.includes(permission);
  };

  // Login admin
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Appel à l'API réelle pour l'authentification admin
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Vérifier que l'utilisateur a le rôle ADMIN
        if (data.user.role === 'ADMIN') {
          const newAdminUser: AdminUser = {
            id: data.user.id.toString(),
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            role: 'super_admin',
            permissions: getRolePermissions('super_admin'),
            lastLogin: new Date(),
            isActive: true
          };
          
          setAdminUser(newAdminUser);
          localStorage.setItem('adminUser', JSON.stringify(newAdminUser));
          localStorage.setItem('token', data.token);
          return true;
        } else {
          console.error('Utilisateur non autorisé - rôle:', data.user.role);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout admin
  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  // Charger les statistiques
  const refreshStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token d\'authentification trouvé');
        return;
      }

      const response = await fetch('http://localhost:8081/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers,
          activeUsers: data.activeUsers,
          totalTutors: data.totalTutors,
          verifiedTutors: data.verifiedTutors,
          totalMessages: data.totalMessages,
          totalSessions: data.totalSessions,
          revenue: data.revenue,
          systemHealth: data.systemHealth
        });
      } else {
        console.error('Erreur lors de la récupération des statistiques:', response.status);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Charger les activités
  const refreshActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token d\'authentification trouvé');
        return;
      }

      const response = await fetch('http://localhost:8081/api/admin/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Convertir les timestamps en objets Date
        const activitiesWithDates = data.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        setActivities(activitiesWithDates);
      } else {
        console.error('Erreur lors de la récupération des activités:', response.status);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Initialiser l'admin depuis localStorage
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdminUser(adminData);
      } catch (error) {
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  // Vérifier si l'utilisateur connecté est admin
  useEffect(() => {
    // Attendre que l'auth soit prête avant d'évaluer le rôle
    if (authLoading) return;

    console.log('AdminContext useEffect:', { user, userRole: user?.role, authLoading });
    if (user && user.role === 'ADMIN') {
      console.log('Création du contexte admin pour:', user.email);
      const adminUserData: AdminUser = {
        id: user.id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: 'super_admin',
        permissions: getRolePermissions('super_admin'),
        lastLogin: new Date(),
        isActive: true
      };
      setAdminUser(adminUserData);
      localStorage.setItem('adminUser', JSON.stringify(adminUserData));
    } else if (user && typeof user.role !== 'undefined' && user.role !== 'ADMIN') {
      // Ne dégrade pas si le rôle est momentanément undefined (ex: refreshUser partiel)
      console.log('Utilisateur non-admin détecté:', user.email, user.role);
      setAdminUser(null);
      localStorage.removeItem('adminUser');
    }
  }, [user, authLoading]);

  // ===== FONCTIONS CRUD =====

  // CRUD Users
  const getUsers = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const createUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la création de l\'utilisateur');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: number, userData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await refreshStats();
        await refreshActivities();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const changeUserPassword = async (userId: number, newPassword: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      return response.ok;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  // CRUD Tutors
  const createTutor = async (tutorData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/tutors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tutorData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la création du tuteur');
    } catch (error) {
      console.error('Error creating tutor:', error);
      throw error;
    }
  };

  const updateTutor = async (tutorId: number, tutorData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/tutors/${tutorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tutorData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la mise à jour du tuteur');
    } catch (error) {
      console.error('Error updating tutor:', error);
      throw error;
    }
  };

  const deleteTutor = async (tutorId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/tutors/${tutorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await refreshStats();
        await refreshActivities();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting tutor:', error);
      return false;
    }
  };

  // CRUD Forum
  const moderatePost = async (postId: number, action: string, data?: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/forum-posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...data })
      });

      if (response.ok) {
        await refreshStats();
        await refreshActivities();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error moderating post:', error);
      return false;
    }
  };

  // CRUD Subjects
  const getSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  };

  const createSubject = async (subjectData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la création de la matière');
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  };

  const updateSubject = async (subjectId: number, subjectData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectData)
      });

      if (response.ok) {
        const data = await response.json();
        await refreshStats();
        await refreshActivities();
        return data;
      }
      throw new Error('Erreur lors de la mise à jour de la matière');
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  };

  const deleteSubject = async (subjectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await refreshStats();
        await refreshActivities();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting subject:', error);
      return false;
    }
  };

  // CRUD Flashcards
  const getFlashcards = async (subjectId?: number, page: number = 1) => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL('http://localhost:8081/api/admin/flashcards');
      if (subjectId) url.searchParams.append('subjectId', subjectId.toString());
      url.searchParams.append('page', page.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return { flashcards: [], pagination: {} };
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      return { flashcards: [], pagination: {} };
    }
  };

  const deleteFlashcard = async (flashcardId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/flashcards/${flashcardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await refreshStats();
        await refreshActivities();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      return false;
    }
  };

  // Charger les données initiales
  useEffect(() => {
    if (adminUser || (user && user.role === 'ADMIN')) {
      refreshStats();
      refreshActivities();
    }
  }, [adminUser, user]);

  const value: AdminContextType = {
    adminUser,
    isAdmin,
    stats,
    activities,
    loading,
    login,
    logout,
    hasPermission,
    refreshStats,
    refreshActivities,
    
    // CRUD Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    
    // CRUD Tutors
    createTutor,
    updateTutor,
    deleteTutor,
    
    // CRUD Forum
    moderatePost,
    
    // CRUD Subjects
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    
    // CRUD Flashcards
    getFlashcards,
    deleteFlashcard
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
