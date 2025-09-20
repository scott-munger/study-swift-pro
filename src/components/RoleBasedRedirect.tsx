import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, BookOpen, GraduationCap } from 'lucide-react';

const RoleBasedRedirect: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/login');
        return;
      }

      // Déterminer le rôle et rediriger
      if (user.role === 'ADMIN' || isAdmin) {
        // Seuls les administrateurs sont redirigés vers leur dashboard
        navigate('/simple-admin/dashboard');
      } else if (user.role === 'STUDENT') {
        // Rediriger les étudiants vers leur tableau de bord
        navigate('/student/dashboard');
      } else if (user.role === 'TUTOR') {
        // Rediriger les tuteurs vers leur profil
        navigate('/profile');
      } else {
        // Pour les autres rôles, rester sur la page d'accueil
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
              Chargement...
            </CardTitle>
            <CardDescription className="text-center">
              Détermination de votre rôle et redirection...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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

  // Interface de sélection de rôle (fallback)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Choisissez votre tableau de bord</CardTitle>
          <CardDescription className="text-center">
            Bienvenue {user.firstName} ! Sélectionnez l'interface qui correspond à votre rôle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Étudiant */}
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3"
              onClick={() => navigate('/student/dashboard')}
            >
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Étudiant</div>
                <div className="text-sm text-muted-foreground">
                  Flashcards, progression, tuteurs
                </div>
              </div>
            </Button>

            {/* Tuteur */}
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3"
              onClick={() => navigate('/profile')}
            >
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold">Tuteur</div>
                <div className="text-sm text-muted-foreground">
                  Sessions, étudiants, performance
                </div>
              </div>
            </Button>

            {/* Admin */}
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3"
              onClick={() => navigate('/simple-admin/dashboard')}
            >
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="text-center">
                <div className="font-semibold">Administrateur</div>
                <div className="text-sm text-muted-foreground">
                  Gestion, modération, analytics
                </div>
              </div>
            </Button>
          </div>

          <div className="text-center pt-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleBasedRedirect;




