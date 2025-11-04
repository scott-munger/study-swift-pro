import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './enhanced-button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPanel from './NotificationPanel';
import { API_URL } from '@/config/api';

const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Charger le compteur de notifications non lues
  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Erreur chargement compteur notifications:', error);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowPanel(!showPanel)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {showPanel && (
        <NotificationPanel
          onClose={() => setShowPanel(false)}
          onNotificationRead={loadUnreadCount}
        />
      )}
    </div>
  );
};

export default NotificationBell;





