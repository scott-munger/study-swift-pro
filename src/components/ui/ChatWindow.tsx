import React, { useState, useEffect, useRef } from 'react';
import { Button } from './enhanced-button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { 
  Users, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Paperclip,
  Image,
  File,
  X,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { API_URL } from '@/config/api';

interface ChatWindowProps {
  conversation: {
    id: number;
    type: 'tutor' | 'group';
    name: string;
    avatar?: string;
    tutor?: any;
    group?: any;
    isOnline?: boolean;
    isTutorChat?: boolean;
  } | null;
  onBack?: () => void;
  onMessageSent?: () => void;
}

interface Message {
  id: number;
  content: string;
  messageType: 'TEXT' | 'VOICE' | 'IMAGE' | 'FILE';
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onBack,
  onMessageSent
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Charger les messages
  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
      // Rafraîchir toutes les 2 secondes
      const interval = setInterval(() => {
        loadMessages();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [conversation?.id]);

  // Scroll automatique vers le bas quand nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation?.id) return;
    
    try {
      let endpoint = '';
      if (conversation.type === 'group') {
        endpoint = `${API_URL}/api/study-groups/${conversation.id}/messages`;
      } else {
        // Pour les conversations tuteur, on utilise l'endpoint conversations
        endpoint = `${API_URL}/api/conversations/${conversation.id}/messages`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Pour les conversations tuteur, enrichir avec les infos utilisateur
        if (conversation.type === 'tutor' && data.length > 0) {
          const enrichedMessages = data.map((msg: any) => {
            // Si le message est de l'utilisateur actuel
            if (msg.senderId === user?.id) {
              return {
                ...msg,
                userId: msg.senderId,
                user: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profilePhoto: user.profilePhoto
                }
              };
            } else {
              // Si le message est du tuteur
              const tutorUser = conversation.tutor?.user;
              return {
                ...msg,
                userId: msg.senderId,
                user: tutorUser || {
                  id: msg.senderId,
                  firstName: 'Tuteur',
                  lastName: '',
                  profilePhoto: null
                }
              };
            }
          });
          setMessages(enrichedMessages);
        } else {
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending) return;
    if (!conversation?.id) return;

    try {
      setSending(true);
      
      let endpoint = '';
      let body: FormData | string;
      
      if (conversation.type === 'group') {
        endpoint = `${API_URL}/api/study-groups/${conversation.id}/messages`;
        body = new FormData();
        if (selectedFile) {
          body.append('file', selectedFile);
        } else {
          body.append('content', newMessage);
        }
      } else {
        // Pour les conversations tuteur, on doit envoyer receiverId
        endpoint = `${API_URL}/api/conversations/${conversation.id}/messages`;
        if (selectedFile) {
          body = new FormData();
          body.append('file', selectedFile);
          // Pour les conversations, on doit aussi envoyer receiverId
          if (conversation.tutor?.userId) {
            body.append('receiverId', conversation.tutor.userId.toString());
          }
        } else {
          // Pour les messages texte, utiliser JSON
          const receiverId = conversation.tutor?.userId || conversation.tutor?.user?.id;
          body = JSON.stringify({
            content: newMessage,
            receiverId: receiverId
          });
        }
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      if (conversation.type === 'tutor' && !selectedFile) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: body as any
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        await loadMessages();
        onMessageSent?.();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Erreur',
          description: errorData.error || 'Impossible d\'envoyer le message',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi du message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceMessage(audioBlob);
        
        // Arrêter le stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder au microphone',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    if (!conversation?.id) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');

      let endpoint = '';
      if (conversation.type === 'group') {
        endpoint = `${API_URL}/api/study-groups/${conversation.id}/messages/audio`;
      } else {
        endpoint = `${API_URL}/api/conversations/${conversation.id}/messages/audio`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        await loadMessages();
        onMessageSent?.();
      }
    } catch (error) {
      console.error('Erreur upload audio:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const deleteMessage = async (messageId: number) => {
    // TODO: Implémenter la suppression
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La suppression de messages sera bientôt disponible'
    });
  };

  if (!conversation) {
    return (
      <div className="hidden lg:flex flex-1 items-center justify-center h-full bg-white dark:bg-slate-900">
        <div className="text-center text-gray-400 dark:text-gray-600">
          <MessageSquare className="h-20 w-20 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
          <p className="text-sm">Choisissez une conversation pour commencer à discuter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            {conversation.type === 'group' ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            ) : conversation.avatar ? (
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
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {conversation.name}
            </h3>
            {conversation.type === 'tutor' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
              </p>
            )}
            {conversation.type === 'group' && conversation.group && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation.group._count?.members || 0} membres
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      {showSearch && (
        <div className="border-b bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Zone des messages */}
      <ScrollArea className="flex-1 bg-gray-50 dark:bg-slate-950">
        <div className="p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aucun message pour le moment</p>
              <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Soyez le premier à envoyer un message !</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.userId === user?.id;
              const isVoiceMessage = msg.messageType === 'VOICE';
              const isImageMessage = msg.messageType === 'IMAGE';
              const isFileMessage = msg.messageType === 'FILE';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 mb-3 group relative",
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar - Uniquement pour les messages reçus */}
                  {!isOwnMessage && (
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      {msg.user.profilePhoto ? (
                        <AvatarImage 
                          src={`${API_URL}/api/profile/photos/${msg.user.profilePhoto}`}
                          alt={`${msg.user.firstName} ${msg.user.lastName}`}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-xs">
                          {msg.user.firstName[0]}{msg.user.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                  {/* Message */}
                  <div className={cn(
                    "flex flex-col gap-1 max-w-[70%] sm:max-w-[60%]",
                    isOwnMessage ? 'items-end' : 'items-start'
                  )}>
                    {!isOwnMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        {msg.user.firstName} {msg.user.lastName}
                      </span>
                    )}
                    
                    <div className={cn(
                      "rounded-2xl px-4 py-2 shadow-sm",
                      isOwnMessage 
                        ? 'bg-primary text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-sm'
                    )}>
                      {isVoiceMessage && msg.audioUrl && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              // TODO: Implémenter la lecture audio
                              toast({
                                title: 'Fonctionnalité à venir',
                                description: 'La lecture des messages vocaux sera bientôt disponible'
                              });
                            }}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <span className="text-sm">Message vocal</span>
                        </div>
                      )}
                      
                      {isImageMessage && msg.fileUrl && (
                        <div className="rounded-lg overflow-hidden max-w-xs">
                          <img 
                            src={`${API_URL}/${msg.fileUrl}`}
                            alt="Image"
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                      
                      {isFileMessage && msg.fileUrl && (
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{msg.fileName || 'Fichier'}</span>
                        </div>
                      )}
                      
                      {msg.messageType === 'TEXT' && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {editingMessage === msg.id ? (
                            <input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className={cn(
                                "bg-transparent border-b outline-none w-full",
                                isOwnMessage ? "border-white/50 text-white" : "border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                              )}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  // TODO: Sauvegarder modification
                                  setEditingMessage(null);
                                }
                                if (e.key === 'Escape') {
                                  setEditingMessage(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            msg.content
                          )}
                        </p>
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1 px-1",
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwnMessage && (
                        <CheckCheck className="h-3 w-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Aperçu fichier/image */}
        {previewUrl && (
          <div className="mb-3 relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-xs rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tapez un message..."
              className="pr-10"
            />
            <input
              type="file"
              id="file-input"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Pièce jointe */}
            <label htmlFor="file-input" className="cursor-pointer">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </label>

            {/* Enregistrement vocal */}
            {isRecording ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-10 w-10 p-0"
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
              >
                <MicOff className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onMouseDown={startRecording}
                onTouchStart={startRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}

            {/* Envoyer */}
            <Button
              type="button"
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              size="sm"
              className="h-10 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

