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
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

    const success = await login(formData.email, formData.password);
    
    if (success) {
      // Récupérer les informations utilisateur pour déterminer la redirection
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userRole = payload.role;
          
          // Rediriger selon le rôle
          if (userRole === 'ADMIN') {
            // Stocker les données admin et rediriger vers le dashboard admin
            const response = await fetch('http://localhost:8081/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const userData = await response.json();
              localStorage.setItem('adminUser', JSON.stringify(userData));
            }
            navigate('/simple-admin/dashboard');
          } else if (userRole === 'STUDENT') {
            // Rediriger les étudiants vers leur tableau de bord
            navigate('/student/dashboard');
          } else if (userRole === 'TUTOR') {
            // Rediriger les tuteurs vers leur profil
            navigate('/profile');
          } else {
            // Pour les autres rôles, rediriger vers la page d'accueil
            navigate('/');
          }
          
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${userRole === 'ADMIN' ? 'Administrateur' : userRole === 'TUTOR' ? 'Tuteur' : 'Étudiant'} !`,
          });
        } catch (error) {
          console.error('Erreur de décodage du token:', error);
          navigate('/');
        }
      } else {
        navigate('/');
      }
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
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <span className="font-bold text-xl sm:text-2xl bg-gradient-primary bg-clip-text text-transparent">
              EduPrep
            </span>
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
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">For Students</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Access flashcards, practice tests, and study materials
            </p>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card/50 border-border text-center">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">For Tutors</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connect with students and share your expertise
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;