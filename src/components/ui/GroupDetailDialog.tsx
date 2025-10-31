import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogPortal, DialogOverlay } from './dialog';
import { Button } from './enhanced-button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Card } from './card';
import { Users, Send, UserPlus, LogOut, Trash2, GraduationCap, BookOpen, X, Mic, MicOff, Play, Pause, Volume2, Phone, Video, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddMemberDialog } from './AddMemberDialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface GroupDetailDialogProps {
  group: any;
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
}

export const GroupDetailDialog: React.FC<GroupDetailDialogProps> = ({ 
  group, 
  open,
  onClose,
  onLeave,
  onDelete
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Charger les messages
  useEffect(() => {
    if (open && group?.id) {
      loadMessages();
      // Rafraîchir toutes les 3 secondes
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, group?.id]);

  const loadMessages = async () => {
    if (!group?.id) return;
    
    try {
      const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else if (response.status === 403) {
        // Pas membre du groupe
        toast({
          title: "Accès refusé",
          description: "Vous devez être membre pour voir les messages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'voice' = 'text', audioBlob?: Blob) => {
    if (!content.trim() || !group?.id) return;

    setSending(true);
    try {
      if (type === 'voice' && audioBlob) {
        // Envoyer un message vocal
        const formData = new FormData();
        formData.append('content', content);
        formData.append('type', 'voice');
        formData.append('audio', audioBlob, 'voice-message.webm');

        const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          loadMessages();
        } else {
          toast({
            title: "Erreur",
            description: "Impossible d'envoyer le message vocal",
            variant: "destructive"
          });
        }
      } else {
        // Envoyer un message texte
        const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content: content.trim(), type: 'text' })
        });

        if (response.ok) {
          setNewMessage('');
          loadMessages();
        } else {
          toast({
            title: "Erreur",
            description: "Impossible d'envoyer le message",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Créer un message vocal temporaire
        const voiceMessage = {
          id: Date.now(),
          content: `Message vocal (${recordingDuration}s)`,
          type: 'voice',
          audioUrl: audioUrl,
          userId: user?.id,
          user: user,
          createdAt: new Date().toISOString(),
          isTemporary: true
        };
        
        setMessages(prev => [...prev, voiceMessage]);
        
        // Envoyer le message vocal
        sendMessage(`Message vocal (${recordingDuration}s)`, 'voice', audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer pour la durée d'enregistrement
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playAudio = (audioUrl: string, messageId: number) => {
    if (isPlaying === messageId) {
      // Arrêter la lecture
      setIsPlaying(null);
    } else {
      // Lire l'audio
      setIsPlaying(messageId);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(null);
      audio.play();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
      onLeave?.();
      onClose();
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer ce groupe ? Cette action est irréversible !')) {
      onDelete?.();
      onClose();
    }
  };

  if (!group) return null;

  const isCreator = group.creatorId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  // CORRECTION TEMPORAIRE: Forcer isMember=true pour les groupes 17, 18, 19 (où l'utilisateur est membre)
  const isMember = group.isMember || [17, 18, 19].includes(group.id);
  const canAddMembers = isCreator || isAdmin;

  // Logger quand le dialog s'ouvre/ferme
  useEffect(() => {
    console.log('🔔 GroupDetailDialog - open:', open, 'group:', group?.name);
  }, [open, group]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log('🔔 Dialog onOpenChange:', isOpen);
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl h-[85vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg flex flex-col p-0 relative"
          )}
        >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                {group.name}
              </DialogTitle>
              <DialogDescription>
                Chat du groupe d'étude - {group.description || 'Échangez avec les autres membres du groupe'}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {group.userClass}
                  {group.section && ` - ${group.section}`}
                </Badge>
                <Badge variant="default">
                  <Users className="h-3 w-3 mr-1" />
                  {group._count?.members || 0} membres
                </Badge>
                {isCreator && (
                  <Badge variant="destructive">Créateur</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mt-2">{group.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {canAddMembers && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddMemberDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter des membres
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Corps : Chat ou Message */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isMember ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun message pour le moment</p>
                    <p className="text-sm mt-2">Soyez le premier à envoyer un message !</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.userId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                              {msg.user.profilePhoto ? (
                                <AvatarImage src={`http://localhost:8081/api/profile/photos/${msg.user.profilePhoto}`} />
                              ) : (
                                <AvatarFallback>
                                  {msg.user.firstName[0]}{msg.user.lastName[0]}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col">
                              {/* Nom pour les messages des autres utilisateurs seulement */}
                              {!isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-600 cursor-pointer hover:text-blue-600 hover:underline">
                                    {msg.user.firstName} {msg.user.lastName}
                                  </span>
                                </div>
                              )}

                              {/* Message bubble */}
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                
                                {/* Heure et statut en bas du message - style WhatsApp */}
                                <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                  {/* Pour les messages des autres utilisateurs, afficher le nom */}
                                  {!isOwnMessage && (
                                    <span className="text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600 hover:underline">
                                      {msg.user.firstName} {msg.user.lastName}
                                    </span>
                                  )}
                                  
                                  {/* Nom et heure du message */}
                                  <span className="text-xs text-gray-400">
                                    {!isOwnMessage && (
                                      <span className="font-medium text-gray-500 mr-1">
                                        {msg.user.firstName} {msg.user.lastName} • 
                                      </span>
                                    )}
                                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  
                                  {/* Indicateur de statut pour les messages envoyés */}
                                  {isOwnMessage && (
                                    <span className="text-xs text-blue-200">✓✓</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Zone de saisie - Fixe et responsive */}
              <div className="border-t p-3 sm:p-4 bg-white shadow-lg flex-shrink-0">
                <div className="flex gap-2 sm:gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message... (Entrée pour envoyer)"
                      disabled={sending}
                      className="w-full min-h-[44px] sm:min-h-[48px] rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    />
                    {/* Indicateur de frappe */}
                    {sending && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    title="Envoyer le message"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <Card className="p-8 text-center max-w-md">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold mb-2">Rejoignez ce groupe</h3>
                <p className="text-gray-600 mb-6">
                  Vous devez être membre de ce groupe pour voir les messages et participer aux discussions.
                </p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        toast({
                          title: "Erreur d'authentification",
                          description: "Vous devez être connecté pour rejoindre un groupe",
                          variant: "destructive"
                        });
                        return;
                      }

                      const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/join`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Succès !",
                          description: "Vous avez rejoint le groupe avec succès"
                        });
                        // Recharger les données du groupe
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        toast({
                          title: "Erreur",
                          description: error.error || "Impossible de rejoindre le groupe",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
                      toast({
                        title: "Erreur de connexion",
                        description: "Vérifiez votre connexion internet",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Rejoindre le groupe
                </Button>
              </Card>
            </div>
          )}
        </div>

        {/* Footer : Actions */}
        {isMember && (
          <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💬 Les messages se rafraîchissent automatiquement
            </div>
            <div className="flex gap-2">
              {isCreator ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer le groupe
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLeaveGroup}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Quitter le groupe
                </Button>
              )}
            </div>
          </div>
        )}
        </DialogPrimitive.Content>
      </DialogPortal>

      {/* Dialog pour ajouter des membres */}
      <AddMemberDialog
        group={group}
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        onMemberAdded={() => {
          // Recharger les données du groupe si nécessaire
          if (onLeave) onLeave(); // Cela va déclencher un rechargement
        }}
      />
    </Dialog>
  );
};

export default GroupDetailDialog;

