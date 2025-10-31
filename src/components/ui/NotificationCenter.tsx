// Centre de notifications moderne pour forum, groupes et messages privés
import { useState, useEffect } from 'react';
import { Bell, MessageSquare, Users, Reply, Check, X, Trash2 } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Card } from './card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './dropdown-menu';

interface Notification {
  id: number;
  type: 'FORUM_REPLY' | 'GROUP_MESSAGE' | 'PRIVATE_MESSAGE' | 'MENTION' | 'LIKE';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  relatedId?: number; // ID du post, groupe, ou message
  relatedType?: string; // 'post', 'group', 'message'
}

export const NotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Charger les notifications
  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        
        // Compter les non lues
        const unread = data.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [user]);

  // Marquer comme lue
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast({
          title: "Notifications marquées comme lues",
          description: "Toutes vos notifications ont été marquées comme lues"
        });
      }
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast({
          title: "Notification supprimée",
          description: "La notification a été supprimée"
        });
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  // Effacer toutes les notifications lues
  const clearReadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/notifications/clear-read', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => !n.read));
        toast({
          title: "Notifications effacées",
          description: "Toutes les notifications lues ont été supprimées"
        });
      }
    } catch (error) {
      console.error('Erreur effacement notifications:', error);
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Rediriger selon le type
    switch (notification.type) {
      case 'FORUM_REPLY':
        window.location.href = `/forum?post=${notification.relatedId}`;
        break;
      case 'GROUP_MESSAGE':
        window.location.href = `/forum?group=${notification.relatedId}`;
        break;
      case 'PRIVATE_MESSAGE':
        window.location.href = `/tutors?chat=${notification.relatedId}`;
        break;
      case 'MENTION':
        if (notification.relatedType === 'post') {
          window.location.href = `/forum?post=${notification.relatedId}`;
        } else if (notification.relatedType === 'group') {
          window.location.href = `/forum?group=${notification.relatedId}`;
        }
        break;
    }
    
    setOpen(false);
  };

  // Icône selon le type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FORUM_REPLY':
        return <Reply className="h-4 w-4" />;
      case 'GROUP_MESSAGE':
        return <Users className="h-4 w-4" />;
      case 'PRIVATE_MESSAGE':
        return <MessageSquare className="h-4 w-4" />;
      case 'MENTION':
        return <MessageSquare className="h-4 w-4" />;
      case 'LIKE':
        return <Check className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Couleur selon le type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'FORUM_REPLY':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'GROUP_MESSAGE':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PRIVATE_MESSAGE':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'MENTION':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'LIKE':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] sm:w-[420px] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tout lire
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearReadNotifications}
                className="text-xs h-7"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            </div>
          )}
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune notification
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Vous serez notifié des nouveaux messages et réponses
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Indicateur non lu */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                  )}

                  <div className="flex gap-3 pl-4">
                    {/* Avatar ou Icône */}
                    {notification.sender ? (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {notification.sender.profilePhoto ? (
                          <img
                            src={`http://localhost:8081/api/profile/photos/${notification.sender.profilePhoto}`}
                            alt={`${notification.sender.firstName} ${notification.sender.lastName}`}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-sm font-semibold">
                            {notification.sender.firstName[0]}{notification.sender.lastName[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    ) : (
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50 dark:bg-slate-900">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                window.location.href = '/notifications';
                setOpen(false);
              }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};



