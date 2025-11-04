import { Book, FlaskConical, BarChart3, Languages, Calculator, Globe, Atom, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const getFinalYearSubjects = (language: 'fr' | 'ht') => [
  {
    icon: Calculator,
    name: language === 'fr' ? "Mathématiques" : "Matematik",
    section: "SMP",
    description: language === 'fr' 
      ? "Algèbre avancée, calcul différentiel et intégral, probabilités et statistiques"
      : "Aljèb avanse, kalkil diferansyèl ak entegral, pwobabilite ak estatistik",
    color: "primary"
  },
  {
    icon: Atom,
    name: language === 'fr' ? "Physique" : "Fizik",
    section: "SMP",
    description: language === 'fr'
      ? "Mécanique, thermodynamique, électricité et notions de physique moderne"
      : "Mekanik, tèmodinamik, elektrisite ak nosyon fizik modèn",
    color: "secondary"
  },
  {
    icon: FlaskConical,
    name: language === 'fr' ? "Chimie" : "Chimi",
    section: "SMP",
    description: language === 'fr'
      ? "Structure de la matière, réactions chimiques, stœchiométrie et équilibres"
      : "Estrikti matyè, reyaksyon chimik, stœkiometri ak ekilib",
    color: "success"
  },
  {
    icon: Atom,
    name: language === 'fr' ? "Informatique" : "Enfòmatik",
    section: "SMP",
    description: language === 'fr'
      ? "Logique algorithmique, bases de données, culture numérique appliquée aux sciences"
      : "Lojik algoritmik, baz done, kilti nimerik aplike nan syans yo",
    color: "primary"
  },
  {
    icon: FlaskConical,
    name: language === 'fr' ? "Biologie" : "Byoloji",
    section: "SVT",
    description: language === 'fr'
      ? "Biologie cellulaire, génétique, écologie et physiologie humaine"
      : "Byoloji selilè, jenetik, ekoloji ak fizyoloji imen",
    color: "success"
  },
  {
    icon: Globe,
    name: language === 'fr' ? "Sciences de la Terre" : "Syans Latè",
    section: "SVT", 
    description: language === 'fr'
      ? "Géologie, climatologie et sciences de l'environnement"
      : "Jeyoloji, klimatoloji ak syans anviwònman",
    color: "primary"
  },
  {
    icon: BarChart3,
    name: language === 'fr' ? "Économie" : "Ekonomi",
    section: "SES",
    description: language === 'fr'
      ? "Microéconomie, macroéconomie et analyse des marchés"
      : "Mikwoekonomi, makwoekonomi ak analiz mache yo",
    color: "secondary"
  },
  {
    icon: Users,
    name: language === 'fr' ? "Sociologie" : "Sosyoloji",
    section: "SES",
    description: language === 'fr'
      ? "Structures sociales, institutions, méthodes et enjeux contemporains"
      : "Estrikti sosyal, enstitisyon, metòd ak enje kontanporen",
    color: "success"
  },
  {
    icon: Languages,
    name: language === 'fr' ? "Littérature" : "Literati",
    section: "LLA",
    description: language === 'fr'
      ? "Analyse de textes, dissertation, commentaire et maîtrise de la langue"
      : "Analiz tèks, disètasyon, kòmantè ak matrise lang",
    color: "primary"
  },
  {
    icon: Book,
    name: language === 'fr' ? "Philosophie" : "Filozofi",
    section: "LLA",
    description: language === 'fr'
      ? "Esprit critique, éthique, logique et histoire des idées"
      : "Lespri kritik, etik, lojik ak istwa lide yo",
    color: "secondary"
  },
  {
    icon: Languages,
    name: language === 'fr' ? "Langues Vivantes" : "Lang Vivant",
    section: "LLA",
    description: language === 'fr'
      ? "Français, Anglais, Espagnol : expression orale et écrite, littérature et culture"
      : "Franse, Angle, Panyòl : ekspresyon oral ak ekri, literati ak kilti",
    color: "success"
  }
];

const getNinthGradeSubjects = (language: 'fr' | 'ht') => [
  {
    icon: Calculator,
    name: language === 'fr' ? "Mathématiques" : "Matematik",
    description: language === 'fr'
      ? "Algèbre, géométrie, calculs et initiation au raisonnement logique"
      : "Aljèb, jewometri, kalkil ak inisyasyon nan rezonman lojik",
    color: "primary"
  },
  {
    icon: FlaskConical,
    name: language === 'fr' ? "Sciences Physiques" : "Syans Fizik",
    description: language === 'fr'
      ? "Notions de physique et de chimie, expériences et méthode scientifique"
      : "Nosyon fizik ak chimi, eksperyans ak metòd syantifik",
    color: "secondary"
  },
  {
    icon: Languages,
    name: language === 'fr' ? "Français" : "Franse",
    description: language === 'fr'
      ? "Grammaire, orthographe, lecture analytique et expression écrite"
      : "Gramè, òtograf, lekti analitik ak ekspresyon ekri",
    color: "success"
  },
  {
    icon: Globe,
    name: language === 'fr' ? "Histoire & Géographie" : "Istwa & Jewografi",
    description: language === 'fr'
      ? "Histoire mondiale, géographie régionale et éducation civique"
      : "Istwa mondyal, jewografi rejyonal ak edikasyon sivil",
    color: "primary"
  },
  {
    icon: Languages,
    name: language === 'fr' ? "Anglais" : "Angle",
    description: language === 'fr'
      ? "Compréhension, vocabulaire, communication orale et écrite"
      : "Konpreyansyon, vokabilè, kominikasyon oral ak ekri",
    color: "secondary"
  },
  {
    icon: Languages,
    name: language === 'fr' ? "Espagnol" : "Panyòl",
    description: language === 'fr'
      ? "Bases grammaticales, compréhension et expression, culture hispanique"
      : "Baz gramatikal, konpreyansyon ak ekspresyon, kilti ispanik",
    color: "primary"
  },
  {
    icon: Atom,
    name: language === 'fr' ? "Informatique" : "Enfòmatik",
    description: language === 'fr'
      ? "Culture numérique, bureautique, pensée algorithmique et sécurité"
      : "Kilti nimerik, byewotik, panse algoritmik ak sekirite",
    color: "success"
  },
  {
    icon: Users,
    name: language === 'fr' ? "Éducation Civique" : "Edikasyon Sivil",
    description: language === 'fr'
      ? "Citoyenneté, institutions, droits et devoirs"
      : "Sitwayènte, enstitisyon, dwa ak devwa",
    color: "secondary"
  }
];

const getIconColor = (color: string) => {
  switch(color) {
    case 'primary': return 'text-primary';
    case 'secondary': return 'text-secondary';
    case 'success': return 'text-success';
    default: return 'text-primary';
  }
};

const SubjectsSection = () => {
  const { language, t } = useLanguage();
  
  const finalYearSubjects = getFinalYearSubjects(language);
  const ninthGradeSubjects = getNinthGradeSubjects(language);
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            {t.home?.subjects?.title || (language === 'fr' ? 'Couverture Complète des Disciplines' : 'Kouvèti Konplè Disiplin yo')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0">
            {t.home?.subjects?.subtitle || (language === 'fr' 
              ? 'Contenus adaptés pour les filières de Terminale (SMP, SVT, SES, LLA) et la 9ème fondamentale'
              : 'Kontni adapte pou filye Tèminal (SMP, SVT, SES, LLA) ak 9yèm fondamantal')}
          </p>
        </div>

        {/* Final Year Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              {t.home?.subjects?.finalYearTitle || (language === 'fr' ? 'Terminale — Filières' : 'Tèminal — Filye')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              {t.home?.subjects?.finalYearSubtitle || (language === 'fr' ? 'Choisissez votre spécialisation : SMP, SVT, SES ou LLA' : 'Chwazi espesyalizasyon ou : SMP, SVT, SES oswa LLA')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {finalYearSubjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={index}
                  className="group p-4 sm:p-6 bg-gradient-card shadow-soft rounded-xl border border-border hover:shadow-primary transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-${subject.color}/10 group-hover:shadow-glow transition-all duration-300`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor(subject.color)}`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${subject.color}/10 ${getIconColor(subject.color)}`}>
                      {subject.section}
                    </span>
                  </div>
                  
                  <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                    {subject.name}
                  </h4>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 9th Grade Section */}
        <div>
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              {t.home?.subjects?.ninthGradeTitle || (language === 'fr' ? '9ème — Classe Fondamentale' : '9yèm — Klas Fondamantal')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              {t.home?.subjects?.ninthGradeSubtitle || (language === 'fr' ? 'Matières essentielles pour construire des bases académiques solides' : 'Matyè esansyèl pou konstwi baz akademik solid')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {ninthGradeSubjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={index}
                  className="group p-4 sm:p-6 bg-gradient-card shadow-soft rounded-xl border border-border hover:shadow-primary transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2"
                >
                  <div className="mb-3 sm:mb-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-${subject.color}/10 group-hover:shadow-glow transition-all duration-300`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor(subject.color)}`} />
                    </div>
                  </div>
                  
                  <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                    {subject.name}
                  </h4>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-gradient-hero rounded-2xl p-6 sm:p-8 md:p-12 border border-border">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              {t.home?.subjects?.ctaTitle || (language === 'fr' ? 'Prêt(e) à Commencer ?' : 'Ou pare pou Kòmanse ?')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-0">
              {t.home?.subjects?.ctaSubtitle || (language === 'fr' 
                ? "Choisissez votre niveau et préparez vos examens d'État avec nos ressources complètes."
                : "Chwazi nivo ou epi prepare egzamen Leta ou yo ak resous konplè nou yo.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button className="bg-gradient-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-primary hover:shadow-glow hover:scale-105 transition-spring text-sm sm:text-base">
                {t.home?.subjects?.ctaButton1 || (language === 'fr' ? 'Terminale' : 'Tèminal')}
              </button>
              <button className="bg-white border border-border text-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-soft hover:shadow-primary hover:scale-105 transition-spring text-sm sm:text-base">
                {t.home?.subjects?.ctaButton2 || (language === 'fr' ? '9ème' : '9yèm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;