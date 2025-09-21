import { Book, FlaskConical, BarChart3, Languages, Calculator, Globe, Atom, Users } from "lucide-react";

const finalYearSubjects = [
  {
    icon: Calculator,
    name: "Mathématiques",
    section: "SMP",
    description: "Algèbre avancée, calcul différentiel et intégral, probabilités et statistiques",
    color: "primary"
  },
  {
    icon: Atom,
    name: "Physique",
    section: "SMP",
    description: "Mécanique, thermodynamique, électricité et notions de physique moderne",
    color: "secondary"
  },
  {
    icon: FlaskConical,
    name: "Chimie",
    section: "SMP",
    description: "Structure de la matière, réactions chimiques, stœchiométrie et équilibres",
    color: "success"
  },
  {
    icon: Atom,
    name: "Informatique",
    section: "SMP",
    description: "Logique algorithmique, bases de données, culture numérique appliquée aux sciences",
    color: "primary"
  },
  {
    icon: FlaskConical,
    name: "Biologie",
    section: "SVT",
    description: "Biologie cellulaire, génétique, écologie et physiologie humaine",
    color: "success"
  },
  {
    icon: Globe,
    name: "Sciences de la Terre",
    section: "SVT", 
    description: "Géologie, climatologie et sciences de l'environnement",
    color: "primary"
  },
  {
    icon: BarChart3,
    name: "Économie",
    section: "SES",
    description: "Microéconomie, macroéconomie et analyse des marchés",
    color: "secondary"
  },
  {
    icon: Users,
    name: "Sociologie",
    section: "SES",
    description: "Structures sociales, institutions, méthodes et enjeux contemporains",
    color: "success"
  },
  {
    icon: Languages,
    name: "Littérature",
    section: "LLA",
    description: "Analyse de textes, dissertation, commentaire et maîtrise de la langue",
    color: "primary"
  },
  {
    icon: Book,
    name: "Philosophie",
    section: "LLA",
    description: "Esprit critique, éthique, logique et histoire des idées",
    color: "secondary"
  },
  {
    icon: Languages,
    name: "Langues Vivantes",
    section: "LLA",
    description: "Français, Anglais, Espagnol : expression orale et écrite, littérature et culture",
    color: "success"
  }
];

const ninthGradeSubjects = [
  {
    icon: Calculator,
    name: "Mathématiques",
    description: "Algèbre, géométrie, calculs et initiation au raisonnement logique",
    color: "primary"
  },
  {
    icon: FlaskConical,
    name: "Sciences Physiques",
    description: "Notions de physique et de chimie, expériences et méthode scientifique",
    color: "secondary"
  },
  {
    icon: Languages,
    name: "Français",
    description: "Grammaire, orthographe, lecture analytique et expression écrite",
    color: "success"
  },
  {
    icon: Globe,
    name: "Histoire & Géographie",
    description: "Histoire mondiale, géographie régionale et éducation civique",
    color: "primary"
  },
  {
    icon: Languages,
    name: "Anglais",
    description: "Compréhension, vocabulaire, communication orale et écrite",
    color: "secondary"
  },
  {
    icon: Languages,
    name: "Espagnol",
    description: "Bases grammaticales, compréhension et expression, culture hispanique",
    color: "primary"
  },
  {
    icon: Atom,
    name: "Informatique",
    description: "Culture numérique, bureautique, pensée algorithmique et sécurité",
    color: "success"
  },
  {
    icon: Users,
    name: "Éducation Civique",
    description: "Citoyenneté, institutions, droits et devoirs",
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
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Couverture Complète des Disciplines
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0">
            Contenus adaptés pour les filières de Terminale (SMP, SVT, SES, LLA) et la 9ème fondamentale
          </p>
        </div>

        {/* Final Year Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Terminale — Filières
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              Choisissez votre spécialisation : SMP, SVT, SES ou LLA
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
              9ème — Classe Fondamentale
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              Matières essentielles pour construire des bases académiques solides
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
              Prêt(e) à Commencer ?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-0">
              Choisissez votre niveau et préparez vos examens d'État avec nos ressources complètes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button className="bg-gradient-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-primary hover:shadow-glow hover:scale-105 transition-spring text-sm sm:text-base">
                Terminale
              </button>
              <button className="bg-white border border-border text-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-soft hover:shadow-primary hover:scale-105 transition-spring text-sm sm:text-base">
                9ème
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;