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
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Pourquoi Choisir Notre Plateforme ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0">
            Découvrez la façon la plus efficace de préparer vos examens d'État avec notre environnement d'apprentissage numérique complet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const iconBgColor = benefit.color === 'primary' ? 'bg-[#00aaff]/10' : 'bg-[#80ff00]/10';
            const iconColor = benefit.color === 'primary' ? 'text-[#00aaff]' : 'text-[#80ff00]';
            return (
              <div
                key={index}
                className="group relative p-6 sm:p-8 bg-card border border-border/50 rounded-2xl hover:border-border transition-all duration-300"
              >
                <div className="mb-4 sm:mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 ${iconBgColor} rounded-xl transition-all duration-300`}>
                    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground/80 leading-relaxed">
                  {benefit.description}
                </p>
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