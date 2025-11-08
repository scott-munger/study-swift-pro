import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogPortal, DialogOverlay } from './dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './alert-dialog';
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
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddMemberDialog } from './AddMemberDialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { API_URL } from "@/config/api";

interface GroupDetailDialogProps {
  group: any;
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
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

export const ModernGroupChat: React.FC<GroupDetailDialogProps> = ({ 
  group, 
  open,
  onClose,
  onLeave,
  onDelete
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null);
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

  // Gérer le bouton "Nouveaux messages" (auto-scroll désactivé)
  useEffect(() => {
    // Afficher le bouton uniquement si pas en bas et qu'il y a des messages
    if (messages.length > 0 && !isAtBottom) {
      setShowNewMessagesButton(true);
    }
    // Pas de scroll automatique - l'utilisateur contrôle le scroll
  }, [messages, isAtBottom]);

  // Fonction helper pour obtenir l'URL correcte de l'audio
  const getAudioUrl = (audioUrl: string | undefined | null): string => {
    if (!audioUrl || audioUrl.trim() === "") {
      console.warn("⚠️ getAudioUrl: audioUrl est vide ou null");
      return "";
    }

    // Si c'est déjà une URL complète, la retourner telle quelle
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      return audioUrl;
    }
    
    try {
      // Si c'est un chemin avec /uploads/audio-messages/, extraire le filename
      if (audioUrl.includes("/uploads/audio-messages/")) {
        const filename = audioUrl.split("/uploads/audio-messages/")[1];
        if (!filename || filename.trim() === "") {
          console.warn("⚠️ getAudioUrl: filename vide après split");
          return "";
        }
        const fullUrl = `${API_URL}/api/audio/${filename}`;
        console.log("🎵 getAudioUrl construit:", fullUrl, "depuis:", audioUrl);
        return fullUrl;
      }
      
      // Si c'est juste un filename ou un chemin relatif, utiliser l'endpoint /api/audio
      const filename = audioUrl.split("/").pop() || audioUrl;
      if (!filename || filename.trim() === "") {
        console.warn("⚠️ getAudioUrl: filename vide après extraction");
        return "";
      }
      const fullUrl = `${API_URL}/api/audio/${filename}`;
      console.log("🎵 getAudioUrl construit:", fullUrl, "depuis:", audioUrl);
      return fullUrl;
    } catch (error) {
      console.error("❌ Erreur dans getAudioUrl:", error, "audioUrl:", audioUrl);
      return "";
    }
  };

