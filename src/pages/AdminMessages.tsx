import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MessageCircle, 
  Users, 
  GraduationCap,
  Trash2,
  Shield,
  ArrowLeft,
  Send,
  Radio,
  User,
  Eye,
  MoreHorizontal,
  X,
  AlertTriangle,
  Archive,
  Download,
  Filter,
  BarChart3,
  Ban,
  CheckCircle,
  Lock,
  Unlock,
  MessageSquare
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
  isBlocked?: boolean;
  blockReason?: string | null;
  blockedAt?: string | null;
}

interface Message {
  id: number;
  content: string;
  messageType: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    userId: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [messageToDeleteConversationId, setMessageToDeleteConversationId] = useState<number | null>(null);
  const [messengerStats, setMessengerStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [conversationToBlock, setConversationToBlock] = useState<Conversation | null>(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadConversations();
    loadUsers();
    loadMessengerStats();
  }, []);

  const loadMessengerStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/messenger-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessengerStats(data);
      }
    } catch (error: any) {
      console.error('Erreur chargement stats messenger:', error);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les messages',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement messages:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les messages',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadConversationMessages(conversation.id);
    setShowMessageDialog(true);
  };

  const handleDeleteMessage = (messageId: number, conversationId: number) => {
    setMessageToDelete(messageId);
    setMessageToDeleteConversationId(conversationId);
    setShowDeleteMessageConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete || !messageToDeleteConversationId) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/messages/${messageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Message supprimé avec succès'
        });
        
        // Recharger les messages de la conversation
        if (selectedConversation) {
          loadConversationMessages(selectedConversation.id);
        }
        
        // Recharger les conversations
        loadConversations();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de supprimer le message',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur suppression message:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le message',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);
      setMessageToDeleteConversationId(null);
    }
  };

  const handleDeleteConversation = (conversationId: number) => {
    setConversationToDelete(conversationId);
    setShowDeleteConversationConfirm(true);
  };

  const handleBlockConversation = (conversation: Conversation) => {
    setConversationToBlock(conversation);
    setBlockReason('');
    setShowBlockDialog(true);
  };

  const confirmBlockConversation = async () => {
    if (!conversationToBlock) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/conversations/${conversationToBlock.id}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isBlocked: true,
          reason: blockReason || 'Violation des règlements du site'
        })
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Conversation bloquée avec succès. Un message automatique a été envoyé aux participants.'
        });
        
        // Recharger les conversations
        loadConversations();
        
        // Fermer le dialog
        setShowBlockDialog(false);
        setConversationToBlock(null);
        setBlockReason('');
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de bloquer la conversation',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur blocage conversation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de bloquer la conversation',
        variant: 'destructive'
      });
    }
  };

  const handleUnblockConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/conversations/${conversationId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isBlocked: false,
          reason: null
        })
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Conversation débloquée avec succès'
        });
        
        // Recharger les conversations
        loadConversations();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de débloquer la conversation',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur déblocage conversation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de débloquer la conversation',
        variant: 'destructive'
      });
    }
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/conversations/${conversationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Conversation supprimée avec succès'
        });
        
        // Recharger les conversations
        loadConversations();
        
        // Fermer le dialog de messages si c'était cette conversation
        if (selectedConversation && selectedConversation.id === conversationToDelete) {
          setShowMessageDialog(false);
          setSelectedConversation(null);
          setConversationMessages([]);
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de supprimer la conversation',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur suppression conversation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la conversation',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteConversationConfirm(false);
      setConversationToDelete(null);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error: any) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setUsersLoading(false);
    }
  };

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

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre et le message sont requis',
        variant: 'destructive'
      });
      return;
    }

    if (broadcastForm.targetAudience === 'specific' && !broadcastForm.userId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/messages/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: broadcastForm.title.trim(),
          message: broadcastForm.message.trim(),
          targetAudience: broadcastForm.targetAudience,
          userId: broadcastForm.targetAudience === 'specific' ? parseInt(broadcastForm.userId) : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Succès',
          description: data.message || 'Message envoyé avec succès'
        });
        setBroadcastDialogOpen(false);
        setBroadcastForm({
          title: '',
          message: '',
          targetAudience: 'all',
          userId: ''
        });
        loadConversations(); // Recharger les conversations
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible d\'envoyer le message',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erreur envoi broadcast:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérer toutes les conversations entre étudiants et tuteurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowStats(!showStats)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </Button>
            <Button 
              onClick={() => setBroadcastDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Radio className="h-4 w-4" />
              Envoyer un message
            </Button>
          </div>
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

        {/* Statistiques */}
        {showStats && messengerStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 text-blue-600 dark:text-blue-400">
                  {messengerStats.totalConversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 text-purple-600 dark:text-purple-400">
                  {messengerStats.totalMessages || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Aujourd'hui</CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 text-green-600 dark:text-green-400">
                  {messengerStats.messagesToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">Messages</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne</CardTitle>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 text-orange-600 dark:text-orange-400">
                  {messengerStats.avgMessagesPerConversation 
                    ? Math.round(messengerStats.avgMessagesPerConversation * 10) / 10 
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Par conversation</p>
              </CardContent>
            </Card>
          </div>
        )}

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
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {conv.student?.firstName || ''} {conv.student?.lastName || ''} ↔ {conv.tutor?.user?.firstName || ''} {conv.tutor?.user?.lastName || ''}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{conv.student?.email || 'N/A'}</span>
                          <span>↔</span>
                          <span>{conv.tutor?.user?.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="secondary">
                          {conv.messageCount} message{conv.messageCount > 1 ? 's' : ''}
                        </Badge>
                        {conv.isBlocked && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            Bloquée
                          </Badge>
                        )}
                      </div>
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConversation(conv)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir messages
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewConversation(conv)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir tous les messages
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {conv.isBlocked ? (
                          <DropdownMenuItem 
                            onClick={() => handleUnblockConversation(conv.id)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Débloquer la conversation
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleBlockConversation(conv)}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquer la conversation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer la conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
            </Card>
            ))}
        </div>
      )}

      {/* Dialog de broadcast */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Envoyer un message broadcast
            </DialogTitle>
            <DialogDescription>
              Envoyez un message à tous les utilisateurs, un rôle spécifique ou un utilisateur particulier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="broadcast-title">Titre</Label>
              <Input
                id="broadcast-title"
                placeholder="Titre du message..."
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="broadcast-audience">Audience cible</Label>
              <Select
                value={broadcastForm.targetAudience}
                onValueChange={(value) => setBroadcastForm({ ...broadcastForm, targetAudience: value, userId: '' })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="students">Tous les étudiants</SelectItem>
                  <SelectItem value="tutors">Tous les tuteurs</SelectItem>
                  <SelectItem value="admins">Tous les admins</SelectItem>
                  <SelectItem value="specific">Utilisateur spécifique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {broadcastForm.targetAudience === 'specific' && (
              <div>
                <Label htmlFor="broadcast-user">Sélectionner un utilisateur</Label>
                <Select
                  value={broadcastForm.userId}
                  onValueChange={(value) => setBroadcastForm({ ...broadcastForm, userId: value })}
                  disabled={usersLoading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={usersLoading ? "Chargement..." : "Sélectionner un utilisateur"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="broadcast-message">Message</Label>
              <Textarea
                id="broadcast-message"
                placeholder="Tapez votre message ici..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendBroadcast} 
              disabled={sendingMessage || !broadcastForm.title.trim() || !broadcastForm.message.trim() || (broadcastForm.targetAudience === 'specific' && !broadcastForm.userId)}
            >
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour voir les messages d'une conversation */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages de la conversation
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMessageDialog(false);
                  setSelectedConversation(null);
                  setConversationMessages([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            {selectedConversation && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="font-medium">
                  {selectedConversation.student?.firstName} {selectedConversation.student?.lastName}
                </span>
                <span>↔</span>
                <span className="font-medium">
                  {selectedConversation.tutor?.user?.firstName} {selectedConversation.tutor?.user?.lastName}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {conversationMessages.length} message(s)
                </Badge>
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun message dans cette conversation
              </div>
            ) : (
              <div className="space-y-3">
                {conversationMessages.map((message) => {
                  const isSystemMessage = message.senderId === 0;
                  const isBlockMessage = isSystemMessage && message.content?.includes('bloquée');
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isSystemMessage
                          ? 'justify-center'
                          : message.senderId === user?.id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isSystemMessage
                            ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                            : message.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              isSystemMessage
                                ? 'text-orange-800 dark:text-orange-200'
                                : message.senderId === user?.id
                                ? 'text-primary-foreground/90'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {isSystemMessage ? 'TYALA' : `${message.sender?.firstName} ${message.sender?.lastName}`}
                            </span>
                            {isSystemMessage && (
                              <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700 h-4 px-1.5">
                                <Shield className="h-2.5 w-2.5 mr-1" />
                                Système
                              </Badge>
                            )}
                          </div>
                          {!isSystemMessage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message.id, selectedConversation!.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isBlockMessage
                            ? 'font-medium text-orange-800 dark:text-orange-200'
                            : isSystemMessage
                            ? 'text-orange-900 dark:text-orange-100'
                            : message.senderId === user?.id
                            ? 'text-primary-foreground'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {message.content}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isSystemMessage
                            ? 'text-orange-700 dark:text-orange-300'
                            : message.senderId === user?.id
                            ? 'text-primary-foreground/70'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(message.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMessageDialog(false);
              setSelectedConversation(null);
              setConversationMessages([]);
            }}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmation de suppression de message */}
      <AlertDialog open={showDeleteMessageConfirm} onOpenChange={setShowDeleteMessageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteMessageConfirm(false);
              setMessageToDelete(null);
              setMessageToDeleteConversationId(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de confirmation de suppression de conversation */}
      <AlertDialog open={showDeleteConversationConfirm} onOpenChange={setShowDeleteConversationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible et tous les messages seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConversationConfirm(false);
              setConversationToDelete(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de blocage de conversation */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-600" />
              Bloquer une conversation
            </DialogTitle>
            <DialogDescription>
              Bloquer cette conversation empêchera les participants de continuer à échanger. Un message automatique sera envoyé aux participants.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {conversationToBlock && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-2">Conversation :</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {conversationToBlock.student?.firstName} {conversationToBlock.student?.lastName} 
                  {' ↔ '}
                  {conversationToBlock.tutor?.user?.firstName} {conversationToBlock.tutor?.user?.lastName}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="block-reason">Raison du blocage (optionnel)</Label>
              <Textarea
                id="block-reason"
                placeholder="Expliquez la raison du blocage (ex: Contenu inapproprié, Spam, etc.)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Si aucune raison n'est spécifiée, un message générique sera utilisé.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note :</strong> Un message automatique sera envoyé aux participants de la conversation pour les informer du blocage.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBlockDialog(false);
              setConversationToBlock(null);
              setBlockReason('');
            }}>
              Annuler
            </Button>
            <Button 
              onClick={confirmBlockConversation}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Ban className="h-4 w-4 mr-2" />
              Bloquer la conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
    </div>
  );
}

