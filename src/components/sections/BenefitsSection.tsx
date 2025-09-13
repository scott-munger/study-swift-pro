import { CheckCircle, Clock, Target, Users, Zap, Brain } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Lightning Fast Learning",
    description: "Accelerate your study process with our optimized flashcard system and adaptive learning algorithms."
  },
  {
    icon: Target,
    title: "Targeted Exam Preparation",
    description: "Focus on exactly what you need to know for your specific exam class and subjects."
  },
  {
    icon: Brain,
    title: "Smart Progress Tracking",
    description: "Monitor your learning progress with detailed analytics and personalized recommendations."
  },
  {
    icon: Users,
    title: "Expert Tutor Network",
    description: "Connect with verified tutors who specialize in your exam subjects and learning needs."
  },
  {
    icon: Clock,
    title: "24/7 Accessibility",
    description: "Study anytime, anywhere with our mobile-optimized platform and offline capabilities."
  },
  {
    icon: CheckCircle,
    title: "Proven Success Rate",
    description: "Join thousands of students who have achieved their exam goals with our platform."
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the most efficient way to prepare for your state exams with our comprehensive digital learning environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-gradient-card shadow-soft rounded-xl border border-border hover:shadow-primary transition-all duration-300 hover:-translate-y-2"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg group-hover:shadow-glow transition-all duration-300">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Key Statistics */}
        <div className="mt-20 bg-gradient-hero rounded-2xl p-8 md:p-12 border border-border">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Platform Impact
            </h3>
            <p className="text-muted-foreground">
              Real results from students who transformed their exam preparation
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                75%
              </div>
              <div className="text-sm text-muted-foreground">Average Score Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                50%
              </div>
              <div className="text-sm text-muted-foreground">Faster Learning Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                90%
              </div>
              <div className="text-sm text-muted-foreground">Student Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">Platform Availability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;