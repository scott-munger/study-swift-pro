import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogPortal, DialogOverlay } from './dialog';
import { Textarea } from './textarea';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './enhanced-button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Card } from './card';
import { 
  Users, 
  Send, 
  UserPlus, 
  LogOut, 
  Trash2, 
  GraduationCap, 
  BookOpen, 
  X, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2,
  Loader2,
  MessageSquare,
  Paperclip,
  Image,
  File,
  Download,
  Eye,
  MoreVertical,
  Edit,
  Check,
  CheckCheck,
  Search,
  ChevronUp,
  ChevronDown,
  Pin,
  FileText,
  RefreshCw,
  Copy,
  ArrowLeft,
  Settings,
  UserCog,
  Shield,
  AlertCircle,
  Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddMemberDialog } from './AddMemberDialog';
import { ConfirmDialog } from './ConfirmDialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { API_URL } from '@/config/api';

interface GroupDetailDialogProps {
  group: any;
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
  inline?: boolean; // Mode inline sans Dialog
  onBack?: () => void; // Bouton retour pour mobile
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
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: number;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  reactions?: Array<{
    id: number;
    emoji: string;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
  }>;
}

export const TutorChat: React.FC<GroupDetailDialogProps> = ({ 
  group, 
  open,
  onClose,
  onLeave,
  onDelete,
  inline = false,
  onBack
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<number, number>>({}); // Progress par message ID (0-100)
  const [audioDuration, setAudioDuration] = useState<Record<number, number>>({}); // Durée totale par message ID
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [showMessageActions, setShowMessageActions] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, any[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAdminsDialog, setShowAdminsDialog] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupSettings, setGroupSettings] = useState({
    name: group?.name || '',
    description: group?.description || '',
    userClass: group?.userClass || '',
    section: group?.section || ''
  });
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null);
  // États pour les dialogs de confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{id: number; name: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageActionsRef = useRef<HTMLDivElement>(null);

  // Emojis populaires pour les réactions
  const popularEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯', '✨'];

  // Fonction helper pour obtenir l'URL correcte de l'audio
  const getAudioUrl = (audioUrl: string): string => {
    if (!audioUrl) return '';
    
    // Si c'est déjà une URL complète, la retourner
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }
    
    // Si c'est un chemin avec /uploads/audio-messages/, extraire le filename
    if (audioUrl.includes('/uploads/audio-messages/')) {
      const filename = audioUrl.split('/uploads/audio-messages/')[1];
      return `${API_URL}/api/audio/${filename}`;
    }
    
    // Si c'est juste un filename ou un chemin relatif, utiliser l'endpoint /api/audio
    const filename = audioUrl.split('/').pop() || audioUrl;
    return `${API_URL}/api/audio/${filename}`;
  };

  // Gérer le bouton "Nouveaux messages" (auto-scroll désactivé)
  useEffect(() => {
    // Afficher le bouton uniquement si pas en bas et qu'il y a des messages
    if (messages.length > 0 && !isAtBottom) {
      setShowNewMessagesButton(true);
    }
    // Pas de scroll automatique - l'utilisateur contrôle le scroll
  }, [messages, isAtBottom]);

  // Précharger les durées des messages vocaux
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.messageType === 'VOICE' && msg.audioUrl && !audioDuration[msg.id]) {
        // Construire l'URL correcte pour l'audio
        const audioUrl = getAudioUrl(msg.audioUrl);
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          setAudioDuration(prev => ({ ...prev, [msg.id]: audio.duration }));
        };
        audio.onerror = (e) => {
          console.error('Erreur préchargement audio:', msg.audioUrl, e);
        };
        // Charger seulement les métadonnées (pas l'audio complet)
        audio.preload = 'metadata';
      }
    });
  }, [messages]);

  // Fonction pour aller aux nouveaux messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
      setShowNewMessagesButton(false);
      setIsAtBottom(true);
    } else if (scrollRef.current) {
      // Fallback si messagesEndRef n'est pas disponible
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
        setShowNewMessagesButton(false);
        setIsAtBottom(true);
      }
    }
  };

  // Détecter si l'utilisateur est en bas de la liste des messages
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottomNow = scrollHeight - scrollTop - clientHeight < 100; // 100px de marge pour plus de tolérance
    
    if (isAtBottomNow !== isAtBottom) {
      setIsAtBottom(isAtBottomNow);
      if (isAtBottomNow) {
        setShowNewMessagesButton(false);
      } else {
        setShowNewMessagesButton(messages.length > 0);
      }
    }
  };

  // Long press (mobile) pour sélectionner un message comme WhatsApp
  const longPressStart = (messageId: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      toggleMessageSelection(messageId);
    }, 500);
  };

  const longPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Fermer le sélecteur d'emojis quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReactionPicker && !(event.target as Element).closest('.reaction-picker')) {
        setShowReactionPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);

  // Charger les messages quand le dialog s'ouvre
  useEffect(() => {
    if (open && group?.id) {
      loadMessages();
      loadPinnedMessages();
      // Rafraîchir toutes les 2 secondes
      const interval = setInterval(() => {
        loadMessages();
        loadPinnedMessages();
      }, 2000);
      return () => clearInterval(interval);
    } else {
      // Nettoyer quand le dialog se ferme
      setMessages([]);
      setPinnedMessages([]);
    }
  }, [open, group?.id]);

  // Nettoyer l'enregistrement quand le composant se démonte
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);

  const loadMessages = async (retryCount = 0) => {
    if (!group?.id) return;
    
    // Déterminer l'endpoint selon le type de conversation
    const isTutorChat = group.isTutorChat || false;
    const endpoint = isTutorChat && group.conversationId
      ? `${API_URL}/api/conversations/${group.conversationId}/messages`
      : `${API_URL}/api/study-groups/${group.id}/messages`;
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        let data = await response.json();
        
        // Pour les conversations tuteur, enrichir les messages avec la structure attendue
        if (isTutorChat) {
          data = data.map((msg: any) => {
            // Transformer senderId/receiverId en userId et ajouter user
            const isOwnMessage = msg.senderId === user?.id;
            // Vérifier si c'est un message système TYALA (senderId = 0 OU userId = 0 OU user.firstName = 'TYALA')
            const isSystemMessage = msg.senderId === 0 || msg.userId === 0 || msg.user?.id === 0 || msg.user?.firstName === 'TYALA' || msg.user?.email === 'system@tyala.com';
            
            // Déterminer l'utilisateur affiché pour le message
            let messageUser;
            if (isSystemMessage) {
              // Message système - Afficher TYALA avec badge certifié (PRIORITÉ ABSOLUE)
              messageUser = {
                id: 0,
                firstName: 'TYALA',
                lastName: '',
                profilePhoto: null,
                email: 'system@tyala.com'
              };
            } else if (isOwnMessage) {
              messageUser = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto
              };
            } else {
              // Message du tuteur ou autre utilisateur
              // Utiliser directement msg.user s'il existe (enrichi par le backend)
              if (msg.user && msg.user.id !== 0) {
                messageUser = msg.user;
              } else {
                // Si senderId existe dans les membres du groupe, utiliser cet utilisateur
                const senderMember = group.members?.find((m: any) => m.user?.id === msg.senderId);
                messageUser = senderMember?.user || group.members?.[0]?.user || {
                  id: msg.senderId,
                  firstName: 'Tuteur',
                  lastName: '',
                  profilePhoto: null
                };
              }
            }
            
            return {
              ...msg,
              userId: msg.senderId,
              messageType: msg.messageType || 'TEXT',
              user: messageUser
            };
          });
        }
        
        setMessages(data);
        
        // Extraire et organiser les réactions par message
        const reactionsByMessage: Record<number, any[]> = {};
        data.forEach((message: Message) => {
          if (message.reactions) {
            reactionsByMessage[message.id] = message.reactions;
          }
        });
        setMessageReactions(reactionsByMessage);
        
        setConnectionStatus('connected');
        setLastMessageTime(new Date());
        // Reset retry count on success
        if (retryCount > 0) {
          console.log('✅ Messages rechargés avec succès après', retryCount, 'tentatives');
        }
      } else if (response.status === 403) {
        // Accès refusé - ne pas afficher de toast à chaque rafraîchissement
        if (messages.length === 0) {
          const errorData = await response.json().catch(() => ({ error: 'Accès refusé' }));
          toast({
            title: "Accès refusé",
            description: errorData.error || "Vous n'avez pas accès à cette conversation",
            variant: "destructive"
          });
        }
        // Fermer le chat si l'utilisateur n'a plus accès (groupe supprimé ou utilisateur retiré)
        onClose?.();
        
        // Déclencher le callback onLeave pour recharger les conversations
        if (onLeave) {
          onLeave();
        }
        return;
      } else if (response.status === 404) {
        // Groupe/conversation non trouvé(e) - probablement supprimé(e)
        console.log('❌ 404 - Groupe/conversation non trouvé(e), fermeture du chat');
        toast({
          title: "Introuvable",
          description: "Cette conversation n'existe plus",
          variant: "destructive"
        });
        // Fermer le chat IMMÉDIATEMENT si le groupe/conversation n'existe plus
        onClose?.();
        
        // Déclencher le callback onLeave pour recharger les conversations
        if (onLeave) {
          onLeave();
        }
        return;
      } else if (response.status === 401) {
        // Token expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (response.status >= 500) {
        // Erreur serveur - retry automatique
        if (retryCount < 3) {
          setConnectionStatus('reconnecting');
          console.log(`🔄 Erreur serveur, retry ${retryCount + 1}/3 dans 2 secondes...`);
          setTimeout(() => {
            loadMessages(retryCount + 1);
          }, 2000 * (retryCount + 1)); // Délai progressif
        } else {
          setConnectionStatus('disconnected');
          toast({
            title: "Erreur de connexion",
            description: "Impossible de charger les messages après plusieurs tentatives",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 3) {
        setConnectionStatus('reconnecting');
        console.log(`🔄 Erreur réseau, retry ${retryCount + 1}/3 dans 2 secondes...`);
        setTimeout(() => {
          loadMessages(retryCount + 1);
        }, 2000 * (retryCount + 1));
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Erreur de connexion",
          description: "Vérifiez votre connexion internet",
          variant: "destructive"
        });
      }
    }
  };

  const sendMessage = async (content: string, type: 'TEXT' | 'VOICE' | 'IMAGE' | 'FILE' = 'TEXT', audioBlob?: Blob, file?: File, retryCount = 0) => {
    if (!content.trim() && !audioBlob && !file) return;
    if (!group?.id) return;

    // Déterminer l'endpoint selon le type de conversation
    const isTutorChat = group.isTutorChat || false;
    const baseEndpoint = isTutorChat && group.conversationId
      ? `${API_URL}/api/conversations/${group.conversationId}`
      : `${API_URL}/api/study-groups/${group.id}`;

    // Pour les conversations tuteur, déterminer le receiverId
    let receiverId: number | undefined = undefined;
    if (isTutorChat && group.conversationId && user?.id) {
      // Méthode 1: Utiliser studentId et tutorUserId si disponibles
      if (group.studentId && group.tutorUserId) {
        if (user.id === group.studentId) {
          // L'étudiant envoie au tuteur
          receiverId = group.tutorUserId;
        } else if (user.id === group.tutorUserId) {
          // Le tuteur envoie à l'étudiant
          receiverId = group.studentId;
        }
      }
      
      // Méthode 2: Fallback - utiliser creatorId (généralement l'userId du tuteur)
      if (!receiverId && group.creatorId) {
        if (user.id === group.creatorId) {
          // Si on est le tuteur (creatorId), on envoie à l'étudiant
          // Récupérer le studentId depuis l'API de manière synchrone
          receiverId = group.studentId || undefined;
        } else {
          // Si on est l'étudiant, le receiverId est le creatorId (tuteur)
          receiverId = group.creatorId;
        }
      }
      
      // Méthode 3: Dernier fallback - récupérer depuis members
      if (!receiverId && group.members?.[0]?.user?.id) {
        const otherUserId = group.members[0].user.id;
        if (otherUserId !== user.id) {
          receiverId = otherUserId;
        }
      }
      
      // Si toujours pas de receiverId, récupérer depuis l'API (fallback asynchrone)
      if (!receiverId && group.conversationId) {
        try {
          const convResponse = await fetch(`${API_URL}/api/conversations`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (convResponse.ok) {
            const conversations = await convResponse.json();
            const conversation = conversations.find((c: any) => c.id === group.conversationId);
            if (conversation) {
              console.log('📋 Conversation trouvée dans l\'API:', conversation);
              // Si on est l'étudiant, le receiverId est l'userId du tuteur
              if (user.id === conversation.studentId && conversation.tutor?.user?.id) {
                receiverId = conversation.tutor.user.id;
              }
              // Si on est le tuteur, le receiverId est le studentId
              else if (conversation.tutor?.user?.id && user.id === conversation.tutor.user.id) {
                receiverId = conversation.studentId;
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de la conversation:', error);
        }
      }
    }

    // Vérifier que receiverId est défini pour les conversations tuteur
    if (isTutorChat && !receiverId) {
      console.error('❌ Impossible de déterminer receiverId pour la conversation tuteur', {
        conversationId: group.conversationId,
        studentId: group.studentId,
        tutorUserId: group.tutorUserId,
        creatorId: group.creatorId,
        userId: user?.id,
        group: group
      });
      toast({
        title: "Erreur",
        description: "Impossible de déterminer le destinataire du message. Veuillez réessayer.",
        variant: "destructive"
      });
      setSending(false);
      return;
    }

    console.log('📤 Frontend - Envoi message:', { 
      content: content?.substring(0, 50), 
      type, 
      hasAudioBlob: !!audioBlob, 
      hasFile: !!file, 
      isTutorChat, 
      receiverId, 
      userId: user?.id,
      groupData: {
        conversationId: group.conversationId,
        studentId: group.studentId,
        tutorUserId: group.tutorUserId,
        creatorId: group.creatorId
      },
      retry: retryCount 
    });
    
    setSending(true);
    try {
      if (type === 'VOICE' && audioBlob) {
        // Envoyer un message vocal
        console.log('🎤 Frontend - Préparation message vocal, taille blob:', audioBlob.size, 'type:', audioBlob.type);
        
        const formData = new FormData();
        formData.append('content', content || 'Message vocal');
        formData.append('messageType', 'VOICE');
        if (isTutorChat && receiverId) {
          formData.append('receiverId', receiverId.toString());
        }
        
        // Déterminer l'extension du fichier basée sur le type MIME
        const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 
                             audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        
        formData.append('audio', audioBlob, `voice-${Date.now()}.${fileExtension}`);

        const endpoint = `${baseEndpoint}/messages${isTutorChat ? '/audio' : ''}`;
        console.log('🎤 Frontend - FormData préparé, envoi vers:', endpoint);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        console.log('🎤 Frontend - Réponse reçue:', response.status, response.statusText);

        if (response.ok) {
          console.log('✅ Frontend - Message vocal envoyé avec succès');
          await loadMessages();
        } else {
          const errorData = await response.json();
          console.error('❌ Frontend - Erreur envoi message vocal:', errorData);
          
          // Retry automatique pour les erreurs temporaires
          if (response.status >= 500 && retryCount < 2) {
            console.log(`🔄 Erreur serveur, retry ${retryCount + 1}/2 dans 1 seconde...`);
            setTimeout(() => {
              sendMessage(content, type, audioBlob, file, retryCount + 1);
            }, 1000);
            return;
          }
          
          toast({
            title: "Erreur",
            description: errorData.error || "Impossible d'envoyer le message vocal",
            variant: "destructive"
          });
        }
      } else if ((type === 'IMAGE' || type === 'FILE') && file) {
        // Envoyer un message avec fichier
        console.log('📎 Frontend - Préparation message fichier, nom:', file.name, 'type:', file.type, 'taille:', file.size);
        
        const formData = new FormData();
        formData.append('content', content || (type === 'IMAGE' ? '📷 Photo' : '📎 Fichier'));
        formData.append('messageType', type);
        if (isTutorChat && receiverId) {
          formData.append('receiverId', receiverId.toString());
        }
        formData.append('file', file);

        const endpoint = `${baseEndpoint}/messages${isTutorChat ? '/file' : ''}`;
        console.log('📎 Frontend - FormData préparé, envoi vers:', endpoint);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        console.log('📎 Frontend - Réponse reçue:', response.status, response.statusText);

        if (response.ok) {
          console.log('✅ Frontend - Message fichier envoyé avec succès');
          setSelectedFile(null);
          setPreviewUrl(null);
          await loadMessages();
        } else {
          const errorData = await response.json();
          console.error('❌ Frontend - Erreur envoi message fichier:', errorData);
          
          // Retry automatique pour les erreurs temporaires
          if (response.status >= 500 && retryCount < 2) {
            console.log(`🔄 Erreur serveur, retry ${retryCount + 1}/2 dans 1 seconde...`);
            setTimeout(() => {
              sendMessage(content, type, audioBlob, file, retryCount + 1);
            }, 1000);
            return;
          }
          
          toast({
            title: "Erreur",
            description: errorData.error || "Impossible d'envoyer le fichier",
            variant: "destructive"
          });
        }
      } else {
        // Envoyer un message texte
        const endpoint = `${baseEndpoint}/messages`;
        const body: any = { 
          content: content.trim() || '', 
          messageType: 'TEXT' 
        };
        // Pour les conversations tuteur, ajouter receiverId (requis)
        if (isTutorChat) {
          if (!receiverId) {
            console.error('❌ receiverId manquant pour conversation tuteur');
            toast({
              title: "Erreur",
              description: "Impossible de déterminer le destinataire",
              variant: "destructive"
            });
            setSending(false);
            return;
          }
          body.receiverId = receiverId;
        }
        
        console.log('📝 Frontend - Envoi message texte:', { endpoint, body, receiverId });
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          setNewMessage('');
          await loadMessages();
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Erreur inconnue' };
          }
          console.error('❌ Frontend - Erreur envoi message texte:', errorData);
          
          // Retry automatique pour les erreurs temporaires
          if (response.status >= 500 && retryCount < 2) {
            console.log(`🔄 Erreur serveur, retry ${retryCount + 1}/2 dans 1 seconde...`);
            setTimeout(() => {
              sendMessage(content, type, audioBlob, file, retryCount + 1);
            }, 1000);
            return;
          }
          
          toast({
            title: "Erreur",
            description: errorData.error || "Impossible d'envoyer le message",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 2) {
        console.log(`🔄 Erreur réseau, retry ${retryCount + 1}/2 dans 1 seconde...`);
        setTimeout(() => {
          sendMessage(content, type, audioBlob, file, retryCount + 1);
        }, 1000);
        return;
      }
      
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet et réessayez",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      // Essayer différents types MIME supportés
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Utiliser le type par défaut
          }
        }
      }
      
      console.log('🎤 Type MIME sélectionné:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blobType = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        const duration = Math.round(recordingDuration);
        
        console.log('🎤 Blob créé:', { size: audioBlob.size, type: audioBlob.type });
        
        // Arrêter le stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Envoyer le message vocal
        await sendMessage(`🎤 Message vocal (${duration}s)`, 'VOICE', audioBlob);
        
        setRecordingDuration(0);
      };

      mediaRecorder.start(100); // Enregistrer par chunks de 100ms
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
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playAudio = (audioUrl: string, messageId: number) => {
    if (isPlaying === messageId) {
      // Arrêter la lecture
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setIsPlaying(null);
      setAudioElement(null);
      setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
    } else {
      // Arrêter toute autre lecture en cours
      if (audioElement) {
        audioElement.pause();
        setAudioProgress(prev => {
          const newProgress = { ...prev };
          if (isPlaying) newProgress[isPlaying] = 0;
          return newProgress;
        });
      }

      // Vérifier que l'URL est valide
      if (!audioUrl || !audioUrl.startsWith('http')) {
        console.error('❌ URL audio invalide:', audioUrl);
        toast({
          title: "Erreur",
          description: "URL audio invalide",
          variant: "destructive"
        });
        return;
      }

      console.log('🎵 Lecture audio:', audioUrl, 'pour message:', messageId);

      // Lire l'audio
      const audio = new Audio(audioUrl);
      
      // Récupérer la durée quand elle est disponible
      audio.onloadedmetadata = () => {
        console.log('✅ Métadonnées audio chargées:', audio.duration, 'secondes');
        setAudioDuration(prev => ({ ...prev, [messageId]: audio.duration }));
      };
      
      // Mettre à jour la progression pendant la lecture
      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(prev => ({ ...prev, [messageId]: progress }));
        }
      };
      
      audio.onended = () => {
        console.log('✅ Audio terminé');
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      };
      
      audio.onerror = (e) => {
        console.error('❌ Erreur lecture audio:', e, 'URL:', audioUrl);
        console.error('Erreur audio détail:', {
          error: audio.error,
          code: audio.error?.code,
          message: audio.error?.message
        });
        toast({
          title: "Erreur",
          description: `Impossible de lire le message vocal: ${audio.error?.message || 'Format non supporté'}`,
          variant: "destructive"
        });
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      };
      
      // Gestion des événements de chargement
      audio.oncanplay = () => {
        console.log('✅ Audio prêt à être lu');
      };
      
      audio.oncanplaythrough = () => {
        console.log('✅ Audio complètement chargé');
      };
      
      setAudioElement(audio);
      setIsPlaying(messageId);
      
      // Essayer de jouer l'audio
      audio.play().catch((error) => {
        console.error('❌ Erreur play audio:', error, 'URL:', audioUrl);
        toast({
          title: "Erreur",
          description: `Impossible de lire le message vocal: ${error.message || 'Vérifiez votre connexion'}`,
          variant: "destructive"
        });
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      });
    }
  };

  // Gestion de la sélection de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier est trop volumineux (max 50MB)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Créer une URL de prévisualisation pour les images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Envoyer le fichier sélectionné
  const sendSelectedFile = () => {
    if (!selectedFile) return;

    const messageType = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    sendMessage(newMessage, messageType, undefined, selectedFile);
  };

  // Annuler la sélection de fichier
  const cancelFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Télécharger un fichier
  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/chat-files/${fileUrl}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formater la taille de fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Gestion de la sélection des messages
  const toggleMessageSelection = (messageId: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  // Supprimer un message
  const deleteMessage = async (messageId: number) => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, la suppression n'est pas supportée pour l'instant
    if (isTutorChat) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "La suppression de messages n'est pas disponible pour les conversations tuteur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await loadMessages();
        toast({
          title: "Succès",
          description: "Message supprimé avec succès",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer le message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur suppression message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Modifier un message
  const editMessage = async (messageId: number, newContent: string) => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, l'édition n'est pas supportée pour l'instant
    if (isTutorChat) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "L'édition de messages n'est pas disponible pour les conversations tuteur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        await loadMessages();
        setEditingMessage(null);
        setEditContent('');
        toast({
          title: "Succès",
          description: "Message modifié avec succès",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de modifier le message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur modification message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification",
        variant: "destructive"
      });
    }
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  // Gérer les réactions aux messages
  const toggleReaction = async (messageId: number, emoji: string) => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, les réactions ne sont pas supportées pour l'instant
    if (isTutorChat) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "Les réactions ne sont pas disponibles pour les conversations tuteur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mettre à jour les réactions localement
        setMessageReactions(prev => {
          const currentReactions = prev[messageId] || [];
          if (result.action === 'added') {
            return {
              ...prev,
              [messageId]: [...currentReactions, result.reaction]
            };
          } else {
            return {
              ...prev,
              [messageId]: currentReactions.filter(r => !(r.userId === user?.id && r.emoji === emoji))
            };
          }
        });
        
        // Recharger les messages pour avoir les données à jour
        await loadMessages();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible d'ajouter la réaction",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de la réaction:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Grouper les réactions par emoji
  const getGroupedReactions = (messageId: number): Array<{ emoji: string; count: number; users: any[]; userReacted: boolean }> => {
    const reactions = messageReactions[messageId] || [];
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      if (reaction.userId === user?.id) {
        acc[reaction.emoji].userReacted = true;
      }
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: any[]; userReacted: boolean }>);
    
    return Object.values(grouped);
  };

  // Obtenir l'icône appropriée pour un type de fichier
  const getFileIcon = (fileType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-600" />;
    } else if (fileType === 'application/pdf') {
      return <span className="text-red-600 font-bold text-lg">📄</span>;
    } else if (fileType.includes('word') || extension === 'doc' || extension === 'docx') {
      return <span className="text-blue-600 font-bold text-lg">📝</span>;
    } else if (fileType.includes('excel') || extension === 'xls' || extension === 'xlsx') {
      return <span className="text-green-600 font-bold text-lg">📊</span>;
    } else if (fileType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') {
      return <span className="text-orange-600 font-bold text-lg">📊</span>;
    } else if (fileType.includes('text') || extension === 'txt') {
      return <span className="text-gray-600 font-bold text-lg">📄</span>;
    } else if (fileType.includes('zip') || extension === 'zip' || extension === 'rar') {
      return <span className="text-purple-600 font-bold text-lg">📦</span>;
    } else {
      return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  // Obtenir le label du type de fichier
  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('word')) return 'Document Word';
    if (fileType.includes('excel')) return 'Feuille de calcul';
    if (fileType.includes('powerpoint')) return 'Présentation';
    if (fileType.includes('text')) return 'Texte';
    if (fileType.includes('zip')) return 'Archive';
    return 'Fichier';
  };

  // Vérifier si un fichier peut être prévisualisé
  const canPreviewFile = (fileType: string) => {
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' || 
           fileType.includes('text');
  };

  // Prévisualiser un fichier
  const previewFile = (fileUrl: string, fileType: string) => {
    const fullUrl = `${API_URL}/api/chat-files/${fileUrl}`;
    
    if (fileType.startsWith('image/')) {
      // Ouvrir l'image dans un nouvel onglet
      window.open(fullUrl, '_blank');
    } else if (fileType === 'application/pdf') {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(fullUrl, '_blank');
    } else if (fileType.includes('text')) {
      // Ouvrir le fichier texte dans un nouvel onglet
      window.open(fullUrl, '_blank');
    } else {
      // Pour les autres types, essayer d'ouvrir dans un nouvel onglet
      window.open(fullUrl, '_blank');
    }
  };

  // Rechercher dans les messages
  const searchMessages = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      message.user.firstName.toLowerCase().includes(query.toLowerCase()) ||
      message.user.lastName.toLowerCase().includes(query.toLowerCase()) ||
      (message.fileName && message.fileName.toLowerCase().includes(query.toLowerCase()))
    );

    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  // Naviguer vers le résultat de recherche suivant
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].id);
  };

  // Naviguer vers le résultat de recherche précédent
  const goToPreviousResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex].id);
  };

  // Faire défiler vers un message spécifique
  const scrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Mettre en surbrillance temporaire
      messageElement.classList.add('bg-yellow-100', 'border-yellow-300');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'border-yellow-300');
      }, 2000);
    }
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setShowSearch(false);
  };

  // Charger les messages épinglés
  const loadPinnedMessages = async () => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, les messages épinglés ne sont pas supportés
    if (isTutorChat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/pinned-messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPinnedMessages(data);
      }
    } catch (error) {
      console.error('Erreur chargement messages épinglés:', error);
    }
  };

  // Épingler un message
  const pinMessage = async (messageId: number) => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, l'épinglage n'est pas supporté
    if (isTutorChat) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "L'épinglage de messages n'est pas disponible pour les conversations tuteur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages/${messageId}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Message épinglé avec succès",
        });
        await loadPinnedMessages();
        await loadMessages();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible d'épingler le message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur épinglage message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Désépingler un message
  const unpinMessage = async (messageId: number) => {
    if (!group?.id) return;
    
    const isTutorChat = group.isTutorChat || false;
    // Pour les conversations tuteur, le désépinglage n'est pas supporté
    if (isTutorChat) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "Le désépinglage de messages n'est pas disponible pour les conversations tuteur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages/${messageId}/pin`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Message désépinglé avec succès",
        });
        await loadPinnedMessages();
        await loadMessages();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de désépingler le message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur désépinglage message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Ouvrir le profil utilisateur
  const openUserProfile = (user: any) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  // Démarrer l'édition
  const startEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        sendSelectedFile();
      } else if (newMessage.trim() && !sending) {
        sendMessage(newMessage);
      }
    }
  };

  const handleLeaveGroup = () => {
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = async () => {
    if (!group?.id || isTutorChat) {
      setShowLeaveConfirm(false);
      return;
    }
    
    try {
      setShowLeaveConfirm(false);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Vous avez quitté le groupe avec succès",
        });
        // Fermer le chat
        onClose?.();
        // Recharger les conversations (le groupe ne sera plus visible)
      onLeave?.();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de quitter le groupe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sortie du groupe:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
      onDelete?.();
      onClose();
  };

  const handleRemoveMemberClick = (userId: number, name: string) => {
    setMemberToRemove({ id: userId, name });
    setShowRemoveMemberConfirm(true);
  };

  const handleConfirmRemoveMember = () => {
    if (memberToRemove) {
      removeMember(memberToRemove.id);
      setShowRemoveMemberConfirm(false);
      setMemberToRemove(null);
    }
  };

  // Charger les membres du groupe
  const loadGroupMembers = async () => {
    if (!group?.id || isTutorChat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const members = await response.json();
        setGroupMembers(members);
      } else if (response.status === 404 || response.status === 403) {
        // Le groupe n'existe plus ou l'utilisateur n'est plus membre
        // Fermer le chat automatiquement et recharger les conversations
        console.log(`⚠️ Groupe introuvable ou utilisateur plus membre (${response.status}), fermeture du chat`);
        
        // Fermer le chat immédiatement
        onClose?.();
        
        // Déclencher le callback onLeave pour recharger les conversations
        // Cela supprimera le groupe de la liste
        if (onLeave) {
          onLeave();
        }
        
        return;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      // En cas d'erreur, ne pas charger les membres mais ne pas fermer le chat
    }
  };

  // Retirer un membre du groupe
  const removeMember = async (userId: number) => {
    if (!group?.id || isTutorChat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Membre retiré du groupe",
        });
        await loadGroupMembers();
        await loadMessages(); // Recharger pour mettre à jour les données du groupe
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de retirer le membre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Mettre à jour les paramètres du groupe
  const updateGroupSettings = async () => {
    if (!group?.id || isTutorChat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(groupSettings)
      });
      
      if (response.ok) {
        const updatedGroup = await response.json();
        console.log('✅ Groupe mis à jour:', updatedGroup);
        
        // Mettre à jour l'objet group local avec les nouvelles données
        if (group) {
          group.name = updatedGroup.name;
          group.description = updatedGroup.description;
          group.userClass = updatedGroup.userClass;
          group.section = updatedGroup.section;
        }
        
        // Mettre à jour groupSettings avec les nouvelles valeurs
        setGroupSettings({
          name: updatedGroup.name || '',
          description: updatedGroup.description || '',
          userClass: updatedGroup.userClass || '',
          section: updatedGroup.section || ''
        });
        
        toast({
          title: "Succès",
          description: "Paramètres du groupe mis à jour avec succès",
        });
        setShowSettingsDialog(false);
        
        // Recharger les messages pour mettre à jour les infos du groupe
        await loadMessages();
        
        // Déclencher le callback onLeave pour recharger les conversations dans Messages.tsx
        if (onLeave) {
          onLeave();
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Erreur inconnue' };
        }
        console.error('❌ Erreur mise à jour groupe:', errorData);
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de mettre à jour les paramètres",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Mettre à jour le rôle d'un membre
  const updateMemberRole = async (userId: number, role: 'MEMBER' | 'MODERATOR' | 'ADMIN') => {
    if (!group?.id || isTutorChat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role })
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Rôle mis à jour",
        });
        await loadGroupMembers();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de mettre à jour le rôle",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Charger les membres au montage si c'est un groupe
  useEffect(() => {
    if (!group) return;
    const isTutorChatLocal = group.isTutorChat || false;
    const isCreatorLocal = group.creatorId === user?.id;
    
    if (!isTutorChatLocal && isCreatorLocal) {
      // Charger les membres seulement si le groupe existe
      loadGroupMembers().catch(error => {
        console.error('Erreur lors du chargement des membres:', error);
      });
      setGroupSettings({
        name: group.name || '',
        description: group.description || '',
        userClass: group.userClass || '',
        section: group.section || ''
      });
    }
  }, [group?.id, user?.id]); // Utiliser group?.id pour éviter les rechargements inutiles

  if (!group) return null;

  const isTutorChat = group.isTutorChat || false;
  const isCreator = group.creatorId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isMember = true; // Dans un chat 1-à-1, l'utilisateur est toujours membre
  const canAddMembers = !isTutorChat && (isCreator || isAdmin); // Seul le créateur peut ajouter des membres (pas pour les chats tuteur)

  // Formatage de la durée d'enregistrement
  const formatDuration = (seconds: number) => {
    // Gérer les cas invalides
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formater le temps actuel de lecture
  const formatCurrentTime = (messageId: number) => {
    const duration = audioDuration[messageId] || 0;
    const progress = audioProgress[messageId] || 0;
    const currentSeconds = Math.floor((progress / 100) * duration);
    return formatDuration(currentSeconds);
  };

  if (!group) {
    return null;
  }

  if (!open) {
    return null;
  }

  // Si inline, retourner tout le contenu sans Dialog
  if (inline) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-12">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="mb-2 lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </Button>
              )}
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                {group.name}
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {group.description || 'Échangez avec les autres membres du groupe'}
              </p>
            </div>
            
            {/* Menu options groupe - Desktop uniquement pour le créateur */}
            {!isTutorChat && isCreator && (
              <div className="relative hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="h-9 w-9 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                
                {/* Menu déroulant - Style WhatsApp */}
                {showGroupMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGroupMenu(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1">
                      <button
                        onClick={async () => {
                          console.log('📝 Ouvrir dialog ajouter membres');
                          setShowGroupMenu(false);
                          setShowAddMemberDialog(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Ajouter des membres</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await loadGroupMembers();
                            setShowMembersDialog(true);
                            setShowGroupMenu(false);
                          } catch (error) {
                            console.error('Erreur lors du chargement des membres:', error);
                            // Si erreur 404, fermer le chat
                            if (error instanceof Error && error.message.includes('404')) {
                              onClose?.();
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <UserCog className="h-4 w-4" />
                        <span>Gérer les membres</span>
                      </button>
                      <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                      <button
                        onClick={() => {
                          console.log('📝 Ouvrir dialog paramètres, group:', group);
                          if (group) {
                            setGroupSettings({
                              name: group.name || '',
                              description: group.description || '',
                              userClass: group.userClass || '',
                              section: group.section || ''
                            });
                            console.log('📝 Paramètres définis:', {
                              name: group.name || '',
                              description: group.description || '',
                              userClass: group.userClass || '',
                              section: group.section || ''
                            });
                            setShowSettingsDialog(true);
                          }
                          setShowGroupMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Paramètres du groupe</span>
                      </button>
                      <button
                        onClick={() => {
                          loadGroupMembers();
                          setShowAdminsDialog(true);
                          setShowGroupMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Administrateurs</span>
                      </button>
                      <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                      <button
                        onClick={() => {
                          handleDeleteGroup();
                          setShowGroupMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Supprimer le groupe</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Boutons d'action - Mobile et pour non-créateur */}
            {(!isCreator || isTutorChat) && (
              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="h-9 w-9 rounded-full"
                >
                  <Search className="h-5 w-5" />
                </Button>
            </div>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        {showSearch && (
            <div className="border-b bg-white p-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-messages-input-inline"
                    name="searchMessages"
                    placeholder="Rechercher dans les messages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchMessages(e.target.value);
                    }}
                    className="pl-10"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPreviousResult}
                      disabled={searchResults.length === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="px-2">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNextResult}
                      disabled={searchResults.length === 0}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        {/* Zone de chat - Structure responsive professionnelle */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
            {isMember ? (
              <>
                {/* Zone des messages - Scrollable */}
                <div className="flex-1 overflow-hidden relative">
                  <ScrollArea 
                    className="h-full" 
                    ref={scrollRef}
                    onScroll={handleScroll}
                  >
                  <div className="p-2 sm:p-3 lg:p-4 xl:p-6 pb-safe">
                    {group.isBlocked ? (
                      <div className="text-center bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 sm:p-8 my-4">
                        <Ban className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-orange-500" />
                        <h3 className="text-lg sm:text-xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                          Conversation bloquée
                        </h3>
                        <p className="text-sm sm:text-base text-orange-700 dark:text-orange-200 mb-4">
                          {group.blockReason || 'Cette conversation a été bloquée par l\'administrateur pour violation des règlements du site.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                          <Button
                            variant="outline"
                            onClick={() => window.open('/privacy-policy', '_blank')}
                            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Lire les politiques de confidentialité
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={onDelete}
                            className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer la conversation
                          </Button>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-12 sm:py-16">
                        <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-700" />
                        <p className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Aucun message pour le moment</p>
                        <p className="text-xs sm:text-sm mt-2 text-gray-500 dark:text-gray-400">Soyez le premier à envoyer un message !</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {messages.map((msg) => {
                        const isOwnMessage = msg.userId === user?.id;
                        // Détection robuste des messages système TYALA
                        const msgUserEmail = (msg.user as any)?.email;
                        const isSystemMessage = msg.userId === 0 || msg.user?.id === 0 || (msg as any).senderId === 0 || msg.user?.firstName === 'TYALA' || msgUserEmail === 'system@tyala.com' || msg.user?.firstName === 'Système';
                        const isVoiceMessage = msg.messageType === 'VOICE';
                        const isImageMessage = msg.messageType === 'IMAGE';
                        const isFileMessage = msg.messageType === 'FILE';
                        
                        return (
                          <div
                            key={msg.id}
                            id={`message-${msg.id}`}
                            className={cn(
                              "flex gap-2 sm:gap-3 mb-2.5 sm:mb-3 lg:mb-4 group relative transition-all duration-200",
                              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                            )}
                            onTouchStart={() => longPressStart(msg.id)}
                            onTouchEnd={longPressEnd}
                          >
                            {/* Avatar - Uniquement pour les messages reçus - Optimisé mobile */}
                            {!isOwnMessage && (
                              <div className="flex-shrink-0 order-1">
                                <Avatar 
                                  className={cn(
                                    "h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 cursor-pointer ring-2 ring-white dark:ring-slate-700 shadow-md hover:ring-primary/50 transition-all duration-300 hover:scale-105 touch-manipulation",
                                    isSystemMessage && "ring-2 ring-blue-500"
                                  )}
                                  onClick={() => !isSystemMessage && openUserProfile(msg.user)}
                                >
                                  {isSystemMessage ? (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[10px] sm:text-xs md:text-sm font-bold">
                                      TY
                                    </AvatarFallback>
                                  ) : msg.user.profilePhoto ? (
                                    <AvatarImage 
                                      src={`${API_URL}/api/profile/photos/${msg.user.profilePhoto}`}
                                      alt={`${msg.user.firstName} ${msg.user.lastName}`}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-[10px] sm:text-xs md:text-sm font-semibold">
                                      {msg.user.firstName?.[0] || ''}{msg.user.lastName?.[0] || ''}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              </div>
                            )}

                            {/* Menu 3 points - Touch target optimisé mobile */}
                            <div className="flex items-start pt-1 order-3">
                              <button
                                onClick={() => setActivePostMenu(activePostMenu === msg.id ? null : msg.id)}
                                className="h-8 w-8 sm:h-6 sm:w-6 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 flex items-center justify-center transition-colors duration-150 touch-manipulation"
                                title="Plus d'options"
                              >
                                <MoreVertical className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-gray-500 dark:text-gray-400" />
                              </button>
                              
                              {/* Menu déroulant des options */}
                              {activePostMenu === msg.id && (
                                <div className="absolute top-8 right-0 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                                  {/* Réagir */}
                                  <button
                                    onClick={() => {
                                      setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id);
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <span className="text-base">😊</span>
                                    <span>Réagir</span>
                                  </button>
                                  
                                  {/* Répondre */}
                                  <button
                                    onClick={() => {
                                      toast({
                                        title: "Fonctionnalité à venir",
                                        description: "La réponse aux messages sera bientôt disponible",
                                      });
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Répondre</span>
                                  </button>
                                  
                                  {/* Actions pour l'auteur du message */}
                                  {isOwnMessage && (
                                    <>
                                      <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                      <button
                                        onClick={() => {
                                          startEdit(msg);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                      >
                                        <Edit className="h-3 w-3" />
                                        <span>Modifier</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          deleteMessage(msg.id);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Supprimer</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Actions pour les admins/moderators */}
                                  {(user?.role === 'ADMIN') && (
                                    <>
                                      <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                      <button
                                        onClick={() => {
                                          msg.isPinned ? unpinMessage(msg.id) : pinMessage(msg.id);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                      >
                                        <Pin className="h-3 w-3" />
                                        <span>{msg.isPinned ? "Désépingler" : "Épingler"}</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Sélectionner */}
                                  <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                  <button
                                    onClick={() => {
                                      toggleMessageSelection(msg.id);
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>{selectedMessages.has(msg.id) ? "Désélectionner" : "Sélectionner"}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Contenu du message - Responsive Mobile Pro */}
                            <div className={cn(
                              "flex flex-col max-w-[75%] sm:max-w-[70%] md:max-w-[65%] lg:max-w-[60%] relative order-2",
                              isOwnMessage ? 'items-end' : 'items-start'
                            )}>
                              {/* Bubble de message - Design Moderne & Épuré - Optimisé mobile */}
                              <div
                                className={cn(
                                  "relative px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ease-out w-full",
                                  isOwnMessage
                                    ? 'bg-primary/90 dark:bg-primary/80 text-white backdrop-blur-sm rounded-br-md'
                                    : 'bg-gray-50 dark:bg-slate-800 text-foreground border border-gray-100 dark:border-slate-700 rounded-bl-md'
                                )}
                              >
                                {/* Nom DANS la bulle - Uniquement pour les messages reçus */}
                                {!isOwnMessage && (
                                  <div 
                                    className={cn(
                                      "flex items-center gap-2 mb-1",
                                      !isSystemMessage && "cursor-pointer hover:underline"
                                    )}
                                    onClick={() => !isSystemMessage && openUserProfile(msg.user)}
                                  >
                                    <span className="text-xs font-semibold text-primary dark:text-primary/90">
                                      {isSystemMessage ? 'TYALA' : `${msg.user.firstName || ''} ${msg.user.lastName || ''}`}
                                    </span>
                                    {isSystemMessage && (
                                      <Badge variant="default" className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                                        ✓ Certifié
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {isVoiceMessage && msg.audioUrl ? (
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-9 w-9 sm:h-10 sm:w-10 rounded-full touch-manipulation active:scale-95",
                                        isOwnMessage 
                                          ? 'bg-white/20 hover:bg-white/30 text-white' 
                                          : 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                      )}
                                      onClick={() => {
                                        if (msg.audioUrl) {
                                          playAudio(
                                            getAudioUrl(msg.audioUrl),
                                            msg.id
                                          );
                                        } else {
                                          toast({
                                            title: "Erreur",
                                            description: "Fichier audio non disponible",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                    >
                                      {isPlaying === msg.id ? (
                                        <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                                      ) : (
                                        <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                      )}
                                    </Button>
                                    <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Volume2 className={cn(
                                          "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                                          isOwnMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                                        )} />
                                        <span className={cn("text-xs sm:text-sm font-medium truncate", isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100')}>
                                          Message vocal
                                        </span>
                                      </div>
                                      
                                      {/* Barre de progression - Optimisée mobile */}
                                      <div className="space-y-1">
                                        <div className={cn(
                                          "h-1 sm:h-1.5 rounded-full overflow-hidden",
                                          isOwnMessage ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-700'
                                        )}>
                                          <div 
                                            className={cn(
                                              "h-full transition-all duration-100",
                                              isOwnMessage ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'
                                            )}
                                            style={{ 
                                              width: `${isPlaying === msg.id ? (audioProgress[msg.id] || 0) : 0}%` 
                                            }}
                                          />
                                        </div>
                                        
                                        {/* Compteur de temps - Optimisé mobile */}
                                        <div className={cn(
                                          "flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs",
                                          isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                        )}>
                                          <span>
                                            {isPlaying === msg.id ? formatCurrentTime(msg.id) : '0:00'}
                                          </span>
                                          <span>
                                            {audioDuration[msg.id] ? formatDuration(Math.floor(audioDuration[msg.id])) : '...'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : isImageMessage && msg.fileUrl ? (
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <div className="relative group touch-manipulation">
                                      <img
                                        src={`${API_URL}/api/chat-files/${msg.fileUrl}`}
                                        alt={msg.fileName || 'Image'}
                                        className={cn(
                                          "max-w-full max-h-64 sm:max-h-80 object-cover cursor-pointer transition-transform active:scale-95 rounded-lg sm:rounded-2xl",
                                          isOwnMessage 
                                            ? 'rounded-br-md sm:rounded-br-md' 
                                            : 'rounded-bl-md sm:rounded-bl-md'
                                        )}
                                        onClick={() => window.open(`${API_URL}/api/chat-files/${msg.fileUrl}`, '_blank')}
                                      />
                                      {/* Overlay pour l'effet hover */}
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-colors" />
                                    </div>
                                    {msg.content && msg.content !== '📷 Photo' && (
                                      <p className={cn(
                                        "text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed",
                                        isOwnMessage ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
                                      )}>
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                ) : isFileMessage && msg.fileUrl ? (
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <div className={cn(
                                      "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border touch-manipulation",
                                      isOwnMessage 
                                        ? 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10' 
                                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                    )}>
                                      <div className={cn(
                                        "p-1.5 sm:p-2 rounded-lg flex-shrink-0",
                                        isOwnMessage ? 'bg-white/20 dark:bg-white/10' : 'bg-blue-100 dark:bg-blue-900/20'
                                      )}>
                                        {getFileIcon(msg.fileType || '', msg.fileName || '')}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          "text-xs sm:text-sm font-medium truncate",
                                          isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                                        )}>
                                          {msg.fileName || 'Fichier'}
                                        </p>
                                        <p className={cn(
                                          "text-[10px] sm:text-xs truncate",
                                          isOwnMessage ? 'text-white/70 dark:text-white/50' : 'text-gray-500 dark:text-gray-400'
                                        )}>
                                          {msg.fileSize ? formatFileSize(msg.fileSize) : ''} • {getFileTypeLabel(msg.fileType || '')}
                                        </p>
                                      </div>
                                      <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                        {canPreviewFile(msg.fileType || '') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                              "h-8 w-8 sm:h-9 sm:w-9 touch-manipulation active:scale-95",
                                              isOwnMessage 
                                                ? 'text-white hover:bg-white/20 dark:hover:bg-white/10' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            )}
                                            onClick={() => previewFile(msg.fileUrl!, msg.fileType || '')}
                                            title="Prévisualiser"
                                          >
                                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn(
                                            "h-8 w-8 sm:h-9 sm:w-9 touch-manipulation active:scale-95",
                                            isOwnMessage 
                                              ? 'text-white hover:bg-white/20 dark:hover:bg-white/10' 
                                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                          )}
                                          onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'fichier')}
                                          title="Télécharger"
                                        >
                                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    {msg.content && msg.content !== '📎 Fichier' && (
                                      <p className={cn(
                                        "text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed",
                                        isOwnMessage ? 'text-white/90 dark:text-white/80' : 'text-gray-700 dark:text-gray-300'
                                      )}>
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                ) : editingMessage === msg.id ? (
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <Input
                                      id={`edit-message-${msg.id}`}
                                      name={`editMessage_${msg.id}`}
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className={cn(
                                        "text-xs sm:text-sm",
                                        isOwnMessage 
                                          ? 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white placeholder-white/70' 
                                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100'
                                      )}
                                      placeholder="Modifier le message..."
                                      autoFocus
                                    />
                                    <div className="flex gap-1.5 sm:gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => editMessage(msg.id, editContent)}
                                        className={cn(
                                          "h-8 sm:h-9 text-xs sm:text-sm touch-manipulation active:scale-95",
                                          isOwnMessage 
                                            ? 'bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-white' 
                                            : 'bg-primary hover:bg-primary/90 text-white'
                                        )}
                                      >
                                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                        Enregistrer
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEdit}
                                        className={cn(
                                          "h-8 sm:h-9 text-xs sm:text-sm touch-manipulation active:scale-95",
                                          isOwnMessage 
                                            ? 'text-white/70 dark:text-white/50 hover:text-white hover:bg-white/10 dark:hover:bg-white/10' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        )}
                                      >
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className={cn(
                                      "text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed",
                                      isOwnMessage ? 'text-white dark:text-white/90' : 'text-gray-900 dark:text-gray-100'
                                    )}>
                                      {searchQuery ? (
                                        <span dangerouslySetInnerHTML={{
                                          __html: msg.content.replace(
                                            new RegExp(`(${searchQuery})`, 'gi'),
                                            '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">$1</mark>'
                                          )
                                        }} />
                                      ) : (
                                        msg.content
                                      )}
                                    </p>
                                    
                                    {/* Heure en bas à droite de la bulle - Optimisée mobile */}
                                    <div className={cn(
                                      "flex items-center gap-1 mt-1 justify-end",
                                      isOwnMessage ? 'text-white/70 dark:text-white/50' : 'text-gray-400 dark:text-gray-500'
                                    )}>
                                      <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      {isOwnMessage && (
                                        <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Sélecteur d'emojis - Responsive amélioré */}
                              {showReactionPicker === msg.id && (
                                <div className={cn(
                                  "reaction-picker absolute z-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-2 sm:p-3",
                                  "grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-1.5",
                                  "max-h-32 sm:max-h-40 overflow-auto",
                                  "w-[200px] sm:w-auto",
                                  isOwnMessage ? 'left-0' : 'right-0'
                                )}>
                                  {popularEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        toggleReaction(msg.id, emoji);
                                        setShowReactionPicker(null);
                                      }}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors text-base sm:text-lg"
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Réactions aux messages - Responsive amélioré */}
                              {getGroupedReactions(msg.id).length > 0 && (
                                <div className={cn(
                                  "flex flex-wrap gap-1 sm:gap-1.5 mt-2 px-1 max-w-full",
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                )}>
                                  {getGroupedReactions(msg.id).map((reaction, index) => (
                                    <button
                                      key={index}
                                      onClick={() => toggleReaction(msg.id, reaction.emoji)}
                                      className={cn(
                                        "flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm transition-colors flex-shrink-0",
                                        reaction.userReacted 
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700' 
                                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                      )}
                                    >
                                      <span className="text-sm sm:text-base">{reaction.emoji}</span>
                                      <span className="text-[10px] sm:text-xs font-medium">{reaction.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
          
          {/* Messages épinglés - désactivé pour chat 1-à-1 */}
          {false && showPinnedMessages && (
            <div className="border-b bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Messages épinglés
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPinnedMessages(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pinnedMessages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun message épinglé</p>
                ) : (
                  pinnedMessages.map((msg) => (
                    <div key={msg.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {msg.user.firstName} {msg.user.lastName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(msg.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{msg.content}</p>
                          {msg.fileUrl && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                              <FileText className="h-3 w-3" />
                              <span>Fichier joint</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unpinMessage(msg.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Scroll anchor for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Bouton "Nouveaux messages" avec animation */}
      <div className={cn(
        "absolute bottom-4 right-4 z-20 transition-all duration-300 ease-in-out",
        showNewMessagesButton 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-2 scale-95 pointer-events-none"
      )}>
        <Button
          onClick={scrollToBottom}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
          size="sm"
        >
          <ChevronDown className="h-4 w-4" />
          <span className="text-sm font-medium">Nouveaux messages</span>
        </Button>
      </div>
    </div>

                {/* Barre d'actions pour les messages sélectionnés */}
                {selectedMessages.size > 0 && (
                  <div className="border-t bg-blue-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedMessages.size} message{selectedMessages.size > 1 ? 's' : ''} sélectionné{selectedMessages.size > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Réagir (sur le premier message sélectionné) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const first = Array.from(selectedMessages)[0];
                          if (first) setShowReactionPicker(showReactionPicker === first ? null : first);
                        }}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        😊 Réagir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Supprimer tous les messages sélectionnés
                          selectedMessages.forEach(id => deleteMessage(id));
                          setSelectedMessages(new Set());
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessages(new Set())}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Zone de saisie - Design Moderne & Épuré - Responsive Mobile Pro */}
                <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 lg:p-5 flex-shrink-0 backdrop-blur-lg safe-area-inset-bottom">
                  {/* Indicateur d'enregistrement - Optimisé mobile */}
                  {isRecording && (
                    <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 truncate">
                          Enregistrement... {formatDuration(recordingDuration)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopRecording}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0"
                        title="Arrêter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Prévisualisation du fichier sélectionné - Optimisé mobile */}
                  {selectedFile && (
                    <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              {getFileIcon(selectedFile.type, selectedFile.name)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                              {formatFileSize(selectedFile.size)} • {getFileTypeLabel(selectedFile.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {canPreviewFile(selectedFile.type) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => previewFile(URL.createObjectURL(selectedFile), selectedFile.type)}
                              className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Prévisualiser"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelFileSelection}
                            className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Supprimer"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5 sm:gap-2 lg:gap-3 items-end">
                    <div className="flex-1 relative">
                      <Input
                        id="message-input-inline"
                        name="messageInline"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedFile ? "Commentaire... (Entrée)" : "Message... (Entrée)"}
                        disabled={sending || isRecording}
                        autoComplete="off"
                        className="w-full min-h-[44px] sm:min-h-[48px] text-sm sm:text-base rounded-full sm:rounded-lg border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 sm:pr-12 py-2.5 sm:py-3"
                      />
                      {/* Indicateur de frappe */}
                      {sending && (
                        <div className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bouton fichier - Touch target optimisé */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || isRecording || !!selectedFile}
                      size="icon"
                      variant="outline"
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-full sm:rounded-lg shrink-0 border-gray-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-manipulation active:scale-95"
                      title="Joindre un fichier"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    {/* Input fichier caché */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* Bouton microphone - Touch target optimisé */}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={sending || !!newMessage.trim() || !!selectedFile}
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      className={cn(
                        "h-11 w-11 sm:h-12 sm:w-12 rounded-full sm:rounded-lg shrink-0 border-gray-300 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation active:scale-95",
                        isRecording && "animate-pulse bg-red-500 hover:bg-red-600 text-white border-red-500"
                      )}
                      title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un message vocal"}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>

                    {/* Bouton envoyer - Touch target optimisé */}
                    <Button
                      onClick={() => {
                        if (selectedFile) {
                          sendSelectedFile();
                        } else {
                          sendMessage(newMessage);
                        }
                      }}
                      disabled={(!newMessage.trim() && !selectedFile) || sending || isRecording}
                      size="icon"
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-full sm:rounded-lg shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 touch-manipulation active:scale-95"
                      title={selectedFile ? "Envoyer le fichier" : "Envoyer le message"}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
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

                        const response = await fetch(`${API_URL}/api/study-groups/${group.id}/join`, {
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

        {/* Footer avec actions */}
        {isMember && (
          <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                💬 Messages actualisés automatiquement
              </div>
              {/* Indicateur de statut de connexion */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? 'Connecté' :
                   connectionStatus === 'reconnecting' ? 'Reconnexion...' :
                   'Déconnecté'}
                </span>
              </div>
              {lastMessageTime && (
                <span className="text-xs text-gray-400">
                  Dernière mise à jour: {lastMessageTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {connectionStatus === 'disconnected' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadMessages()}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnecter
                </Button>
              )}
              {isCreator ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLeaveGroup}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Quitter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Dialogs de confirmation modernes */}
        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          onConfirm={handleConfirmLeave}
          title="Quitter le groupe"
          description={`Êtes-vous sûr de vouloir quitter le groupe "${group?.name}" ? Vous ne pourrez plus voir les messages de ce groupe.`}
          confirmText="Quitter"
          cancelText="Annuler"
          variant="default"
        />

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleConfirmDelete}
          title="Supprimer le groupe"
          description={`Voulez-vous vraiment supprimer le groupe "${group?.name}" ? Cette action est irréversible et tous les messages seront perdus.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="destructive"
        />

        <ConfirmDialog
          open={showRemoveMemberConfirm}
          onOpenChange={(open) => {
            setShowRemoveMemberConfirm(open);
            if (!open) setMemberToRemove(null);
          }}
          onConfirm={handleConfirmRemoveMember}
          title="Retirer le membre"
          description={`Êtes-vous sûr de vouloir retirer ${memberToRemove?.name} du groupe "${group?.name}" ?`}
          confirmText="Retirer"
          cancelText="Annuler"
          variant="destructive"
        />
      </div>
    );
  }

  // Sinon, retourner avec Dialog (comportement original)
  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        stopRecording();
        onClose();
      }
    }}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-12">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                <Users className="h-6 w-6 text-blue-600" />
                {group.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-gray-600">
                {group.description || 'Échangez avec les autres membres du groupe'}
              </DialogDescription>
              {/* Badges pour chat 1-à-1 */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {group.userClass}
                </Badge>
                {group.section && (
                  <Badge variant={group.section === 'En ligne' ? 'default' : 'secondary'} className={group.section === 'En ligne' ? 'bg-green-600' : ''}>
                    {group.section}
                  </Badge>
                )}
              </div>
            </div>
            {/* Pas de boutons groupe pour chat 1-à-1 */}
            <div className="flex gap-2">
              {/* Chat privé - pas besoin de recherche/épinglage/ajout */}
            </div>
          </div>
        </DialogHeader>

        {/* Barre de recherche */}
        {showSearch && (
          <div className="border-b bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-messages-input-dialog"
                  name="searchMessagesDialog"
                  placeholder="Rechercher dans les messages..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchMessages(e.target.value);
                  }}
                  className="pl-10"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <span className="px-2">
                    {currentSearchIndex + 1} / {searchResults.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Zone de chat - Structure responsive professionnelle */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
          {isMember ? (
            <>
              {/* Zone des messages - Scrollable */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea 
                  className="h-full" 
                  ref={scrollRef}
                  onScroll={handleScroll}
                >
                  <div className="p-3 sm:p-4 lg:p-6">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-16">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-600">Aucun message pour le moment</p>
                        <p className="text-sm mt-2 text-gray-500">Soyez le premier à envoyer un message !</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {messages.map((msg) => {
                          const isOwnMessage = msg.userId === user?.id;
                          // Vérifier si c'est un message système TYALA
                          const isSystemMessage = msg.userId === 0 || (msg as any).senderId === 0 || msg.user?.id === 0 || msg.user?.firstName === 'TYALA' || (msg.user as any)?.email === 'system@tyala.com';
                          const isVoiceMessage = msg.messageType === 'VOICE';
                          const isImageMessage = msg.messageType === 'IMAGE';
                          const isFileMessage = msg.messageType === 'FILE';
                          
                          return (
                            <div
                              key={msg.id}
                              id={`message-${msg.id}`}
                              className={cn(
                                "flex gap-2 sm:gap-3 mb-3 sm:mb-4 group relative transition-all duration-200",
                                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                              )}
                              onTouchStart={() => longPressStart(msg.id)}
                              onTouchEnd={longPressEnd}
                            >
                              {/* Avatar - Uniquement pour les messages reçus */}
                              {!isOwnMessage && (
                                <div className="flex-shrink-0 order-1">
                                  <Avatar 
                                    className={cn(
                                      "h-9 w-9 sm:h-11 sm:w-11 ring-2 ring-white dark:ring-slate-700 shadow-md hover:ring-primary/50 transition-all duration-300 hover:scale-105",
                                      !isSystemMessage && "cursor-pointer"
                                    )}
                                    onClick={() => !isSystemMessage && openUserProfile(msg.user)}
                                  >
                                    {isSystemMessage ? (
                                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold">
                                        TY
                                      </AvatarFallback>
                                    ) : msg.user.profilePhoto ? (
                                      <AvatarImage 
                                        src={`${API_URL}/api/profile/photos/${msg.user.profilePhoto}`}
                                        alt={`${msg.user.firstName} ${msg.user.lastName}`}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-xs sm:text-sm font-semibold">
                                        {msg.user.firstName?.[0] || ''}{msg.user.lastName?.[0] || ''}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                </div>
                              )}

                              {/* Contenu du message simplifié pour Dialog */}
                              <div className={cn(
                                "flex flex-col max-w-[70%] sm:max-w-[65%] md:max-w-[60%] relative order-2",
                                isOwnMessage ? 'items-end' : 'items-start'
                              )}>
                                <div
                                  className={cn(
                                    "relative px-4 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-sm",
                                    isOwnMessage
                                      ? 'bg-primary/90 text-white rounded-br-md'
                                      : 'bg-gray-50 text-foreground border border-gray-100 rounded-bl-md'
                                  )}
                                >
                                  {!isOwnMessage && (
                                    <div 
                                      className="text-xs font-semibold text-primary mb-1 flex items-center gap-2"
                                    >
                                      <span>{isSystemMessage ? 'TYALA' : `${msg.user.firstName || ''} ${msg.user.lastName || ''}`.trim()}</span>
                                      {isSystemMessage && (
                                        <Badge variant="default" className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                                          ✓ Certifié
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {isVoiceMessage && msg.audioUrl && (
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          "h-10 w-10 rounded-full",
                                          isOwnMessage 
                                            ? 'bg-white/20 hover:bg-white/30 text-white' 
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                        )}
                                        onClick={() => {
                                          if (msg.audioUrl) {
                                            playAudio(
                                              getAudioUrl(msg.audioUrl),
                                              msg.id
                                            );
                                          }
                                        }}
                                      >
                                        {isPlaying === msg.id ? (
                                          <Pause className="h-5 w-5" />
                                        ) : (
                                          <Play className="h-5 w-5" />
                                        )}
                                      </Button>
                                      <span className="text-sm">Message vocal</span>
                                    </div>
                                  )}
                                  {isImageMessage && msg.fileUrl && (
                                    <img
                                      src={`${API_URL}/api/chat-files/${msg.fileUrl}`}
                                      alt={msg.fileName || 'Image'}
                                      className="max-w-full max-h-80 object-cover rounded-lg"
                                    />
                                  )}
                                  {isFileMessage && msg.fileUrl && (
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4" />
                                      <span className="text-sm">{msg.fileName || 'Fichier'}</span>
                                    </div>
                                  )}
                                  {msg.messageType === 'TEXT' && (
                                    <p className={cn(
                                      "text-sm whitespace-pre-wrap break-words",
                                      isOwnMessage ? 'text-white' : 'text-gray-900'
                                    )}>
                                      {msg.content}
                                    </p>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-xs mt-1",
                                  isOwnMessage ? 'text-white/70' : 'text-gray-400'
                                )}>
                                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Zone de saisie */}
              <div className="border-t border-gray-100 bg-white p-4 flex-shrink-0">
                {selectedFile && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{selectedFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={cancelFileSelection}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <Input
                    id="message-input"
                    name="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrivez votre message..."
                    disabled={sending || isRecording}
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="icon"
                    variant="outline"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    name="file"
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedFile) {
                        sendSelectedFile();
                      } else {
                        sendMessage(newMessage);
                      }
                    }}
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
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
                  Vous devez être membre de ce groupe pour voir les messages.
                </p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/join`, {
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
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
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
      </DialogContent>

      {/* Dialog pour ajouter des membres */}
      {/* Dialog Gérer les membres */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gérer les membres</DialogTitle>
            <DialogDescription>
              Liste des membres du groupe. Vous pouvez retirer des membres ou modifier leurs rôles.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {groupMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.user.profilePhoto ? (
                        <AvatarImage src={`${API_URL}/api/profile/photos/${member.user.profilePhoto}`} />
                      ) : (
                        <AvatarFallback>
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      {member.userId === group?.creatorId && (
                        <Badge variant="destructive" className="mt-1">Créateur</Badge>
                      )}
                      {member.userId !== group?.creatorId && (
                        <Badge variant="secondary" className="mt-1">{member.role}</Badge>
                      )}
                    </div>
                  </div>
                  {member.userId !== group?.creatorId && isCreator && (
                    <div className="flex gap-2">
                      <Select
                        name={`memberRole_${member.userId}`}
                        value={member.role}
                        onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => {
                          updateMemberRole(member.userId, value);
                        }}
                      >
                        <SelectTrigger id={`role-select-${member.userId}`} className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Membre</SelectItem>
                          <SelectItem value="MODERATOR">Modérateur</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMemberClick(member.userId, `${member.user.firstName} ${member.user.lastName}`)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Paramètres du groupe */}
      {showSettingsDialog && (
        <Dialog open={showSettingsDialog} onOpenChange={(open) => {
          console.log('📝 Dialog paramètres onOpenChange:', open);
          setShowSettingsDialog(open);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Paramètres du groupe</DialogTitle>
              <DialogDescription>
                Modifiez les informations du groupe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Nom du groupe</Label>
                <Input
                  id="group-name"
                  name="groupName"
                  value={groupSettings.name}
                  onChange={(e) => {
                    console.log('📝 Nom changé:', e.target.value);
                    setGroupSettings({ ...groupSettings, name: e.target.value });
                  }}
                  placeholder="Nom du groupe"
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  name="groupDescription"
                  value={groupSettings.description || ''}
                  onChange={(e) => {
                    console.log('📝 Description changée:', e.target.value);
                    setGroupSettings({ ...groupSettings, description: e.target.value });
                  }}
                  placeholder="Description du groupe"
                  rows={3}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="group-class">Classe</Label>
                <Input
                  id="group-class"
                  name="groupClass"
                  value={groupSettings.userClass || ''}
                  onChange={(e) => {
                    console.log('📝 Classe changée:', e.target.value);
                    setGroupSettings({ ...groupSettings, userClass: e.target.value });
                  }}
                  placeholder="ex: Terminale"
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="group-section">Section</Label>
                <Input
                  id="group-section"
                  name="groupSection"
                  value={groupSettings.section || ''}
                  onChange={(e) => {
                    console.log('📝 Section changée:', e.target.value);
                    setGroupSettings({ ...groupSettings, section: e.target.value });
                  }}
                  placeholder="ex: SMP"
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  console.log('📝 Annuler modifications');
                  setShowSettingsDialog(false);
                }}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  console.log('📝 Enregistrer paramètres:', groupSettings);
                  updateGroupSettings();
                }}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Administrateurs */}
      <Dialog open={showAdminsDialog} onOpenChange={setShowAdminsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gérer les administrateurs</DialogTitle>
            <DialogDescription>
              Promouvoir ou rétrograder des membres en tant qu'administrateurs ou modérateurs.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {groupMembers
                .filter(m => m.userId !== group?.creatorId)
                .map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.user.profilePhoto ? (
                        <AvatarImage src={`${API_URL}/api/profile/photos/${member.user.profilePhoto}`} />
                      ) : (
                        <AvatarFallback>
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      <Badge variant={member.role === 'ADMIN' ? 'destructive' : member.role === 'MODERATOR' ? 'default' : 'secondary'} className="mt-1">
                        {member.role === 'ADMIN' ? 'Administrateur' : member.role === 'MODERATOR' ? 'Modérateur' : 'Membre'}
                      </Badge>
                    </div>
                  </div>
                  <Select
                    value={member.role}
                    onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => {
                      updateMemberRole(member.userId, value);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Membre</SelectItem>
                      <SelectItem value="MODERATOR">Modérateur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {groupMembers.filter(m => m.userId !== group?.creatorId).length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun autre membre dans le groupe</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AddMemberDialog
        group={group}
        open={showAddMemberDialog}
        onClose={() => {
          console.log('📝 Fermer dialog ajouter membres');
          setShowAddMemberDialog(false);
        }}
        onMemberAdded={async () => {
          console.log('✅ Membre ajouté, recharger les données');
          await loadGroupMembers();
          await loadMessages();
          // Recharger les données du groupe si nécessaire
          if (onLeave) {
            onLeave(); // Cela déclenchera un rechargement
          }
        }}
      />

      {/* Dialog du profil utilisateur - Style WhatsApp Responsive */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="max-w-md sm:max-w-lg mx-4 sm:mx-0">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-center text-lg sm:text-xl">Profil</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 sm:space-y-6">
              {/* Photo de profil et nom */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  {selectedUser.profilePhoto ? (
                    <AvatarImage 
                      src={`${API_URL}/api/profile/photos/${selectedUser.profilePhoto}`}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xl sm:text-2xl">
                      {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center px-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 break-all">{selectedUser.email}</p>
                  {selectedUser.role && (
                    <Badge 
                      variant={selectedUser.role === 'ADMIN' ? 'destructive' : 'secondary'} 
                      className="mt-2 text-xs"
                    >
                      {selectedUser.role === 'ADMIN' ? 'Administrateur' : 
                       selectedUser.role === 'TUTOR' ? 'Tuteur' : 'Étudiant'}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Informations détaillées */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Informations personnelles</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm text-gray-600">Prénom</span>
                      <span className="text-xs sm:text-sm font-medium text-right max-w-[60%] break-words">{selectedUser.firstName || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm text-gray-600">Nom</span>
                      <span className="text-xs sm:text-sm font-medium text-right max-w-[60%] break-words">{selectedUser.lastName || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm text-gray-600">Email</span>
                      <span className="text-xs sm:text-sm font-medium text-right max-w-[60%] break-all">{selectedUser.email || 'Non renseigné'}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs sm:text-sm text-gray-600">Téléphone</span>
                        <span className="text-xs sm:text-sm font-medium text-right max-w-[60%] break-words">{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.studentId && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs sm:text-sm text-gray-600">ID Étudiant</span>
                        <span className="text-xs sm:text-sm font-medium text-right max-w-[60%] break-words">{selectedUser.studentId}</span>
                      </div>
                    )}
                    {selectedUser.createdAt && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs sm:text-sm text-gray-600">Membre depuis</span>
                        <span className="text-xs sm:text-sm font-medium text-right max-w-[60%]">
                          {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedUser.lastLoginAt && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs sm:text-sm text-gray-600">Dernière connexion</span>
                        <span className="text-xs sm:text-sm font-medium text-right max-w-[60%]">
                          {new Date(selectedUser.lastLoginAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section groupe retirée pour un profil plus simple */}

                {/* Actions */}
                <div className="space-y-2">
                  {selectedUser.email && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs sm:text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.email);
                        toast({
                          title: "Email copié",
                          description: "L'adresse email a été copiée dans le presse-papiers",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Copier l'email
                    </Button>
                  )}
                  
                  {selectedUser.phone && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs sm:text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.phone);
                        toast({
                          title: "Téléphone copié",
                          description: "Le numéro de téléphone a été copié dans le presse-papiers",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Copier le téléphone
                    </Button>
                  )}

                  {selectedUser.studentId && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs sm:text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.studentId);
                        toast({
                          title: "ID Étudiant copié",
                          description: "L'ID étudiant a été copié dans le presse-papiers",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Copier l'ID étudiant
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => {
                      toast({
                        title: "Fonctionnalité à venir",
                        description: "L'envoi de message privé sera bientôt disponible",
                      });
                    }}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Envoyer un message privé
                  </Button>

                  {(user?.role === 'ADMIN') && selectedUser.role !== 'ADMIN' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs sm:text-sm text-orange-600 hover:text-orange-700"
                      onClick={() => {
                        toast({
                          title: "Fonctionnalité à venir",
                          description: "La gestion des utilisateurs sera bientôt disponible",
                        });
                      }}
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Gérer l'utilisateur
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>

    {/* Dialogs de confirmation modernes */}
    <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        onConfirm={handleConfirmLeave}
        title="Quitter le groupe"
        description={`Êtes-vous sûr de vouloir quitter le groupe "${group?.name}" ? Vous ne pourrez plus voir les messages de ce groupe.`}
        confirmText="Quitter"
        cancelText="Annuler"
        variant="default"
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Supprimer le groupe"
        description={`Voulez-vous vraiment supprimer le groupe "${group?.name}" ? Cette action est irréversible et tous les messages seront perdus.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      <ConfirmDialog
        open={showRemoveMemberConfirm}
        onOpenChange={(open) => {
          setShowRemoveMemberConfirm(open);
          if (!open) setMemberToRemove(null);
        }}
        onConfirm={handleConfirmRemoveMember}
        title="Retirer le membre"
        description={`Êtes-vous sûr de vouloir retirer ${memberToRemove?.name} du groupe "${group?.name}" ?`}
        confirmText="Retirer"
        cancelText="Annuler"
        variant="destructive"
      />
    </>
  );
};

export default TutorChat;

