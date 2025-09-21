import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Shield,
  BookOpen,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  createdAt: string;
  updatedAt: string;
  subject: {
    id: number;
    name: string;
    level: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  _count?: {
    attempts: number;
  };
}

interface Subject {
  id: number;
  name: string;
  level: string;
}

const AdminFlashcards = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [flashcardForm, setFlashcardForm] = useState({
    question: '',
    answer: '',
    subjectId: '',
    difficulty: 'medium'
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    console.log('🔐 AdminFlashcards - Token trouvé:', savedToken ? 'Oui' : 'Non');
    console.log('🔐 AdminFlashcards - Token:', savedToken);
    
    if (savedToken) {
      setToken(savedToken);
      loadFlashcards(savedToken);
      loadSubjects(savedToken);
    } else {
      console.log('🔐 AdminFlashcards - Pas de token, redirection vers login');
      window.location.href = '/login';
    }
  }, []);

  const loadFlashcards = async (authToken: string | null = token) => {
    if (!authToken) {
      console.log('🔐 AdminFlashcards - Pas de token pour charger les flashcards');
      return;
    }
    setLoading(true);
    console.log('🔐 AdminFlashcards - Chargement des flashcards avec token:', authToken.substring(0, 50) + '...');
    
    try {
      const response = await fetch('http://localhost:8081/api/admin/flashcards', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔐 AdminFlashcards - Réponse API:', response.status, response.statusText);
      
      if (response.ok) {
        const flashcardsData = await response.json();
        console.log('🔐 AdminFlashcards - Données reçues:', flashcardsData.flashcards ? flashcardsData.flashcards.length : 0, 'flashcards');
        setFlashcards(flashcardsData.flashcards || flashcardsData);
      } else {
        const errorData = await response.json();
        console.error('🔐 AdminFlashcards - Erreur API:', errorData);
        throw new Error('Erreur lors de la récupération des flashcards');
      }
    } catch (error) {
      console.error('🔐 AdminFlashcards - Erreur lors du chargement des flashcards:', error);
      toast({ title: "Erreur", description: "Impossible de charger les flashcards", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (authToken: string | null = token) => {
    if (!authToken) return;
    try {
      const response = await fetch('http://localhost:8081/api/subjects', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const subjectsData = await response.json();
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  const handleCreateFlashcard = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/flashcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: flashcardForm.question,
          answer: flashcardForm.answer,
          subjectId: parseInt(flashcardForm.subjectId),
          difficulty: flashcardForm.difficulty
        })
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Flashcard créée avec succès" });
        setShowFlashcardModal(false);
        resetForm();
        loadFlashcards();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la création", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleUpdateFlashcard = async () => {
    if (!editingFlashcard) return;

    try {
      const response = await fetch(`http://localhost:8081/api/flashcards/${editingFlashcard.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: flashcardForm.question,
          answer: flashcardForm.answer,
          subjectId: parseInt(flashcardForm.subjectId),
          difficulty: flashcardForm.difficulty
        })
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Flashcard mise à jour avec succès" });
        setShowFlashcardModal(false);
        setEditingFlashcard(null);
        resetForm();
        loadFlashcards();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleDeleteFlashcard = async (flashcardId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette flashcard ?')) return;

    try {
      const response = await fetch(`http://localhost:8081/api/flashcards/${flashcardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Flashcard supprimée avec succès" });
        loadFlashcards();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFlashcardForm({
      question: '',
      answer: '',
      subjectId: '',
      difficulty: 'medium'
    });
  };

  const openEditModal = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setFlashcardForm({
      question: flashcard.question,
      answer: flashcard.answer,
      subjectId: flashcard.subject.id.toString(),
      difficulty: flashcard.difficulty
    });
    setShowFlashcardModal(true);
  };

  const filteredFlashcards = flashcards.filter(flashcard => {
    const matchesSearch = flashcard.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flashcard.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || flashcard.subject.id.toString() === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || flashcard.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/simple-admin/dashboard'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Flashcards</h1>
                <p className="text-gray-600">Gérez toutes les flashcards de la plateforme</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Administration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une flashcard..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par matière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les matières</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par difficulté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les difficultés</SelectItem>
                <SelectItem value="easy">Facile</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="hard">Difficile</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showFlashcardModal} onOpenChange={setShowFlashcardModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingFlashcard(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Flashcard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFlashcard ? 'Modifier la flashcard' : 'Créer une nouvelle flashcard'}
                </DialogTitle>
                <DialogDescription>
                  {editingFlashcard ? 'Modifiez les informations de la flashcard.' : 'Ajoutez une nouvelle flashcard à la plateforme.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={flashcardForm.question}
                    onChange={(e) => setFlashcardForm({...flashcardForm, question: e.target.value})}
                    placeholder="Posez votre question..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="answer">Réponse</Label>
                  <Textarea
                    id="answer"
                    value={flashcardForm.answer}
                    onChange={(e) => setFlashcardForm({...flashcardForm, answer: e.target.value})}
                    placeholder="Donnez la réponse..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Matière</Label>
                  <Select value={flashcardForm.subjectId} onValueChange={(value) => setFlashcardForm({...flashcardForm, subjectId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulté</Label>
                  <Select value={flashcardForm.difficulty} onValueChange={(value) => setFlashcardForm({...flashcardForm, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFlashcardModal(false)}>
                  Annuler
                </Button>
                <Button onClick={editingFlashcard ? handleUpdateFlashcard : handleCreateFlashcard}>
                  {editingFlashcard ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flashcards</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faciles</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.filter(f => f.difficulty === 'easy').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Moyennes</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.filter(f => f.difficulty === 'medium').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Difficiles</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.filter(f => f.difficulty === 'hard').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des flashcards */}
        <Card>
          <CardHeader>
            <CardTitle>Flashcards ({filteredFlashcards.length})</CardTitle>
            <CardDescription>
              Liste de toutes les flashcards de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des flashcards...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlashcards.map((flashcard) => (
                  <Card key={flashcard.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getDifficultyBadgeColor(flashcard.difficulty)}>
                              {getDifficultyLabel(flashcard.difficulty)}
                            </Badge>
                            <Badge variant="outline">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {flashcard.subject.name}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Question</h4>
                              <p className="text-gray-700">{flashcard.question}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Réponse</h4>
                              <p className="text-gray-700">{flashcard.answer}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {flashcard.user.firstName} {flashcard.user.lastName}
                              </div>
                              <div>
                                Créée le {new Date(flashcard.createdAt).toLocaleDateString()}
                              </div>
                              {flashcard._count?.attempts && (
                                <div>
                                  {flashcard._count.attempts} tentatives
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(flashcard)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFlashcard(flashcard.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminFlashcards;


