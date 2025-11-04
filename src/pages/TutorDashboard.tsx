import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare,
  Settings,
  Bell,
  Star,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TutorProfile {
  id: number;
  bio: string;
  hourlyRate: number;
  experience: number;
  rating: number;
  isOnline: boolean;
  isAvailable: boolean;
  tutorSubjects: Array<{
    subject: {
      id: number;
      name: string;
    };
  }>;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto: string | null;
  };
  _count: {
    sessions: number;
    reviews: number;
  };
}

const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeConversations, setActiveConversations] = useState(0);

  useEffect(() => {
    loadTutorData();
  }, []);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Non authentifié');
      }

      const profileResponse = await fetch(`${API_URL}/api/tutors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setTutorProfile(profileData);
      }

      // Charger les conversations et messages non lus
      const conversationsResponse = await fetch(`${API_URL}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationsResponse.ok) {
        const conversations = await conversationsResponse.json();
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessages(totalUnread);
        setActiveConversations(conversations.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données tuteur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Messages non lus',
      value: unreadMessages,
      icon: Bell,
      color: 'text-blue-600',
      showBadge: unreadMessages > 0
    },
    {
      label: 'Note moyenne',
      value: tutorProfile?.rating ? `${tutorProfile.rating.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      label: 'Avis',
      value: tutorProfile?._count?.reviews || 0,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'Conversations',
      value: activeConversations,
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      label: 'Messages',
      description: 'Communiquer avec vos étudiants',
      icon: MessageSquare,
      path: '/messages',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Paramètres',
      description: 'Gérer votre profil',
      icon: Settings,
      path: '/profile',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Bonjour, {user?.firstName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue sur votre tableau de bord
          </p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6 border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/20">
                <AvatarImage 
                  src={tutorProfile?.user.profilePhoto 
                    ? `${API_URL}/api/profile/photos/${tutorProfile.user.profilePhoto}`
                    : undefined} 
                />
                <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        variant={tutorProfile?.isAvailable ? "default" : "secondary"}
                        className={cn(
                          tutorProfile?.isAvailable && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {tutorProfile?.isAvailable ? "Disponible" : "Non disponible"}
                      </Badge>
                      {tutorProfile?.isOnline && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          En ligne
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/profile')}
                    className="flex-shrink-0"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier le profil
                  </Button>
                </div>
                
                {tutorProfile?.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mt-4 max-w-2xl">
                    {tutorProfile.bio}
                  </p>
                )}
                
                {tutorProfile?.tutorSubjects && tutorProfile.tutorSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tutorProfile.tutorSubjects.map((ts, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {ts.subject.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-5 w-5", stat.color)} />
                    {stat.showBadge && unreadMessages > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </Badge>
                    )}
                  </div>
                  <div className={cn("text-2xl font-bold mb-1", stat.color)}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="border-0 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-lg", action.color, "text-white")}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {action.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Rate Display */}
        {tutorProfile?.hourlyRate && (
          <Card className="mt-6 border-0 shadow-sm bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Tarif horaire
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {tutorProfile.hourlyRate.toLocaleString()} HTG
                  </p>
                </div>
                {tutorProfile.experience > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Expérience
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tutorProfile.experience}+ ans
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TutorDashboard;
