import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  Flag,
  Shield,
  Users,
  Clock,
  ThumbsUp,
  Reply,
  Loader2
} from 'lucide-react';

const AdminModeration = () => {
  const { adminUser, hasPermission, moderatePost } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vérifier l'accès admin
  const hasAdminAccess = adminUser || user?.role === 'ADMIN';
  
  if (!user || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès Refusé</CardTitle>
            <CardDescription className="text-center">
              Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
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

  // Charger les posts du forum depuis la base de données
  useEffect(() => {
    loadForumPosts();
  }, []);

  const loadForumPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/forum-posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des posts');
      }

      const data = await response.json();
      setForumPosts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les posts du forum",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId: number, action: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/moderate-post/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modération');
      }

      const result = await response.json();
      toast({
        title: "Succès",
        description: result.message,
      });
      loadForumPosts(); // Recharger les posts
    } catch (error) {
      console.error('Erreur lors de la modération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modérer le post",
        variant: "destructive"
      });
    }
  };

  // Données simulées des posts du forum (fallback si pas de données)
  const mockForumPosts = [
    {
      id: 1,
      title: 'Aide en mathématiques - Dérivées',
      content: 'Bonjour, j\'ai besoin d\'aide pour comprendre les dérivées. Quelqu\'un peut m\'expliquer ?',
      author: {
        id: 1,
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@test.com',
        role: 'STUDENT'
      },
      subject: 'Mathématiques',
      createdAt: '2024-01-15T10:30:00Z',
      status: 'approved',
      likes: 5,
      replies: 3,
      reports: 0,
      isPinned: false
    },
    {
      id: 2,
      title: 'Question sur la photosynthèse',
      content: 'Je ne comprends pas bien le processus de photosynthèse. Pouvez-vous m\'aider ?',
      author: {
        id: 2,
        name: 'Maria Gonzalez',
        email: 'maria.gonzalez@test.com',
        role: 'STUDENT'
      },
      subject: 'SVT',
      createdAt: '2024-01-14T14:20:00Z',
      status: 'pending',
      likes: 2,
      replies: 1,
      reports: 0,
      isPinned: false
    },
    {
      id: 3,
      title: 'Contenu inapproprié signalé',
      content: 'Ce post contient du contenu inapproprié et des insultes.',
      author: {
        id: 3,
        name: 'Utilisateur Anonyme',
        email: 'anonymous@test.com',
        role: 'STUDENT'
      },
      subject: 'Général',
      createdAt: '2024-01-13T16:45:00Z',
      status: 'reported',
      likes: 0,
      replies: 0,
      reports: 3,
      isPinned: false
    }
  ];

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès Refusé</CardTitle>
            <CardDescription className="text-center">
              Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
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

  // Utiliser les vraies données ou les données simulées en fallback
  const postsToDisplay = forumPosts.length > 0 ? forumPosts : mockForumPosts;
  
  const filteredPosts = postsToDisplay.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.author?.name || post.author?.firstName)?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reported': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reported': return <AlertTriangle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-lime-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Modération du Forum
              </h1>
              <p className="text-gray-600 mt-2">
                Surveillez et modérez les discussions du forum
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/admin/dashboard'}>
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{forumPosts.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signalés</p>
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'reported').length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approuvés</p>
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'approved').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Titre, contenu, auteur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="filter">Filtrer par statut</Label>
                <select
                  id="filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvés</option>
                  <option value="reported">Signalés</option>
                  <option value="rejected">Rejetés</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des posts */}
        <Card>
          <CardHeader>
            <CardTitle>Posts du Forum</CardTitle>
            <CardDescription>
              {loading ? 'Chargement...' : `${filteredPosts.length} post(s) trouvé(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Chargement des posts...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <Badge className={getStatusColor(post.status)}>
                          {getStatusIcon(post.status)}
                          <span className="ml-1 capitalize">{post.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="text-xs">
                              {post.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {post.author.name}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {post.subject}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">{post.content}</p>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {post.likes} j'aime
                        </div>
                        <div className="flex items-center">
                          <Reply className="h-3 w-3 mr-1" />
                          {post.replies} réponses
                        </div>
                        {post.reports > 0 && (
                          <div className="flex items-center text-red-600">
                            <Flag className="h-3 w-3 mr-1" />
                            {post.reports} signalement(s)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {post.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600"
                            onClick={() => handleModeratePost(post.id, 'approve')}
                            title="Approuver"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleModeratePost(post.id, 'reject')}
                            title="Rejeter"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {post.status === 'reported' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600"
                            onClick={() => handleModeratePost(post.id, 'approve')}
                            title="Approuver"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleModeratePost(post.id, 'delete')}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminModeration;





