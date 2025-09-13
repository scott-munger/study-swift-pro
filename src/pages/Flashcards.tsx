import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Trophy, RotateCcw, ChevronRight, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Flashcards = () => {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  const subjects = {
    mathematics: {
      name: "Mathematics",
      chapters: ["Algebra", "Geometry", "Calculus", "Statistics"],
      color: "text-primary"
    },
    physics: {
      name: "Physics",
      chapters: ["Mechanics", "Thermodynamics", "Electricity", "Optics"],
      color: "text-secondary"
    },
    chemistry: {
      name: "Chemistry",
      chapters: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
      color: "text-accent"
    },
    english: {
      name: "English",
      chapters: ["Grammar", "Literature", "Writing", "Reading Comprehension"],
      color: "text-success"
    }
  };

  const handleStartFlashcards = () => {
    toast({
      title: "Flashcard system requires Supabase",
      description: "Connect to Supabase to store and retrieve flashcard data",
    });
  };

  const handleStartExam = () => {
    toast({
      title: "Exam system requires Supabase",
      description: "Connect to Supabase to enable exam functionality",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Study with <span className="bg-gradient-primary bg-clip-text text-transparent">Flashcards</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Master your subjects with our adaptive flashcard system
          </p>
        </div>

        {/* Subject Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Select Subject</h3>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your subject" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(subjects).map(([key, subject]) => (
                  <SelectItem key={key} value={key}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {selectedSubject && (
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Select Chapter</h3>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose chapter" />
                </SelectTrigger>
                <SelectContent>
                  {subjects[selectedSubject as keyof typeof subjects].chapters.map((chapter) => (
                    <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}
        </div>

        {/* Study Options */}
        {selectedSubject && selectedChapter && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-card border-border hover-scale cursor-pointer" onClick={handleStartFlashcards}>
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
                <Badge variant="secondary">Available</Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Flashcard Study</h3>
              <p className="text-muted-foreground mb-4">Practice with adaptive flashcards</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">45 cards</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border hover-scale cursor-pointer" onClick={handleStartFlashcards}>
              <div className="flex items-center justify-between mb-4">
                <RotateCcw className="w-8 h-8 text-secondary" />
                <Badge variant="outline">Spaced Rep.</Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Review Mode</h3>
              <p className="text-muted-foreground mb-4">Review cards you've studied</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">12 due</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border hover-scale cursor-pointer" onClick={handleStartExam}>
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-accent" />
                <Badge variant="outline">Exam</Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Chapter Test</h3>
              <p className="text-muted-foreground mb-4">Test your knowledge</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Min. 70%</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}

        {/* Progress Overview */}
        <Card className="p-6 bg-gradient-card border-border">
          <h3 className="text-xl font-semibold text-foreground mb-6">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(subjects).map(([key, subject]) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className={`font-medium ${subject.color}`}>{subject.name}</h4>
                  <span className="text-sm text-muted-foreground">3/4 chapters</span>
                </div>
                <Progress value={75} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>156 cards</span>
                  <span>85% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="p-4 bg-gradient-card border-border text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">2h 35m</p>
            <p className="text-xs text-muted-foreground">Study time today</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-border text-center">
            <BookOpen className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">247</p>
            <p className="text-xs text-muted-foreground">Cards reviewed</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-border text-center">
            <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-border text-center">
            <RotateCcw className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">87%</p>
            <p className="text-xs text-muted-foreground">Accuracy rate</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;