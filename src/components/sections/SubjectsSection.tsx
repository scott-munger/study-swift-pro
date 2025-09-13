import { Book, FlaskConical, BarChart3, Languages, Calculator, Globe, Atom, Users } from "lucide-react";

const finalYearSubjects = [
  {
    icon: Calculator,
    name: "Mathematics",
    section: "SMP",
    description: "Advanced algebra, calculus, and statistical analysis for scientific preparation",
    color: "primary"
  },
  {
    icon: Atom,
    name: "Physics",
    section: "SMP",
    description: "Mechanics, thermodynamics, and quantum physics fundamentals",
    color: "secondary"
  },
  {
    icon: FlaskConical,
    name: "Biology",
    section: "SVT",
    description: "Cell biology, genetics, ecology, and human physiology",
    color: "success"
  },
  {
    icon: Globe,
    name: "Earth Sciences",
    section: "SVT", 
    description: "Geology, climatology, and environmental science concepts",
    color: "primary"
  },
  {
    icon: BarChart3,
    name: "Economics",
    section: "SES",
    description: "Microeconomics, macroeconomics, and social analysis",
    color: "secondary"
  },
  {
    icon: Users,
    name: "Sociology",
    section: "SES",
    description: "Social structures, institutions, and contemporary issues",
    color: "success"
  },
  {
    icon: Languages,
    name: "Literature",
    section: "LLA",
    description: "Literary analysis, composition, and language mastery",
    color: "primary"
  },
  {
    icon: Book,
    name: "Philosophy",
    section: "LLA",
    description: "Critical thinking, ethics, and philosophical reasoning",
    color: "secondary"
  }
];

const ninthGradeSubjects = [
  {
    icon: Calculator,
    name: "Mathematics",
    description: "Fundamental algebra, geometry, and problem-solving skills",
    color: "primary"
  },
  {
    icon: FlaskConical,
    name: "Physical Sciences",
    description: "Basic physics and chemistry principles and experiments",
    color: "secondary"
  },
  {
    icon: Languages,
    name: "French Language",
    description: "Grammar, literature, and written expression skills",
    color: "success"
  },
  {
    icon: Globe,
    name: "History & Geography",
    description: "World history, regional geography, and civic education",
    color: "primary"
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
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Comprehensive Subject Coverage
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tailored content for both final year specializations and 9th grade fundamentals
          </p>
        </div>

        {/* Final Year Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Final Year Programs
            </h3>
            <p className="text-muted-foreground">
              Choose your specialization: SMP, SVT, SES, or LLA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {finalYearSubjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-gradient-card shadow-soft rounded-xl border border-border hover:shadow-primary transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${subject.color}/10 group-hover:shadow-glow transition-all duration-300`}>
                      <Icon className={`h-6 w-6 ${getIconColor(subject.color)}`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${subject.color}/10 ${getIconColor(subject.color)}`}>
                      {subject.section}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-foreground mb-3">
                    {subject.name}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 9th Grade Section */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              9th Grade Fundamental Class
            </h3>
            <p className="text-muted-foreground">
              Essential subjects for building strong academic foundations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ninthGradeSubjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-gradient-card shadow-soft rounded-xl border border-border hover:shadow-primary transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${subject.color}/10 group-hover:shadow-glow transition-all duration-300`}>
                      <Icon className={`h-6 w-6 ${getIconColor(subject.color)}`} />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-foreground mb-3">
                    {subject.name}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 border border-border">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Select your class level and begin preparing for your state exams with our comprehensive study materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-primary text-white px-8 py-3 rounded-lg font-semibold shadow-primary hover:shadow-glow hover:scale-105 transition-spring">
                Choose Final Year
              </button>
              <button className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold shadow-soft hover:shadow-primary hover:scale-105 transition-spring">
                Choose 9th Grade
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;