import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, MessageCircle, BookOpen, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Tutors = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const tutors = [
    {
      id: 1,
      name: "Prof. Amadou Ba",
      subjects: ["Mathematics", "Physics"],
      rating: 4.8,
      reviews: 124,
      location: "Dakar",
      experience: "10+ years",
      price: "15,000 CFA/hour",
      avatar: "/placeholder.svg",
      verified: true,
      description: "Experienced mathematics and physics teacher with over 10 years of teaching experience. Specializes in Final Year preparation."
    },
    {
      id: 2,
      name: "Dr. Fatou Ndiaye",
      subjects: ["Chemistry", "Biology"],
      rating: 4.9,
      reviews: 89,
      location: "Thiès",
      experience: "8 years",
      price: "12,000 CFA/hour",
      avatar: "/placeholder.svg",
      verified: true,
      description: "Chemistry and Biology expert with a PhD in Biochemistry. Excellent track record with students preparing for state exams."
    },
    {
      id: 3,
      name: "M. Ousmane Fall",
      subjects: ["English", "French"],
      rating: 4.7,
      reviews: 156,
      location: "Saint-Louis",
      experience: "12 years",
      price: "10,000 CFA/hour",
      avatar: "/placeholder.svg",
      verified: true,
      description: "Bilingual language teacher specializing in English and French literature. Helps students with both written and oral exams."
    }
  ];

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "French", "History", "Geography"];
  const departments = ["Dakar", "Thiès", "Saint-Louis", "Diourbel", "Kaolack", "Ziguinchor"];

  const handleContactTutor = (tutorName: string) => {
    toast({
      title: "Contact feature requires Supabase",
      description: "Connect to Supabase to enable messaging functionality",
    });
  };

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !selectedSubject || tutor.subjects.includes(selectedSubject);
    const matchesDepartment = !selectedDepartment || tutor.location === selectedDepartment;
    
    return matchesSearch && matchesSubject && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your <span className="bg-gradient-primary bg-clip-text text-transparent">Perfect Tutor</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with experienced tutors to boost your exam preparation
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-gradient-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </Card>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map(tutor => (
            <Card key={tutor.id} className="p-6 bg-gradient-card border-border hover-scale">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={tutor.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {tutor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{tutor.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {tutor.location}
                    </div>
                  </div>
                </div>
                {tutor.verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap gap-1">
                  {tutor.subjects.map(subject => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{tutor.rating}</span>
                    <span className="text-muted-foreground">({tutor.reviews} reviews)</span>
                  </div>
                  <span className="text-muted-foreground">{tutor.experience}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tutor.description}
                </p>

                <div className="text-lg font-semibold text-primary">
                  {tutor.price}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleContactTutor(tutor.name)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button 
                  variant="premium" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleContactTutor(tutor.name)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Book Session
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <Card className="p-8 text-center bg-gradient-card border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tutors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available tutors.
            </p>
          </Card>
        )}

        {/* Become a Tutor CTA */}
        <Card className="mt-12 p-8 text-center bg-gradient-primary/10 border-primary/20">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Are you a qualified teacher?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join our platform as a tutor and help students achieve their academic goals while earning extra income.
          </p>
          <Button variant="premium" size="lg" onClick={() => handleContactTutor("Registration")}>
            Become a Tutor
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Tutors;