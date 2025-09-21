import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Search, Plus, ThumbsUp, Clock, Pin, TrendingUp, Edit, Trash2, Lock, Bell, RefreshCw, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ForumPostDetail from "@/components/ui/forum-post-detail";
import SimpleForumDialog from "@/components/ui/simple-forum-dialog";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    replies: number;
    likes: number;
  };
  likes: Array<{ id: number; userId: number }>;
  replies: any[];
  tags?: string[];
}

const Forum = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté et a le bon rôle
  useEffect(() => {
    if (!user) {
      toast({
        title: "Accès restreint",
        description: "Vous devez être connecté pour accéder au forum",
        variant: "destructive"
      });
      navigate('/login');
    } else if (user.role !== 'STUDENT' && user.role !== 'TUTOR' && user.role !== 'ADMIN') {
      toast({
        title: "Accès non autorisé",
        description: "Seuls les étudiants, tuteurs et administrateurs peuvent accéder au forum",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  // Si l'utilisateur n'est pas connecté ou n'a pas le bon rôle, ne rien afficher
  if (!user || (user.role !== 'STUDENT' && user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <LogIn className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6">
            {!user ? "Vous devez être connecté pour accéder au forum" : "Seuls les étudiants, tuteurs et administrateurs peuvent accéder au forum"}
          </p>
          <Button onClick={() => navigate(!user ? '/login' : '/')} className="w-full">
            {!user ? 'Se connecter' : 'Retour à l\'accueil'}
          </Button>
        </Card>
      </div>
    );
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; level: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editDialogOpenForId, setEditDialogOpenForId] = useState<number | null>(null);


  const [selectedSubject, setSelectedSubject] = useState("All");

  // Groupes de filtres souhaités
  const FILIERE_SUBJECTS: Record<string, string[]> = {
    SMP: ["Mathématiques", "Physique", "Chimie", "Informatique"],
    SVT: ["Biologie", "Sciences de la Terre", "SVT"],
    SES: ["Économie", "Sociologie"],
    LLA: ["Littérature", "Philosophie", "Langues Vivantes", "Français"],
  };
  const NINTH_SUBJECTS = ["Français", "Histoire-Géographie", "Anglais", "Sciences"];

  const computeTags = (subjectName?: string): string[] => {
    const tags: string[] = [];
    if (!subjectName) return tags;
    for (const filiere of Object.keys(FILIERE_SUBJECTS)) {
      if (FILIERE_SUBJECTS[filiere].includes(subjectName)) tags.push(filiere);
    }
    if (NINTH_SUBJECTS.includes(subjectName)) tags.push(subjectName);
    return tags;
  };

  // Fonction pour charger les données depuis l'API
  const loadDataFromAPI = async () => {
    try {
      const [postsRes, subjectsRes] = await Promise.all([
        fetch('http://localhost:8081/api/forum/posts'),
        fetch('http://localhost:8081/api/subjects')
      ]);
      
      if (postsRes.ok && subjectsRes.ok) {
        const postsData = await postsRes.json();
        const subjectsData = await subjectsRes.json();
        
        // Charger les réponses pour chaque post
        const postsWithReplies = await Promise.all(
          postsData.map(async (post: any) => {
            try {
              const repliesRes = await fetch(`http://localhost:8081/api/forum/posts/${post.id}/replies`);
              if (repliesRes.ok) {
                const replies = await repliesRes.json();
                return {
                  ...post,
                  replies: replies,
                  tags: computeTags(post.subject?.name)
                };
              }
            } catch (error) {
              console.error(`Erreur lors du chargement des réponses pour le post ${post.id}:`, error);
            }
            return {
              ...post,
              replies: [],
              tags: computeTags(post.subject?.name)
            };
          })
        );
        
        setPosts(postsWithReplies);
        setSubjects(subjectsData.map((s: any) => ({ id: s.id, name: s.name, level: s.level })));
        // Connexion établie
        
        toast({
          title: "Mode en ligne",
          description: "Données chargées depuis la base de données",
          variant: "default"
        });
        
        return true;
      } else {
        throw new Error('API non disponible');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données depuis l\'API:', error);
      return false;
    }
  };

  // Fonction pour charger les données de test (mode hors ligne)
  const loadDataFromMock = () => {
    setPosts([]);
    setSubjects([]);
    
    toast({
      title: "Mode hors ligne",
      description: "Aucune donnée disponible",
      variant: "default"
    });
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Essayer d'abord l'API
      const apiSuccess = await loadDataFromAPI();
      
      // Si l'API échoue, utiliser les données de test
      if (!apiSuccess) {
        loadDataFromMock();
      }
      
      setLoading(false);
    };

    loadData();
  }, [toast]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setLoading(true);
    const apiSuccess = await loadDataFromAPI();
    if (!apiSuccess) {
      loadDataFromMock();
    }
    setLoading(false);
  };

  // Fonction pour charger les réponses d'un post depuis l'API
  const loadRepliesForPost = async (postId: number) => {
    try {
      const response = await fetch(`http://localhost:8081/api/forum/posts/${postId}/replies`);
      if (response.ok) {
        const replies = await response.json();
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, replies: replies }
            : post
        ));
        return replies;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des réponses pour le post ${postId}:`, error);
    }
    return [];
  };



  const handleCreatePost = async (data: { title: string; content: string; subjectId?: number }) => {
    if (!user) return;
    
    const newPost: ForumPost = {
      id: Date.now(),
      title: data.title,
      content: data.content,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.userClass === 'Tuteur' ? 'TUTOR' : 'STUDENT'
      },
      subject: data.subjectId ? subjects.find(s => s.id === data.subjectId) : undefined,
      isPinned: false,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        replies: 0,
        likes: 0
      },
      likes: [],
      replies: []
    };

    // Persister dans la base
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('http://localhost:8081/api/forum/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          subjectId: newPost.subject?.id,
          authorId: newPost.author.id
        })
      });
      if (resp.ok) {
        const saved = await resp.json();
        // Recharger les données depuis l'API pour avoir les données à jour
        await loadDataFromAPI();
        // Post sauvegardé avec succès
      } else {
        // fallback local
        setPosts(prev => [newPost, ...prev]);
        // Post ajouté localement
      }
    } catch (e) {
      setPosts(prev => [newPost, ...prev]);
      // Post ajouté en mode hors ligne
    }

    // Notification envoyée


    toast({
      title: "Post créé avec succès !",
      description: "Votre post a été ajouté au forum",
    });
  };


  // (Temps réel désactivé pour rester simple; API persiste et restitue)

  // const handleEditPost = async (data: { title: string; content: string; subjectId?: number }) => {
  //   // L'édition sera implémentée plus tard
  // };

  const handleDeletePost = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les données depuis l'API pour avoir les données à jour
        await loadDataFromAPI();
        toast({
          title: "Post supprimé",
          description: "Le post a été supprimé avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de supprimer le post",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const userId = user.id;
            return {
              ...post,
              likes: result.isLiked 
                ? [...post.likes, { id: Date.now(), userId: userId }]
                : post.likes.filter(like => like.userId !== userId),
              _count: {
                ...post._count,
                likes: result.likeCount
              }
            };
          }
          return post;
        }));
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de liker le post",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleReply = async (postId: number, content: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        // Recharger les réponses depuis l'API pour avoir les données à jour
        await loadRepliesForPost(postId);
        
        // Mettre à jour le compteur de réponses
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                _count: {
                  ...post._count,
                  replies: post._count.replies + 1
                }
              }
            : post
        ));
        
        toast({
          title: "Réponse ajoutée",
          description: "Votre réponse a été publiée avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'ajouter la réponse",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (!user) return;

    const userId = user.id;
    setPosts(prev => prev.map(post => ({
      ...post,
      replies: post.replies.map(reply => {
        if (reply.id === replyId) {
          const isLiked = reply.likes.some(like => like.userId === userId);
          return {
            ...reply,
            likes: isLiked 
              ? reply.likes.filter(like => like.userId !== userId)
              : [...reply.likes, { id: Date.now(), userId: userId }],
            _count: {
              ...reply._count,
              likes: isLiked ? reply._count.likes - 1 : reply._count.likes + 1
            }
          };
        }
        return reply;
      })
    })));
  };

  const handleDeleteReply = async (replyId: number) => {
    setPosts(prev => prev.map(post => ({
      ...post,
      replies: post.replies.filter(reply => reply.id !== replyId),
      _count: {
        ...post._count,
        replies: post._count.replies - 1
      }
    })));
  };

  const handleJoinDiscussion = (post: ForumPost) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrage par filière ou matière spécifique
    let matchesSubject = true;
    if (selectedSubject !== "All") {
      const subjectName = post.subject?.name || "";
      if (FILIERE_SUBJECTS[selectedSubject as keyof typeof FILIERE_SUBJECTS]) {
        matchesSubject = post.tags?.includes(selectedSubject) ?? FILIERE_SUBJECTS[selectedSubject].includes(subjectName);
      } else if (NINTH_SUBJECTS.includes(selectedSubject)) {
        matchesSubject = (post.tags?.includes(selectedSubject) ?? false) || subjectName === selectedSubject;
      } else {
        matchesSubject = subjectName === selectedSubject;
      }
    }

    return matchesSearch && matchesSubject;
  });

  const subjectOptions = [
    "All",
    "SMP",
    "SVT",
    "SES",
    "LLA",
    ...NINTH_SUBJECTS,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Forum <span className="bg-gradient-primary bg-clip-text text-transparent">Étudiant</span>
            </h1>
            
            {/* Boutons d'action - Optimisés mobile */}
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              
              {/* Indicateur de connexion simplifié */}
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Connecté
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground">
            Connectez-vous avec vos pairs et tuteurs, partagez vos connaissances et obtenez de l'aide
          </p>
        </div>

        {/* Forum Stats - Optimisées mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Posts</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">{posts.length}</p>
              </div>
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Actifs</p>
                <p className="text-lg sm:text-2xl font-bold text-secondary">1,234</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-lg sm:text-2xl font-bold text-accent">{posts.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">En Ligne</p>
                <p className="text-lg sm:text-2xl font-bold text-success">156</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Contenu Principal du Forum */}
          <div className="lg:col-span-3">
            {/* Recherche et Création de Post */}
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-card border-border">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-4">
                  <SimpleForumDialog 
                    trigger={
                      <Button variant="hero" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau Post
                      </Button>
                    }
                    onSave={handleCreatePost}
                  />
                </div>
              </div>
            </Card>

            {/* Onglets de Matières */}
            <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-6">
              <div className="w-full overflow-x-auto">
                <TabsList className="inline-flex min-w-full gap-1 px-1 py-1 rounded-lg bg-white border border-border">
                  {subjectOptions.map(subject => (
                    <TabsTrigger 
                      key={subject} 
                      value={subject} 
                      className="text-xs sm:text-sm whitespace-nowrap"
                    >
                      {subject}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value={selectedSubject} className="space-y-4">
                {filteredPosts.length === 0 ? (
                  <Card className="p-8 bg-gradient-card border-border text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun post trouvé</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? "Aucun post ne correspond à votre recherche" : "Aucun post dans cette catégorie"}
                    </p>
                    <SimpleForumDialog
                      onSave={handleCreatePost}
                    />
                  </Card>
                ) : (
                  filteredPosts.map(post => {
                    const isLiked = post.likes.some(like => like.userId === user?.id);
                    const canEdit = user && (user.id === post.author.id);
                    
                    return (
                      <Card key={post.id} className="p-4 sm:p-6 bg-gradient-card border-border hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                                {post.author.firstName[0]}{post.author.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground cursor-pointer hover:text-primary text-sm sm:text-base truncate" 
                                    onClick={() => handleJoinDiscussion(post)}>
                                  {post.title}
                                </h3>
                            {post.isPinned && <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />}
                                {post.isLocked && <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />}
                          </div>
                          <p className="text-muted-foreground text-xs sm:text-sm mb-2 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                <span className="truncate">par {post.author.firstName} {post.author.lastName}</span>
                                <Badge variant={post.author.role === "TUTOR" ? "secondary" : "outline"} className="text-xs">
                                  {post.author.role === "TUTOR" ? "Tuteur" : "Étudiant"}
                            </Badge>
                                {post.subject && (
                            <Badge variant="outline" className="text-xs">
                                    {post.subject.name}
                            </Badge>
                                )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                                  {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPost(post);
                                  setEditDialogOpenForId(post.id);
                                }}
                                className="p-1 sm:p-2"
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                        </div>
                          )}
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      {/* Section mobile - disposition verticale */}
                      <div className="flex flex-col sm:hidden space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post._count.replies} réponses</span>
                          </div>
                          <Button
                            variant={isLiked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">{post._count.likes}</span>
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleJoinDiscussion(post)}
                          className="w-full"
                        >
                          Rejoindre la Discussion
                        </Button>
                      </div>
                      
                      {/* Section desktop - disposition horizontale */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post._count.replies} réponses</span>
                          </div>
                          <Button
                            variant={isLiked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {post._count.likes}
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleJoinDiscussion(post)}
                        >
                          Rejoindre la Discussion
                        </Button>
                      </div>
                    </div>
                  </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>

            {/* Dialog d'édition par post (monté à la fin pour éviter duplication du header) */}
            {editingPost && (
              <SimpleForumDialog
                initialData={{ title: editingPost.title, content: editingPost.content }}
                mode="edit"
                submitLabel="Enregistrer"
                dialogTitle="Modifier le Post"
                open={!!editDialogOpenForId}
                onOpenChange={(o) => {
                  if (!o) {
                    setEditingPost(null);
                    setEditDialogOpenForId(null);
                  }
                }}
                onSave={async (data) => {
                  try {
                    const resp = await fetch(`http://localhost:8081/api/forum/posts/${editingPost.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: data.title,
                        content: data.content,
                        subjectId: editingPost.subject?.id
                      })
                    });
                    if (resp.ok) {
                      const updated = await resp.json();
                      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updated, tags: computeTags(updated.subject?.name) } : p));
                    } else {
                      alert('Échec de la mise à jour du post');
                    }
                  } catch (e) {
                    alert('Erreur lors de la mise à jour du post');
                  } finally {
                    setEditingPost(null);
                    setEditDialogOpenForId(null);
                  }
                }}
              />
            )}
          </div>

          {/* Barre Latérale */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actions Rapides */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Actions Rapides</h3>
              <div className="space-y-2">
                <SimpleForumDialog
                  onSave={handleCreatePost}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Poser une Question
                    </Button>
                  }
                />
                <SimpleForumDialog
                  onSave={handleCreatePost}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Créer un Groupe d'Étude
                    </Button>
                  }
                />
                <SimpleForumDialog
                  onSave={handleCreatePost}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Partager des Ressources
                    </Button>
                  }
                />
              </div>
            </Card>

            {/* Sujets Populaires */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Sujets Tendance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Préparation Terminale</span>
                  <Badge variant="secondary">124</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Résolution de Problèmes Mathématiques</span>
                  <Badge variant="secondary">89</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Conseils d'Étude</span>
                  <Badge variant="secondary">67</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Stratégies d'Examen</span>
                  <Badge variant="secondary">45</Badge>
                </div>
              </div>
            </Card>

            {/* Utilisateurs en Ligne */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Qui est en Ligne</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">MD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Marie Diop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">AB</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Prof. Ba</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">OF</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Ousmane F.</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Voir Tous (156 en ligne)
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Fenêtres de Dialogue */}
        {/* L'édition de posts sera implémentée plus tard */}

        <ForumPostDetail
          post={selectedPost}
          open={showPostDetail}
          onClose={() => {
            setShowPostDetail(false);
            setSelectedPost(null);
          }}
          onDelete={handleDeletePost}
          onEdit={(p) => {
            setShowPostDetail(false);
            setSelectedPost(null);
            setEditingPost(p);
            setEditDialogOpenForId(p.id);
          }}
          onLike={handleLikePost}
          onReply={handleReply}
          onLikeReply={handleLikeReply}
          onDeleteReply={handleDeleteReply}
        />

      </div>
    </div>
  );
};

export default Forum;