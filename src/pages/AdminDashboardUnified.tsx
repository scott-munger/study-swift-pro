import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Image,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  RefreshCw,
  Bell,
  MessageSquare,
  TrendingUp,
  Activity,
  CheckCircle,
  UserCheck,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Import des pages admin
import AdminUsers from './AdminUsers';
import AdminSubjects from './AdminSubjects';
import AdminFlashcards from './AdminFlashcards';
import AdminForumImages from './AdminForumImages';
import AdminModeration from './AdminModeration';
import AdminMessages from './AdminMessages';
import { API_URL } from '@/config/api';

const AdminDashboardUnified = () => {
  const { user, logout } = useAuth();
  const { stats, activities } = useAdmin();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Vérifier et mettre à jour le token si nécessaire au chargement
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (!token) {
        console.error('❌ AdminDashboardUnified: Pas de token, redirection login');
        navigate('/login');
        return;
      }

      // Décoder le token pour vérifier le rôle
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenEmail = payload.email;
        const tokenRole = payload.role;
        
        console.log('🔐 AdminDashboardUnified: Token décodé - Email:', tokenEmail, ', Rôle:', tokenRole);
        
        // Si le token dit STUDENT mais l'utilisateur est admin@test.com ou sur le dashboard admin
        if (tokenRole !== 'ADMIN') {
          console.warn('⚠️ AdminDashboardUnified: Token ne contient pas ADMIN (rôle:', tokenRole, ')');
          
          // Vérifier aussi dans savedUser si l'email correspond
          let savedUserData = null;
          try {
            if (savedUser) {
              savedUserData = JSON.parse(savedUser);
            }
          } catch (err) {
            console.warn('⚠️ AdminDashboardUnified: Erreur parsing savedUser:', err);
          }
          
          // Si c'est admin@test.com OU si l'utilisateur a le rôle ADMIN en DB mais pas dans le token, forcer le rafraîchissement
          const shouldRefresh = tokenEmail === 'admin@test.com' || 
                                (savedUserData && savedUserData.email === 'admin@test.com') ||
                                (savedUserData && savedUserData.role === 'ADMIN') ||
                                user?.role === 'ADMIN' ||
                                user?.email?.toLowerCase() === 'admin@test.com';
          
          if (shouldRefresh) {
            console.log('🔄 AdminDashboardUnified: admin@test.com détecté, rafraîchissement FORCÉ...');
            
            try {
              const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                const data = await response.json();
                console.log('✅ AdminDashboardUnified: Token rafraîchi, nouveau rôle:', data.user.role);
                
                if (data.user.role === 'ADMIN') {
                  // Mettre à jour le token et les données utilisateur
                  localStorage.setItem('token', data.token);
                  sessionStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  sessionStorage.setItem('user', JSON.stringify(data.user));
                  
                  // Recharger la page pour que AuthContext charge le nouveau token
                  console.log('🔄 AdminDashboardUnified: Rechargement avec nouveau token ADMIN...');
                  window.location.reload();
                  return;
                } else {
                  console.error('❌ AdminDashboardUnified: Après rafraîchissement, rôle toujours:', data.user.role);
                  // Forcer la reconnexion
                  localStorage.clear();
                  sessionStorage.clear();
                  navigate('/login');
                  return;
                }
              } else {
                const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                console.error('❌ AdminDashboardUnified: Erreur rafraîchissement:', errorData);
                
                // Si erreur 403/401, nettoyer et forcer reconnexion
                if (response.status === 403 || response.status === 401) {
                  console.error('❌ AdminDashboardUnified: Token invalide, nettoyage et redirection...');
                  localStorage.clear();
                  sessionStorage.clear();
                  navigate('/login');
                  return;
                }
              }
            } catch (error: any) {
              console.error('❌ AdminDashboardUnified: Erreur lors du rafraîchissement:', error);
              // En cas d'erreur, nettoyer et forcer reconnexion
              localStorage.clear();
              sessionStorage.clear();
              navigate('/login');
              return;
            }
          } else {
            // Si ce n'est pas admin@test.com et pas admin, rediriger
            console.error('❌ AdminDashboardUnified: Utilisateur non-admin (email:', tokenEmail, ', rôle:', tokenRole, ')');
            navigate('/');
            return;
          }
        } else {
          console.log('✅ AdminDashboardUnified: Token valide avec rôle ADMIN');
        }
      } catch (error) {
        console.error('❌ AdminDashboardUnified: Erreur décodage token:', error);
        // Si erreur de décodage, nettoyer et rediriger
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
      }
    };

    checkAndRefreshToken();
  }, [navigate, user]);

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytiques', icon: TrendingUp },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'subjects', label: 'Matières', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', icon: FileText },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'moderation', label: 'Modération', icon: Shield },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshData = () => {
    window.location.reload();
  };

  // Dashboard Overview Component
  const DashboardOverview = () => (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tuteurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTutors || 0}</div>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posts Forum</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForumPosts || 0}</div>
            <p className="text-xs text-muted-foreground">Publications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlashcards || 0}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activités Récentes
            </CardTitle>
            <CardDescription>
              Dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4 text-sm">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-muted-foreground text-xs">{activity.description}</p>
                      <p className="text-muted-foreground text-xs">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Santé du Système
            </CardTitle>
            <CardDescription>
              État de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de données</span>
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stockage</span>
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Disponible
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('users')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Utilisateurs</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('subjects')}
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Matières</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('flashcards')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Flashcards</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('images')}
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">Images</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('moderation')}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Modération</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Analytics Component
  const AnalyticsView = () => {
    const [analyticsData, setAnalyticsData] = React.useState<any>(null);
    const [activityData, setActivityData] = React.useState<any[]>([]);
    const [userGrowthData, setUserGrowthData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadAnalytics = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          console.log('📊 Chargement des statistiques analytiques...');
          console.log('📊 API_URL:', API_URL);
          
          // Charger les statistiques avec analytiques
          const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (statsRes.ok) {
            const stats = await statsRes.json();
            console.log('✅ Statistiques reçues:', stats);
            console.log('📊 Analytics data:', stats.analytics);
            if (stats.analytics) {
              setAnalyticsData(stats.analytics);
              console.log('✅ Analytics data défini:', stats.analytics);
            } else {
              console.warn('⚠️ Pas de données analytics dans la réponse');
              setAnalyticsData({});
            }
          } else {
            const errorText = await statsRes.text();
            console.error('❌ Erreur stats:', statsRes.status, statsRes.statusText, errorText);
            setAnalyticsData({});
          }
          
          // Charger les données d'activité
          const activityRes = await fetch(`${API_URL}/api/admin/activity-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (activityRes.ok) {
            const activity = await activityRes.json();
            const formattedActivity = activity.map((a: any) => ({
              day: new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
              logins: a.users || 0,
              posts: a.posts || 0,
              sessions: a.sessions || 0
            }));
            console.log('✅ Activité chargée:', formattedActivity);
            setActivityData(formattedActivity);
          }
          
          // Générer les données de croissance des 6 derniers mois
          const growthData = [];
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            
            try {
              // Appeler l'API pour récupérer les données
              const monthDataRes = await fetch(`${API_URL}/api/admin/growth-data?month=${date.toISOString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (monthDataRes.ok) {
                const monthData = await monthDataRes.json();
                growthData.push({
                  month: months[(now.getMonth() - i + 12) % 12],
                  users: monthData.users || 0,
                  tutors: monthData.tutors || 0,
                  posts: monthData.posts || 0
                });
              } else {
                growthData.push({
                  month: months[(now.getMonth() - i + 12) % 12],
                  users: 0,
                  tutors: 0,
                  posts: 0
                });
              }
            } catch (error) {
              console.error(`Erreur chargement données mois ${i}:`, error);
              growthData.push({
                month: months[(now.getMonth() - i + 12) % 12],
                users: 0,
                tutors: 0,
                posts: 0
              });
            }
          }
          console.log('✅ Données de croissance:', growthData);
          setUserGrowthData(growthData);
        } catch (error) {
          console.error('❌ Erreur chargement analytiques:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAnalytics();
    }, []);

    const [subjectDistribution, setSubjectDistribution] = React.useState<any[]>([]);
    const [engagementData, setEngagementData] = React.useState<any[]>([]);

    // Charger les données de matières et engagement
    React.useEffect(() => {
      const loadSubjectAndEngagementData = async () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          // Charger les stats par matière
          const subjectRes = await fetch(`${API_URL}/api/admin/subject-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (subjectRes.ok) {
            const subjects = await subjectRes.json();
            if (subjects && Array.isArray(subjects) && subjects.length > 0) {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
              const total = subjects.reduce((sum: number, s: any) => sum + (s.posts || 0) + (s.flashcards || 0), 0);
              const distribution = subjects
                .map((s: any, idx: number) => ({
                  name: s.name,
                  value: total > 0 ? Math.round(((s.posts || 0) + (s.flashcards || 0)) / total * 100) : 0,
                  color: colors[idx % colors.length]
                }))
                .filter((s: any) => s.value > 0)
                .slice(0, 5);
              setSubjectDistribution(distribution);
            } else {
              setSubjectDistribution([]);
            }
          }
          
          // Générer les données d'engagement par heure (basé sur les messages récents)
          const engagementByHour = [];
          
          // Charger les données d'activité une seule fois
          const activityRes = await fetch(`${API_URL}/api/admin/activity-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          let activityData: any[] = [];
          if (activityRes.ok) {
            const activity = await activityRes.json();
            if (activity && Array.isArray(activity)) {
              activityData = activity;
            }
          }
          
          // Générer les tranches horaires
          for (let hour = 0; hour < 24; hour += 4) {
            // Estimer l'activité par heure basée sur la moyenne des jours
            const avgActivity = activityData.length > 0 
              ? Math.round(activityData.reduce((sum: number, a: any) => sum + (a.users || 0), 0) / activityData.length / 6)
              : 0;
            
            engagementByHour.push({
              time: `${hour.toString().padStart(2, '0')}h`,
              active: avgActivity
            });
          }
          setEngagementData(engagementByHour);
        } catch (error) {
          console.error('Erreur chargement données matières/engagement:', error);
        }
      };
      
      loadSubjectAndEngagementData();
    }, []);

    // Afficher un écran de chargement pendant le chargement initial
    if (loading && !analyticsData) {
      return (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement des statistiques analytiques...</p>
          </div>
        </div>
      );
    }

    console.log('📊 AnalyticsView - analyticsData:', analyticsData);
    console.log('📊 AnalyticsView - loading:', loading);

    return (
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Croissance</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {loading ? (
                  <span className="text-muted-foreground">-</span>
                ) : analyticsData?.growthRate ? (
                  <span className={parseFloat(analyticsData.growthRate.replace('%', '')) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {parseFloat(analyticsData.growthRate.replace('%', '')) >= 0 ? '+' : ''}{analyticsData.growthRate}
                  </span>
                ) : (
                  <span className="text-muted-foreground">+0.0%</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">vs mois précédent</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-blue-600 dark:text-blue-400">
                {loading ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  analyticsData?.engagementRate || '0%'
                )}
              </div>
              <p className="text-xs text-muted-foreground">Utilisateurs actifs/jour</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Temps Moyen</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-purple-600 dark:text-purple-400">
                {loading ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  analyticsData?.avgSessionDuration || '0 min'
                )}
              </div>
              <p className="text-xs text-muted-foreground">Par session</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vues</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-orange-600 dark:text-orange-400">
                {loading ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  analyticsData?.totalViewsThisWeek || '0'
                )}
              </div>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Growth Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Croissance des Utilisateurs</CardTitle>
              <CardDescription className="text-xs">Évolution sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              {userGrowthData && userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTutors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#764ba2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="users" stroke="#667eea" strokeWidth={2} fill="url(#colorUsers)" name="Utilisateurs" />
                    <Area type="monotone" dataKey="tutors" stroke="#764ba2" strokeWidth={2} fill="url(#colorTutors)" name="Tuteurs" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  <p>Chargement des données...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Activité Hebdomadaire</CardTitle>
              <CardDescription className="text-xs">Connexions et interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {activityData && activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="logins" fill="#667eea" radius={[4, 4, 0, 0]} name="Connexions" />
                    <Bar dataKey="posts" fill="#764ba2" radius={[4, 4, 0, 0]} name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  <p>Chargement des données...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subject Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribution par Matière</CardTitle>
              <CardDescription className="text-xs">Répartition de l'activité</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectDistribution && subjectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={subjectDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Engagement par Heure</CardTitle>
              <CardDescription className="text-xs">Utilisateurs actifs par tranche horaire</CardDescription>
            </CardHeader>
            <CardContent>
              {engagementData && engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={engagementData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#764ba2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#764ba2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Area type="monotone" dataKey="active" stroke="#764ba2" strokeWidth={2} fill="url(#colorActive)" />
                    <Line type="monotone" dataKey="active" stroke="#764ba2" strokeWidth={2} dot={{ fill: '#764ba2', r: 4 }} activeDot={{ r: 6 }} name="Utilisateurs actifs" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  <p>Chargement des données...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'analytics':
        return <AnalyticsView />;
      case 'users':
        return <AdminUsers />;
      case 'subjects':
        return <AdminSubjects />;
      case 'flashcards':
        return <AdminFlashcards />;
      case 'images':
        return <AdminForumImages />;
      case 'messenger':
        return <AdminMessages />;
      case 'moderation':
        return <AdminModeration />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border transition-all duration-300 flex flex-col fixed left-0 top-0 h-full z-30 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
          )}
          {sidebarCollapsed && (
            <Shield className="w-6 h-6 text-primary mx-auto" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            className="w-full justify-start"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {!sidebarCollapsed && 'Actualiser'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {!sidebarCollapsed && 'Déconnexion'}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={user?.profilePhoto || undefined} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Area - Full width without additional padding */}
        <div className="w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardUnified;

