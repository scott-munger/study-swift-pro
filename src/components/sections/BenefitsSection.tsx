import { CheckCircle, Clock, Target, Users, Zap, Brain, BookOpen, Award, TrendingUp, Shield, Globe, Star } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Apprentissage Ultra-Rapide",
    description: "Accélérez votre processus d'étude avec notre système de flashcards optimisé et nos algorithmes d'apprentissage adaptatifs.",
    color: "primary"
  },
  {
    icon: Target,
    title: "Préparation Ciblée aux Examens",
    description: "Concentrez-vous exactement sur ce que vous devez savoir pour votre classe d'examen et vos matières spécifiques.",
    color: "secondary"
  },
  {
    icon: Brain,
    title: "Suivi Intelligent des Progrès",
    description: "Surveillez vos progrès d'apprentissage avec des analyses détaillées et des recommandations personnalisées.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Réseau de Tuteurs Experts",
    description: "Connectez-vous avec des tuteurs vérifiés qui se spécialisent dans vos matières d'examen et vos besoins d'apprentissage.",
    color: "secondary"
  },
  {
    icon: Clock,
    title: "Accessibilité 24h/24",
    description: "Étudiez n'importe quand, n'importe où avec notre plateforme optimisée mobile et nos capacités hors ligne.",
    color: "primary"
  },
  {
    icon: Award,
    title: "Taux de Réussite Prouvé",
    description: "Rejoignez des milliers d'étudiants qui ont atteint leurs objectifs d'examen avec notre plateforme.",
    color: "secondary"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Pourquoi Choisir Notre Plateforme ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0">
            Découvrez la façon la plus efficace de préparer vos examens d'État avec notre environnement d'apprentissage numérique complet.
          </p>
        </div>

        {/* Design professionnel en liste avec séparateurs */}
        <div className="max-w-5xl mx-auto space-y-0">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const iconColor = benefit.color === 'primary' ? 'text-[#00aaff]' : 'text-[#80ff00]';
            const isLast = index === benefits.length - 1;
            
            return (
              <div
                key={index}
                className={`group relative py-8 sm:py-10 lg:py-12 ${!isLast ? 'border-b border-border/30' : ''}`}
              >
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-12">
                  {/* Numéro + Icône */}
                  <div className="flex items-start gap-4 sm:gap-6">
                    {/* Numéro */}
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-lg sm:text-xl font-bold text-muted-foreground/30 transition-colors duration-300 group-hover:text-muted-foreground/50">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    
                    {/* Icône */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Icon className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${iconColor} transition-all duration-300 group-hover:scale-110`} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-foreground/90">
                      {benefit.title}
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground/70 leading-relaxed max-w-3xl">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Statistics */}
        <div className="mt-12 sm:mt-16 lg:mt-20 bg-gradient-hero rounded-2xl p-6 sm:p-8 md:p-12 border border-border">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Impact de la Plateforme
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              Résultats réels d'étudiants qui ont transformé leur préparation aux examens
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                75%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Amélioration Moyenne des Notes</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                50%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Vitesse d'Apprentissage Plus Rapide</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                90%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction des Étudiants</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                24/7
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Disponibilité de la Plateforme</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;