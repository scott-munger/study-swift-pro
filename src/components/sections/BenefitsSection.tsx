import { useLanguage } from "@/contexts/LanguageContext";

const BenefitsSection = () => {
  const { language, t } = useLanguage();
  
  const benefits = [
    {
      number: "01",
      title: language === 'fr' ? "Apprentissage Ultra-Rapide" : "Aprantisaj Ult-Rapid",
      description: language === 'fr' 
        ? "Accélérez votre processus d'étude avec notre système de flashcards optimisé et nos algorithmes d'apprentissage adaptatifs."
        : "Akselere pwosesis etid ou ak sistèm flashcards optimize nou an ak algoritm aprantisaj adaptatif yo.",
      accent: "primary"
    },
    {
      number: "02",
      title: language === 'fr' ? "Préparation Ciblée aux Examens" : "Preparasyon Sib pou Egzamen",
      description: language === 'fr'
        ? "Concentrez-vous exactement sur ce que vous devez savoir pour votre classe d'examen et vos matières spécifiques."
        : "Konsantre egzakteman sou sa ou dwe konnen pou klas egzamen ou ak matyè espesifik ou yo.",
      accent: "secondary"
    },
    {
      number: "03",
      title: language === 'fr' ? "Suivi Intelligent des Progrès" : "Swiv Entelijan Pwogrè",
      description: language === 'fr'
        ? "Surveillez vos progrès d'apprentissage avec des analyses détaillées et des recommandations personnalisées."
        : "Swiv pwogrè aprantisaj ou ak analiz detaye ak rekòmandasyon pèsonalize.",
      accent: "primary"
    },
    {
      number: "04",
      title: language === 'fr' ? "Réseau de Tuteurs Experts" : "Rezo Titor Ekspè",
      description: language === 'fr'
        ? "Connectez-vous avec des tuteurs vérifiés qui se spécialisent dans vos matières d'examen et vos besoins d'apprentissage."
        : "Konekte ak titor verifye ki espesyalize nan matyè egzamen ou ak bezwen aprantisaj ou yo.",
      accent: "secondary"
    },
    {
      number: "05",
      title: language === 'fr' ? "Accessibilité 24h/24" : "Aksesib 24/7",
      description: language === 'fr'
        ? "Étudiez n'importe quand, n'importe où avec notre plateforme optimisée mobile et nos capacités hors ligne."
        : "Etidye nenpòt lè, nenpòt kote ak platfòm optimize mobil nou an ak kapasite ofline nou yo.",
      accent: "primary"
    },
    {
      number: "06",
      title: language === 'fr' ? "Taux de Réussite Prouvé" : "Pousantaj Siksè Pwouve",
      description: language === 'fr'
        ? "Rejoignez des milliers d'étudiants qui ont atteint leurs objectifs d'examen avec notre plateforme."
        : "Ansanm dè milye elèv ki te rive nan objektif egzamen yo ak platfòm nou an.",
      accent: "secondary"
    }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* En-tête centré */}
        <div className="text-center mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
            {t.home?.benefits?.title || (language === 'fr' ? 'Pourquoi Choisir Notre Plateforme ?' : 'Poukisa Chwazi Platfòm Nou an ?')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t.home?.benefits?.subtitle || (language === 'fr' 
              ? "Découvrez la façon la plus efficace de préparer vos examens d'État avec notre environnement d'apprentissage numérique complet."
              : "Dekouvri fason ki pi efikas pou prepare egzamen Leta ou yo ak anviwònman aprantisaj nimerik konplè nou an.")}
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
              {t.home?.benefits?.impactTitle || (language === 'fr' ? 'Impact de la Plateforme' : 'Enpak Platfòm nan')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              {t.home?.benefits?.impactSubtitle || (language === 'fr' 
                ? "Résultats réels d'étudiants qui ont transformé leur préparation aux examens"
                : 'Rezilta reyèl elèv ki te transfòme preparasyon egzamen yo')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                75%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.home?.benefits?.stat1 || (language === 'fr' ? 'Amélioration Moyenne des Notes' : 'Amelyorasyon Mwayen Nòt yo')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                50%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.home?.benefits?.stat2 || (language === 'fr' ? 'Vitesse d\'Apprentissage Plus Rapide' : 'Vitès Aprantisaj Pi Rapid')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                90%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.home?.benefits?.stat3 || (language === 'fr' ? 'Satisfaction des Étudiants' : 'Satisfaksyon Elèv yo')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
                24/7
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.home?.benefits?.stat4 || (language === 'fr' ? 'Disponibilité de la Plateforme' : 'Disponibilite Platfòm nan')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;