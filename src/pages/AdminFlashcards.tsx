import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useFlashcards, Flashcard } from '../contexts/FlashcardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  User,
  Upload
} from 'lucide-react';
import { importFlashcardsFromCSV, generateFlashcardImportTemplate, ImportFlashcardData, ImportError } from '../lib/csvUtils';
import { CsvImportDialog } from '../components/ui/CsvImportDialog';
// useToast et useFlashcards déjà importés plus haut

// Interface Flashcard est maintenant importée du contexte

interface Subject {
  id: number;
  name: string;
  level: string;
}

const AdminFlashcards = () => {
  console.log('🔄 AdminFlashcards - Composant rendu');
  
  // Vérification de l'authentification d'abord
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Non connecté</h1>
          <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    );
  }

  console.log('🔄 AdminFlashcards - Utilisateur connecté:', user.role);
  
  // Protection contre les erreurs de contexte
  let flashcards: Flashcard[] = [];
  let loading = false;
  let refreshFlashcards = async () => {};
  let addFlashcard = (flashcard: Flashcard) => {};
  let updateFlashcard = (flashcard: Flashcard) => {};
  let removeFlashcard = (flashcardId: number) => {};
  
  try {
    const flashcardContext = useFlashcards();
    flashcards = flashcardContext.flashcards || [];
    loading = flashcardContext.loading || false;
    refreshFlashcards = flashcardContext.refreshFlashcards || (async () => {});
    addFlashcard = flashcardContext.addFlashcard || (() => {});
    updateFlashcard = flashcardContext.updateFlashcard || (() => {});
    removeFlashcard = flashcardContext.removeFlashcard || (() => {});
    console.log('🔄 AdminFlashcards - Contexte chargé:', { flashcards: flashcards.length, loading });
  } catch (error) {
    console.error('❌ AdminFlashcards - Erreur de contexte:', error);
    // Fallback simple en cas d'erreur
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-600 mb-4">Impossible de charger les flashcards. Veuillez recharger la page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
  
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<number | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    subjectId: ''
  });
  const [flashcardForm, setFlashcardForm] = useState({
    question: '',
    answer: '',
    subjectId: '',
    chapterId: 'none',
    difficulty: 'medium'
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔐 AdminFlashcards - Token trouvé:', savedToken ? 'Oui' : 'Non');
    
    if (savedToken) {
      setToken(savedToken);
      loadSubjects(savedToken);
      loadChapters(savedToken);
      // Les flashcards sont maintenant gérées par le contexte global
    } else {
      console.log('🔐 AdminFlashcards - Pas de token, affichage sans redirection');
    }
  }, []);


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

  const loadChapters = async (authToken: string | null = token) => {
    if (!authToken) return;
    try {
      const response = await fetch('http://localhost:8081/api/chapters', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const chaptersData = await response.json();
        setChapters(chaptersData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chapitres:', error);
    }
  };

  const handleCreateFlashcard = async () => {
    try {
      // Validation des champs requis
      if (!flashcardForm.question || !flashcardForm.answer || !flashcardForm.subjectId) {
        toast({ 
          title: "Erreur", 
          description: "Veuillez remplir tous les champs requis", 
          variant: "destructive" 
        });
        return;
      }

      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

      // Validation du subjectId
      const subjectIdNum = parseInt(flashcardForm.subjectId);
      if (isNaN(subjectIdNum) || subjectIdNum <= 0) {
        toast({ 
          title: "Erreur", 
          description: "Matière invalide", 
          variant: "destructive" 
        });
        return;
      }

      const response = await fetch('http://localhost:8081/api/admin/flashcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: flashcardForm.question.trim(),
          answer: flashcardForm.answer.trim(),
          subjectId: subjectIdNum,
          chapterId: flashcardForm.chapterId && flashcardForm.chapterId !== 'none' ? parseInt(flashcardForm.chapterId) : null,
          difficulty: flashcardForm.difficulty.toUpperCase()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Flashcard créée:', result.flashcard);
        
        // Ajouter la flashcard au contexte global
        addFlashcard(result.flashcard);
        
        toast({ title: "Succès", description: "Flashcard créée avec succès" });
        setShowFlashcardModal(false);
        resetForm();
        // La flashcard est déjà ajoutée au contexte global via addFlashcard()
        // Pas besoin de recharger, le contexte se met à jour automatiquement
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        toast({ title: "Erreur", description: errorData.error || "Erreur lors de la création", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleUpdateFlashcard = async () => {
    if (!editingFlashcard) return;

    try {
      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

      // Validation des champs requis
      if (!flashcardForm.question || !flashcardForm.answer || !flashcardForm.subjectId) {
        toast({ 
          title: "Erreur", 
          description: "Veuillez remplir tous les champs requis", 
          variant: "destructive" 
        });
        return;
      }

      // Validation du subjectId
      const subjectIdNum = parseInt(flashcardForm.subjectId);
      if (isNaN(subjectIdNum) || subjectIdNum <= 0) {
        toast({ 
          title: "Erreur", 
          description: "Matière invalide", 
          variant: "destructive" 
        });
        return;
      }

      const response = await fetch(`http://localhost:8081/api/admin/flashcards/${editingFlashcard.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: flashcardForm.question.trim(),
          answer: flashcardForm.answer.trim(),
          subjectId: subjectIdNum,
          chapterId: flashcardForm.chapterId && flashcardForm.chapterId !== 'none' ? parseInt(flashcardForm.chapterId) : null,
          difficulty: flashcardForm.difficulty.toUpperCase()
        })
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Flashcard mise à jour avec succès" });
        setShowFlashcardModal(false);
        setEditingFlashcard(null);
        resetForm();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleDeleteFlashcard = (flashcardId: number) => {
    setFlashcardToDelete(flashcardId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;

    try {
      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

      const response = await fetch(`http://localhost:8081/api/admin/flashcards/${flashcardToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('🗑️ Flashcard supprimée:', flashcardToDelete);
        
        // Supprimer la flashcard du contexte global
        removeFlashcard(flashcardToDelete);
        
        toast({ title: "Succès", description: "Flashcard supprimée avec succès" });
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
      chapterId: 'none',
      difficulty: 'medium'
    });
  };

  const openEditModal = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setFlashcardForm({
      question: flashcard.question,
      answer: flashcard.answer,
      subjectId: flashcard.subject.id.toString(),
      chapterId: flashcard.chapterId ? flashcard.chapterId.toString() : 'none',
      difficulty: flashcard.difficulty
    });
    setShowFlashcardModal(true);
  };

  // Gestion des chapitres
  const handleCreateChapter = async () => {
    if (!chapterForm.title || !chapterForm.subjectId) {
      toast({ title: "Erreur", description: "Titre et matière sont requis", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/api/admin/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: chapterForm.title,
          description: chapterForm.description,
          subjectId: parseInt(chapterForm.subjectId)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Succès", description: "Chapitre créé avec succès" });
        
        // Recharger les chapitres
        await loadChapters();
        
        // Fermer le modal et réinitialiser le formulaire
        setShowChapterModal(false);
        setChapterForm({ title: '', description: '', subjectId: '' });
        
        // Mettre à jour le formulaire de flashcard si la matière correspond
        if (chapterForm.subjectId === flashcardForm.subjectId) {
          setFlashcardForm({...flashcardForm, chapterId: data.chapter.id.toString()});
        }
      } else {
        const errorData = await response.json();
        toast({ title: "Erreur", description: errorData.error || "Erreur lors de la création du chapitre", variant: "destructive" });
      }
    } catch (error) {
      console.error('Erreur lors de la création du chapitre:', error);
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const openChapterModal = () => {
    if (!flashcardForm.subjectId) {
      toast({ title: "Erreur", description: "Veuillez d'abord sélectionner une matière", variant: "destructive" });
      return;
    }
    setChapterForm({
      title: '',
      description: '',
      subjectId: flashcardForm.subjectId
    });
    setShowChapterModal(true);
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


  const handleImportFlashcards = async (file: File, options?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const result = importFlashcardsFromCSV(csvContent, subjects, chapters, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleConfirmImportFlashcards = async (data: ImportFlashcardData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const flashcardData of data) {
        try {
          const response = await fetch('http://localhost:8081/api/admin/flashcards', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              question: flashcardData.question,
              answer: flashcardData.answer,
              subjectId: flashcardData.subjectId,
              chapterId: flashcardData.chapterId,
              difficulty: flashcardData.difficulty,
              userId: user?.id // Ajouter l'ID de l'utilisateur admin
            })
          });

          if (response.ok) {
            const result = await response.json();
            addFlashcard(result.flashcard);
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`Flashcard "${flashcardData.question}": ${errorData.error || 'Erreur inconnue'}`);
            errorCount++;
          }
        } catch (error) {
          console.error('Erreur lors de la création de la flashcard:', error);
          errors.push(`Flashcard "${flashcardData.question}": Erreur de connexion`);
          errorCount++;
        }
      }

      // Afficher le résultat
      if (successCount > 0) {
        toast({ 
          title: "Import terminé", 
          description: `${successCount} flashcards importées avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}` 
        });
      }

      if (errorCount > 0) {
        console.error('Erreurs d\'import:', errors);
        toast({ 
          title: "Erreurs d'import", 
          description: `${errorCount} flashcards n'ont pas pu être importées. Vérifiez la console pour plus de détails.`, 
          variant: "destructive" 
        });
      }

      // Recharger les flashcards
      await refreshFlashcards();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({ 
        title: "Erreur d'import", 
        description: "Une erreur est survenue lors de l'import des flashcards", 
        variant: "destructive" 
      });
    }
  };

  const renderFlashcardPreview = (data: ImportFlashcardData[], errors: ImportError[]) => {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.slice(0, 5).map((flashcard, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Question:</p>
                <p className="text-sm text-gray-900">{flashcard.question}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Réponse:</p>
                <p className="text-sm text-gray-900">{flashcard.answer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {flashcard.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {subjects.find(s => s.id === flashcard.subjectId)?.name}
              </Badge>
              {flashcard.chapterId && (
                <Badge variant="outline" className="text-xs">
                  {chapters.find(c => c.id === flashcard.chapterId)?.name}
                </Badge>
              )}
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-sm text-gray-500 text-center">
            ... et {data.length - 5} autres flashcards
          </p>
        )}
      </div>
    );
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
                onClick={() => window.location.href = '/admin/dashboard-modern'}
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
          
          <div className="flex items-center space-x-2">
            <CsvImportDialog
              trigger={
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer CSV
                </Button>
              }
              title="Importer des flashcards"
              description="Importez des flashcards depuis un fichier CSV. Vous pouvez pré-sélectionner la matière et la difficulté ci-dessous."
              onImport={handleImportFlashcards}
              onConfirmImport={handleConfirmImportFlashcards}
              templateGenerator={generateFlashcardImportTemplate}
              previewComponent={renderFlashcardPreview}
              showSubjectSelector={true}
              showDifficultySelector={true}
              subjects={subjects}
            />
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
                  <Select value={flashcardForm.subjectId} onValueChange={(value) => setFlashcardForm({...flashcardForm, subjectId: value, chapterId: 'none'})}>
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="chapter">Chapitre (optionnel)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openChapterModal}
                      disabled={!flashcardForm.subjectId}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau chapitre
                    </Button>
                  </div>
                  <Select value={flashcardForm.chapterId} onValueChange={(value) => setFlashcardForm({...flashcardForm, chapterId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chapitre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun chapitre</SelectItem>
                      {chapters
                        .filter(chapter => !flashcardForm.subjectId || chapter.subjectId === parseInt(flashcardForm.subjectId))
                        .map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
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

          {/* Modal pour créer un nouveau chapitre */}
          <Dialog open={showChapterModal} onOpenChange={setShowChapterModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouveau chapitre</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau chapitre pour la matière sélectionnée.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chapterTitle">Titre du chapitre</Label>
                  <Input
                    id="chapterTitle"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({...chapterForm, title: e.target.value})}
                    placeholder="Ex: Introduction aux fonctions"
                  />
                </div>
                <div>
                  <Label htmlFor="chapterDescription">Description (optionnel)</Label>
                  <Textarea
                    id="chapterDescription"
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm({...chapterForm, description: e.target.value})}
                    placeholder="Description du chapitre..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="chapterSubject">Matière</Label>
                  <Select value={chapterForm.subjectId} onValueChange={(value) => setChapterForm({...chapterForm, subjectId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowChapterModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateChapter}>
                  Créer le chapitre
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

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette flashcard ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFlashcard}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFlashcards;


