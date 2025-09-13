import { Button } from "@/components/ui/enhanced-button";
import { ArrowRight, BookOpen, Users, Trophy } from "lucide-react";
import studentsBanner from "@/assets/students-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src={studentsBanner} 
          alt="Students studying with digital materials"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-foreground mb-8">
            <Trophy className="h-4 w-4 text-primary" />
            Excellence in Exam Preparation
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            Your Success
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              One Click Away
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Master your final year and 9th grade exams with our comprehensive digital platform. 
            Flashcards, exercises, and expert tutors - all in one place.
          </p>

          {/* Slogan Boxes */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <div className="bg-gradient-card shadow-soft rounded-lg px-6 py-3 border border-border">
              <span className="text-sm font-medium text-primary">⚡ More Efficient</span>
            </div>
            <div className="bg-gradient-card shadow-soft rounded-lg px-6 py-3 border border-border">
              <span className="text-sm font-medium text-secondary">📚 Your Revision in One Click</span>
            </div>
            <div className="bg-gradient-card shadow-soft rounded-lg px-6 py-3 border border-border">
              <span className="text-sm font-medium text-success">🎯 Targeted Exam Prep</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="hero" size="xl" className="group">
              Start Learning Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl">
              <Users className="mr-2 h-5 w-5" />
              Find a Tutor
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">500+</div>
              <div className="text-muted-foreground">Expert Tutors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">95%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="bg-gradient-card shadow-soft rounded-lg p-4 border border-border">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-40 right-10 animate-float" style={{ animationDelay: '1s' }}>
        <div className="bg-gradient-card shadow-soft rounded-lg p-4 border border-border">
          <Trophy className="h-8 w-8 text-secondary" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;