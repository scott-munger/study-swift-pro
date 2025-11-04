import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, CheckCheck, Trash2, MessageSquare, ThumbsUp, Users, Trophy, Bell as BellIcon } from 'lucide-react';
import { Button } from './enhanced-button';
import { ScrollArea } from './scroll-area';
import { Card } from './card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

const NotificationPanel = ({ onClose, onNotificationRead }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Fermer le panel si on clique à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Marquer une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        onNotificationRead();
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        onNotificationRead();
        toast({
          title: "Succès",
          description: "Toutes les notifications ont été marquées comme lues"
        });
      }
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        onNotificationRead();
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  // Supprimer les notifications lues
  const clearReadNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/clear-read`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !n.isRead));
        toast({
          title: "Succès",
          description: "Notifications lues supprimées"
        });
      }
    } catch (error) {
      console.error('Erreur suppression notifications lues:', error);
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  // Icône selon le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FORUM_REPLY':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'FORUM_LIKE':
        return <ThumbsUp className="h-5 w-5 text-pink-500" />;
      case 'GROUP_MESSAGE':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'GROUP_INVITE':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'TEST_RESULT':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'ACHIEVEMENT':
        return <Trophy className="h-5 w-5 text-orange-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Card
      ref={panelRef}
      className="absolute right-0 top-12 w-screen sm:w-96 max-h-[80vh] shadow-2xl border-2 z-50"
    >
      {/* En-tête */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">
            Notifications
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearReadNotifications}
              className="flex-1 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Effacer lues
            </Button>
          </div>
        )}
      </div>

      {/* Liste des notifications */}
      <ScrollArea className="h-[calc(80vh-120px)]">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto mb-2 animate-pulse" />
            <p>Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Aucune notification</p>
            <p className="text-sm mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group",
                  !notification.isRead && "bg-blue-50/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  {/* Icône */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-medium",
                        !notification.isRead && "text-blue-900"
                      )}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  
                  {/* Bouton supprimer */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default NotificationPanel;





