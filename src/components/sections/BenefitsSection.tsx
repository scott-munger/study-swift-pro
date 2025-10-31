const benefits = [
  {
    number: "01",
    title: "Apprentissage Ultra-Rapide",
    description: "Accélérez votre processus d'étude avec notre système de flashcards optimisé et nos algorithmes d'apprentissage adaptatifs.",
    accent: "primary"
  },
  {
    number: "02",
    title: "Préparation Ciblée aux Examens",
    description: "Concentrez-vous exactement sur ce que vous devez savoir pour votre classe d'examen et vos matières spécifiques.",
    accent: "secondary"
  },
  {
    number: "03",
    title: "Suivi Intelligent des Progrès",
    description: "Surveillez vos progrès d'apprentissage avec des analyses détaillées et des recommandations personnalisées.",
    accent: "primary"
  },
  {
    number: "04",
    title: "Réseau de Tuteurs Experts",
    description: "Connectez-vous avec des tuteurs vérifiés qui se spécialisent dans vos matières d'examen et vos besoins d'apprentissage.",
    accent: "secondary"
  },
  {
    number: "05",
    title: "Accessibilité 24h/24",
    description: "Étudiez n'importe quand, n'importe où avec notre plateforme optimisée mobile et nos capacités hors ligne.",
    accent: "primary"
  },
  {
    number: "06",
    title: "Taux de Réussite Prouvé",
    description: "Rejoignez des milliers d'étudiants qui ont atteint leurs objectifs d'examen avec notre plateforme.",
    accent: "secondary"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* En-tête centré */}
        <div className="text-center mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
            Pourquoi Choisir Notre Plateforme ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            Découvrez la façon la plus efficace de préparer vos examens d'État avec notre environnement d'apprentissage numérique complet.
          </p>
        </div>

        {/* Grille professionnelle 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => {
            const accentColor = benefit.accent === 'primary' ? 'text-[#00aaff]' : 'text-[#80ff00]';
            const borderColor = benefit.accent === 'primary' ? 'border-[#00aaff]/20' : 'border-[#80ff00]/20';
            
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Numéro élégant */}
                <div className="mb-6">
                  <span className={`text-6xl sm:text-7xl font-bold ${accentColor} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}>
                    {benefit.number}
                  </span>
                </div>

                {/* Titre */}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 group-hover:translate-x-1 transition-transform duration-300">
                  {benefit.title}
                </h3>

                {/* Ligne d'accent */}
                <div className={`w-12 h-0.5 ${benefit.accent === 'primary' ? 'bg-[#00aaff]' : 'bg-[#80ff00]'} mb-4 group-hover:w-20 transition-all duration-300`}></div>

                {/* Description */}
                <p className="text-sm sm:text-base text-muted-foreground/70 leading-relaxed">
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