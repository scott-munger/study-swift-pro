import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  CheckCheck,
  Check,
  Clock,
  Pin
} from 'lucide-react';
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
  // Pour les tuteurs
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
  // Pour les groupes
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
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatData, setChatData] = useState<any>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [conversations, filter, searchQuery]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Charger les conversations avec les tuteurs
      const tutorConversationsRes = await fetch(`${API_URL}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Charger les groupes de l'utilisateur
      const groupsRes = await fetch(`${API_URL}/api/study-groups/my-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (tutorConversationsRes.ok && groupsRes.ok) {
        const tutorConvs = await tutorConversationsRes.json();
        const groups = await groupsRes.json();

        // Transformer les conversations tuteur
        const tutorConversations: Conversation[] = tutorConvs.map((conv: any) => ({
          id: conv.id,
          type: 'tutor' as const,
          name: `${conv.tutor.user.firstName} ${conv.tutor.user.lastName}`,
          avatar: conv.tutor.user.profilePhoto,
          lastMessage: conv.lastMessage?.content || 'Aucun message',
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.tutor.isOnline,
          isPinned: false,
          tutor: conv.tutor
        }));

        // Transformer les groupes
        const groupConversations: Conversation[] = groups.map((group: any) => ({
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

        // Combiner et trier par date
        const allConversations = [...tutorConversations, ...groupConversations]
          .sort((a, b) => {
            // Les conversations épinglées en premier
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Puis par date
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          });

        setConversations(allConversations);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = conversations;

    // Filtrer par type
    if (filter === 'tutors') {
      filtered = filtered.filter(c => c.type === 'tutor');
    } else if (filter === 'groups') {
      filtered = filtered.filter(c => c.type === 'group');
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    if (conversation.type === 'group') {
      // C'est un groupe d'étude
      setChatData(conversation.group);
    } else {
      // C'est un tuteur - on transforme en format "groupe"
      const tutorData = {
        id: conversation.tutor!.id,
        name: conversation.name,
        description: `Tuteur - Conversation privée`,
        userClass: 'Tuteur',
        section: conversation.isOnline ? '🟢 En ligne' : '⚫ Hors ligne',
        creatorId: conversation.tutor!.userId,
        isTutorChat: true, // Flag pour indiquer que c'est un chat tuteur
        tutorId: conversation.tutor!.id,
        _count: { members: 2 },
        members: [
          { 
            user: {
              ...conversation.tutor!.user,
              role: 'TUTOR'
            }
          }
        ]
      };
      setChatData(tutorData);
    }
    setShowChat(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations - Style WhatsApp */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 overflow-hidden">
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-slate-800 border-0"
                  />
                </div>
              </div>

              {/* Filtres - Style WhatsApp */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="flex-1"
                >
                  Tous
                  {filter === 'all' && conversations.length > 0 && (
                    <Badge className="ml-2 bg-white/20">{conversations.length}</Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'tutors' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('tutors')}
                  className="flex-1"
                >
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Tuteurs
                  {filter === 'tutors' && conversations.filter(c => c.type === 'tutor').length > 0 && (
                    <Badge className="ml-2 bg-white/20">
                      {conversations.filter(c => c.type === 'tutor').length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'groups' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('groups')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Groupes
                  {filter === 'groups' && conversations.filter(c => c.type === 'group').length > 0 && (
                    <Badge className="ml-2 bg-white/20">
                      {conversations.filter(c => c.type === 'group').length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Liste des conversations */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-slate-800">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={`${conversation.type}-${conversation.id}`}
                        onClick={() => handleConversationClick(conversation)}
                        className={cn(
                          "w-full p-4 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors text-left relative",
                          selectedConversation?.id === conversation.id && selectedConversation?.type === conversation.type && "bg-gray-50 dark:bg-slate-800"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {conversation.type === 'group' ? (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            ) : (
                              <Avatar className="h-12 w-12">
                                {conversation.avatar ? (
                                  <AvatarImage 
                                    src={`${API_URL}/api/profile/photos/${conversation.avatar}`}
                                    alt={conversation.name}
                                  />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white">
                                    {conversation.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            )}
                            
                            {/* Point vert si en ligne (tuteurs uniquement) */}
                            {conversation.type === 'tutor' && conversation.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {conversation.name}
                                </h3>
                                {conversation.type === 'tutor' && (
                                  <GraduationCap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                )}
                                {conversation.isPinned && (
                                  <Pin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {conversation.lastMessage || 'Aucun message'}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-primary text-white rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs px-1.5 flex-shrink-0 ml-2">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Zone de prévisualisation - Placeholder */}
          <div className="hidden lg:block lg:col-span-2">
            <Card className="h-[calc(100vh-180px)] bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-600">
                <MessageCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm">Choisissez une conversation pour commencer à discuter</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogue de chat - Même composant pour tuteurs ET groupes */}
      <TutorChat
        group={chatData}
        open={showChat}
        onClose={() => {
          setShowChat(false);
          setChatData(null);
          setSelectedConversation(null);
          loadConversations(); // Recharger pour mettre à jour le dernier message
        }}
      />
    </div>
  );
}

