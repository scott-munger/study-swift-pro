import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText,
  Activity,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  totalAdmins: number;
  totalSubjects: number;
  totalFlashcards: number;
  totalForumPosts: number;
  totalMessages: number;
  totalSessions: number;
  revenue: number;
  systemHealth: string;
  activeUsers: number;
  newUsersThisMonth: number;
  newPostsThisWeek: number;
  averageSessionDuration: number;
}

interface UserActivity {
  date: string;
  users: number;
  posts: number;
  sessions: number;
}

interface SubjectStats {
  name: string;
  flashcards: number;
  posts: number;
  students: number;
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  databaseConnections: number;
}

const ModernAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin: contextIsAdmin } = useAdmin();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
    totalAdmins: 0,
    totalSubjects: 0,
    totalFlashcards: 0,
    totalForumPosts: 0,
    totalMessages: 0,
    totalSessions: 0,
    revenue: 0,
    systemHealth: 'good',
    activeUsers: 0,
    newUsersThisMonth: 0,
    newPostsThisWeek: 0,
    averageSessionDuration: 0
  });

  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'good',
    uptime: '99.9%',
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    databaseConnections: 0
  });


  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (savedToken) {
      setToken(savedToken);
      loadDashboardData(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async (authToken: string) => {
    try {
      setLoading(true);
      
      // Charger les statistiques principales
      const statsResponse = await fetch('http://localhost:8081/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Normaliser les champs attendus par le frontend
        const normalized = {
          totalUsers: statsData.totalUsers ?? 0,
          totalStudents: statsData.breakdown?.students ?? 0,
          totalTutors: statsData.totalTutors ?? 0,
          totalAdmins: statsData.breakdown?.admins ?? 0,
          totalSubjects: 0, // Pas dans l'API actuelle
          totalFlashcards: statsData.breakdown?.flashcards ?? 0,
          totalForumPosts: statsData.breakdown?.forumPosts ?? 0,
          totalMessages: statsData.totalMessages ?? 0,
          totalSessions: statsData.totalSessions ?? 0,
          revenue: statsData.revenue ?? 0,
          systemHealth: statsData.systemHealth ?? 'good',
          activeUsers: statsData.activeUsers ?? 0,
          newUsersThisMonth: 0, // Pas dans l'API actuelle
          newPostsThisWeek: 0, // Pas dans l'API actuelle
          averageSessionDuration: 0, // Pas dans l'API actuelle
        } as typeof stats;
        
        setStats(normalized);
      } else {
        const errorData = await statsResponse.json().catch(() => ({ error: 'Erreur de parsing' }));
        toast({
          title: "Erreur",
          description: `Erreur lors du chargement des statistiques: ${errorData.error || 'Erreur inconnue'}`,
          variant: "destructive"
        });
      }

      // Charger les données d'activité depuis l'API
      const activityResponse = await fetch('http://localhost:8081/api/admin/activity-data', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setUserActivity(activityData);
      }

      // Charger les statistiques par matière depuis l'API
      const subjectStatsResponse = await fetch('http://localhost:8081/api/admin/subject-stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (subjectStatsResponse.ok) {
        const subjectData = await subjectStatsResponse.json();
        setSubjectStats(subjectData);
      }

      // Charger les données de santé du système depuis l'API
      const systemHealthResponse = await fetch('http://localhost:8081/api/admin/system-health', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (systemHealthResponse.ok) {
        const systemHealthData = await systemHealthResponse.json();
        setSystemHealth(systemHealthData);
      }

    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les données du dashboard: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (token) {
      loadDashboardData(token);
      toast({
        title: "Données actualisées",
        description: "Toutes les données ont été mises à jour depuis la base de données",
      });
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const hasToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  
  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Non connecté</h2>
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page</p>
          <Button onClick={() => navigate('/login')}>Se connecter</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
              <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme éducative</p>
              <Badge variant="secondary" className="mt-2">
                📊 Données dynamiques en temps réel
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`${getHealthColor(systemHealth.status)} border-0`}>
                {getHealthIcon(systemHealth.status)}
                <span className="ml-2 capitalize">{systemHealth.status}</span>
              </Badge>
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs Totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600">+{stats.newUsersThisMonth} ce mois</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Matières</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                  <p className="text-xs text-blue-600">{stats.totalFlashcards} flashcards</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts Forum</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalForumPosts}</p>
                  <p className="text-xs text-purple-600">+{stats.newPostsThisWeek} cette semaine</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  <p className="text-xs text-orange-600">{stats.averageSessionDuration}min moy.</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique d'activité */}
              <Card>
                <CardHeader>
                  <CardTitle>Activité des Utilisateurs</CardTitle>
                  <CardDescription>Évolution sur les 7 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="posts" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="sessions" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition des utilisateurs */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Utilisateurs</CardTitle>
                  <CardDescription>Par type de compte</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Étudiants', value: stats.totalStudents, color: '#0088FE' },
                          { name: 'Tuteurs', value: stats.totalTutors, color: '#00C49F' },
                          { name: 'Admins', value: stats.totalAdmins, color: '#FFBB28' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Étudiants', value: stats.totalStudents, color: '#0088FE' },
                          { name: 'Tuteurs', value: stats.totalTutors, color: '#00C49F' },
                          { name: 'Admins', value: stats.totalAdmins, color: '#FFBB28' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Statistiques par matière */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques par Matière</CardTitle>
                <CardDescription>Performance des différentes matières</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Chargement des statistiques par matière...</p>
                    </div>
                  </div>
                ) : subjectStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={subjectStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="flashcards" fill="#8884d8" name="Flashcards" />
                      <Bar dataKey="posts" fill="#82ca9d" name="Posts Forum" />
                      <Bar dataKey="students" fill="#ffc658" name="Étudiants" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">Aucune donnée de matière disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytiques */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Inscriptions</CardTitle>
                  <CardDescription>Nouveaux utilisateurs par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Chargement des données...</p>
                      </div>
                    </div>
                  ) : userActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">Aucune donnée d'activité disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Forum</CardTitle>
                  <CardDescription>Posts et interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Chargement des données...</p>
                      </div>
                    </div>
                  ) : userActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="posts" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">Aucune donnée d'engagement disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestion des Utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>Interface complète de gestion des comptes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Interface de Gestion des Utilisateurs
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Accédez à l'interface complète pour gérer tous les utilisateurs
                  </p>
                  <Button onClick={() => navigate('/admin/users')} size="lg">
                    <Users className="w-5 h-5 mr-2" />
                    Ouvrir la Gestion des Utilisateurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion du Contenu */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>Gérez les cartes d'apprentissage</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/flashcards')} className="w-full">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Gérer les Flashcards
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Matières</CardTitle>
                  <CardDescription>Gérez les matières et chapitres</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/subjects')} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Gérer les Matières
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modération Forum</CardTitle>
                  <CardDescription>Modérez les discussions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/moderation')} className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Modérer le Forum
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Images Forum</CardTitle>
                  <CardDescription>Gérez les images uploadées</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/forum-images')} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Gérer les Images
                  </Button>
                </CardContent>
              </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tests de Connaissances</CardTitle>
              <CardDescription>Gérez les tests et importez depuis CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/tests')} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Gérer les Tests
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>Créez et gérez vos flashcards dynamiquement</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/flashcards-crud')} className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Gérer les Flashcards
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tuteurs</CardTitle>
              <CardDescription>Gérez les tuteurs et leurs informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/tutors')} className="w-full bg-primary hover:bg-primary/90">
                <Users className="w-4 h-4 mr-2" />
                Gérer les Tuteurs
              </Button>
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          {/* Système */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Santé du Système</CardTitle>
                  <CardDescription>État général de la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Serveur</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Opérationnel
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Base de données</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Database className="w-3 h-3 mr-1" />
                        Connectée
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uptime</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Server className="w-3 h-3 mr-1" />
                        {systemHealth.uptime}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ressources Système</CardTitle>
                  <CardDescription>Utilisation des ressources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mémoire</span>
                        <span>{systemHealth.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${systemHealth.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU</span>
                        <span>{systemHealth.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${systemHealth.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disque</span>
                        <span>{systemHealth.diskUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${systemHealth.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernAdminDashboard;
