import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Search, Plus, ThumbsUp, Clock, Pin, TrendingUp, Edit, Trash2, Lock, Bell, RefreshCw, LogIn, UserPlus, Menu, X, MoreVertical, Heart, Share2, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ForumPostDetail from "@/components/ui/forum-post-detail";
import SimpleForumDialog from "@/components/ui/simple-forum-dialog";
import ForumImageGallery from "@/components/ui/ForumImageGallery";
import CreateGroupDialog from "@/components/ui/CreateGroupDialog";
import ModernGroupChat from "@/components/ui/ModernGroupChat";
import UserProfileDialog from "@/components/ui/UserProfileDialog";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    profilePhoto?: string;
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
  images?: Array<{
    id: number;
    filename: string;
    mimetype: string;
    size: number;
    createdAt: string;
  }>;
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editDialogOpenForId, setEditDialogOpenForId] = useState<number | null>(null);
  const [activeShareMenu, setActiveShareMenu] = useState<number | null>(null);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null);

  const [selectedSubject, setSelectedSubject] = useState("All");

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeShareMenu !== null) {
        setActiveShareMenu(null);
      }
      if (activePostMenu !== null) {
        setActivePostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeShareMenu, activePostMenu]);

  // États pour les statistiques dynamiques
  const [forumStats, setForumStats] = useState({
    activeUsers: 0,
    onlineUsers: 0,
    todayPosts: 0,
    totalPosts: 0
  });
  const [onlineUsers, setOnlineUsers] = useState<Array<{
    id: number;
    name: string;
    initials: string;
    role: string;
  }>>([]);

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
  const loadDataFromAPI = async (showToast: boolean = true) => {
    try {
      const [postsRes, subjectsRes] = await Promise.all([
        fetch('http://localhost:8081/api/forum/posts-temp'),
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
        
        // Debug des photos de profil
        console.log('📝 Posts chargés avec photos de profil:');
        postsWithReplies.forEach((post: any, index: number) => {
          console.log(`👤 Post ${index + 1} - Auteur:`, {
            id: post.author.id,
            name: `${post.author.firstName} ${post.author.lastName}`,
            profilePhoto: post.author.profilePhoto,
            hasPhoto: !!post.author.profilePhoto
          });
        });
        
        // Connexion établie
        
        if (showToast) {
          toast({
            title: "Mode en ligne",
            description: "Données chargées depuis la base de données",
            variant: "default"
          });
        }
        
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

  // Fonction pour charger les statistiques du forum
  const loadForumStats = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/forum/stats');
      if (response.ok) {
        const stats = await response.json();
        setForumStats(stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques du forum:', error);
    }
  };

  // Fonction pour charger les utilisateurs en ligne
  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/forum/online-users');
      if (response.ok) {
        const users = await response.json();
        setOnlineUsers(users);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs en ligne:', error);
    }
  };

  // Charger les groupes d'étude
  const loadStudyGroups = async (forceRefresh = false) => {
    try {
      console.log('🔄 Chargement des groupes d\'étude...', forceRefresh ? '(rafraîchissement forcé)' : '');
      const token = localStorage.getItem('token');
      
      // Préparer les headers
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token trouvé, appel de l\'API avec authentification...');
      } else {
        console.log('⚠️ Aucun token, tentative de chargement sans authentification...');
      }

      const response = await fetch('http://localhost:8081/api/study-groups', {
        headers
      });
      
      console.log('📡 Réponse API groupes:', response.status, response.statusText);
      
      if (response.ok) {
        const groups = await response.json();
        console.log('✅ Groupes reçus:', groups.length, 'groupes');
        console.log('📋 Détails des groupes:', groups);
        setStudyGroups(groups);
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur API groupes:', errorData);
        // En cas d'erreur, essayer de charger des groupes de démonstration
        console.log('🔄 Tentative de chargement de groupes de démonstration...');
        setStudyGroups([
          {
            id: 1,
            name: 'Groupe de Démonstration',
            description: 'Groupe d\'exemple pour tester l\'interface',
            subject: { name: 'Mathématiques' },
            creator: { firstName: 'Admin', lastName: 'Demo' },
            _count: { members: 5 },
            isMember: false,
            isCreator: false
          }
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des groupes:', error);
      // En cas d'erreur réseau, charger des groupes de démonstration
      console.log('🔄 Chargement de groupes de démonstration en cas d\'erreur...');
      setStudyGroups([
        {
          id: 1,
          name: 'Groupe de Démonstration',
          description: 'Groupe d\'exemple pour tester l\'interface',
          subject: { name: 'Mathématiques' },
          creator: { firstName: 'Admin', lastName: 'Demo' },
          _count: { members: 5 },
          isMember: false,
          isCreator: false
        }
      ]);
    }
  };

  // Rejoindre un groupe
  const handleJoinGroup = async (groupId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token pour rejoindre le groupe:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour rejoindre un groupe",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`http://localhost:8081/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Réponse rejoindre groupe:', response.status, response.statusText);
      
      if (response.ok) {
        toast({
          title: "Succès !",
          description: "Vous avez rejoint le groupe avec succès"
        });
        loadStudyGroups(true);
      } else {
        const error = await response.json();
        console.error('❌ Erreur rejoindre groupe:', error);
        
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive"
          });
          // Rediriger vers login
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          toast({
            title: "Erreur",
            description: error.error || "Impossible de rejoindre le groupe",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet",
        variant: "destructive"
      });
    }
  };

  // Quitter un groupe
  const handleLeaveGroup = async (groupId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token pour quitter le groupe:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour quitter un groupe",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`http://localhost:8081/api/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Réponse quitter groupe:', response.status, response.statusText);
      
      if (response.ok) {
        toast({
          title: "Succès !",
          description: "Vous avez quitté le groupe avec succès"
        });
        loadStudyGroups(true);
      } else {
        const error = await response.json();
        console.error('❌ Erreur quitter groupe:', error);
        
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive"
          });
          // Rediriger vers login
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          toast({
            title: "Erreur",
            description: error.error || "Impossible de quitter le groupe",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet",
        variant: "destructive"
      });
    }
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
      
      // Charger les statistiques du forum
      await loadForumStats();
      await loadOnlineUsers();
      
      // Charger les groupes d'étude (même si pas connecté)
      try {
        await loadStudyGroups();
      } catch (error) {
        console.error('Erreur lors du chargement des groupes:', error);
      }
      
      setLoading(false);
    };

    loadData();
  }, [toast]);

  // Charger les statistiques périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      loadForumStats();
      loadOnlineUsers();
        loadStudyGroups(true); // Recharger aussi les groupes avec rafraîchissement forcé
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Recharger les groupes quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      console.log('👤 Utilisateur connecté, rechargement des groupes...');
      loadStudyGroups(true);
    }
  }, [user]);

  // Logger quand selectedGroup change
  useEffect(() => {
    if (selectedGroup) {
      console.log('📋 Groupe sélectionné:', selectedGroup.name, selectedGroup.id);
    } else {
      console.log('📋 Aucun groupe sélectionné');
    }
  }, [selectedGroup]);

  // Fermer le menu d'actions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePostMenu && !(event.target as Element).closest('.post-actions-menu')) {
        setActivePostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePostMenu]);

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



  const handleCreatePost = async (data: { title: string; content: string; subjectId?: number; images?: File[] }) => {
    if (!user) return;
    
    // Validation : Vérifier si la matière est sélectionnée
    if (!data.subjectId) {
      toast({
        title: "Matière requise",
        description: "Veuillez sélectionner une matière pour créer votre post",
        variant: "destructive"
      });
      return;
    }
    
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
        
        // Upload des images si elles existent
        if (data.images && data.images.length > 0) {
          const formData = new FormData();
          data.images.forEach(image => {
            formData.append('images', image);
          });
          
          try {
            const imageResp = await fetch(`http://localhost:8081/api/forum/posts/${saved.id}/images`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            if (!imageResp.ok) {
              console.error('Erreur lors de l\'upload des images');
            }
          } catch (imageError) {
            console.error('Erreur lors de l\'upload des images:', imageError);
          }
        }
        
        // Recharger les données depuis l'API pour avoir les données à jour (sans toast)
        await loadDataFromAPI(false);
        
        toast({
          title: "✅ Post créé",
          description: "Votre post a été publié avec succès",
          variant: "default"
        });
      } else {
        // fallback local
        setPosts(prev => [newPost, ...prev]);
        toast({
          title: "⚠️ Mode hors ligne",
          description: "Post ajouté localement",
          variant: "default"
        });
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


  // Fonction pour éditer un post
  const handleEditPost = async (postId: number, data: { title: string; content: string; subjectId?: number }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          subjectId: data.subjectId
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        
        // Mettre à jour l'état local
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                title: updatedPost.title,
                content: updatedPost.content,
                subject: updatedPost.subject,
                updatedAt: updatedPost.updatedAt,
                tags: computeTags(updatedPost.subject?.name)
              }
            : post
        ));
        
        toast({
          title: "Post modifié",
          description: "Le post a été modifié avec succès",
        });
        
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de modifier le post",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification",
        variant: "destructive"
      });
      return false;
    }
  };

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

  const handleEditReply = async (postId: number, replyId: number, content: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const updatedReply = await response.json();
        
        // Mettre à jour l'état local
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                replies: post.replies.map(reply => 
                  reply.id === replyId 
                    ? { ...reply, content: updatedReply.content, updatedAt: updatedReply.updatedAt }
                    : reply
                )
              }
            : post
        ));
        
        toast({
          title: "Réponse modifiée",
          description: "La réponse a été modifiée avec succès",
        });
        
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de modifier la réponse",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la réponse:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleDeleteReply = async (postId: number, replyId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                replies: post.replies.filter(reply => reply.id !== replyId),
                _count: {
                  ...post._count,
                  replies: post._count.replies - 1
                }
              }
            : post
        ));
        
        toast({
          title: "Réponse supprimée",
          description: "La réponse a été supprimée avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de supprimer la réponse",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la réponse:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-gradient-hero py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Forum <span className="bg-gradient-primary bg-clip-text text-transparent">Étudiant</span>
            </h1>
            
            {/* Boutons d'action - Optimisés mobile */}
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              {/* Bouton menu mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center space-x-1 px-2 sm:px-3"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden xs:inline">Menu</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-1 px-2 sm:px-3"
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
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Posts</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-primary">{posts.length}</p>
              </div>
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-green-600">{posts.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length}</p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Menu Mobile - Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Menu Forum</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Actions Rapides */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Actions Rapides</h3>
                  <div className="space-y-2">
                    <SimpleForumDialog
                      onSave={handleCreatePost}
                      subjects={subjects}
                      showSubjectSelector={true}
                      trigger={
                        <Button variant="outline" className="w-full justify-start">
                          <Plus className="w-4 h-4 mr-2" />
                          Poser une Question
                        </Button>
                      }
                    />
                    <CreateGroupDialog 
                      subjects={subjects}
                      onGroupCreated={loadStudyGroups}
                    />
                    <SimpleForumDialog
                      onSave={handleCreatePost}
                      subjects={subjects}
                      showSubjectSelector={true}
                      trigger={
                        <Button variant="outline" className="w-full justify-start">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Partager des Ressources
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* Groupes d'Étude */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center justify-between">
                    <span>Groupes d'Étude</span>
                    <Badge variant="secondary">{studyGroups.length}</Badge>
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {studyGroups.slice(0, 5).map((group) => (
                      <div 
                        key={group.id} 
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer hover:shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Clic sur le groupe:', group.name, group.id);
                          setSelectedGroup(group);
                          setShowMobileMenu(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">{group.name}</h4>
                          {group.userClass && (
                            <Badge variant="outline" className="text-xs shrink-0 ml-2">
                              📚 {group.userClass}{group.section ? ` - ${group.section}` : ''}
                            </Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {group._count.members} membres
                          </div>
                          {group.isMember ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveGroup(group.id);
                              }}
                            >
                              Quitter
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinGroup(group.id);
                              }}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Rejoindre
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {studyGroups.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun groupe pour le moment.<br />
                        Créez-en un !
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Publicités */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Publicités</h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">📚 Cours Particuliers</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Besoin d'aide ? Nos tuteurs qualifiés sont là pour vous !
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        En savoir plus
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">🎯 Tests de Connaissances</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Évaluez votre niveau avec nos tests interactifs !
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Découvrir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
          {/* Contenu Principal du Forum */}
          <div className="lg:col-span-3">
            {/* Recherche et Création de Post */}
            <Card className="p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6 bg-gradient-card border-border">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
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
                    subjects={subjects}
                    showSubjectSelector={true}
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
                      subjects={subjects}
                      showSubjectSelector={true}
                    />
                  </Card>
                ) : (
                  filteredPosts.map(post => {
                    const isLiked = post.likes.some(like => like.userId === user?.id);
                    const canEdit = user && (user.id === post.author.id);
                    
                    return (
                      <Card key={post.id} className="p-3 sm:p-4 lg:p-6 bg-gradient-card border-border hover:shadow-lg transition-shadow">
                    {/* En-tête avec profil et boutons */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar 
                          className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
                          onClick={() => {
                            console.log('👤 Clic sur profil:', post.author);
                            setSelectedUserProfile(post.author);
                            setShowUserProfile(true);
                          }}
                        >
                          <AvatarImage 
                            src={post.author.profilePhoto ? `http://localhost:8081/api/profile/photos/${post.author.profilePhoto}` : undefined} 
                            alt={`${post.author.firstName} ${post.author.lastName}`}
                            onError={() => console.log('❌ Erreur chargement photo:', post.author.profilePhoto)}
                            onLoad={() => console.log('✅ Photo chargée:', post.author.profilePhoto)}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                                {post.author.firstName[0]}{post.author.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                                <h3 className="font-semibold text-foreground cursor-pointer hover:text-primary text-sm sm:text-base line-clamp-2 flex-1" 
                                    onClick={() => handleJoinDiscussion(post)}>
                                  {post.title}
                                </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {post.isPinned && <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />}
                              {post.isLocked && <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 lg:gap-4 text-xs text-muted-foreground">
                                <span 
                                  className="truncate cursor-pointer hover:text-primary hover:underline"
                                  onClick={() => {
                                    setSelectedUserProfile(post.author);
                                    setShowUserProfile(true);
                                  }}
                                >
                                  par {post.author.firstName} {post.author.lastName}
                                </span>
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
                      {/* Menu d'actions professionnel */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Bouton de partage avec menu déroulant */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveShareMenu(activeShareMenu === post.id ? null : post.id)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Partager"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          
                          {/* Menu de partage */}
                          {activeShareMenu === post.id && (
                            <div className="absolute right-0 top-9 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
                              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                                Partager sur les réseaux sociaux
                              </div>
                              
                              {/* Facebook */}
                              <button
                                onClick={() => {
                                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                                  window.open(url, '_blank', 'width=600,height=400');
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">f</span>
                                </div>
                                <span>Facebook</span>
                              </button>
                              
                              {/* Twitter */}
                              <button
                                onClick={() => {
                                  const text = `"${post.title}" - ${post.author.firstName} ${post.author.lastName}`;
                                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
                                  window.open(url, '_blank', 'width=600,height=400');
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">𝕏</span>
                                </div>
                                <span>Twitter/X</span>
                              </button>
                              
                              {/* WhatsApp */}
                              <button
                                onClick={() => {
                                  const text = `"${post.title}" - ${post.author.firstName} ${post.author.lastName}\n${window.location.href}`;
                                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                  window.open(url, '_blank');
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">W</span>
                                </div>
                                <span>WhatsApp</span>
                              </button>
                              
                              {/* LinkedIn */}
                              <button
                                onClick={() => {
                                  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                                  window.open(url, '_blank', 'width=600,height=400');
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">in</span>
                                </div>
                                <span>LinkedIn</span>
                              </button>
                              
                              {/* Telegram */}
                              <button
                                onClick={() => {
                                  const text = `"${post.title}" - ${post.author.firstName} ${post.author.lastName}\n${window.location.href}`;
                                  const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
                                  window.open(url, '_blank');
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">T</span>
                                </div>
                                <span>Telegram</span>
                              </button>
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              {/* Copier le lien */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast({
                                    title: "Lien copié",
                                    description: "Le lien du post a été copié dans le presse-papiers",
                                  });
                                  setActiveShareMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">📋</span>
                                </div>
                                <span>Copier le lien</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bouton de sauvegarde */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "La sauvegarde de posts sera bientôt disponible",
                            });
                          }}
                          className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          title="Sauvegarder"
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>

                        {/* Menu d'actions pour l'auteur */}
                        {canEdit && (
                          <div className="relative post-actions-menu">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                              title="Plus d'actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            
                            {/* Menu déroulant */}
                            {activePostMenu === post.id && (
                              <div className="absolute right-0 top-9 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in slide-in-from-top-2 duration-200">
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setEditDialogOpenForId(post.id);
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier le post
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeletePost(post.id);
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer le post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div className="border-t border-border mb-3"></div>

                    {/* Contenu du post (texte + images) */}
                    <div className="mb-3">
                      <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 sm:line-clamp-3">
                        {post.content}
                      </p>
                      {post.images && post.images.length > 0 && (
                        <ForumImageGallery
                          images={post.images}
                          postId={post.id}
                          className="text-xs"
                        />
                      )}
                    </div>
                    
                    {/* Actions du post - Design professionnel */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        {/* Actions principales */}
                        <div className="flex items-center gap-1">
                          {/* Bouton Like avec animation */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-2 px-3 py-2 h-9 rounded-full transition-all duration-200 ${
                              isLiked 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 transition-transform duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
                            <span className="text-sm font-medium">{post._count.likes}</span>
                          </Button>

                          {/* Bouton Commentaire */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleJoinDiscussion(post)}
                            className="flex items-center gap-2 px-3 py-2 h-9 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">Commenter</span>
                            {post._count.replies > 0 && (
                              <Badge 
                                variant="secondary" 
                                className="ml-1 h-5 min-w-[20px] flex items-center justify-center text-xs bg-blue-100 text-blue-700"
                              >
                                {post._count.replies}
                              </Badge>
                            )}
                          </Button>
                        </div>

                        {/* Indicateur de statut */}
                        <div className="flex items-center gap-2">
                          {post.isPinned && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                              <Pin className="w-3 h-3" />
                              <span>Épinglé</span>
                            </div>
                          )}
                          {post.isLocked && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                              <Lock className="w-3 h-3" />
                              <span>Verrouillé</span>
                            </div>
                          )}
                        </div>
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
                  const success = await handleEditPost(editingPost.id, {
                    title: data.title,
                    content: data.content,
                    subjectId: editingPost.subject?.id
                  });
                  
                  if (success) {
                    setEditingPost(null);
                    setEditDialogOpenForId(null);
                  }
                }}
              />
            )}
          </div>

          {/* Section Publicité Mobile - Visible uniquement sur mobile */}
          <div className="lg:hidden mt-6">
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Publicités</h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📚 Cours Particuliers</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Besoin d'aide ? Nos tuteurs qualifiés sont là pour vous !
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    En savoir plus
                  </Button>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Tests de Connaissances</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Évaluez votre niveau avec nos tests interactifs !
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Découvrir
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Barre Latérale - Masquée sur mobile */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Actions Rapides */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Actions Rapides</h3>
              <div className="space-y-2">
                <SimpleForumDialog
                  onSave={handleCreatePost}
                  subjects={subjects}
                  showSubjectSelector={true}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Poser une Question
                    </Button>
                  }
                />
                <CreateGroupDialog 
                  subjects={subjects}
                  onGroupCreated={loadStudyGroups}
                />
                <SimpleForumDialog
                  onSave={handleCreatePost}
                  subjects={subjects}
                  showSubjectSelector={true}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Partager des Ressources
                    </Button>
                  }
                />
              </div>
            </Card>

            {/* Groupes d'Étude */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center justify-between">
                <span>Groupes d'Étude</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{studyGroups.length}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadStudyGroups()}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Actualiser
                  </Button>
                </div>
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Chargement des groupes...</span>
                  </div>
                ) : studyGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aucun groupe d'étude disponible</p>
                    <p className="text-sm text-gray-500">Créez un nouveau groupe pour commencer</p>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        Debug: Token = {localStorage.getItem('token') ? 'Présent' : 'Absent'} | 
                        User = {user ? 'Connecté' : 'Non connecté'} | 
                        Loading = {loading ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                ) : (
                  studyGroups.slice(0, 5).map((group) => (
                  <div 
                    key={group.id} 
                    className="p-3 bg-white/50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer hover:shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ Clic sur le groupe (desktop):', group.name, group.id);
                      setSelectedGroup(group);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{group.name}</h4>
                      {group.userClass && (
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          📚 {group.userClass}{group.section ? ` - ${group.section}` : ''}
                        </Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        {group._count.members} membres
                      </div>
                      {group.isMember ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveGroup(group.id);
                          }}
                        >
                          Quitter
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(group.id);
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Rejoindre
                        </Button>
                      )}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Card>

            {/* Section Publicités */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Publicités</h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📚 Cours Particuliers</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Besoin d'aide ? Nos tuteurs qualifiés sont là pour vous !
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    En savoir plus
                  </Button>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Tests de Connaissances</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Évaluez votre niveau avec nos tests interactifs !
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Découvrir
                  </Button>
                </div>
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
          onDeleteReply={(replyId: number) => handleDeleteReply(selectedPost?.id || 0, replyId)}
        />

      {/* Dialog détails du groupe */}
      {selectedGroup && (
        <ModernGroupChat
          group={selectedGroup}
          open={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onLeave={() => handleLeaveGroup(selectedGroup.id)}
          onDelete={async () => {
            try {
              const response = await fetch(`http://localhost:8081/api/study-groups/${selectedGroup.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (response.ok) {
                toast({
                  title: "Succès !",
                  description: "Groupe supprimé avec succès"
                });
                loadStudyGroups(true);
              } else {
                const error = await response.json();
                toast({
                  title: "Erreur",
                  description: error.error || "Impossible de supprimer le groupe",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error('Erreur:', error);
              toast({
                title: "Erreur",
                description: "Une erreur est survenue",
                variant: "destructive"
              });
            }
          }}
        />
      )}

      {/* Dialog profil utilisateur */}
      <UserProfileDialog
        user={selectedUserProfile}
        open={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUserProfile(null);
        }}
      />

      </div>
    </div>
  );
};

export default Forum;