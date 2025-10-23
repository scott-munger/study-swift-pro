import { Button } from "@/components/ui/enhanced-button";
import { ArrowRight, BookOpen, Users, Trophy, Star, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import studentsBanner from "@/assets/students-banner.jpg";
import student1 from "@/assets/student1.jpg";
import student2 from "@/assets/student2.jpg";
import student3 from "@/assets/student3.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Phrases d'animation courtes sur l'éducation
  const educationPhrases = [
    "Réussir ses examens",
    "Apprendre efficacement",
    "Maîtriser les matières",
    "Étudier intelligemment",
    "Transformer sa vie"
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentPhrase = educationPhrases[currentPhraseIndex];
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => setIsPaused(false), 1500);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Écriture
        if (displayedText.length < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        } else {
          // Pause avant effacement
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        // Effacement plus rapide
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % educationPhrases.length);
          setIsPaused(true);
        }
      }
    }, isDeleting ? 30 : 80);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex, isPaused, educationPhrases]);
  
  // Gestion des erreurs d'images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  const handleStartNow = () => {
    if (user) {
      // Utilisateur déjà connecté, rediriger vers le dashboard approprié
      if (user.role === 'ADMINISTRATOR') {
        navigate('/admin/dashboard-modern');
      } else if (user.role === 'TUTOR') {
        navigate('/tutor/dashboard');
      } else if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/dashboard');
      }
      toast({
        title: "Bienvenue !",
        description: `Bon retour, ${user.firstName} !`,
      });
    } else {
      // Utilisateur non connecté, rediriger vers la page de connexion
      navigate('/login');
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour accéder aux fonctionnalités",
      });
    }
  };

  const handleFindTutor = () => {
    toast({
      title: "Fonctionnalité en développement",
      description: "La recherche de tuteurs sera bientôt disponible",
      variant: "destructive"
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-1 sm:gap-2 bg-blue-100 text-blue-800 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Excellence dans la préparation aux examens</span>
              <span className="sm:hidden">Excellence aux examens</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              <div className="mb-2 sm:mb-4">
                Votre Réussite
                <br />
                <span className="text-primary">
                  à Portée de Clic
                </span>
              </div>
              
              {/* Animation de texte sur l'éducation - Optimisée mobile */}
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
                <span className="inline-block text-center sm:text-left w-full">
                  {displayedText}
                  <span className="animate-pulse text-primary ml-1">|</span>
                </span>
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl">
              Maîtrisez vos examens de terminale et de 9ème avec notre plateforme numérique complète. 
              Flashcards, exercices et tuteurs experts - tout en un seul endroit pour votre réussite.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700">Plus efficace que les méthodes traditionnelles</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-700">Vos révisions en un clic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-700">Préparation ciblée aux examens</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <Button variant="hero" size="lg" onClick={handleStartNow} className="w-full sm:w-auto">
                {user ? "Accéder au Dashboard" : "Commencer Maintenant"}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10" onClick={handleFindTutor}>
                <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Trouver un Tuteur
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">10,000+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Étudiants Actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success mb-1 sm:mb-2">500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Tuteurs Experts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-secondary mb-1 sm:mb-2">95%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Taux de Réussite</div>
              </div>
            </div>
          </div>

          {/* Right Content - Student Cards */}
          <div className="relative mt-8 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Colonne gauche */}
              <div className="space-y-4">
                {/* Marie-Claire Joseph - Carte principale */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-lg font-bold text-gray-800 truncate">Marie-Claire Joseph</div>
                        <div className="text-xs sm:text-sm text-gray-600">Terminale SMP</div>
                        <div className="text-xs text-blue-600 font-medium">Port-au-Prince</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                        <span className="text-xs sm:text-sm font-bold text-gray-800">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jean-Baptiste Pierre - Carte secondaire */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">Jean-Baptiste Pierre</div>
                        <div className="text-sm text-gray-600">Terminale SVT</div>
                        <div className="text-xs text-green-600 font-medium">156 flashcards</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Étudiant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">
                {/* Étudiants de 9ème - Carte groupe */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">Étudiants de 9ème</div>
                        <div className="text-sm text-gray-600">Collège Saint-Louis</div>
                        <div className="text-xs text-purple-600 font-medium">Équipe d'étude</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Groupe</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte de statistiques */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 shadow-lg border border-white/20">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1">95%</div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Taux de Réussite</div>
                      <div className="text-xs text-gray-500">Parmi nos étudiants</div>
                      <div className="mt-2 flex items-center justify-center">
                        <div className="flex items-center text-xs text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span>+15% ce mois</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Éléments décoratifs */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;