import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { toast } = useToast();
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const success = await login(formData.email, formData.password, rememberMe);
    
    if (success) {
      // ATTENDRE que le user soit chargé dans le contexte
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Récupérer immédiatement les informations utilisateur pour déterminer la redirection
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      let userRole = null;
      let userData = null;
      
      // Essayer de récupérer le rôle depuis le token
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.role;
          console.log('Rôle détecté depuis token:', userRole);
        } catch (error) {
          console.error('Erreur de décodage du token:', error);
        }
      }
      
      // Essayer de récupérer le rôle depuis les données utilisateur sauvegardées
      if (!userRole && savedUser) {
        try {
          userData = JSON.parse(savedUser);
          userRole = userData.role;
          console.log('Rôle détecté depuis localStorage:', userRole);
        } catch (error) {
          console.error('Erreur de parsing des données utilisateur:', error);
        }
      }
      
      // Essayer de récupérer le rôle depuis l'état React
      if (!userRole && user && user.role) {
        userRole = user.role;
        console.log('Rôle détecté depuis AuthContext:', userRole);
      }
      
      console.log('Rôle final pour redirection:', userRole);
      
      // Rediriger selon le rôle
      if (userRole === 'ADMIN') {
        // Stocker les données admin et rediriger vers le dashboard admin
        if (userData) {
          localStorage.setItem('adminUser', JSON.stringify(userData));
        } else if (user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        }
        console.log('Redirection admin vers /admin/dashboard-modern');
        navigate('/admin/dashboard-modern');
        return; // Arrêter l'exécution ici
      } else if (userRole === 'STUDENT') {
        // Rediriger les étudiants vers leur tableau de bord
        console.log('Redirection étudiant vers /student/dashboard');
        navigate('/student/dashboard');
      } else if (userRole === 'TUTOR') {
        // Rediriger les tuteurs vers leur profil
        console.log('Redirection tuteur vers /profile');
        navigate('/profile');
      } else {
        // Pour les autres rôles, rediriger vers la page d'accueil
        console.log('Redirection par défaut vers /');
        navigate('/');
      }
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${userRole === 'ADMIN' ? 'Administrateur' : userRole === 'TUTOR' ? 'Tuteur' : 'Étudiant'} !`,
      });
    } else {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <img 
              src="/Asset 2Tyala copie.png" 
              alt="Tyala Logo" 
              className="h-8 w-auto sm:h-10"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Bon retour !
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Connectez-vous pour continuer votre parcours d'apprentissage
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6 sm:p-8 bg-gradient-card border-border">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresse email
                </Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Entrez votre email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Entrez votre mot de passe"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-muted rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="premium" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>


            <Separator className="my-4 sm:my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Pas de compte ?{" "}
                <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                  S'inscrire ici
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Card className="p-3 sm:p-4 bg-gradient-card/50 border-border text-center">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Pour les Étudiants</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Accédez aux flashcards, tests de pratique et matériels d'étude
            </p>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card/50 border-border text-center">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Pour les Tuteurs</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connectez-vous avec les étudiants et partagez votre expertise
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;