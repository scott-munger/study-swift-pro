const benefits = [
  {
    emoji: "⚡",
    title: "Apprentissage Ultra-Rapide",
    description: "Accélérez votre processus d'étude avec notre système de flashcards optimisé et nos algorithmes d'apprentissage adaptatifs.",
    gradient: "from-yellow-400 via-orange-500 to-red-500"
  },
  {
    emoji: "🎯",
    title: "Préparation Ciblée aux Examens",
    description: "Concentrez-vous exactement sur ce que vous devez savoir pour votre classe d'examen et vos matières spécifiques.",
    gradient: "from-blue-400 via-cyan-500 to-teal-500"
  },
  {
    emoji: "🧠",
    title: "Suivi Intelligent des Progrès",
    description: "Surveillez vos progrès d'apprentissage avec des analyses détaillées et des recommandations personnalisées.",
    gradient: "from-purple-400 via-pink-500 to-red-500"
  },
  {
    emoji: "👥",
    title: "Réseau de Tuteurs Experts",
    description: "Connectez-vous avec des tuteurs vérifiés qui se spécialisent dans vos matières d'examen et vos besoins d'apprentissage.",
    gradient: "from-green-400 via-emerald-500 to-teal-500"
  },
  {
    emoji: "🕐",
    title: "Accessibilité 24h/24",
    description: "Étudiez n'importe quand, n'importe où avec notre plateforme optimisée mobile et nos capacités hors ligne.",
    gradient: "from-indigo-400 via-blue-500 to-cyan-500"
  },
  {
    emoji: "🏆",
    title: "Taux de Réussite Prouvé",
    description: "Rejoignez des milliers d'étudiants qui ont atteint leurs objectifs d'examen avec notre plateforme.",
    gradient: "from-amber-400 via-yellow-500 to-orange-500"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Pourquoi Choisir Notre Plateforme ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0">
            Découvrez la façon la plus efficace de préparer vos examens d'État avec notre environnement d'apprentissage numérique complet.
          </p>
        </div>

        {/* Grille moderne 2 colonnes avec cartes 3D */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-card/80 to-card backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 hover:border-border"
            >
              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Contenu */}
              <div className="relative z-10">
                {/* Icône 3D avec gradient background */}
                <div className="mb-6 sm:mb-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${benefit.gradient} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl`}>
                    <span className="text-4xl sm:text-5xl filter drop-shadow-lg" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                      {benefit.emoji}
                    </span>
                  </div>
                </div>

                {/* Titre */}
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 sm:mb-4 transition-colors duration-300">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground/80 leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Petit gradient accent en bas */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            </div>
          ))}
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