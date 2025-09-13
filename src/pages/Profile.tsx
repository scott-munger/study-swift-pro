import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Trophy, Clock, Target, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logout functionality requires Supabase",
      description: "Connect to Supabase to enable authentication",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gradient-card border-border">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">JS</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-foreground mb-2">John Student</h2>
                <Badge variant="secondary" className="mb-2">Final Year - SMP</Badge>
                <p className="text-muted-foreground mb-4">Dakar, Senegal</p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Study Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Mathematics</span>
                    <span className="text-primary font-medium">85%</span>
                  </div>
                  <Progress value={85} className="mb-4" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Physics</span>
                    <span className="text-primary font-medium">72%</span>
                  </div>
                  <Progress value={72} className="mb-4" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Chemistry</span>
                    <span className="text-primary font-medium">68%</span>
                  </div>
                  <Progress value={68} className="mb-4" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">English</span>
                    <span className="text-primary font-medium">91%</span>
                  </div>
                  <Progress value={91} className="mb-4" />
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Flashcards Completed</p>
                    <p className="text-2xl font-bold text-primary">1,247</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-4 bg-gradient-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Study Streak</p>
                    <p className="text-2xl font-bold text-secondary">15 days</p>
                  </div>
                  <Trophy className="w-8 h-8 text-secondary" />
                </div>
              </Card>
              <Card className="p-4 bg-gradient-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                    <p className="text-2xl font-bold text-accent">42h</p>
                  </div>
                  <Clock className="w-8 h-8 text-accent" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Completed Mathematics Chapter 5</p>
                    <p className="text-sm text-muted-foreground">Score: 87% • 2 hours ago</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Physics Practice Test</p>
                    <p className="text-sm text-muted-foreground">Score: 72% • 1 day ago</p>
                  </div>
                  <Badge variant="secondary">Passed</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Chemistry Flashcards Session</p>
                    <p className="text-sm text-muted-foreground">25 cards • 2 days ago</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;