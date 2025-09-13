import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, MessageSquare, Settings, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { toast } = useToast();

  const handleAdminAction = (action: string) => {
    toast({
      title: `${action} requires Supabase`,
      description: "Connect to Supabase to enable admin functionality and database operations",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Admin <span className="bg-gradient-primary bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your educational platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-primary">1,247</p>
                <p className="text-xs text-success">+12% this month</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tutors</p>
                <p className="text-2xl font-bold text-secondary">89</p>
                <p className="text-xs text-success">+5% this month</p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flashcards</p>
                <p className="text-2xl font-bold text-accent">15,432</p>
                <p className="text-xs text-success">+248 this week</p>
              </div>
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
                <p className="text-2xl font-bold text-success">3,891</p>
                <p className="text-xs text-success">+45 today</p>
              </div>
              <MessageSquare className="w-8 h-8 text-success" />
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="bg-gradient-card border-border">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Student Management</h3>
                  <Button onClick={() => handleAdminAction("Add Student")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">John Doe</TableCell>
                      <TableCell>Final Year - SMP</TableCell>
                      <TableCell>Dakar</TableCell>
                      <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("View Student")}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Student")}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Delete Student")}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Marie Diop</TableCell>
                      <TableCell>9th Grade</TableCell>
                      <TableCell>Thiès</TableCell>
                      <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("View Student")}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Student")}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Delete Student")}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Tutors Tab */}
          <TabsContent value="tutors">
            <Card className="bg-gradient-card border-border">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Tutor Management</h3>
                  <Button onClick={() => handleAdminAction("Verify Tutor")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Verify Tutor
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Prof. Amadou Ba</TableCell>
                      <TableCell>Mathematics, Physics</TableCell>
                      <TableCell>4.8/5</TableCell>
                      <TableCell><Badge variant="secondary">Verified</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("View Tutor")}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Tutor")}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Dr. Fatou Ndiaye</TableCell>
                      <TableCell>Chemistry, Biology</TableCell>
                      <TableCell>4.9/5</TableCell>
                      <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("View Tutor")}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdminAction("Approve Tutor")}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card className="bg-gradient-card border-border">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Content Management</h3>
                  <Button onClick={() => handleAdminAction("Add Content")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4 bg-muted/20">
                    <h4 className="font-medium text-foreground mb-2">Mathematics Flashcards</h4>
                    <p className="text-sm text-muted-foreground mb-3">2,450 cards • 4 chapters</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Flashcards")}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Add Flashcards")}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-4 bg-muted/20">
                    <h4 className="font-medium text-foreground mb-2">Physics Exercises</h4>
                    <p className="text-sm text-muted-foreground mb-3">1,890 exercises • 4 chapters</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Exercises")}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Add Exercises")}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-4 bg-muted/20">
                    <h4 className="font-medium text-foreground mb-2">Past Exams</h4>
                    <p className="text-sm text-muted-foreground mb-3">156 exams • All subjects</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Edit Exams")}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAdminAction("Add Exams")}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card className="bg-gradient-card border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Email Configuration</h4>
                    <p className="text-sm text-muted-foreground">Configure SMTP settings for notifications</p>
                  </div>
                  <Button variant="outline" onClick={() => handleAdminAction("Configure Email")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Mistral AI Integration</h4>
                    <p className="text-sm text-muted-foreground">Configure AI chatbot settings</p>
                  </div>
                  <Button variant="outline" onClick={() => handleAdminAction("Configure AI")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Platform Settings</h4>
                    <p className="text-sm text-muted-foreground">General platform configuration</p>
                  </div>
                  <Button variant="outline" onClick={() => handleAdminAction("Platform Settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;