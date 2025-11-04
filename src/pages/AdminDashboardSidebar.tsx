import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  WifiOff,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu
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

const AdminDashboardSidebar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin: contextIsAdmin } = useAdmin();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
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

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'content', label: 'Contenu', icon: FileText },
    { id: 'system', label: 'Système', icon: Server },
  ];

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
      
      const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const normalized = {
          totalUsers: statsData.totalUsers ?? 0,
          totalStudents: statsData.breakdown?.students ?? 0,
          totalTutors: statsData.totalTutors ?? 0,
          totalAdmins: statsData.breakdown?.admins ?? 0,
          totalSubjects: 0,
          totalFlashcards: statsData.breakdown?.flashcards ?? 0,
          totalForumPosts: statsData.breakdown?.forumPosts ?? 0,
          totalMessages: statsData.totalMessages ?? 0,
          totalSessions: statsData.totalSessions ?? 0,
          revenue: statsData.revenue ?? 0,
          systemHealth: statsData.systemHealth ?? 'good',
          activeUsers: statsData.activeUsers ?? 0,
          newUsersThisMonth: 0,
          newPostsThisWeek: 0,
          averageSessionDuration: 0,
        } as typeof stats;
        
        setStats(normalized);
      }

      const activityResponse = await fetch(`${API_URL}/api/admin/activity-data`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (activityResponse.ok) setUserActivity(await activityResponse.json());

      const subjectStatsResponse = await fetch(`${API_URL}/api/admin/subject-stats`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (subjectStatsResponse.ok) setSubjectStats(await subjectStatsResponse.json());

      const systemHealthResponse = await fetch(`${API_URL}/api/admin/system-health`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (systemHealthResponse.ok) setSystemHealth(await systemHealthResponse.json());

    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les données du dashboard`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (token) {
      loadDashboardData(token);
      toast({ title: "Données actualisées", description: "Toutes les données ont été mises à jour" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

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
        <nav className="flex-1 p-4 space-y-2">
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
                  {navigationItems.find(item => item.id === activeSection)?.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenue, {user?.name || 'Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Système opérationnel
              </Badge>
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Vue d'ensemble */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.newUsersThisMonth} ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tuteurs</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTutors}</div>
                    <p className="text-xs text-muted-foreground">Actifs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Posts Forum</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalForumPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.newPostsThisWeek} cette semaine
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activité Utilisateurs</CardTitle>
                    <CardDescription>7 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={userActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="users" stroke="#00aaff" fill="#00aaff" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Posts et Sessions</CardTitle>
                    <CardDescription>Comparaison hebdomadaire</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="posts" fill="#80ff00" />
                        <Bar dataKey="sessions" fill="#00aaff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytiques Avancées</CardTitle>
                  <CardDescription>Statistiques détaillées de la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Contenu des analytiques...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>Liste et administration des utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Contenu de la gestion utilisateurs...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content */}
          {activeSection === 'content' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion du Contenu</CardTitle>
                  <CardDescription>Flashcards, forum et ressources</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Contenu de la gestion du contenu...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">CPU</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth.cpuUsage}%</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${systemHealth.cpuUsage}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth.memoryUsage}%</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: `${systemHealth.memoryUsage}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Disque</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth.diskUsage}%</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: `${systemHealth.diskUsage}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth.uptime}</div>
                    <p className="text-xs text-muted-foreground">Disponibilité</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardSidebar;

