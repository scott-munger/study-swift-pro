import { Button } from "@/components/ui/enhanced-button";
import { Play, RotateCcw, CheckCircle } from "lucide-react";
import mobileFlashcard from "@/assets/mobile-flashcard-mockup.jpg";

const FlashcardSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Smart Flashcards for
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Faster Learning
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Master your exam content with our intelligent flashcard system. 
                Adaptive learning algorithms adjust to your pace and focus on areas that need improvement.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-lg p-2 mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Adaptive Learning</h4>
                  <p className="text-muted-foreground">Cards adapt to your learning speed and knowledge gaps</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 rounded-lg p-2 mt-1">
                  <RotateCcw className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Spaced Repetition</h4>
                  <p className="text-muted-foreground">Scientifically proven method for long-term retention</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-success/10 rounded-lg p-2 mt-1">
                  <Play className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Interactive Content</h4>
                  <p className="text-muted-foreground">Rich multimedia content with images, diagrams, and videos</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 py-8">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">10,000+</div>
                <div className="text-sm text-muted-foreground">Flashcards Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary mb-1">85%</div>
                <div className="text-sm text-muted-foreground">Retention Rate</div>
              </div>
            </div>

            <Button variant="premium" size="lg">
              Try Flashcards Now
            </Button>
          </div>

          {/* Mobile Mockup */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={mobileFlashcard}
                alt="Mobile flashcard interface mockup"
                className="w-full max-w-md mx-auto rounded-2xl shadow-primary"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 left-4 bg-gradient-card shadow-soft rounded-lg p-3 border border-border animate-float">
              <div className="text-xs text-muted-foreground mb-1">Chapter Progress</div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="w-8 h-full bg-gradient-primary rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-primary">75%</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 right-4 bg-gradient-card shadow-soft rounded-lg p-3 border border-border animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="text-xs text-muted-foreground mb-1">Daily Streak</div>
              <div className="text-lg font-bold text-secondary">12 days</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashcardSection;