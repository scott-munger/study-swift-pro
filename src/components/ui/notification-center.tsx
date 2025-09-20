import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { Bell, MessageCircle, Users, X, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'forum'>('messages');
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [forumNotifications, setForumNotifications] = useState<any[]>([]);
  
  const clearNotifications = () => setNotifications([]);
  const clearForumNotifications = () => setForumNotifications([]);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Onglets */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('messages')}
              className="flex-1 relative"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Messages
              {notifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {notifications.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'forum' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('forum')}
              className="flex-1 relative"
            >
              <Users className="w-4 h-4 mr-1" />
              Forum
              {forumNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {forumNotifications.length}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[400px]">
            {activeTab === 'messages' ? (
              <div className="p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification de message</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Message de {notification.fromUserName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {notification.fromUserType === 'tutor' ? 'Tuteur' : 'Étudiant'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {forumNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification du forum</p>
                  </div>
                ) : (
                  forumNotifications.map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.notificationType}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.postTitle}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          par {notification.authorName}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Actions */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={activeTab === 'messages' ? clearNotifications : clearForumNotifications}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Marquer comme lu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

