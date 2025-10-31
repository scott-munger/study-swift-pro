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

  // Vérifier si on est sur /dashboard
  const currentPath = window.location.pathname;
  console.log('RoleBasedRedirect - Current path:', currentPath);
  
  if (currentPath !== '/dashboard') {
    console.log('RoleBasedRedirect - Pas sur /dashboard, retour null');
    return null;
  }

  // Vérifier si on a un utilisateur admin connecté
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  if (token && savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      if (userData.role === 'ADMIN') {
        console.log('RoleBasedRedirect - Admin détecté, redirection vers dashboard admin');
        navigate('/admin/dashboard-modern', { replace: true });
        return null;
      }
    } catch (error) {
      console.error('RoleBasedRedirect - Erreur parsing user data:', error);
    }
  }

  useEffect(() => {
    console.log('RoleBasedRedirect - useEffect déclenché', {
      user: user ? { email: user.email, role: user.role } : null,
      authLoading,
      adminLoading
    });
    
    // Attendre que le chargement soit terminé
    if (!authLoading && !adminLoading) {
      // Vérifier localStorage en priorité
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      let currentUser = user;
      if (!currentUser && savedUser && savedToken) {
        try {
          currentUser = JSON.parse(savedUser);
          console.log('RoleBasedRedirect - Utilisateur depuis localStorage:', currentUser.email);
        } catch (error) {
          console.error('RoleBasedRedirect - Erreur parsing:', error);
        }
      }
      
      // Seulement rediriger vers login si vraiment aucun utilisateur
      if (!currentUser && !savedUser) {
        console.log('RoleBasedRedirect - Aucun utilisateur trouvé, redirection vers login');
        navigate('/login');
        return;
      }

      // Rediriger selon le rôle
      if (currentUser) {
        console.log('RoleBasedRedirect - Redirection pour:', currentUser.role);
        if (currentUser.role === 'ADMIN') {
          navigate('/admin/dashboard-modern', { replace: true });
        } else if (currentUser.role === 'STUDENT') {
          navigate('/student/dashboard');
        } else if (currentUser.role === 'TUTOR') {
          navigate('/profile');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, authLoading, adminLoading, navigate]);

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
              onClick={() => navigate('/admin/dashboard-modern')}
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