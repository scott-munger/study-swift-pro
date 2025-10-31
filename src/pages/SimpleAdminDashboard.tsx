import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Shield, 
  BarChart3,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { validateClassSection } from '@/lib/classConfig';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userClass?: string;
  section?: string;
  department?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  id: number;
  name: string;
  level: string;
  description?: string;
  createdAt: string;
  _count?: {
    flashcards: number;
    forumPosts: number;
    tutors: number;
  };
}


interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTutors: number;
  verifiedTutors: number;
  totalMessages: number;
  totalSessions: number;
  revenue: number;
  systemHealth: string;
}

const SimpleAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTutors: 0,
    verifiedTutors: 0,
    totalMessages: 0,
    totalSessions: 0,
    revenue: 0,
    systemHealth: 'good'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Rediriger définitivement ce tableau de bord vers la page unique de gestion des matières
  useEffect(() => {
    navigate('/admin/subjects', { replace: true });
  }, []);

  // Gérer les paramètres de requête pour les onglets
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'users', 'subjects', 'profile'].includes(tab)) {
      if (tab === 'users') {
        // Rediriger directement vers la gestion des utilisateurs
        navigate('/admin/users', { replace: true });
        return;
      }
      setActiveTab(tab);
    }
  }, []);

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = (tab: string) => {
    if (tab === 'users') {
      // Aller directement sur la page dédiée de gestion des utilisateurs
      navigate('/admin/users');
      return;
    }
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // États pour les modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // États pour les formulaires
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    userClass: '',
    section: '',
    department: '',
    phone: '',
    address: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    level: '',
    description: ''
  });


  // Vérifier l'authentification au chargement
  useEffect(() => {
    console.log('🔐 Vérification de l\'authentification...');
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('adminUser');
    
    console.log('🔐 Token trouvé:', savedToken ? 'Oui' : 'Non');
    console.log('🔐 User trouvé:', savedUser ? 'Oui' : 'Non');
    console.log('🔐 Admin trouvé:', savedAdmin ? 'Oui' : 'Non');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔐 Utilisateur connecté:', userData);
        
        if (userData.role === 'ADMIN') {
          console.log('🔐 Utilisateur admin confirmé, chargement des données...');
          setToken(savedToken);
          // Délai pour s'assurer que le token est bien défini
          setTimeout(() => {
            loadData();
          }, 100);
        } else {
          console.log('🔐 Utilisateur non-admin, redirection...');
          navigate('/');
        }
      } catch (error) {
        console.error('🔐 Erreur parsing user data:', error);
        navigate('/login');
      }
    } else {
      console.log('🔐 Aucun token ou utilisateur, redirection vers la connexion...');
      // Rediriger vers la page de connexion admin
      navigate('/login');
    }
  }, []);


  const loadData = async () => {
    const currentToken = token || localStorage.getItem('token');
    
    if (!currentToken) {
      console.log('❌ Aucun token disponible pour charger les données');
      return;
    }
    
    console.log('🔄 Début du chargement des données...');
    setLoading(true);
    try {
      // Charger toutes les données en parallèle pour de meilleures performances
      await Promise.all([
        loadStats(currentToken),
        loadUsers(currentToken),
        loadSubjects(currentToken)
      ]);
      
      console.log('✅ Toutes les données chargées avec succès');
      toast({
        title: "Données chargées",
        description: "Toutes les données ont été mises à jour avec succès",
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (currentToken = token) => {
    console.log('🔍 Chargement des statistiques avec token:', currentToken ? 'présent' : 'absent');
    const response = await fetch('http://localhost:8081/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Réponse statistiques:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📈 Données statistiques reçues:', data);
      setStats(data);
    } else {
      const errorData = await response.json();
      console.error('❌ Erreur statistiques:', errorData);
    }
  };

  const loadUsers = async (currentToken = token) => {
    console.log('👥 Chargement des utilisateurs...');
    const response = await fetch('http://localhost:8081/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('👥 Réponse utilisateurs:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('👥 Données utilisateurs reçues:', data.length, 'utilisateurs');
      setUsers(data);
    } else {
      const errorData = await response.json();
      console.error('❌ Erreur utilisateurs:', errorData);
    }
  };

  const loadSubjects = async (currentToken = token) => {
    console.log('📚 Chargement des matières...');
    const response = await fetch('http://localhost:8081/api/admin/subjects', {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Réponse matières:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📚 Données matières reçues:', data.length, 'matières');
      setSubjects(data);
    } else {
      const errorData = await response.json();
      console.error('❌ Erreur matières:', errorData);
    }
  };


  const handleCreateUser = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès"
        });
        setShowUserModal(false);
        resetUserForm();
        loadUsers();
        loadStats();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès"
        });
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
        loadUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès"
        });
        loadUsers();
        loadStats();
      } else if (response.status === 401) {
        // Token invalide ou expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (response.status === 403) {
        // Accès refusé
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectForm)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Matière créée avec succès"
        });
        setShowSubjectModal(false);
        resetSubjectForm();
        loadSubjects();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectForm)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Matière mise à jour avec succès"
        });
        setShowSubjectModal(false);
        setEditingSubject(null);
        resetSubjectForm();
        loadSubjects();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Matière supprimée avec succès"
        });
        loadSubjects();
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };


  const resetUserForm = () => {
    setUserForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STUDENT',
      userClass: '',
      section: '',
      department: '',
      phone: '',
      address: ''
    });
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      level: '',
      description: ''
    });
  };



  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userClass: user.userClass || '',
      section: user.section || '',
      department: user.department || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowUserModal(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      level: subject.level,
      description: subject.description || ''
    });
    setShowSubjectModal(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('user'); // Nettoyer aussi les données utilisateur
    navigate('/'); // Rediriger vers la page d'accueil générale
  };

  // Vérification du token et affichage de chargement
  if (!token) {
    console.log('🔐 Aucun token disponible, affichage de chargement...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Affichage de chargement des données
  if (loading && (!stats || !users.length)) {
    console.log('📊 Chargement des données en cours...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-gray-600">Récupération des statistiques et données administratives...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur si pas de données après chargement
  if (!loading && (!stats || !users.length)) {
    console.log('❌ Aucune donnée disponible après chargement');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données administratives.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recharger la page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Matières</h1>
                <p className="text-sm text-gray-500">Gérez toutes les matières de la plateforme</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Chargement...' : 'Actualiser'}
              </Button>
              <Button onClick={logout} variant="outline" size="sm">
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value="subjects" onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subjects">Matières</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble supprimée */}
          {false && (
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tuteurs</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTutors}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.verifiedTutors} vérifiés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    Total échangés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.revenue} HTG</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions complétées
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Santé du Système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    {stats.systemHealth === 'excellent' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {stats.systemHealth === 'good' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                    {stats.systemHealth === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {stats.systemHealth === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    <span className="capitalize font-medium">{stats.systemHealth}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Utilisateurs actifs:</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tuteurs vérifiés:</span>
                      <span className="font-medium">{stats.verifiedTutors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions totales:</span>
                      <span className="font-medium">{stats.totalSessions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dernières Activités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{users.length} utilisateurs enregistrés</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{subjects.length} matières disponibles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{stats.totalMessages} messages échangés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => handleTabChange('users')} className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Gérer les Utilisateurs
                  </Button>
                  <Button onClick={() => handleTabChange('subjects')} className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gérer les Matières
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>)}

          {/* Gestion des Utilisateurs supprimée (navigation vers /admin/users) */}
          {false && (
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
              <Button onClick={() => navigate('/admin/users')}>
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gestion des Utilisateurs
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Accédez à l'interface complète de gestion des utilisateurs
                  </p>
                  <Button onClick={() => navigate('/admin/users')}>
                    Ouvrir la gestion des utilisateurs
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        placeholder={editingUser ? "Laisser vide pour ne pas changer" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={userForm.firstName}
                        onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={userForm.lastName}
                        onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Étudiant</SelectItem>
                          <SelectItem value="TUTOR">Tuteur</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <ClassSectionSelector
                        selectedClass={userForm.userClass || ''}
                        selectedSection={userForm.section || ''}
                        onClassChange={(className) => setUserForm({...userForm, userClass: className})}
                        onSectionChange={(section) => setUserForm({...userForm, section: section})}
                        showLabel={true}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Département</Label>
                      <Input
                        id="department"
                        value={userForm.department}
                        onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUserModal(false)}>
                      Annuler
                    </Button>
                    <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                      {editingUser ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'TUTOR' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.userClass || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>)}

          {/* Gestion des Matières */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Matières</h2>
              <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetSubjectForm(); setEditingSubject(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Matière
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSubject ? 'Modifiez les informations de la matière' : 'Créez une nouvelle matière'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subjectName">Nom</Label>
                      <Input
                        id="subjectName"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">Niveau</Label>
                      <Select value={subjectForm.level} onValueChange={(value) => setSubjectForm({...subjectForm, level: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Débutant">Débutant</SelectItem>
                          <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                          <SelectItem value="Avancé">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={subjectForm.description}
                        onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSubjectModal(false)}>
                      Annuler
                    </Button>
                    <Button onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}>
                      {editingSubject ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      {subject.name}
                      <Badge variant="outline">{subject.level}</Badge>
                    </CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Flashcards:</span>
                        <span>{subject._count?.flashcards || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Posts Forum:</span>
                        <span>{subject._count?.forumPosts || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tuteurs:</span>
                        <span>{subject._count?.tutors || 0}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => openEditSubject(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteSubject(subject.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestion des Tests */}
          <TabsContent value="tests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Tests</h2>
              <Button onClick={() => navigate('/admin/tests')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Gérer les Tests
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tests de Connaissances
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Gérez les tests de connaissances et importez depuis CSV
                  </p>
                  <Button onClick={() => navigate('/admin/tests')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ouvrir la gestion des tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profil supprimé */}
          {false && (
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Profil Administrateur</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Administrateur</h3>
                      <p className="text-gray-600">Rôle: Super Administrateur</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">admin@tyala.com</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nom</Label>
                      <p className="text-sm text-gray-600">Administrateur Tyala</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Dernière connexion</Label>
                      <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                      <div className="text-sm text-gray-600">Utilisateurs gérés</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{subjects.length}</div>
                      <div className="text-sm text-gray-600">Matières créées</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalMessages}</div>
                      <div className="text-sm text-gray-600">Messages modérés</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actions Administratives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => handleTabChange('users')} className="h-20 flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 mb-2" />
                    Gérer les Utilisateurs
                  </Button>
                  <Button onClick={() => handleTabChange('subjects')} variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <BookOpen className="h-6 w-6 mb-2" />
                    Gérer les Matières
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>)}
        </Tabs>
      </main>
    </div>
  );
};

export default SimpleAdminDashboard;
