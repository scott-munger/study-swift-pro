import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  MessageSquare, 
  Users, 
  Search,
  Trash2,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Send,
  Ban,
  Unlock,
  Megaphone,
  Shield
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_URL, adminFetch } from '@/config/api';
import { cn } from '@/lib/utils';

interface Conversation {
  id: number;
  studentId: number;
  tutorId: number;
  lastMessageAt: string;
  createdAt: string;
  student: {
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profilePhoto?: string;
      role: string;
    };
  } | null;
  tutor: {
    id: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profilePhoto?: string;
      role: string;
    };
  } | null;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
  } | null;
  messageCount: number;
}

interface Message {
  id: number;
  content: string;
  messageType: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  } | null;
  receiver: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  } | null;
}

const AdminMessages = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState(false);
  const [deleteConversationId, setDeleteConversationId] = useState<number | null>(null);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  
  // Broadcast message states
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'students' | 'tutors' | 'admins' | 'specific'>('all');
  const [broadcastUserId, setBroadcastUserId] = useState<string>('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Block conversation states
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [conversationToBlock, setConversationToBlock] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ Pas de token disponible pour charger les utilisateurs');
        return;
      }
      
      console.log('📡 AdminMessages: Chargement utilisateurs depuis:', `${API_URL}/api/admin/users`);
      
      const response = await adminFetch(`${API_URL}/api/admin/users`);
      const data = await response.json();
      console.log('✅ AdminMessages: Utilisateurs chargés:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    applyFilters();
  }, [conversations, searchQuery]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
      }
      
      console.log('📡 AdminMessages: Chargement conversations depuis:', `${API_URL}/api/admin/conversations`);
      console.log('📡 AdminMessages: Token présent:', !!token);
      
      const response = await adminFetch(`${API_URL}/api/admin/conversations`);
      const data = await response.json();
      
      console.log('✅ AdminMessages: Conversations chargées:', data);
      console.log('✅ AdminMessages: Nombre de conversations:', data?.length || 0);
      
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length === 0) {
          toast({
            title: "Information",
            description: "Aucune conversation trouvée dans la base de données.",
          });
        }
      } else {
        console.error('❌ AdminMessages: Données invalides, attendu un tableau:', data);
        setConversations([]);
      }
    } catch (error: any) {
      console.error('❌ AdminMessages: Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les conversations. Vérifiez la console pour plus de détails.",
        variant: "destructive"
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
      }
      
      console.log('📡 AdminMessages: Chargement messages pour conversation:', conversationId);
      console.log('📡 AdminMessages: URL:', `${API_URL}/api/admin/conversations/${conversationId}/messages`);
      
      const response = await adminFetch(`${API_URL}/api/admin/conversations/${conversationId}/messages`);
      const data = await response.json();
      
      console.log('✅ AdminMessages: Messages chargés:', data);
      console.log('✅ AdminMessages: Nombre de messages:', data?.length || 0);
      
      if (Array.isArray(data)) {
        // Filtrer les messages système/broadcast (senderId: 0) pour qu'ils n'apparaissent pas
        const filteredMessages = data.filter((msg: Message) => msg.senderId !== 0);
        setMessages(filteredMessages);
        if (filteredMessages.length === 0) {
          toast({
            title: "Information",
            description: "Aucun message trouvé dans cette conversation.",
          });
        }
      } else {
        console.error('❌ AdminMessages: Données invalides, attendu un tableau:', data);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('❌ AdminMessages: Erreur lors du chargement des messages:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les messages. Vérifiez la console pour plus de détails.",
        variant: "destructive"
      });
      setMessages([]);
    }
  };

  const applyFilters = () => {
    let filtered = conversations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.student?.user.firstName.toLowerCase().includes(query) ||
        conv.student?.user.lastName.toLowerCase().includes(query) ||
        conv.tutor?.user.firstName.toLowerCase().includes(query) ||
        conv.tutor?.user.lastName.toLowerCase().includes(query) ||
        conv.student?.user.email.toLowerCase().includes(query) ||
        conv.tutor?.user.email.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  };

  const handleDeleteConversation = (conversationId: number) => {
    setDeleteConversationId(conversationId);
    setShowDeleteConversationConfirm(true);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteConversationId) return;

    try {
      await adminFetch(`${API_URL}/api/admin/conversations/${deleteConversationId}`, {
        method: 'DELETE'
      });

      toast({
        title: "Succès",
        description: "Conversation supprimée avec succès",
      });
      
      // Recharger les conversations après suppression
      await loadConversations();
      
      if (selectedConversation?.id === deleteConversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      setShowDeleteConversationConfirm(false);
      setDeleteConversationId(null);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la conversation",
        variant: "destructive"
      });
      setShowDeleteConversationConfirm(false);
      setDeleteConversationId(null);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setDeleteMessageId(messageId);
    setShowDeleteMessageConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMessageId) return;

    try {
      await adminFetch(`${API_URL}/api/admin/messages/${deleteMessageId}`, {
        method: 'DELETE'
      });

      toast({
        title: "Succès",
        description: "Message supprimé avec succès",
      });
      
      // Recharger les messages après suppression
      if (selectedConversation) {
        await loadMessages(selectedConversation.id);
      }
      
      // Recharger les conversations pour mettre à jour messageCount
      await loadConversations();
      
      setShowDeleteMessageConfirm(false);
      setDeleteMessageId(null);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le message",
        variant: "destructive"
      });
      setShowDeleteMessageConfirm(false);
      setDeleteMessageId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et le message sont requis",
        variant: "destructive"
      });
      return;
    }

    if (broadcastAudience === 'specific' && !broadcastUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur",
        variant: "destructive"
      });
      return;
    }

    try {
      setSendingBroadcast(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour envoyer un message broadcast",
          variant: "destructive"
        });
        return;
      }
      
      console.log('📢 AdminMessages: Envoi broadcast - Audience:', broadcastAudience, 'UserId:', broadcastUserId);
      console.log('📢 AdminMessages: URL:', `${API_URL}/api/admin/messages/broadcast`);
      
      const requestBody = {
        title: broadcastTitle,
        message: broadcastMessage,
        targetAudience: broadcastAudience,
        ...(broadcastAudience === 'specific' && broadcastUserId ? { userId: parseInt(broadcastUserId) } : {})
      };
      
      console.log('📢 AdminMessages: Corps de la requête:', requestBody);
      
      const response = await adminFetch(`${API_URL}/api/admin/messages/broadcast`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      console.log('✅ AdminMessages: Broadcast réussi:', data);
      toast({
        title: "Succès",
        description: `Message broadcast envoyé à ${data.sentCount} utilisateur(s)`,
      });
      setShowBroadcastDialog(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastAudience('all');
      setBroadcastUserId('');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message broadcast",
        variant: "destructive"
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleBlockConversation = (conversationId: number) => {
    setConversationToBlock(conversationId);
    setBlockReason('');
    setShowBlockDialog(true);
  };

  const confirmBlockConversation = async () => {
    if (!conversationToBlock) return;

    try {
      await adminFetch(`${API_URL}/api/admin/conversations/${conversationToBlock}/block`, {
        method: 'PUT',
        body: JSON.stringify({
          isBlocked: true,
          reason: blockReason || 'Violation des règlements du site'
        })
      });

      toast({
        title: "Succès",
        description: "Conversation bloquée avec succès",
      });
      setShowBlockDialog(false);
      setConversationToBlock(null);
      setBlockReason('');
      loadConversations();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de bloquer la conversation",
        variant: "destructive"
      });
      setShowBlockDialog(false);
      setConversationToBlock(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion Messenger</h2>
          <p className="text-sm text-gray-500 mt-1">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowBroadcastDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Megaphone className="h-4 w-4 mr-2" />
            Message Broadcast
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des conversations */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>
                Liste de toutes les conversations tuteur-étudiant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-conversations-admin"
                    name="searchConversations"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Aucune conversation</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedConversation?.id === conv.id
                            ? "bg-primary/10 border-primary"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        )}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <GraduationCap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {conv.tutor?.user.firstName} {conv.tutor?.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                avec {conv.student?.user.firstName} {conv.student?.user.lastName}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {conv.messageCount}
                          </Badge>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {conv.lastMessage.content.substring(0, 50)}
                            {conv.lastMessage.content.length > 50 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatDate(conv.lastMessageAt)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockConversation(conv.id);
                              }}
                              className="h-6 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Bloquer la conversation"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Supprimer la conversation"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Détails de la conversation sélectionnée */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Conversation</CardTitle>
                    <CardDescription>
                      {selectedConversation.tutor?.user.firstName} {selectedConversation.tutor?.user.lastName} ↔ 
                      {' '}{selectedConversation.student?.user.firstName} {selectedConversation.student?.user.lastName}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {messages.length} message{messages.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Aucun message dans cette conversation</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        // Vérifier si c'est un message système TYALA
                        const senderEmail = (msg.sender as any)?.email;
                        const isSystemMessage = msg.senderId === 0 || msg.sender?.id === 0 || msg.sender?.firstName === 'TYALA' || senderEmail === 'system@tyala.com';
                        const senderName = isSystemMessage ? 'TYALA' : `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim();
                        const senderInitials = isSystemMessage ? 'TY' : `${msg.sender?.firstName?.[0] || ''}${msg.sender?.lastName?.[0] || ''}`;
                        
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "p-3 rounded-lg border",
                              isSystemMessage ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className={cn("h-6 w-6", isSystemMessage && "ring-2 ring-blue-500")}>
                                  {isSystemMessage ? (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold">
                                      TY
                                    </AvatarFallback>
                                  ) : msg.sender?.profilePhoto ? (
                                    <AvatarImage src={`${API_URL}/api/profile/photos/${msg.sender.profilePhoto}`} />
                                  ) : (
                                    <AvatarFallback>
                                      {senderInitials}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">
                                      {senderName}
                                    </p>
                                    {isSystemMessage && (
                                      <Badge variant="default" className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                                        ✓ Certifié
                                      </Badge>
                                    )}
                                  </div>
                                  {!isSystemMessage && (
                                    <p className="text-xs text-gray-500">
                                      → {msg.receiver?.firstName} {msg.receiver?.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{msg.content}</p>
                            <p className="text-xs text-gray-400">
                              {formatDate(msg.createdAt)}
                            </p>
                            {msg.messageType !== 'TEXT' && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {msg.messageType}
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[700px]">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Sélectionnez une conversation</p>
                  <p className="text-sm mt-2">Choisissez une conversation pour voir les messages</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        open={showDeleteConversationConfirm}
        onOpenChange={setShowDeleteConversationConfirm}
        onConfirm={confirmDeleteConversation}
        title="Supprimer la conversation"
        description="Êtes-vous sûr de vouloir supprimer cette conversation et tous ses messages ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      <ConfirmDialog
        open={showDeleteMessageConfirm}
        onOpenChange={setShowDeleteMessageConfirm}
        onConfirm={confirmDeleteMessage}
        title="Supprimer le message"
        description="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog Broadcast Message */}
      {showBroadcastDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Message Broadcast
              </CardTitle>
              <CardDescription>
                Envoyer un message à tous les utilisateurs au nom de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="broadcast-audience">Audience cible</Label>
                <Select value={broadcastAudience} onValueChange={(value: any) => {
                  setBroadcastAudience(value);
                  if (value !== 'specific') {
                    setBroadcastUserId('');
                  }
                }} name="broadcastAudience">
                  <SelectTrigger id="broadcast-audience" name="broadcastAudience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    <SelectItem value="students">Étudiants uniquement</SelectItem>
                    <SelectItem value="tutors">Tuteurs uniquement</SelectItem>
                    <SelectItem value="admins">Administrateurs uniquement</SelectItem>
                    <SelectItem value="specific">Utilisateur spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {broadcastAudience === 'specific' && (
                <div>
                  <Label htmlFor="broadcast-user">Utilisateur</Label>
                  {loadingUsers ? (
                    <div className="text-sm text-gray-500">Chargement des utilisateurs...</div>
                  ) : (
                    <Select value={broadcastUserId} onValueChange={(value) => setBroadcastUserId(value)} name="broadcastUserId">
                      <SelectTrigger id="broadcast-user" name="broadcastUserId">
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName} ({user.email}) - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="broadcast-title">Titre</Label>
                <Input
                  id="broadcast-title"
                  name="broadcastTitle"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Titre du message"
                />
              </div>
              <div>
                <Label htmlFor="broadcast-message">Message</Label>
                <Textarea
                  id="broadcast-message"
                  name="broadcastMessage"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Contenu du message..."
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBroadcastDialog(false);
                    setBroadcastTitle('');
                    setBroadcastMessage('');
                    setBroadcastAudience('all');
                    setBroadcastUserId('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendBroadcast}
                  disabled={
                    sendingBroadcast || 
                    !broadcastTitle.trim() || 
                    !broadcastMessage.trim() || 
                    (broadcastAudience === 'specific' && !broadcastUserId)
                  }
                >
                  {sendingBroadcast ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog Block Conversation */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Bloquer la conversation
              </CardTitle>
              <CardDescription>
                Cette conversation sera bloquée car elle viole les règlements du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="block-reason">Raison du blocage</Label>
                <Textarea
                  id="block-reason"
                  name="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Expliquez la raison du blocage..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBlockDialog(false);
                    setConversationToBlock(null);
                    setBlockReason('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmBlockConversation}
                >
                  Bloquer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;

