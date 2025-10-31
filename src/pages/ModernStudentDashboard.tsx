import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/hooks/useStudentData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Star, 
  Clock, 
  TrendingUp, 
  Zap, 
  Award,
  Trophy,
  Calendar,
  BarChart3,
  PlayCircle,
  BookMarked,
  Users,
  MessageSquare,
  Settings,
  ChevronRight,
  Flame,
  Brain,
  Timer,
  Eye,
  Heart,
  Share2,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface StudentStats {
  flashcardsCompleted: number;
  studyStreak: number;
  averageScore: number;
  timeSpent: string;
  totalSubjects: number;
  completedLessons: number;
  upcomingTests: number;
  achievements: number;
}

interface SubjectProgress {
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLesson?: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'flashcard' | 'test' | 'lesson' | 'achievement';
  title: string;
  subject: string;
  time: string;
  score?: number;
  icon: React.ReactNode;
  color: string;
}

const ModernStudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  
  // Utiliser le hook de données
  const { 
    loading, 
    error, 
    stats: studentStats, 
    refreshData 
  } = useStudentData();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de synchronisation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Les données ne peuvent pas être chargées depuis la base de données. 
            Vérifiez votre connexion et réessayez.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Recharger la page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!studentStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header avec actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Bonjour, {user?.firstName} ! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Prêt à continuer votre apprentissage en {user?.userClass} {user?.section ? `- ${user.section}` : ''} ?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Profil
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Flashcards</p>
                  <p className="text-2xl sm:text-3xl font-bold">{studentStats.flashcardsCompleted}</p>
                  <p className="text-blue-200 text-xs">Terminées</p>
                </div>
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Série</p>
                  <p className="text-2xl sm:text-3xl font-bold">{studentStats.studyStreak}</p>
                  <p className="text-green-200 text-xs">jours</p>
                </div>
                <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Score</p>
                  <p className="text-2xl sm:text-3xl font-bold">{studentStats.averageScore}%</p>
                  <p className="text-purple-200 text-xs">Moyen</p>
                </div>
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Temps</p>
                  <p className="text-2xl sm:text-3xl font-bold">{studentStats.timeSpent}</p>
                  <p className="text-orange-200 text-xs">Étude</p>
                </div>
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate('/flashcards')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Flashcards</h3>
                    <p className="text-sm text-gray-600">Révisez vos cours</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate('/knowledge-tests')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tests</h3>
                    <p className="text-sm text-gray-600">Testez vos connaissances</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate('/forum')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Forum</h3>
                    <p className="text-sm text-gray-600">Discutez avec vos pairs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate('/profile')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Profil</h3>
                    <p className="text-sm text-gray-600">Gérez votre compte</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistiques avancées */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Statistiques détaillées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookMarked className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.completedLessons}</p>
                  <p className="text-sm text-gray-600">Leçons terminées</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.totalSubjects}</p>
                  <p className="text-sm text-gray-600">Matières suivies</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.upcomingTests}</p>
                  <p className="text-sm text-gray-600">Tests à venir</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.achievements}</p>
                  <p className="text-sm text-gray-600">Récompenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernStudentDashboard;
