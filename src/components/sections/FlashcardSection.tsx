import { Button } from "@/components/ui/enhanced-button";
import { Play, RotateCcw, CheckCircle, BookOpen, Brain, Target } from "lucide-react";

const FlashcardSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
                Flashcards Intelligentes pour
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  un Apprentissage Plus Rapide
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
                Maîtrisez le contenu de vos examens avec notre système de flashcards intelligent. 
                Les algorithmes d'apprentissage adaptatif s'ajustent à votre rythme et se concentrent sur les domaines à améliorer.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-primary/10 rounded-lg p-1.5 sm:p-2 mt-1">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">Apprentissage Adaptatif</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Les cartes s'adaptent à votre vitesse d'apprentissage et aux lacunes de connaissances</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-secondary/10 rounded-lg p-1.5 sm:p-2 mt-1">
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">Répétition Espacée</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Méthode scientifiquement prouvée pour la rétention à long terme</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-success/10 rounded-lg p-1.5 sm:p-2 mt-1">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">Contenu Interactif</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Contenu multimédia riche avec images, diagrammes et vidéos</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 py-6 sm:py-8">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary mb-1">10,000+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Flashcards Disponibles</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-secondary mb-1">85%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Taux de Rétention</div>
              </div>
            </div>

            <Button variant="premium" size="lg" className="w-full sm:w-auto">
              Essayer les Flashcards
            </Button>
          </div>

          {/* Interactive Demo */}
          <div className="relative order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Démonstration Interactive</h3>
                <p className="text-gray-600">Essayez notre système de flashcards</p>
              </div>
              
              {/* Flashcard Demo */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6 min-h-[200px] flex flex-col justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Question de Mathématiques</h4>
                  <p className="text-gray-700 mb-4">Quelle est la dérivée de x² + 3x + 2 ?</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" className="bg-white">2x + 3</Button>
                    <Button size="sm" variant="outline" className="bg-white">2x + 2</Button>
                  </div>
                </div>
              </div>
              
              {/* Progress Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">75%</div>
                  <div className="text-xs text-gray-500">Progression</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">12</div>
                  <div className="text-xs text-gray-500">Série</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">85%</div>
                  <div className="text-xs text-gray-500">Précision</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashcardSection;