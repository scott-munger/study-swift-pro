import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
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
  Bell
} from 'lucide-react';
import { NotificationCenter } from '@/components/ui/notification-center';

const AdminDashboard = () => {
  const { adminUser, stats, activities, hasPermission } = useAdmin();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([]);
  const [forumNotifications] = useState([]);
  const [isConnected] = useState(true);
  
  // Debug: Afficher les informations de debug
  console.log('AdminDashboard Debug:', {
    user,
    adminUser,
    userRole: user?.role,
    isAdmin: !!adminUser
  });

  // Vérification : si l'utilisateur a le rôle ADMIN ou est détecté comme admin
  const hasAdminAccess = user?.role === 'ADMIN' || adminUser;
  
  if (!user || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès Refusé</CardTitle>
            <CardDescription className="text-center">
              Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
              <br />
              <br />
              <strong>Debug:</strong>
              <br />
              Rôle utilisateur: {user?.role || 'Non connecté'}
              <br />
              Admin détecté: {adminUser ? 'Oui' : 'Non'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/login'}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '+' : ''}{change}%
            </span> par rapport au mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );

  const ActivityItem = ({ activity }: any) => (
    <div className="flex items-center space-x-4 p-3 border rounded-lg">
      <div className={`p-2 rounded-full ${
        activity.severity === 'critical' ? 'bg-red-100 text-red-600' :
        activity.severity === 'high' ? 'bg-orange-100 text-orange-600' :
        activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
        'bg-green-100 text-green-600'
      }`}>
        {activity.type === 'user_action' ? <UserCheck className="h-4 w-4" /> :
         activity.type === 'system_event' ? <Activity className="h-4 w-4" /> :
         activity.type === 'security_alert' ? <Shield className="h-4 w-4" /> :
         <MessageSquare className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{activity.action}</p>
        <p className="text-xs text-muted-foreground">{activity.details}</p>
        <p className="text-xs text-muted-foreground">
          {activity.user} • {activity.timestamp.toLocaleString()}
        </p>
      </div>
      <Badge variant={
        activity.severity === 'critical' ? 'destructive' :
        activity.severity === 'high' ? 'destructive' :
        activity.severity === 'medium' ? 'secondary' :
        'default'
      }>
        {activity.severity}
      </Badge>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-lime-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord Administrateur
              </h1>
              <p className="text-gray-600 mt-2">
                Bienvenue, {user.firstName} {user.lastName} • Rôle: {user.role}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                ✅ Admin détecté - Contexte: {adminUser ? 'Actif' : 'Inactif'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bouton de notifications pour admin */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {(notifications.length > 0 || forumNotifications.length > 0) && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs"
                  >
                    {notifications.length + forumNotifications.length}
                  </Badge>
                )}
              </Button>
              
              {/* Indicateur de connexion */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
              
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Retour au site
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Admin */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Navigation Administration</h2>
              <div className="flex items-center space-x-3">
                <Button onClick={() => window.location.href = '/simple-admin/dashboard?tab=users'}>
                  <Users className="h-4 w-4 mr-2" />
                  Gestion Utilisateurs
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin/moderation'}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Modération Forum
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Utilisateurs Totaux"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Tuteurs Actifs"
            value={stats.totalTutors}
            icon={BookOpen}
            color="text-green-600"
          />
          <StatCard
            title="Messages"
            value={stats.totalMessages.toLocaleString()}
            icon={MessageSquare}
            color="text-purple-600"
          />
          <StatCard
            title="Flashcards"
            value={stats.breakdown?.flashcards?.toLocaleString() || '0'}
            icon={FileText}
            color="text-orange-600"
          />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
            <TabsTrigger value="moderation">Modération Forum</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activités récentes */}
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
                <CardContent className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </CardContent>
              </Card>

              {/* Santé du système */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Santé du Système
                  </CardTitle>
                  <CardDescription>
                    État général de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>État général</span>
                    <Badge variant={
                      stats.systemHealth === 'excellent' ? 'default' :
                      stats.systemHealth === 'good' ? 'default' :
                      stats.systemHealth === 'warning' ? 'secondary' :
                      'destructive'
                    }>
                      {stats.systemHealth === 'excellent' ? 'Excellent' :
                       stats.systemHealth === 'good' ? 'Bon' :
                       stats.systemHealth === 'warning' ? 'Attention' :
                       'Critique'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilisateurs actifs</span>
                    <span className="font-medium">{stats.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tuteurs vérifiés</span>
                    <span className="font-medium">{stats.verifiedTutors}/{stats.totalTutors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Revenus ce mois</span>
                    <span className="font-medium text-green-600">
                      ${stats.revenue.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>
                  Gérer les comptes étudiants et tuteurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Actions rapides</h3>
                    <div className="space-x-2">
                      <Button onClick={() => window.location.href = '/simple-admin/dashboard?tab=users'}>
                        <Users className="h-4 w-4 mr-2" />
                        Voir tous les utilisateurs
                      </Button>
                      <Button variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Ajouter un utilisateur
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Étudiants</h4>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalUsers - stats.totalTutors - 1}</p>
                      <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Tuteurs</h4>
                      <p className="text-2xl font-bold text-green-600">{stats.totalTutors}</p>
                      <p className="text-sm text-muted-foreground">Tuteurs vérifiés</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Administrateurs</h4>
                      <p className="text-2xl font-bold text-purple-600">1</p>
                      <p className="text-sm text-muted-foreground">Super admin</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Modération */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modération du Forum</CardTitle>
                <CardDescription>
                  Surveiller et modérer les discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Actions rapides</h3>
                    <div className="space-x-2">
                      <Button onClick={() => window.location.href = '/admin/moderation'}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Modérer le forum
                      </Button>
                      <Button variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Voir les signalements
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Posts en attente</h4>
                      <p className="text-2xl font-bold text-yellow-600">3</p>
                      <p className="text-sm text-muted-foreground">Nécessitent une révision</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Posts signalés</h4>
                      <p className="text-2xl font-bold text-red-600">1</p>
                      <p className="text-sm text-muted-foreground">Nécessitent une action</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Posts approuvés</h4>
                      <p className="text-2xl font-bold text-green-600">24</p>
                      <p className="text-sm text-muted-foreground">Cette semaine</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      
      {/* Centre de Notifications */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default AdminDashboard;

