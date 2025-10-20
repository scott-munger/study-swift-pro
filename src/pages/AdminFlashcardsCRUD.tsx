import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  subject: {
    id: number;
    name: string;
    level: string;
    section?: string;
  };
  difficulty: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  id: number;
  name: string;
  level: string;
  section?: string;
}

const AdminFlashcardsCRUD: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // États
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    subjectId: '',
    difficulty: 'MEDIUM',
    tags: ''
  });

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Charger les flashcards
      const flashcardsResponse = await fetch('http://localhost:8081/api/admin/flashcards', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Charger les matières
      const subjectsResponse = await fetch('http://localhost:8081/api/admin/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (flashcardsResponse.ok && subjectsResponse.ok) {
        const flashcardsData = await flashcardsResponse.json();
        const subjectsData = await subjectsResponse.json();
        
        setFlashcards(flashcardsData.flashcards || flashcardsData);
        setSubjects(subjectsData.subjects || subjectsData);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les flashcards
  const filteredFlashcards = flashcards.filter(flashcard => {
    const matchesSearch = flashcard.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flashcard.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (flashcard.tags && flashcard.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = filterSubject === 'all' || flashcard.subject.id.toString() === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || flashcard.difficulty === filterDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  // Gestion des flashcards
  const handleCreateFlashcard = async () => {
    if (!formData.front || !formData.back || !formData.subjectId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/flashcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard créée avec succès"
        });
        setShowCreateModal(false);
        setFormData({ front: '', back: '', subjectId: '', difficulty: 'MEDIUM', tags: '' });
        loadData();
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleEditFlashcard = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setFormData({
      front: flashcard.front,
      back: flashcard.back,
      subjectId: flashcard.subject.id.toString(),
      difficulty: flashcard.difficulty,
      tags: flashcard.tags || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateFlashcard = async () => {
    if (!selectedFlashcard || !formData.front || !formData.back || !formData.subjectId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/flashcards/${selectedFlashcard.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard modifiée avec succès"
        });
        setShowEditModal(false);
        setSelectedFlashcard(null);
        loadData();
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la modification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFlashcard = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette flashcard ?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/flashcards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard supprimée avec succès"
        });
        loadData();
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleViewFlashcard = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setShowViewModal(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HARD': return 'destructive';
      default: return 'outline';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Facile';
      case 'MEDIUM': return 'Moyen';
      case 'HARD': return 'Difficile';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard-modern')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Flashcards</h1>
            <p className="text-gray-600">Créez et gérez vos flashcards de manière dynamique</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Flashcard
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Rechercher dans les flashcards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subjectFilter">Matière</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les matières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name} - {subject.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficultyFilter">Difficulté</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les difficultés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les difficultés</SelectItem>
                  <SelectItem value="EASY">Facile</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HARD">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterSubject('all');
                  setFilterDifficulty('all');
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des flashcards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Flashcards ({filteredFlashcards.length})</span>
            <Badge variant="outline">
              {flashcards.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFlashcards.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune flashcard trouvée</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all' 
                  ? 'Aucune flashcard ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première flashcard.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une flashcard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlashcards.map(flashcard => (
                <Card key={flashcard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {flashcard.front}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {flashcard.subject.name} - {flashcard.subject.level}
                        </CardDescription>
                      </div>
                      <Badge variant={getDifficultyColor(flashcard.difficulty)}>
                        {getDifficultyLabel(flashcard.difficulty)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {flashcard.back}
                    </p>
                    {flashcard.tags && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {flashcard.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewFlashcard(flashcard)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditFlashcard(flashcard)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteFlashcard(flashcard.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Créer Flashcard */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle flashcard</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle flashcard à votre collection
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="front">Question/Face avant *</Label>
              <Textarea
                id="front"
                value={formData.front}
                onChange={(e) => setFormData({...formData, front: e.target.value})}
                rows={3}
                placeholder="Entrez la question ou le concept..."
              />
            </div>
            
            <div>
              <Label htmlFor="back">Réponse/Face arrière *</Label>
              <Textarea
                id="back"
                value={formData.back}
                onChange={(e) => setFormData({...formData, back: e.target.value})}
                rows={3}
                placeholder="Entrez la réponse ou l'explication..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Matière *</Label>
                <Select value={formData.subjectId} onValueChange={(value) => setFormData({...formData, subjectId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} - {subject.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Facile</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HARD">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (optionnel)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="Séparés par des virgules (ex: vocabulaire, grammaire, conjugaison)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateFlashcard}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier Flashcard */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la flashcard</DialogTitle>
            <DialogDescription>
              Modifiez les informations de cette flashcard
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFront">Question/Face avant *</Label>
              <Textarea
                id="editFront"
                value={formData.front}
                onChange={(e) => setFormData({...formData, front: e.target.value})}
                rows={3}
                placeholder="Entrez la question ou le concept..."
              />
            </div>
            
            <div>
              <Label htmlFor="editBack">Réponse/Face arrière *</Label>
              <Textarea
                id="editBack"
                value={formData.back}
                onChange={(e) => setFormData({...formData, back: e.target.value})}
                rows={3}
                placeholder="Entrez la réponse ou l'explication..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSubject">Matière *</Label>
                <Select value={formData.subjectId} onValueChange={(value) => setFormData({...formData, subjectId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} - {subject.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editDifficulty">Difficulté</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Facile</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HARD">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="editTags">Tags (optionnel)</Label>
              <Input
                id="editTags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="Séparés par des virgules (ex: vocabulaire, grammaire, conjugaison)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateFlashcard}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Voir Flashcard */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la flashcard</DialogTitle>
          </DialogHeader>
          
          {selectedFlashcard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Matière</Label>
                  <p className="text-gray-700">{selectedFlashcard.subject.name} - {selectedFlashcard.subject.level}</p>
                </div>
                <div>
                  <Label className="font-semibold">Difficulté</Label>
                  <Badge variant={getDifficultyColor(selectedFlashcard.difficulty)}>
                    {getDifficultyLabel(selectedFlashcard.difficulty)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Question/Face avant</Label>
                <div className="p-4 bg-gray-50 rounded-lg mt-2">
                  <p className="text-gray-700">{selectedFlashcard.front}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Réponse/Face arrière</Label>
                <div className="p-4 bg-gray-50 rounded-lg mt-2">
                  <p className="text-gray-700">{selectedFlashcard.back}</p>
                </div>
              </div>
              
              {selectedFlashcard.tags && (
                <div>
                  <Label className="font-semibold">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFlashcard.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label className="font-semibold">Créée le</Label>
                  <p>{new Date(selectedFlashcard.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Modifiée le</Label>
                  <p>{new Date(selectedFlashcard.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFlashcardsCRUD;
