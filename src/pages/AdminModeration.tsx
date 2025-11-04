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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { API_URL } from '@/config/api';

const AdminModeration = () => {
  const { adminUser, hasPermission, moderatePost } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    isPinned: false,
    isLocked: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeletePostIds, setBulkDeletePostIds] = useState<number[]>([]);

  // Vérifier l'accès admin
  const storageUser = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const payload = (() => { try { return token ? JSON.parse(atob(token.split('.')[1])) : null; } catch { return null; } })();
  const hasAdminAccess = adminUser || user?.role === 'ADMIN' || storageUser?.role === 'ADMIN' || payload?.role === 'ADMIN';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès Refusé</CardTitle>
            <CardDescription className="text-center">
              Vous devez être administrateur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center" />
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts`, {
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
      console.log('📋 Posts du forum chargés:', data?.length || 0, 'posts');
      setForumPosts(Array.isArray(data) ? data : []);
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
      const response = await fetch(`${API_URL}/api/admin/moderate-post/${postId}`, {
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

  const handleDeletePost = (postId: number) => {
    setDeletePostId(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts/${deletePostId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setForumPosts(prev => prev.filter((post: any) => post.id !== deletePostId));
        toast({
          title: "Post supprimé",
          description: "Le post a été supprimé avec succès",
        });
        setShowDeleteConfirm(false);
        setDeletePostId(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = (postIds: number[]) => {
    setBulkDeletePostIds(postIds);
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postIds: bulkDeletePostIds })
      });

      if (response.ok) {
        const result = await response.json();
        setForumPosts(prev => prev.filter((post: any) => !bulkDeletePostIds.includes(post.id)));
        setSelectedPosts([]);
        setIsSelectMode(false);
        setShowBulkDeleteConfirm(false);
        setBulkDeletePostIds([]);
        toast({
          title: "Posts supprimés",
          description: `${result.deletedCount} post(s) supprimé(s) avec succès`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les posts",
        variant: "destructive"
      });
      setShowBulkDeleteConfirm(false);
      setBulkDeletePostIds([]);
    }
  };

  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map((post: any) => post.id));
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedPosts([]);
  };

  const handleViewPost = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const post = await response.json();
        setSelectedPost(post);
        setShowPostModal(true);
      } else {
        throw new Error('Erreur lors du chargement du post');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le post",
        variant: "destructive"
      });
    }
  };

  // Fonction pour éditer un post
  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      content: post.content,
      isPinned: post.isPinned || false,
      isLocked: post.isLocked || false
    });
    setShowEditModal(true);
  };

  // Fonction pour sauvegarder les modifications d'un post
  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast({
          title: "Post modifié",
          description: "Le post a été modifié avec succès",
        });
        setShowEditModal(false);
        setEditingPost(null);
        loadForumPosts(); // Recharger les posts
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le post",
        variant: "destructive"
      });
    }
  };

  // Fonction pour épingler/désépingler un post
  const handleTogglePin = async (postId: number, currentPinStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPinned: !currentPinStatus })
      });

      if (response.ok) {
        toast({
          title: "Post modifié",
          description: `Post ${!currentPinStatus ? 'épinglé' : 'désépinglé'} avec succès`,
        });
        loadForumPosts();
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le post",
        variant: "destructive"
      });
    }
  };

  // Fonction pour verrouiller/déverrouiller un post
  const handleToggleLock = async (postId: number, currentLockStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/forum-posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isLocked: !currentLockStatus })
      });

      if (response.ok) {
        toast({
          title: "Post modifié",
          description: `Post ${!currentLockStatus ? 'verrouillé' : 'déverrouillé'} avec succès`,
        });
        loadForumPosts();
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le post",
        variant: "destructive"
      });
    }
  };

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

  // Utiliser uniquement les vraies données de la base
  const filteredPosts = forumPosts.filter(post => {
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
              <Button variant="outline" onClick={() => window.location.href = '/admin/dashboard-modern'}>
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
                  <p className="text-2xl font-bold">{filteredPosts.length}</p>
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
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'pending' || (!p.status && !p.isLocked)).length}</p>
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
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'rejected' || p.isLocked).length}</p>
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
                  <p className="text-2xl font-bold">{forumPosts.filter(p => p.status === 'approved' || (!p.isLocked && p.status !== 'rejected')).length}</p>
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
            ) : forumPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Aucun post dans le forum</p>
                <p className="text-sm text-gray-500">Il n'y a actuellement aucun post à modérer dans le forum.</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Aucun post correspondant aux filtres</p>
                <p className="text-sm text-gray-500">Essayez de modifier vos critères de recherche ou de filtre.</p>
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
                      {/* Bouton Voir */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPost(post.id)}
                        title="Voir le post"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Bouton Éditer */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        title="Éditer le post"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Bouton Épingler/Désépingler */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={post.isPinned ? "text-yellow-600" : "text-gray-600"}
                        onClick={() => handleTogglePin(post.id, post.isPinned)}
                        title={post.isPinned ? "Désépingler" : "Épingler"}
                      >
                        📌
                      </Button>
                      
                      {/* Bouton Verrouiller/Déverrouiller */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={post.isLocked ? "text-red-600" : "text-gray-600"}
                        onClick={() => handleToggleLock(post.id, post.isLocked)}
                        title={post.isLocked ? "Déverrouiller" : "Verrouiller"}
                      >
                        🔒
                      </Button>
                      
                      {/* Actions de modération selon le statut */}
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
                      
                      {/* Bouton Supprimer (toujours visible) */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeletePost(post.id)}
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal d'édition de post */}
        {showEditModal && editingPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Éditer le Post</CardTitle>
                <CardDescription>
                  Modifier le contenu et les paramètres du post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Titre</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du post"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-content">Contenu</Label>
                  <textarea
                    id="edit-content"
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Contenu du post"
                    className="w-full p-3 border border-gray-300 rounded-md min-h-[200px]"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.isPinned}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Épingler le post</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.isLocked}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isLocked: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Verrouiller le post</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPost(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDeletePost}
        title="Supprimer le post"
        description="Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        onConfirm={() => {
          confirmBulkDelete();
          setShowBulkDeleteConfirm(false);
        }}
        title="Supprimer plusieurs posts"
        description={`Êtes-vous sûr de vouloir supprimer ${bulkDeletePostIds.length} post(s) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
};

export default AdminModeration;





