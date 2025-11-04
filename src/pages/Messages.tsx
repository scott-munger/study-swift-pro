import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MessageCircle, 
  Users, 
  GraduationCap,
  Pin,
  Trash2,
  MoreVertical,
  Ban,
  Shield,
  FileText
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TutorChat } from '@/components/ui/TutorChat';

interface Conversation {
  id: number;
  type: 'tutor' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  isTyalaSystem?: boolean;
  studentId?: number;
  tutorUserId?: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  tutor?: {
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
    isOnline: boolean;
  };
  group?: {
    id: number;
    name: string;
    description?: string;
    userClass?: string;
    section?: string;
    creatorId: number;
    _count: { members: number };
    members: any[];
  };
}

type FilterType = 'all' | 'tutors' | 'groups';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const state = location.state as { conversationId?: number; tutorId?: number; groupId?: number } | null;
    if (conversations.length > 0) {
      let conversationToSelect = null;
      
      if (state?.conversationId) {
        conversationToSelect = conversations.find(c => c.id === state.conversationId);
      }
      else if (state?.groupId) {
        conversationToSelect = conversations.find(c => c.type === 'group' && c.group?.id === state.groupId);
      }
      
      if (conversationToSelect) {
        setSelectedConversation(conversationToSelect);
        if (window.innerWidth < 1024) {
          setShowChatOnMobile(true);
        }
        window.history.replaceState({}, document.title);
      }
    }
  }, [conversations, location.state]);

  useEffect(() => {
    applyFilters();
  }, [conversations, filter, searchQuery]);

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = async (conversation: Conversation) => {
    if (!conversation || conversation.unreadCount === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Pour les conversations tutor
      if (conversation.type === 'tutor' && conversation.id) {
        const response = await fetch(`${API_URL}/api/conversations/${conversation.id}/mark-read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Mettre à jour le unreadCount localement
          setConversations(prev => prev.map(c => 
            c.id === conversation.id ? { ...c, unreadCount: 0 } : c
          ));
        }
      }
      // Pour les groupes, on peut ajouter une route similaire si nécessaire
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  // Marquer comme lu quand on sélectionne une conversation
  useEffect(() => {
    if (selectedConversation) {
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation?.id]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (window.innerWidth < 1024) {
      setShowChatOnMobile(true);
    }
    // Marquer les messages comme lus
    markMessagesAsRead(conversation);
  };

  const handleDeleteConversation = (conversation: Conversation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setConversationToDelete(conversation);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }
      
      if (conversationToDelete.type === 'group') {
        const response = await fetch(`${API_URL}/api/study-groups/${conversationToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Impossible de supprimer le groupe");
        }

        toast({
          title: "Succès",
          description: "Groupe supprimé avec succès",
        });
      } else {
        const response = await fetch(`${API_URL}/api/conversations/${conversationToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          throw new Error(errorData.error || "Impossible de supprimer la conversation");
        }

        toast({
          title: "Succès",
          description: "Conversation supprimée avec succès",
        });
      }

      if (selectedConversation?.id === conversationToDelete.id && selectedConversation?.type === conversationToDelete.type) {
        setSelectedConversation(null);
        setShowChatOnMobile(false);
      }
      
      await loadConversations();
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour voir vos messages',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      const tutorConversationsRes = await fetch(`${API_URL}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const groupsRes = await fetch(`${API_URL}/api/study-groups/my-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (tutorConversationsRes.ok && groupsRes.ok) {
        const tutorConvs = await tutorConversationsRes.json();
        const groups = await groupsRes.json();
        
        const tutorConversations: Conversation[] = tutorConvs
          .filter((conv: any) => conv && conv.tutor && conv.tutor.user)
          .map((conv: any) => {
            const tutorUser = conv.tutor.user;
            const isTyalaSystem = tutorUser && (
              tutorUser.firstName === 'TYALA' || 
              tutorUser.email === 'system@tyala.com'
            );
            
            // Afficher le nom de l'autre personne selon le rôle de l'utilisateur connecté
            // Si étudiant → afficher le nom du tuteur
            // Si tuteur → afficher le nom de l'étudiant
            let displayName: string;
            if (isTyalaSystem) {
              displayName = 'TYALA';
            } else if (user?.role === 'STUDENT') {
              // Étudiant connecté : afficher le nom du tuteur
              displayName = `${conv.tutor.user.firstName} ${conv.tutor.user.lastName}`;
            } else {
              // Tuteur connecté : afficher le nom de l'étudiant
              // Vérifier si l'objet student existe et a des propriétés
              if (conv.student && conv.student.firstName && conv.student.lastName) {
                displayName = `${conv.student.firstName} ${conv.student.lastName}`;
              } else if (conv.studentId) {
                // Si on a l'ID mais pas les données, charger depuis l'API
                // Pour l'instant, on utilise un placeholder mais on pourrait charger les données
                displayName = `Étudiant #${conv.studentId}`;
              } else {
                displayName = 'Étudiant';
              }
            }
            
            return {
              id: conv.id,
              type: 'tutor' as const,
              name: displayName,
              avatar: isTyalaSystem ? null : conv.tutor.user.profilePhoto,
              isTyalaSystem: !!isTyalaSystem,
              lastMessage: conv.lastMessage?.content || 'Aucun message',
              lastMessageAt: conv.lastMessageAt,
              unreadCount: conv.unreadCount || 0,
              isOnline: conv.tutor.isOnline,
              isPinned: conv.isPinned || isTyalaSystem,
              isBlocked: conv.isBlocked || false,
              blockReason: conv.blockReason || null,
              tutor: conv.tutor,
              student: conv.student,
              studentId: conv.studentId,
              tutorUserId: conv.tutor.user.id
            };
          });

        const groupConversations: Conversation[] = groups
          .filter((group: any) => group !== null && group !== undefined && group.id !== undefined)
          .map((group: any) => ({
            id: group.id,
            type: 'group' as const,
            name: group.name,
            avatar: null,
            lastMessage: group.lastMessage?.content || 'Aucun message',
            lastMessageAt: group.lastMessageAt || group.createdAt,
            unreadCount: group.unreadCount || 0,
            isPinned: group.isPinned || false,
            group: group
          }));

        const allConversations = [...tutorConversations, ...groupConversations]
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isPinned && b.isPinned) {
              if (a.isTyalaSystem && !b.isTyalaSystem) return -1;
              if (!a.isTyalaSystem && b.isTyalaSystem) return 1;
            }
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          });

        setConversations(allConversations);
      } else {
        setConversations([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les conversations',
        variant: 'destructive'
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = conversations;

    if (filter === 'tutors') {
      filtered = filtered.filter(c => c.type === 'tutor');
    } else if (filter === 'groups') {
      filtered = filtered.filter(c => c.type === 'group');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'À l\'instant' : `Il y a ${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (showChatOnMobile && selectedConversation) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
        <TutorChat
          group={selectedConversation.type === 'group' 
            ? selectedConversation.group 
              : {
                  id: selectedConversation.tutor!.id,
                  name: selectedConversation.name,
                  description: `Tuteur - Conversation privée`,
                  userClass: 'Tuteur',
                  section: selectedConversation.isOnline ? 'En ligne' : 'Hors ligne',
                creatorId: selectedConversation.tutorUserId || selectedConversation.tutor!.userId,
                isTutorChat: true,
                tutorId: selectedConversation.tutor!.id,
                conversationId: selectedConversation.id,
                studentId: selectedConversation.studentId,
                tutorUserId: selectedConversation.tutorUserId || selectedConversation.tutor!.userId,
                  _count: { members: 2 },
                  members: [
                    { 
                      user: {
                        ...selectedConversation.tutor!.user,
                        role: 'TUTOR'
                      }
                    }
                  ]
                }}
          open={true}
          onClose={() => {
            setShowChatOnMobile(false);
            setSelectedConversation(null);
          }}
          inline={true}
          onBack={() => {
            setShowChatOnMobile(false);
            setSelectedConversation(null);
          }}
          onLeave={async () => {
            await loadConversations();
            setSelectedConversation(null);
            setShowChatOnMobile(false);
          }}
          onDelete={confirmDeleteConversation}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-slate-900">
      {/* Liste des conversations - Colonne gauche style WhatsApp */}
      <div className={cn(
        "w-full lg:w-[35%] lg:max-w-[380px] flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 overflow-hidden",
        selectedConversation && showChatOnMobile && "hidden lg:flex"
      )}>
        {/* Header avec titre */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-conversations-input"
              name="searchConversations"
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-9 sm:h-10 bg-gray-100 dark:bg-slate-800 border-0 rounded-lg text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2 py-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-hide">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              "h-8 text-xs rounded-lg",
              filter === 'all' && "bg-primary text-white hover:bg-primary/90"
            )}
          >
            Tous
            {filter === 'all' && conversations.length > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-white/20">
                {conversations.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'tutors' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('tutors')}
            className={cn(
              "h-8 text-xs rounded-lg",
              filter === 'tutors' && "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            Tuteurs
            {filter === 'tutors' && conversations.filter(c => c.type === 'tutor').length > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-white/20">
                {conversations.filter(c => c.type === 'tutor').length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'groups' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('groups')}
            className={cn(
              "h-8 text-xs rounded-lg",
              filter === 'groups' && "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Groupes
            {filter === 'groups' && conversations.filter(c => c.type === 'group').length > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-white/20">
                {conversations.filter(c => c.type === 'group').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Liste des conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredConversations.map((conversation) => (
                <div
                  key={`${conversation.type}-${conversation.id}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) {
                      e.stopPropagation();
                      return;
                    }
                    handleConversationClick(conversation);
                  }}
                  className={cn(
                    "w-full p-2.5 sm:p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 active:bg-gray-100 dark:active:bg-slate-800 transition-colors text-left relative cursor-pointer touch-manipulation",
                    selectedConversation?.id === conversation.id && selectedConversation?.type === conversation.type && 
                    "bg-gray-50 dark:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.type === 'group' ? (
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                          <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                      ) : (
                        <Avatar className={cn(
                          "h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-white dark:ring-slate-900",
                          conversation.isTyalaSystem && "ring-2 ring-blue-500"
                        )}>
                          {conversation.isTyalaSystem ? (
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm sm:text-base font-bold">
                              TY
                            </AvatarFallback>
                          ) : conversation.avatar ? (
                            <AvatarImage 
                              src={`${API_URL}/api/profile/photos/${conversation.avatar}`}
                              alt={conversation.name}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm sm:text-base font-semibold">
                              {conversation.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      {conversation.isTyalaSystem && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                      )}
                      {conversation.type === 'tutor' && conversation.isOnline && !conversation.isTyalaSystem && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-[15px]">
                            {conversation.name}
                          </h3>
                          {conversation.isTyalaSystem && (
                            <Badge variant="default" className="bg-blue-600 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" />
                              Certifié
                            </Badge>
                          )}
                          {conversation.isPinned && !conversation.isTyalaSystem && (
                            <Pin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                          )}
                          {conversation.isBlocked && (
                            <div title="Conversation bloquée">
                              <Ban className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 whitespace-nowrap">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      
                      {conversation.isBlocked ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                              <Ban className="h-2.5 w-2.5 mr-1" />
                              Bloquée
                            </Badge>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open('/privacy-policy', '_blank');
                              }}
                              title="Lire les politiques de confidentialité"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Politiques
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteConversation(conversation, e);
                            }}
                            title="Supprimer la conversation"
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                            {conversation.lastMessage || 'Aucun message'}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-white rounded-full h-5 sm:h-5 min-w-[20px] flex items-center justify-center text-[10px] sm:text-xs px-1.5">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              onClick={(e) => handleDeleteConversation(conversation, e)}
                              title="Supprimer la conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Zone de chat - Colonne droite style WhatsApp */}
      <div className={cn(
        "hidden lg:flex flex-1 bg-white dark:bg-slate-900 overflow-hidden",
        selectedConversation || "lg:flex"
      )}>
        {selectedConversation ? (
          <TutorChat
            group={selectedConversation.type === 'group' 
              ? selectedConversation.group 
              : {
                  id: selectedConversation.tutor!.id,
                  name: selectedConversation.name,
                  description: `Tuteur - Conversation privée`,
                  userClass: 'Tuteur',
                  section: selectedConversation.isOnline ? 'En ligne' : 'Hors ligne',
                creatorId: selectedConversation.tutorUserId || selectedConversation.tutor!.userId,
                isTutorChat: true,
                tutorId: selectedConversation.tutor!.id,
                conversationId: selectedConversation.id,
                studentId: selectedConversation.studentId,
                tutorUserId: selectedConversation.tutorUserId || selectedConversation.tutor!.userId,
                isBlocked: selectedConversation.isBlocked || false,
                blockReason: selectedConversation.blockReason || null,
                  _count: { members: 2 },
                  members: [
                    { 
                      user: {
                        ...selectedConversation.tutor!.user,
                        role: 'TUTOR'
                      }
                    }
                  ]
                }}
            open={true}
            onClose={() => setSelectedConversation(null)}
            inline={true}
            onBack={() => setSelectedConversation(null)}
            onLeave={async () => {
              await loadConversations();
              setSelectedConversation(null);
              setShowChatOnMobile(false);
            }}
            onDelete={confirmDeleteConversation}
          />
        ) : (
          <div className="flex-1 items-center justify-center h-full bg-white dark:bg-slate-900 flex">
            <div className="text-center text-gray-400 dark:text-gray-600">
              <MessageCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
              <p className="text-sm">Choisissez une conversation pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDeleteConversation}
        title={conversationToDelete?.type === 'group' ? "Supprimer le groupe" : "Supprimer la conversation"}
        description={
          conversationToDelete?.type === 'group'
            ? "Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible et tous les messages seront perdus."
            : "Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible et tous les messages seront perdus."
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
}

