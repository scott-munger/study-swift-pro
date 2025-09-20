import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, X, BookOpen, Users, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'message' | 'call' | 'system' | 'forum' | 'tutor';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
  forumPostId?: string;
  forumTitle?: string;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Demander les permissions de notification
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Gérer les notifications locales
  useEffect(() => {
    // Gérer les notifications locales
    const newNotifications: Notification[] = [];

    // Notifications de messages
    notifications.forEach(notif => {
      newNotifications.push({
        id: `msg_${notif.fromUserId}_${Date.now()}`,
        type: 'message',
        title: `Message de ${notif.fromUserName}`,
        message: notif.message,
        fromUserId: notif.fromUserId,
        fromUserName: notif.fromUserName,
        timestamp: notif.timestamp,
        isRead: false
      });
    });

    // Notifications du forum
    forumNotifications.forEach(notif => {
      newNotifications.push({
        id: `forum_${notif.postId}_${Date.now()}`,
        type: 'forum',
        title: '📚 Nouveau post dans le forum',
        message: `${notif.authorName} a publié: "${notif.postTitle}"`,
        fromUserId: notif.authorId,
        fromUserName: notif.authorName,
        timestamp: notif.timestamp,
        isRead: false,
        avatar: notif.avatar,
        forumPostId: notif.postId,
        forumTitle: notif.postTitle
      });
    });

    if (newNotifications.length > 0) {
      setLocalNotifications(prev => [...newNotifications, ...prev]);
      setUnreadCount(prev => prev + newNotifications.length);

      // Afficher une notification système si la fenêtre n'est pas active
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        newNotifications.forEach(notif => {
          new Notification(notif.title, {
            body: notif.message,
            icon: '/placeholder.svg',
            tag: notif.id
          });
        });
      }
    }
  }, [notifications, forumNotifications]);

  // Marquer une notification comme lue
  const markAsRead = (notificationId: string) => {
    setLocalNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setLocalNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  // Supprimer une notification
  const removeNotification = (notificationId: string) => {
    const notification = localNotifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Formater le temps
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={cn("relative", className)}>
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panneau des notifications */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b hover:bg-gray-50 cursor-pointer",
                    !notification.isRead && "bg-blue-50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'message' ? (
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                      ) : notification.type === 'forum' ? (
                        <BookOpen className="w-5 h-5 text-green-500" />
                      ) : notification.type === 'tutor' ? (
                        <Users className="w-5 h-5 text-purple-500" />
                      ) : notification.type === 'call' ? (
                        <Phone className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.isRead && "font-bold"
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className={cn(
                "flex items-center",
                isConnected ? "text-green-600" : "text-red-600"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                {isConnected ? "Connecté" : "Déconnecté"}
              </span>
              <span>{localNotifications.length} notifications</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