  // Précharger les durées des messages vocaux
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.messageType === 'VOICE' && msg.audioUrl && !audioDuration[msg.id]) {
        const audioUrl = getAudioUrl(msg.audioUrl);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          setAudioDuration(prev => ({ ...prev, [msg.id]: audio.duration }));
        };
        // Charger seulement les métadonnées (pas l'audio complet)
        audio.preload = 'metadata';
        }
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
    
    try {
      const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📨 Messages chargés:", data.length, "messages");
        // Debug pour les messages vocaux
        const voiceMessages = data.filter((msg: Message) => msg.messageType === 'VOICE');
        if (voiceMessages.length > 0) {
          console.log("🎤 Messages vocaux trouvés:", voiceMessages.length);
          voiceMessages.forEach((msg: Message) => {
            console.log("🎤 Message vocal:", {
              id: msg.id,
              audioUrl: msg.audioUrl,
              messageType: msg.messageType
            });
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
        // Pas membre du groupe - ne pas afficher de toast à chaque rafraîchissement
        if (messages.length === 0) {
          toast({
            title: "Accès refusé",
            description: "Vous devez être membre pour voir les messages",
            variant: "destructive"
          });
        }
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

    console.log('📤 Frontend - Envoi message:', { content, type, hasAudioBlob: !!audioBlob, hasFile: !!file, groupId: group.id, retry: retryCount });
    
    setSending(true);
    try {
      if (type === 'VOICE' && audioBlob) {
        // Envoyer un message vocal
        console.log('🎤 Frontend - Préparation message vocal, taille blob:', audioBlob.size, 'type:', audioBlob.type);
        
        const formData = new FormData();
        formData.append('content', content || 'Message vocal');
        formData.append('messageType', 'VOICE');
        
        // Déterminer l'extension du fichier basée sur le type MIME
        const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 
                             audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        
        formData.append('audio', audioBlob, `voice-${Date.now()}.${fileExtension}`);

        console.log('🎤 Frontend - FormData préparé, envoi vers:', `${API_URL}/api/study-groups/${group.id}/messages`);

        const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages`, {
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
        formData.append('file', file);

        console.log('📎 Frontend - FormData préparé, envoi vers:', `${API_URL}/api/study-groups/${group.id}/messages`);

        const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages`, {
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
        const response = await fetch(`${API_URL}/api/study-groups/${group.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            content: content.trim(), 
            messageType: 'TEXT' 
          })
        });

        if (response.ok) {
          setNewMessage('');
          await loadMessages();
        } else {
          const errorData = await response.json();
          
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
    console.log("🎵 playAudio appelé avec:", { audioUrl, messageId });
    
    if (isPlaying === messageId) {
      // Arrêter la lecture
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setIsPlaying(null);
      setAudioElement(null);
      setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      return;
    }
    
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
    if (!audioUrl || audioUrl.trim() === "") {
      console.error("❌ URL audio vide pour message:", messageId);
      toast({
        title: "Erreur",
        description: "URL audio non disponible pour ce message vocal",
        variant: "destructive",
      });
      return;
    }

    // Normaliser l'URL - utiliser getAudioUrl si nécessaire
    let normalizedUrl = audioUrl;
    if (!audioUrl.startsWith("http://") && !audioUrl.startsWith("https://")) {
      console.log("⚠️ URL ne commence pas par http, normalisation...");
      normalizedUrl = getAudioUrl(audioUrl);
      if (!normalizedUrl || normalizedUrl.trim() === "") {
        console.error("❌ Impossible de normaliser l'URL audio:", audioUrl);
        toast({
          title: "Erreur",
          description: "Format d'URL audio invalide. Veuillez réessayer.",
          variant: "destructive",
        });
        return;
      }
    }
    
    console.log("🎵 URL normalisée:", normalizedUrl);

    console.log("🎵 Lecture audio:", normalizedUrl, "pour message:", messageId);

    // Vérifier le support du format audio dans le navigateur
    const audioElementTest = document.createElement('audio');
    const canPlayWebM = audioElementTest.canPlayType('audio/webm; codecs=opus') || 
                       audioElementTest.canPlayType('audio/webm') || 
                       audioElementTest.canPlayType('audio/ogg; codecs=opus') ||
                       audioElementTest.canPlayType('audio/mpeg');
    
    if (!canPlayWebM && normalizedUrl.includes('.webm')) {
      console.warn("⚠️ Format WebM pas totalement supporté, mais tentative de lecture");
    }

      // Lire l'audio
    const audio = new Audio(normalizedUrl);
    audio.crossOrigin = 'anonymous'; // Permettre CORS si nécessaire
    audio.preload = 'auto';
    
    // Gestion du timeout pour les erreurs de chargement
    let loadTimeout: NodeJS.Timeout;
    const clearLoadTimeout = () => {
      if (loadTimeout) clearTimeout(loadTimeout);
    };
    
    // Timeout de 10 secondes pour le chargement
    loadTimeout = setTimeout(() => {
      if (audio.readyState < 2) { // HAVE_CURRENT_DATA
        console.error("❌ Timeout chargement audio:", normalizedUrl);
        toast({
          title: "Erreur",
          description: "Le message vocal prend trop de temps à charger. Vérifiez votre connexion.",
          variant: "destructive",
        });
        setIsPlaying(null);
        setAudioElement(null);
        clearLoadTimeout();
      }
    }, 10000);
      
      // Récupérer la durée quand elle est disponible
      audio.onloadedmetadata = () => {
      clearLoadTimeout();
      console.log(
        "✅ Métadonnées audio chargées:",
        audio.duration,
        "secondes"
      );
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
      clearLoadTimeout();
      console.log("✅ Audio terminé");
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      };
      
      audio.onerror = (e) => {
      clearLoadTimeout();
      console.error("❌ Erreur lecture audio:", e, "URL:", normalizedUrl);
      console.error("Erreur audio détail:", {
        error: audio.error,
        code: audio.error?.code,
        message: audio.error?.message,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
      
      // Messages d'erreur plus descriptifs selon le code d'erreur
      // MediaError.MEDIA_ERR_ABORTED = 1
      // MediaError.MEDIA_ERR_NETWORK = 2
      // MediaError.MEDIA_ERR_DECODE = 3
      // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4
      let errorMessage = "Format non supporté";
      if (audio.error) {
        switch (audio.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = "Lecture interrompue";
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = "Erreur réseau. Vérifiez votre connexion.";
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = "Format audio non supporté par votre navigateur";
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = "Format audio non supporté ou fichier corrompu";
            break;
          default:
            errorMessage = audio.error.message || "Erreur de lecture audio";
        }
      }
      
        toast({
          title: "Erreur",
        description: `Impossible de lire le message vocal: ${errorMessage}`,
        variant: "destructive",
        });
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      };
    
    // Gestion des événements de chargement
    audio.oncanplay = () => {
      clearLoadTimeout();
      console.log("✅ Audio prêt à être lu");
    };
    
    audio.oncanplaythrough = () => {
      clearLoadTimeout();
      console.log("✅ Audio complètement chargé");
    };
    
    audio.onloadstart = () => {
      console.log("🔄 Début chargement audio:", normalizedUrl);
    };
    
    audio.onstalled = () => {
      console.warn("⚠️ Chargement audio bloqué:", normalizedUrl);
    };
      
      setAudioElement(audio);
      setIsPlaying(messageId);
    
    // Essayer de jouer l'audio avec meilleure gestion d'erreur
      audio.play().catch((error) => {
      clearLoadTimeout();
      console.error("❌ Erreur play audio:", error, "URL:", normalizedUrl);
      let errorMessage = "Vérifiez votre connexion";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Lecture bloquée. Autorisez la lecture audio dans votre navigateur.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Format audio non supporté par votre navigateur";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
        toast({
          title: "Erreur",
        description: `Impossible de lire le message vocal: ${errorMessage}`,
        variant: "destructive",
        });
        setIsPlaying(null);
        setAudioElement(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      });
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
  const getGroupedReactions = (messageId: number) => {
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
    }, {} as Record<string, any>);
    
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

  const confirmLeaveGroup = () => {
    onLeave?.();
    onClose();
    setShowLeaveConfirm(false);
  };

  const handleDeleteGroup = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = () => {
    onDelete?.();
    onClose();
    setShowDeleteConfirm(false);
  };

  if (!group) return null;

  const isCreator = group.creatorId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isMember = group.isMember || [17, 18, 19].includes(group.id);
  const canAddMembers = isCreator || isAdmin;

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

  return (
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
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {group.userClass}
                    {group.section && ` - ${group.section}`}
                  </Badge>
                  <Badge variant="default" className="bg-blue-600">
                    <Users className="h-3 w-3 mr-1" />
                    {group._count?.members || 0} membres
                  </Badge>
                  {isCreator && (
                    <Badge variant="destructive">Créateur</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  className="shrink-0"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Messages épinglés
                </Button>
                {canAddMembers && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddMemberDialog(true)}
                    className="shrink-0"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                )}
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
                    placeholder="Rechercher dans les messages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchMessages(e.target.value);
                    }}
                    className="pl-10"
                    autoFocus
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
                        const isVoiceMessage = msg.messageType === 'VOICE';
                        const isImageMessage = msg.messageType === 'IMAGE';
                        const isFileMessage = msg.messageType === 'FILE';
                        
                        // Debug pour les messages vocaux
                        if (isVoiceMessage) {
                          console.log("🎤 Message vocal détecté:", {
                            id: msg.id,
                            messageType: msg.messageType,
                            audioUrl: msg.audioUrl,
                            hasAudioUrl: !!msg.audioUrl
                          });
                        }
                        
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
                                  className="h-9 w-9 sm:h-11 sm:w-11 cursor-pointer ring-2 ring-white dark:ring-slate-700 shadow-md hover:ring-primary/50 transition-all duration-300 hover:scale-105"
                                  onClick={() => openUserProfile(msg.user)}
                                >
                                  {msg.user.profilePhoto ? (
                                    <AvatarImage 
                                      src={`${API_URL}/api/profile/photos/${msg.user.profilePhoto}`}
                                      alt={`${msg.user.firstName} ${msg.user.lastName}`}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-xs sm:text-sm font-semibold">
                                      {msg.user.firstName[0]}{msg.user.lastName[0]}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              </div>
                            )}

                            {/* Menu 3 points - toujours à droite */}
                            <div className="flex items-start pt-1 order-3">
                              <button
                                onClick={() => setActivePostMenu(activePostMenu === msg.id ? null : msg.id)}
                                className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors duration-150"
                                title="Plus d'options"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                                  {(user?.role === 'admin' || user?.role === 'moderator') && (
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

                            {/* Contenu du message */}
                            <div className={cn(
                              "flex flex-col max-w-[70%] sm:max-w-[65%] md:max-w-[60%] relative order-2",
                              isOwnMessage ? 'items-end' : 'items-start'
                            )}>
                              {/* Bubble de message - Design Moderne & Épuré */}
                              <div
                                className={cn(
                                  "relative px-4 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ease-out w-full",
                                  isOwnMessage
                                    ? 'bg-primary/90 dark:bg-primary/80 text-white backdrop-blur-sm rounded-br-md'
                                    : 'bg-gray-50 dark:bg-slate-800 text-foreground border border-gray-100 dark:border-slate-700 rounded-bl-md'
                                )}
                              >
                                {/* Nom DANS la bulle - Uniquement pour les messages reçus */}
                                {!isOwnMessage && (
                                  <div 
                                    className="text-xs font-semibold text-primary dark:text-primary/90 mb-1 cursor-pointer hover:underline"
                                    onClick={() => openUserProfile(msg.user)}
                                  >
                                    {msg.user.firstName} {msg.user.lastName}
                                  </div>
                                )}
                                {isVoiceMessage && msg.audioUrl ? (
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
                                      onClick={async () => {
                                        console.log("🎵 Clic sur bouton play audio pour message:", msg.id);
                                        console.log("🎵 Données du message:", {
                                          id: msg.id,
                                          messageType: msg.messageType,
                                          audioUrl: msg.audioUrl,
                                          audioUrlType: typeof msg.audioUrl,
                                          audioUrlLength: msg.audioUrl?.length
                                        });
                                        
                                        if (msg.audioUrl && typeof msg.audioUrl === 'string' && msg.audioUrl.trim() !== '') {
                                          const audioUrl = getAudioUrl(msg.audioUrl);
                                          console.log("🎵 URL audio générée:", audioUrl, "depuis:", msg.audioUrl);
                                          
                                          if (audioUrl && audioUrl.trim() !== "") {
                                            // Test si l'URL est accessible avant de jouer
                                            try {
                                              const testResponse = await fetch(audioUrl, { method: 'HEAD' });
                                              if (testResponse.ok) {
                                                console.log("✅ Fichier audio accessible, lecture...");
                                                playAudio(audioUrl, msg.id);
                                        } else {
                                                console.error("❌ Fichier audio non accessible:", testResponse.status, testResponse.statusText);
                                          toast({
                                            title: "Erreur",
                                                  description: `Fichier audio non accessible (${testResponse.status}). Veuillez réessayer.`,
                                                  variant: "destructive",
                                                });
                                              }
                                            } catch (fetchError) {
                                              console.error("❌ Erreur lors de la vérification de l'URL audio:", fetchError);
                                              // Essayer quand même de jouer l'audio
                                              console.log("⚠️ Tentative de lecture malgré l'erreur de vérification...");
                                              playAudio(audioUrl, msg.id);
                                            }
                                          } else {
                                            console.error("❌ Impossible de générer une URL audio valide depuis:", msg.audioUrl);
                                            toast({
                                              title: "Erreur",
                                              description: "Impossible de charger le message vocal. URL invalide.",
                                              variant: "destructive",
                                            });
                                          }
                                        } else {
                                          console.error("❌ Message vocal sans audioUrl valide:", msg);
                                          toast({
                                            title: "Erreur",
                                            description: "Fichier audio non disponible pour ce message",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      {isPlaying === msg.id ? (
                                        <Pause className="h-5 w-5" />
                                      ) : (
                                        <Play className="h-5 w-5" />
                                      )}
                                    </Button>
                                    <div className="flex-1 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <Volume2 className={cn(
                                          "h-4 w-4",
                                          isOwnMessage ? 'text-white/80' : 'text-gray-600'
                                        )} />
                                        <span className={cn("text-sm font-medium", isOwnMessage ? 'text-white' : 'text-gray-900')}>
                                          Message vocal
                                        </span>
                                      </div>
                                      
                                      {/* Barre de progression */}
                                      <div className="space-y-1">
                                        <div className={cn(
                                          "h-1.5 rounded-full overflow-hidden",
                                          isOwnMessage ? 'bg-white/20' : 'bg-gray-200'
                                        )}>
                                          <div 
                                            className={cn(
                                              "h-full transition-all duration-100",
                                              isOwnMessage ? 'bg-white' : 'bg-blue-500'
                                            )}
                                            style={{ 
                                              width: `${isPlaying === msg.id ? (audioProgress[msg.id] || 0) : 0}%` 
                                            }}
                                          />
                                        </div>
                                        
                                        {/* Compteur de temps */}
                                        <div className={cn(
                                          "flex items-center justify-between text-[10px] sm:text-xs",
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
                                    {/* Actions spécifiques pour les messages vocaux - Téléchargement supprimé */}
                                  </div>
                                ) : isImageMessage && msg.fileUrl ? (
                                  <div className="space-y-2">
                                    <div className="relative group">
                                      <img
                                        src={`${API_URL}/api/chat-files/${msg.fileUrl}`}
                                        alt={msg.fileName || 'Image'}
                                        className={cn(
                                          "max-w-full max-h-80 object-cover cursor-pointer transition-transform hover:scale-105",
                                          isOwnMessage 
                                            ? 'rounded-2xl rounded-br-md' 
                                            : 'rounded-2xl rounded-bl-md'
                                        )}
                                        onClick={() => window.open(`${API_URL}/api/chat-files/${msg.fileUrl}`, '_blank')}
                                      />
                                      {/* Overlay pour l'effet hover */}
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-colors" />
                                    </div>
                                    {msg.content && msg.content !== '📷 Photo' && (
                                      <p className={cn(
                                        "text-sm whitespace-pre-wrap break-words leading-relaxed",
                                        isOwnMessage ? 'text-white/90' : 'text-gray-700'
                                      )}>
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                ) : isFileMessage && msg.fileUrl ? (
                                  <div className="space-y-2">
                                    <div className={cn(
                                      "flex items-center gap-3 p-3 rounded-lg border",
                                      isOwnMessage 
                                        ? 'bg-white/10 border-white/20' 
                                        : 'bg-gray-50 border-gray-200'
                                    )}>
                                      <div className={cn(
                                        "p-2 rounded-lg",
                                        isOwnMessage ? 'bg-white/20' : 'bg-blue-100'
                                      )}>
                                        {getFileIcon(msg.fileType || '', msg.fileName || '')}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          "text-sm font-medium truncate",
                                          isOwnMessage ? 'text-white' : 'text-gray-900'
                                        )}>
                                          {msg.fileName || 'Fichier'}
                                        </p>
                                        <p className={cn(
                                          "text-xs",
                                          isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                        )}>
                                          {msg.fileSize ? formatFileSize(msg.fileSize) : ''} • {getFileTypeLabel(msg.fileType || '')}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        {canPreviewFile(msg.fileType || '') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                              "h-8 w-8",
                                              isOwnMessage 
                                                ? 'text-white hover:bg-white/20' 
                                                : 'text-gray-600 hover:bg-gray-100'
                                            )}
                                            onClick={() => previewFile(msg.fileUrl!, msg.fileType || '')}
                                            title="Prévisualiser"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn(
                                            "h-8 w-8",
                                            isOwnMessage 
                                              ? 'text-white hover:bg-white/20' 
                                              : 'text-gray-600 hover:bg-gray-100'
                                          )}
                                          onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'fichier')}
                                          title="Télécharger"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    {msg.content && msg.content !== '📎 Fichier' && (
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                ) : editingMessage === msg.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="bg-white/10 border-white/20 text-white placeholder-white/70"
                                      placeholder="Modifier le message..."
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => editMessage(msg.id, editContent)}
                                        className="bg-white/20 hover:bg-white/30 text-white"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Enregistrer
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEdit}
                                        className="text-white/70 hover:text-white hover:bg-white/10"
                                      >
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className={cn(
                                      "text-sm whitespace-pre-wrap break-words leading-relaxed",
                                      isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                                    )}>
                                      {searchQuery ? (
                                        <span dangerouslySetInnerHTML={{
                                          __html: msg.content.replace(
                                            new RegExp(`(${searchQuery})`, 'gi'),
                                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                          )
                                        }} />
                                      ) : (
                                        msg.content
                                      )}
                                    </p>
                                    
                                    {/* Heure en bas à droite de la bulle */}
                                    <div className={cn(
                                      "flex items-center gap-1 mt-1 justify-end",
                                      isOwnMessage ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
                                    )}>
                                      <span className="text-[10px] sm:text-xs font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      {isOwnMessage && (
                                        <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
          
          {/* Messages épinglés */}
          {showPinnedMessages && (
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

                {/* Zone de saisie - Design Moderne & Épuré */}
                <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 flex-shrink-0 backdrop-blur-lg">
                  {/* Indicateur d'enregistrement */}
                  {isRecording && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">
                          Enregistrement en cours... {formatDuration(recordingDuration)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopRecording}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        Arrêter
                      </Button>
                    </div>
                  )}

                  {/* Prévisualisation du fichier sélectionné */}
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                              {getFileIcon(selectedFile.type, selectedFile.name)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(selectedFile.size)} • {getFileTypeLabel(selectedFile.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {canPreviewFile(selectedFile.type) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => previewFile(URL.createObjectURL(selectedFile), selectedFile.type)}
                              className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Prévisualiser"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelFileSelection}
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Supprimer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedFile ? "Ajouter un commentaire... (Entrée pour envoyer)" : "Écrivez votre message... (Entrée pour envoyer)"}
                        disabled={sending || isRecording}
                        className="w-full min-h-[44px] sm:min-h-[48px] rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                      />
                      {/* Indicateur de frappe */}
                      {sending && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bouton fichier */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || isRecording || !!selectedFile}
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
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
                    
                    {/* Bouton microphone */}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={sending || !!newMessage.trim() || !!selectedFile}
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      className={cn(
                        "h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 border-gray-300 hover:border-red-500 hover:bg-red-50",
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

                    {/* Bouton envoyer */}
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
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      title={selectedFile ? "Envoyer le fichier" : "Envoyer le message"}
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
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
      </DialogContent>

      {/* Dialog pour ajouter des membres */}
      <AddMemberDialog
        group={group}
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        onMemberAdded={() => {
          if (onLeave) onLeave();
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
                      variant={selectedUser.role === 'admin' ? 'destructive' : 'secondary'} 
                      className="mt-2 text-xs"
                    >
                      {selectedUser.role === 'admin' ? 'Administrateur' : 
                       selectedUser.role === 'moderator' ? 'Modérateur' : 'Étudiant'}
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

                  {(user?.role === 'admin' || user?.role === 'moderator') && selectedUser.role !== 'admin' && (
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

      {/* AlertDialog de confirmation pour quitter le groupe */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter ce groupe ? Vous ne recevrez plus de messages de ce groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveGroup}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de confirmation pour supprimer le groupe */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Supprimer le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer ce groupe ? Cette action est irréversible et supprimera tous les messages et membres du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ModernGroupChat;

