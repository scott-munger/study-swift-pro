import { useState, useEffect } from 'react';
import { Search, Star, MessageCircle, Clock, BookOpen, Award, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TutorChat } from '@/components/ui/TutorChat';

interface TutorSubject {
  subject: {
    id: number;
    name: string;
  };
}

interface Review {
  rating: number;
  comment: string;
  student: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Tutor {
  id: number;
  rating: number;
  hourlyRate: number | null;
  isOnline: boolean;
  isAvailable: boolean;
  bio: string;
  experience: number;
  totalSessions: number;
  responseTime: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
  };
  tutorSubjects: TutorSubject[];
  reviews?: Review[];
  _count: {
    reviews: number;
    sessions: number;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
}

export default function FindTutors() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [chatConversation, setChatConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tutors/search`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      // Filtrer les tuteurs avec N/A dans firstName ou lastName
      const filteredData = data.filter((tutor: Tutor) => 
        tutor.user?.firstName !== 'N/A' && tutor.user?.lastName !== 'N/A'
      );
      setTutors(filteredData);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tuteurs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${tutor.user.firstName} ${tutor.user.lastName}`.toLowerCase();
    const subjects = tutor.tutorSubjects.map(ts => ts.subject.name.toLowerCase()).join(' ');
    
    return fullName.includes(searchLower) || 
           subjects.includes(searchLower) ||
           tutor.bio?.toLowerCase().includes(searchLower);
  });

  const handleContact = async (tutor: Tutor) => {
    try {
      // Créer ou récupérer une conversation avec le tuteur
      const token = localStorage.getItem('token');
      if (!token || !user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour contacter un tuteur',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorId: tutor.id
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversation');
      }

      const conversationData = await response.json();
      
      // Ouvrir directement le chat style WhatsApp au lieu de naviguer
      setChatConversation({
        id: tutor.id,
        name: `${tutor.user.firstName} ${tutor.user.lastName}`,
        description: `Tuteur - Conversation privée`,
        userClass: 'Tuteur',
        section: tutor.isOnline ? 'En ligne' : 'Hors ligne',
        creatorId: tutor.user.id,
        isTutorChat: true,
        tutorId: tutor.id,
        conversationId: conversationData.id,
        studentId: user.id,
        tutorUserId: tutor.user.id,
        _count: { members: 2 },
        members: [
          { 
            user: {
              ...tutor.user,
              role: 'TUTOR'
            }
          }
        ],
        tutor: {
          id: tutor.id,
          userId: tutor.user.id,
          user: tutor.user,
          isOnline: tutor.isOnline
        }
      });
      setShowChat(true);
      // Fermer le modal si ouvert
      setSelectedTutor(null);
    } catch (error) {
      console.error('Erreur lors du contact avec le tuteur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de contacter le tuteur. Veuillez réessayer.',
        variant: 'destructive'
      });
    }
  };

  // Si le chat est ouvert, afficher le chat en plein écran style WhatsApp
  if (showChat && chatConversation) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
        <TutorChat
          group={chatConversation}
          open={true}
          onClose={() => {
            setShowChat(false);
            setChatConversation(null);
          }}
          inline={true}
          onBack={() => {
            setShowChat(false);
            setChatConversation(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement des tuteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary/90 dark:via-primary/80 dark:to-primary/70 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Award className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Plateforme #1 en Haïti</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              Trouvez votre tuteur parfait
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto font-light">
              Connectez-vous avec des experts certifiés pour atteindre vos objectifs académiques
            </p>
          </div>

          {/* Barre de recherche premium */}
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom, matière, spécialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-14 text-base border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
                <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 font-semibold shadow-lg">
                  Rechercher
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: BookOpen, label: 'Tuteurs experts', value: tutors.length },
              { icon: Star, label: 'Note moyenne', value: '4.8/5' },
              { icon: Award, label: 'Certifiés', value: '100%' },
              { icon: TrendingUp, label: 'Taux de succès', value: '95%' }
            ].map((stat, i) => (
              <div key={i} className="text-center text-white">
                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-90" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tuteurs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Nos meilleurs tuteurs
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredTutors.length} tuteur{filteredTutors.length > 1 ? 's' : ''} disponible{filteredTutors.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {filteredTutors.length === 0 ? (
          <Card className="p-16 text-center border-2 border-dashed">
            <Search className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Aucun tuteur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Essayez une autre recherche ou parcourez tous nos tuteurs
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredTutors.map((tutor) => (
              <Card 
                key={tutor.id}
                className="group relative hover:shadow-2xl transition-all duration-300 border border-gray-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 backdrop-blur-sm overflow-hidden cursor-pointer hover:-translate-y-1"
                onClick={() => setSelectedTutor(tutor)}
              >
                {/* Gradient overlay subtil au hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative p-5 sm:p-6">
                  {/* Avatar et Info - Layout optimisé */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shadow-lg">
                        {tutor.user.profilePhoto ? (
                          <AvatarImage 
                            src={`${API_URL}/api/profile/photos/${tutor.user.profilePhoto}`}
                            alt={`${tutor.user.firstName} ${tutor.user.lastName}`}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-base sm:text-lg font-bold">
                            {tutor.user.firstName[0]}{tutor.user.lastName[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {/* Point vert en ligne - Style minimaliste */}
                      {tutor.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900">
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5 truncate group-hover:text-primary transition-colors leading-tight">
                        {tutor.user.firstName} {tutor.user.lastName}
                      </h3>
                      
                      {/* Rating avec étoiles dorées - Compact */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3 transition-all",
                                i < Math.floor(tutor.rating)
                                  ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                  : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'Nouveau'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({tutor._count.reviews})
                        </span>
                      </div>

                      {/* Stats compactes et élégantes */}
                      <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary/70" />
                          <span className="font-medium">{tutor._count.sessions}</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary/70" />
                          <span className="font-medium">{tutor.responseTime}h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio courte - 2 lignes max */}
                  {tutor.bio && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3.5 leading-relaxed">
                      {tutor.bio}
                    </p>
                  )}

                  {/* Matières - Design minimaliste */}
                  {tutor.tutorSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tutor.tutorSubjects.slice(0, 3).map((ts, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-foreground hover:bg-primary/10 dark:hover:bg-primary/20 border-0 font-medium text-[10px] sm:text-xs px-2 py-0.5 rounded-md"
                        >
                          {ts.subject.name}
                        </Badge>
                      ))}
                      {tutor.tutorSubjects.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="font-medium text-[10px] sm:text-xs px-2 py-0.5 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          +{tutor.tutorSubjects.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Prix et CTA - Layout premium */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800/80">
                    <div>
                      <div className="flex items-baseline gap-1 mb-0.5">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                          {tutor.hourlyRate ? tutor.hourlyRate.toLocaleString() : 'N/A'}
                        </span>
                        {tutor.hourlyRate && (
                          <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">HTG</span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {tutor.hourlyRate ? 'par heure' : 'Prix sur demande'}
                      </div>
                    </div>
                    
                    <Button 
                      size="default"
                      className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-semibold rounded-lg px-4 sm:px-5 text-xs sm:text-sm h-9 sm:h-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContact(tutor);
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                      Contacter
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Profil */}
      <Dialog open={!!selectedTutor} onOpenChange={() => setSelectedTutor(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTutor && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-2xl ring-4 ring-gray-100">
                    {selectedTutor.user.profilePhoto ? (
                      <AvatarImage 
                        src={`${API_URL}/api/profile/photos/${selectedTutor.user.profilePhoto}`}
                        alt={`${selectedTutor.user.firstName} ${selectedTutor.user.lastName}`}
                      />
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-3xl font-bold">
                          {selectedTutor.user.firstName[0]}{selectedTutor.user.lastName[0]}
                        </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-3xl font-black mb-2">
                      {selectedTutor.user.firstName} {selectedTutor.user.lastName}
                    </DialogTitle>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-bold">
                          {selectedTutor.rating > 0 ? selectedTutor.rating.toFixed(1) : 'Nouveau'}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({selectedTutor._count.reviews} avis)
                        </span>
                      </div>
                      <Badge 
                        variant={selectedTutor.isOnline ? "default" : "secondary"}
                        className="text-sm px-3 py-1"
                      >
                        {selectedTutor.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{selectedTutor._count.sessions} sessions données</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{selectedTutor.experience} ans d'expérience</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8">
                {/* Prix prominently displayed */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30 rounded-2xl p-6 border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tarif horaire</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-gray-900 dark:text-white">
                          {selectedTutor.hourlyRate ? selectedTutor.hourlyRate.toLocaleString() : 'N/A'}
                        </span>
                        {selectedTutor.hourlyRate && (
                          <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">HTG</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedTutor.hourlyRate ? 'par heure de cours' : 'Prix sur demande'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500 text-white text-sm px-4 py-2">
                        ✓ Paiement sécurisé
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">À propos</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTutor.bio || 'Professeur expérimenté et passionné par l\'enseignement, je m\'engage à aider mes étudiants à atteindre leurs objectifs académiques.'}
                  </p>
                </div>

                {/* Matières */}
                {selectedTutor.tutorSubjects.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Matières enseignées</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedTutor.tutorSubjects.map((ts, index) => (
                        <Badge 
                          key={index}
                          className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground hover:bg-primary/20 border-0 text-base px-4 py-2 font-medium"
                        >
                          {ts.subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Expérience', value: `${selectedTutor.experience} ans`, icon: Clock },
                    { label: 'Sessions', value: selectedTutor._count.sessions, icon: CheckCircle2 },
                    { label: 'Avis', value: selectedTutor._count.reviews, icon: Star }
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-lg py-6 font-bold shadow-lg"
                  onClick={() => {
                    handleContact(selectedTutor);
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Démarrer la conversation
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
