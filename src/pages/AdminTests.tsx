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
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react';

interface KnowledgeTest {
  id: number;
  title: string;
  description?: string;
  subjectId: number;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject: {
    name: string;
    level: string;
    section?: string;
  };
  _count: {
    questions: number;
    results: number;
  };
}

interface Subject {
  id: number;
  name: string;
  level: string;
  section?: string;
}

const AdminTests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<KnowledgeTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  
  // États pour l'import CSV
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const [testsResponse, subjectsResponse] = await Promise.all([
        fetch('http://localhost:8081/api/admin/knowledge-tests', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:8081/api/admin/subjects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        setTests(testsData.tests || []);
      }

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller les données CSV",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:8081/api/admin/tests/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csvData })
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
        toast({
          title: "Import réussi",
          description: result.message,
        });
        setCsvData('');
        loadData(); // Recharger les données
      } else {
        toast({
          title: "Erreur d'import",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer les tests",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `title,subject,question,type,correctAnswer
Test Math,Mathématiques,2+2=?,MULTIPLE_CHOICE,4
Test Math,Mathématiques,3+3=?,MULTIPLE_CHOICE,6`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_tests.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // États pour les modales
  const [selectedTest, setSelectedTest] = useState<KnowledgeTest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'MULTIPLE_CHOICE',
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    concept: '',
    options: '["Option A", "Option B", "Option C", "Option D"]'
  });

  // Fonctions CRUD
  const handleViewTest = async (testId: number) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Récupérer les détails du test depuis la liste existante
      const test = tests.find(t => t.id === testId);
      if (!test) {
        toast({
          title: "Erreur",
          description: "Test non trouvé",
          variant: "destructive"
        });
        return;
      }

      // Pour l'instant, on utilise des données simulées pour les questions
      // En attendant que l'endpoint API soit corrigé
      const mockQuestions = [
        {
          id: 1,
          question: "Quelle est la capitale de la France ?",
          type: "MULTIPLE_CHOICE",
          correctAnswer: "Paris",
          explanation: "Paris est la capitale de la France depuis le 6ème siècle.",
          difficulty: "EASY",
          concept: "Géographie",
          options: ["Paris", "Lyon", "Marseille", "Toulouse"]
        },
        {
          id: 2,
          question: "Combien font 2 + 2 ?",
          type: "MULTIPLE_CHOICE",
          correctAnswer: "4",
          explanation: "2 + 2 = 4 en arithmétique de base.",
          difficulty: "EASY",
          concept: "Mathématiques",
          options: ["3", "4", "5", "6"]
        },
        {
          id: 3,
          question: "Expliquez le processus de la photosynthèse chez les plantes vertes.",
          type: "ELABORATION",
          correctAnswer: "La photosynthèse est le processus par lequel les plantes vertes utilisent la lumière du soleil pour convertir le dioxyde de carbone et l'eau en glucose et en oxygène.",
          explanation: "Ce processus se déroule dans les chloroplastes et implique deux phases : la phase claire (photolyse de l'eau) et la phase sombre (cycle de Calvin).",
          difficulty: "HARD",
          concept: "Biologie",
          options: null
        },
        {
          id: 4,
          question: "La Terre tourne autour du Soleil.",
          type: "TRUE_FALSE",
          correctAnswer: "Vrai",
          explanation: "La Terre effectue une révolution autour du Soleil en 365,25 jours.",
          difficulty: "EASY",
          concept: "Astronomie",
          options: null
        }
      ];
      
      setSelectedTest(test);
      setQuestions(mockQuestions);
      setShowViewModal(true);
      
      toast({
        title: "Info",
        description: "Affichage des données de test (questions simulées en attendant la correction de l'API)"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleEditTest = async (test: KnowledgeTest) => {
    setSelectedTest(test);
    
    // Pour l'instant, on utilise des données simulées pour les questions
    // En attendant que l'endpoint API soit corrigé
    const mockQuestions = [
      {
        id: 1,
        question: "Quelle est la capitale de la France ?",
        type: "MULTIPLE_CHOICE",
        correctAnswer: "Paris",
        explanation: "Paris est la capitale de la France depuis le 6ème siècle.",
        difficulty: "EASY",
        concept: "Géographie",
        options: ["Paris", "Lyon", "Marseille", "Toulouse"]
      },
      {
        id: 2,
        question: "Combien font 2 + 2 ?",
        type: "MULTIPLE_CHOICE",
        correctAnswer: "4",
        explanation: "2 + 2 = 4 en arithmétique de base.",
        difficulty: "EASY",
        concept: "Mathématiques",
        options: ["3", "4", "5", "6"]
      },
      {
        id: 3,
        question: "Expliquez le processus de la photosynthèse chez les plantes vertes.",
        type: "ELABORATION",
        correctAnswer: "La photosynthèse est le processus par lequel les plantes vertes utilisent la lumière du soleil pour convertir le dioxyde de carbone et l'eau en glucose et en oxygène.",
        explanation: "Ce processus se déroule dans les chloroplastes et implique deux phases : la phase claire (photolyse de l'eau) et la phase sombre (cycle de Calvin).",
        difficulty: "HARD",
        concept: "Biologie",
        options: null
      },
      {
        id: 4,
        question: "La Terre tourne autour du Soleil.",
        type: "TRUE_FALSE",
        correctAnswer: "Vrai",
        explanation: "La Terre effectue une révolution autour du Soleil en 365,25 jours.",
        difficulty: "EASY",
        concept: "Astronomie",
        options: null
      }
    ];
    
    setQuestions(mockQuestions);
    setShowEditModal(true);
  };

  // Fonctions pour gérer les questions
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question: '',
      type: 'MULTIPLE_CHOICE',
      correctAnswer: '',
      explanation: '',
      difficulty: 'MEDIUM',
      concept: '',
      options: '["Option A", "Option B", "Option C", "Option D"]'
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      type: question.type,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'MEDIUM',
      concept: question.concept || '',
      options: question.options ? JSON.stringify(question.options) : '["Option A", "Option B", "Option C", "Option D"]'
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedTest) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editingQuestion 
        ? `http://localhost:8081/api/admin/knowledge-questions/${editingQuestion.id}`
        : `http://localhost:8081/api/admin/knowledge-tests/${selectedTest.id}/questions`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...questionForm,
          options: questionForm.type === 'MULTIPLE_CHOICE' ? JSON.parse(questionForm.options) : null
        })
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: editingQuestion ? "Question modifiée" : "Question ajoutée"
        });
        setShowQuestionModal(false);
        // Recharger les questions
        handleEditTest(selectedTest);
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la sauvegarde",
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

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Supprimer cette question ?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/knowledge-questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Question supprimée"
        });
        // Recharger les questions
        if (selectedTest) {
          handleEditTest(selectedTest);
        }
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

  const handleDeleteTest = async (testId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/knowledge-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Test supprimé avec succès"
        });
        loadData(); // Recharger la liste
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Tests</h1>
              <p className="text-gray-600 mt-2">Gérez les tests de connaissances et importez depuis CSV</p>
            </div>
            <Button onClick={() => navigate('/admin/dashboard-modern')} variant="outline">
              Retour au Dashboard
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Liste des Tests</TabsTrigger>
            <TabsTrigger value="import">Import CSV</TabsTrigger>
          </TabsList>

          {/* Liste des Tests */}
          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{test.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {test.subject.name} - {test.subject.level}
                          {test.subject.section && ` (${test.subject.section})`}
                        </CardDescription>
                      </div>
                      <Badge variant={test.isActive ? "default" : "secondary"}>
                        {test.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        {test._count.questions} questions
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {test.timeLimit} minutes
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {test.passingScore}% minimum
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {test._count.results} tentatives
                      </div>
                      {test.description && (
                        <p className="text-sm text-gray-600 mt-2">{test.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => handleViewTest(test.id)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditTest(test)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteTest(test.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {tests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun test trouvé</h3>
                  <p className="text-gray-600 mb-4">Commencez par importer des tests depuis un fichier CSV</p>
                  <Button onClick={() => setActiveTab('import')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer des Tests
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Import CSV */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import CSV Simple</CardTitle>
                <CardDescription>Collez votre CSV et cliquez sur Importer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csvData">Contenu CSV</Label>
                  <Textarea
                    id="csvData"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={8}
                    className="mt-1 font-mono text-sm"
                    placeholder="title,subject,question,type,correctAnswer
Test Math,Mathématiques,2+2=?,MULTIPLE_CHOICE,4
Test Math,Mathématiques,3+3=?,MULTIPLE_CHOICE,6"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleImportCSV} 
                    disabled={importing || !csvData.trim()}
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Import...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importer
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Modèle
                  </Button>
                </div>

                {importResults && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-green-600 font-semibold">✅ {importResults.results.success} test(s) créé(s)</span>
                      {importResults.results.errors.length > 0 && (
                        <span className="text-red-600 font-semibold">❌ {importResults.results.errors.length} erreur(s)</span>
                      )}
                    </div>
                    {importResults.results.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        {importResults.results.errors.slice(0, 3).map((error: string, index: number) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Voir Test */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Test Complet - {selectedTest?.title}</DialogTitle>
              <DialogDescription>
                Visualisation complète du test avec toutes ses questions
              </DialogDescription>
            </DialogHeader>
            
            {selectedTest && (
              <div className="space-y-6">
                {/* Informations du Test */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Matière</Label>
                        <p className="text-gray-700">{selectedTest.subject.name} - {selectedTest.subject.level}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Statut</Label>
                        <Badge variant={selectedTest.isActive ? "default" : "secondary"}>
                          {selectedTest.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-semibold">Durée</Label>
                        <p className="text-gray-700">{selectedTest.timeLimit} minutes</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Score minimum</Label>
                        <p className="text-gray-700">{selectedTest.passingScore}%</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Nombre de questions</Label>
                        <p className="text-gray-700">{questions.length}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Tentatives</Label>
                        <p className="text-gray-700">{selectedTest._count?.results || 0}</p>
                      </div>
                    </div>
                    {selectedTest.description && (
                      <div className="mt-4">
                        <Label className="font-semibold">Description</Label>
                        <p className="text-gray-700 mt-1">{selectedTest.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Questions du Test */}
                <Card>
                  <CardHeader>
                    <CardTitle>Questions du Test ({questions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {questions.length > 0 ? (
                      <div className="space-y-4">
                        {questions.map((question, index) => (
                          <div key={question.id} className="border rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <Badge variant="outline">Question {index + 1}</Badge>
                              <Badge variant="secondary">{question.type}</Badge>
                              <Badge variant={
                                question.difficulty === 'EASY' ? 'default' : 
                                question.difficulty === 'MEDIUM' ? 'secondary' : 
                                'destructive'
                              }>
                                {question.difficulty}
                              </Badge>
                            </div>
                            
                            <div className="mb-3">
                              <Label className="font-semibold">Question:</Label>
                              <p className="text-gray-700 mt-1">{question.question}</p>
                            </div>

                            {question.type === 'MULTIPLE_CHOICE' && question.options && (
                              <div className="mb-3">
                                <Label className="font-semibold">Options:</Label>
                                <div className="mt-1 space-y-1">
                                  {Array.isArray(question.options) ? question.options.map((option: string, optIndex: number) => (
                                    <div key={optIndex} className="text-sm text-gray-600">
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                    </div>
                                  )) : (
                                    <div className="text-sm text-gray-600">{JSON.stringify(question.options)}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {question.type === 'ELABORATION' && (
                              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <Label className="font-semibold text-blue-800">Question d'Élaboration</Label>
                                </div>
                                <p className="text-sm text-blue-700">
                                  L'étudiant devra fournir une réponse détaillée et structurée. 
                                  L'évaluation se fait manuellement.
                                </p>
                              </div>
                            )}

                            <div className="mb-3">
                              <Label className="font-semibold">Réponse correcte:</Label>
                              <p className="text-green-600 font-medium mt-1">{question.correctAnswer}</p>
                            </div>

                            {question.explanation && (
                              <div className="mb-3">
                                <Label className="font-semibold">Explication:</Label>
                                <p className="text-gray-600 mt-1">{question.explanation}</p>
                              </div>
                            )}

                            {question.concept && (
                              <div>
                                <Label className="font-semibold">Concept:</Label>
                                <p className="text-gray-600 mt-1">{question.concept}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Aucune question dans ce test</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Gestion des Questions */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion des Questions - {selectedTest?.title}</DialogTitle>
              <DialogDescription>
                Gérez les questions de ce test de connaissances
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Bouton Ajouter Question */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                <Button onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une Question
                </Button>
              </div>

              {/* Liste des Questions */}
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="secondary">{question.type}</Badge>
                          <Badge variant={question.difficulty === 'EASY' ? 'default' : question.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'}>
                            {question.difficulty}
                          </Badge>
                        </div>
                        <p className="font-medium mb-2">{question.question}</p>
                        {question.type === 'MULTIPLE_CHOICE' && question.options && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Options:</strong> {JSON.stringify(question.options)}
                          </div>
                        )}
                        <p className="text-sm text-gray-600">
                          <strong>Réponse:</strong> {question.correctAnswer}
                        </p>
                        {question.explanation && (
                          <p className="text-sm text-gray-500 mt-1">
                            <strong>Explication:</strong> {question.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEditQuestion(question)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteQuestion(question.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucune question dans ce test</p>
                    <Button onClick={handleAddQuestion} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter la première question
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Question */}
        <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Modifier la Question' : 'Nouvelle Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Modifiez les détails de cette question' : 'Créez une nouvelle question pour le test'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question</Label>
                <Textarea
                  id="questionText"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                  rows={3}
                  placeholder="Entrez votre question..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionType">Type</Label>
                  <Select value={questionForm.type} onValueChange={(value) => setQuestionForm({...questionForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">Choix Multiple</SelectItem>
                      <SelectItem value="TRUE_FALSE">Vrai/Faux</SelectItem>
                      <SelectItem value="SHORT_ANSWER">Réponse Courte</SelectItem>
                      <SelectItem value="ELABORATION">Élaboration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="questionDifficulty">Difficulté</Label>
                  <Select value={questionForm.difficulty} onValueChange={(value) => setQuestionForm({...questionForm, difficulty: value})}>
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

              {questionForm.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <Label htmlFor="questionOptions">Options (JSON)</Label>
                  <Textarea
                    id="questionOptions"
                    value={questionForm.options}
                    onChange={(e) => setQuestionForm({...questionForm, options: e.target.value})}
                    rows={2}
                    placeholder='["Option A", "Option B", "Option C", "Option D"]'
                  />
                </div>
              )}

              {questionForm.type === 'ELABORATION' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="font-semibold text-blue-800">Question d'Élaboration</Label>
                  </div>
                  <p className="text-sm text-blue-700">
                    Ce type de question permet aux étudiants de fournir une réponse détaillée et structurée. 
                    L'évaluation se fait manuellement par l'enseignant.
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="correctAnswer">Réponse Correcte</Label>
                <Input
                  id="correctAnswer"
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                  placeholder="Entrez la réponse correcte..."
                />
              </div>
              
              <div>
                <Label htmlFor="explanation">Explication (optionnel)</Label>
                <Textarea
                  id="explanation"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                  rows={2}
                  placeholder="Expliquez pourquoi cette réponse est correcte..."
                />
              </div>
              
              <div>
                <Label htmlFor="concept">Concept (optionnel)</Label>
                <Input
                  id="concept"
                  value={questionForm.concept}
                  onChange={(e) => setQuestionForm({...questionForm, concept: e.target.value})}
                  placeholder="Concept abordé par cette question..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveQuestion}>
                {editingQuestion ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTests;
