import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  MessageSquare, 
  Clock,
  Star,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentStats] = useState({
    flashcardsCompleted: 156,
    studyStreak: 7,
    averageScore: 87,
    timeSpent: '24h 30m'
  });



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès Refusé</CardTitle>
            <CardDescription className="text-center">
              Vous devez être connecté pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Simple */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bonjour {user.firstName} ! 👋
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Prêt à réussir vos examens ?
          </p>
          <div className="flex justify-center space-x-4">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 px-4 py-2">
              {user.userClass} - {user.section}
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 px-4 py-2">
              {user.department}
            </Badge>
          </div>
        </div>

        {/* Actions Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="text-center p-8 hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => navigate('/flashcards')}>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Étudier</h3>
            <p className="text-gray-600 mb-4">
              Accédez aux flashcards et tests pour réviser vos matières
            </p>
            <Button size="lg" className="w-full">
              <BookOpen className="h-5 w-5 mr-2" />
              Commencer à étudier
            </Button>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/forum')}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Forum</h3>
            <p className="text-gray-600 mb-4">
              Posez vos questions et échangez avec vos tuteurs
            </p>
            <Button size="lg" variant="outline" className="w-full">
              <MessageSquare className="h-5 w-5 mr-2" />
              Accéder au Forum
            </Button>
          </Card>
        </div>

        {/* Statistiques Simplifiées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Flashcards"
            value={studentStats.flashcardsCompleted}
            icon={BookOpen}
            color="text-blue-600"
            subtitle="Complétées"
          />
          <StatCard
            title="Série"
            value={`${studentStats.studyStreak}`}
            icon={Target}
            color="text-green-600"
            subtitle="jours"
          />
          <StatCard
            title="Score"
            value={`${studentStats.averageScore}%`}
            icon={Star}
            color="text-yellow-600"
            subtitle="Moyen"
          />
          <StatCard
            title="Temps"
            value={studentStats.timeSpent}
            icon={Clock}
            color="text-purple-600"
            subtitle="Étude"
          />
        </div>

        {/* Progression */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-2xl">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
              Votre Progression
            </CardTitle>
            <CardDescription>
              Suivez vos progrès dans chaque matière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Mathématiques</span>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">SVT</span>
                  <span className="text-sm text-muted-foreground">60%</span>
                </div>
                <Progress value={60} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Physique</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;



