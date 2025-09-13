import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Search, Plus, ThumbsUp, Clock, Pin, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Forum = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const forumPosts = [
    {
      id: 1,
      title: "Help with Calculus Integration",
      content: "I'm struggling with integration by parts. Can someone explain the method step by step?",
      author: "Marie Diop",
      authorType: "student",
      subject: "Mathematics",
      replies: 12,
      likes: 8,
      createdAt: "2 hours ago",
      isPinned: false,
      isTrending: true
    },
    {
      id: 2,
      title: "Chemistry Lab Safety - Important Reminders",
      content: "As we prepare for practical exams, let's review essential lab safety procedures...",
      author: "Prof. Amadou Ba",
      authorType: "tutor",
      subject: "Chemistry",
      replies: 25,
      likes: 34,
      createdAt: "1 day ago",
      isPinned: true,
      isTrending: false
    },
    {
      id: 3,
      title: "Study Group for Physics - Electricity Chapter",
      content: "Looking for serious students to form a study group for electricity and magnetism...",
      author: "Ousmane Fall",
      authorType: "student",
      subject: "Physics",
      replies: 7,
      likes: 15,
      createdAt: "3 days ago",
      isPinned: false,
      isTrending: true
    }
  ];

  const subjects = ["All", "Mathematics", "Physics", "Chemistry", "Biology", "English", "French"];
  const [selectedSubject, setSelectedSubject] = useState("All");

  const handleCreatePost = () => {
    toast({
      title: "Forum functionality requires Supabase",
      description: "Connect to Supabase to enable forum posts and discussions",
    });
  };

  const handleJoinDiscussion = (postTitle: string) => {
    toast({
      title: "Discussion feature requires Supabase",
      description: "Connect to Supabase to enable forum interactions",
    });
  };

  const filteredPosts = forumPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "All" || post.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Student <span className="bg-gradient-primary bg-clip-text text-transparent">Forum</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with peers and tutors, share knowledge, and get help
          </p>
        </div>

        {/* Forum Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold text-primary">2,847</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-secondary">1,234</p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Posts</p>
                <p className="text-2xl font-bold text-accent">45</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-success">156</p>
              </div>
              <Users className="w-8 h-8 text-success" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Forum Content */}
          <div className="lg:col-span-3">
            {/* Search and Create Post */}
            <Card className="p-6 mb-6 bg-gradient-card border-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleCreatePost} className="sm:w-auto w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </Card>

            {/* Subject Tabs */}
            <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7">
                {subjects.map(subject => (
                  <TabsTrigger key={subject} value={subject} className="text-xs">
                    {subject}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedSubject} className="space-y-4">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="p-6 bg-gradient-card border-border hover-scale cursor-pointer" onClick={() => handleJoinDiscussion(post.title)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{post.title}</h3>
                            {post.isPinned && <Pin className="w-4 h-4 text-primary" />}
                            {post.isTrending && <TrendingUp className="w-4 h-4 text-secondary" />}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>by {post.author}</span>
                            <Badge variant={post.authorType === "tutor" ? "secondary" : "outline"} className="text-xs">
                              {post.authorType === "tutor" ? "Tutor" : "Student"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {post.subject}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.createdAt}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.replies} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.likes} likes</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleJoinDiscussion(post.title);
                      }}>
                        Join Discussion
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleCreatePost}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ask a Question
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleCreatePost}>
                  <Users className="w-4 h-4 mr-2" />
                  Create Study Group
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleCreatePost}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Share Resources
                </Button>
              </div>
            </Card>

            {/* Popular Topics */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Trending Topics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Final Year Preparation</span>
                  <Badge variant="secondary">124</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Math Problem Solving</span>
                  <Badge variant="secondary">89</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Study Tips</span>
                  <Badge variant="secondary">67</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Exam Strategies</span>
                  <Badge variant="secondary">45</Badge>
                </div>
              </div>
            </Card>

            {/* Online Users */}
            <Card className="p-4 bg-gradient-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Who's Online</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">MD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Marie Diop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">AB</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Prof. Ba</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">OF</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Ousmane F.</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All (156 online)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;