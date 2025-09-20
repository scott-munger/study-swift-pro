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
  
  // Phrases d'animation sur l'éducation
  const educationPhrases = [
    "L'éducation est la clé du succès",
    "Chaque jour est une nouvelle opportunité d'apprendre",
    "La connaissance est le pouvoir",
    "L'avenir appartient à ceux qui étudient",
    "L'éducation ouvre toutes les portes",
    "Apprendre, c'est grandir",
    "La persévérance mène à la réussite",
    "L'éducation transforme les vies",
    "Chaque effort compte",
    "L'étude est l'investissement le plus rentable"
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentPhrase = educationPhrases[currentPhraseIndex];
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => setIsPaused(false), 2000);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Écriture
        if (displayedText.length < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        } else {
          // Pause avant effacement
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Effacement
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % educationPhrases.length);
          setIsPaused(true);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex, isPaused, educationPhrases]);
  
  // Gestion des erreurs d'images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  const handleStartNow = () => {
    navigate('/flashcards');
    toast({
      title: "Bienvenue !",
      description: "Commençons votre préparation aux examens avec les flashcards",
    });
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
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Trophy className="h-4 w-4" />
              Excellence dans la préparation aux examens
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              <div className="mb-4">
                Votre Réussite
                <br />
                <span className="text-primary">
                  à Portée de Clic
                </span>
              </div>
              
              {/* Animation de texte sur l'éducation */}
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-700 min-h-[3rem] flex items-center">
                <span className="inline-block">
                  {displayedText}
                  <span className="animate-pulse text-primary">|</span>
                </span>
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl">
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
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="lg" onClick={handleStartNow}>
                Commencer Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10" onClick={handleFindTutor}>
                <Users className="mr-2 h-5 w-5" />
                Trouver un Tuteur
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-sm text-muted-foreground">Étudiants Actifs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Tuteurs Experts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Taux de Réussite</div>
              </div>
            </div>
          </div>

          {/* Right Content - Student Cards */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Colonne gauche */}
              <div className="space-y-4">
                {/* Marie-Claire Joseph - Carte principale */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">Marie-Claire Joseph</div>
                        <div className="text-sm text-gray-600">Terminale SMP</div>
                        <div className="text-xs text-blue-600 font-medium">Port-au-Prince</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-gray-800">4.9</span>
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