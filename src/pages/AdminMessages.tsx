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
  Trash2,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Conversation {
  id: number;
  studentId: number;
  tutorId: number;
  student: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profilePhoto?: string;
    };
  tutor: {
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profilePhoto?: string;
    };
  };
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
  };
  lastMessageAt: string;
  messageCount: number;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/admin/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
      const data = await response.json();
        setConversations(data);
      } else {
        setConversations([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des conversations:', error);
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

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
    return (
      (conv.student?.firstName || '').toLowerCase().includes(query) ||
      (conv.student?.lastName || '').toLowerCase().includes(query) ||
      (conv.student?.email || '').toLowerCase().includes(query) ||
      (conv.tutor?.user?.firstName || '').toLowerCase().includes(query) ||
      (conv.tutor?.user?.lastName || '').toLowerCase().includes(query) ||
      (conv.tutor?.user?.email || '').toLowerCase().includes(query) ||
      conv.lastMessage?.content.toLowerCase().includes(query)
    );
  });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Messages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gérer toutes les conversations entre étudiants et tuteurs
          </p>
      </div>

        {/* Barre de recherche */}
        <Card className="p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
              id="search-admin-messages-input"
              name="searchAdminMessages"
              type="text"
              placeholder="Rechercher une conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoComplete="off"
                  />
                </div>
        </Card>

        {/* Liste des conversations */}
                  {filteredConversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
          </Card>
        ) : (
                  <div className="space-y-4">
            {filteredConversations.map((conv) => (
              <Card key={conv.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatars */}
                  <div className="flex -space-x-2">
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900">
                      {conv.student?.profilePhoto ? (
                        <AvatarImage 
                          src={`${API_URL}/api/profile/photos/${conv.student.profilePhoto}`}
                          alt={`${conv.student?.firstName || ''} ${conv.student?.lastName || ''}`}
                        />
                                  ) : (
                                    <AvatarFallback>
                          {(conv.student?.firstName?.[0] || '')}{(conv.student?.lastName?.[0] || '')}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900">
                      {conv.tutor?.user?.profilePhoto ? (
                        <AvatarImage 
                          src={`${API_URL}/api/profile/photos/${conv.tutor.user.profilePhoto}`}
                          alt={`${conv.tutor.user.firstName || ''} ${conv.tutor.user.lastName || ''}`}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary">
                          {(conv.tutor?.user?.firstName?.[0] || '')}{(conv.tutor?.user?.lastName?.[0] || '')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {conv.student?.firstName || ''} {conv.student?.lastName || ''} ↔ {conv.tutor?.user?.firstName || ''} {conv.tutor?.user?.lastName || ''}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{conv.student?.email || 'N/A'}</span>
                          <span>↔</span>
                          <span>{conv.tutor?.user?.email || 'N/A'}</span>
                                </div>
                              </div>
                      <Badge variant="secondary" className="ml-2">
                        {conv.messageCount} message{conv.messageCount > 1 ? 's' : ''}
                      </Badge>
                            </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                        {conv.lastMessage.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dernier message: {formatTime(conv.lastMessageAt)}
                    </p>
                  </div>
                </div>
            </Card>
            ))}
        </div>
      )}
        </div>
    </div>
  );
}

