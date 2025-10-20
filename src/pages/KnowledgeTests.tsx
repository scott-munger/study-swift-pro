import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Clock, BookOpen, Target, Users, CheckCircle, XCircle, Upload } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { API_CONFIG } from '../config/api';
import { importTestsFromCSV, generateTestImportTemplate, ImportTestData, ImportError, importFlashcardsFromCSV, generateFlashcardImportTemplate, ImportFlashcardData, importQuestionsFromCSV, generateQuestionImportTemplate, ImportQuestionData } from '../lib/csvUtils';
import { CsvImportDialog } from '../components/ui/CsvImportDialog';

interface KnowledgeTest {
  id: number;
  title: string;
  description: string;
  subjectId: number;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  subject: {
    name: string;
    level: string;
    section: string | null;
  };
  _count: {
    questions: number;
    results: number;
  };
}

interface Question {
  id: number;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  options: string[] | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  concept: string | null;
}

interface TestResult {
  id: number;
  score: number;
  percentage: number;
  timeSpent: number;
  isPassed: boolean;
  completedAt: string;
  test: {
    title: string;
    subject: {
      name: string;
    };
  };
}

const KnowledgeTests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<KnowledgeTest[]>([]);
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Liste complète des matières avec leurs niveaux et sections
  const allSubjects = [
    { id: '21', name: 'Français', level: '9ème' },
    { id: '22', name: 'Histoire-Géographie', level: '9ème' },
    { id: '23', name: 'Anglais', level: '9ème' },
    { id: '24', name: 'Sciences', level: '9ème' },
    { id: '25', name: 'Mathématiques', level: '9ème' },
    { id: '27', name: 'Physique', level: 'Terminale', section: 'SMP' },
    { id: '28', name: 'Chimie', level: 'Terminale', section: 'SMP' },
    { id: '29', name: 'Informatique', level: 'Terminale', section: 'SMP' },
    { id: '30', name: 'Biologie', level: 'Terminale', section: 'SVT' },
    { id: '31', name: 'Sciences de la Terre', level: 'Terminale', section: 'SVT' },
    { id: '32', name: 'Économie', level: 'Terminale', section: 'SES' },
    { id: '33', name: 'Sociologie', level: 'Terminale', section: 'SES' },
    { id: '34', name: 'Littérature', level: 'Terminale', section: 'LLA' },
    { id: '35', name: 'Philosophie', level: 'Terminale', section: 'LLA' },
    { id: '36', name: 'Langues Vivantes', level: 'Terminale', section: 'LLA' }
  ];

  // Filtrer les matières selon la CLASSE de l'utilisateur (9ème ou Terminale)
  const availableSubjects = allSubjects.filter((subject) => {
    // Afficher les matières selon la classe de l'utilisateur
    const levelMatch = subject.level === user?.userClass;
    return levelMatch;
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadUserResults();
  }, [user, navigate]);

  const loadUserResults = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_CONFIG.ENDPOINTS.KNOWLEDGE_TEST_RESULTS(user?.id || 0), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const results = await response.json();
        setUserResults(results);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
    }
  };

  const loadTestsForSubject = async (subjectId: string) => {
    if (!subjectId) {
      setTests([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_CONFIG.ENDPOINTS.KNOWLEDGE_TESTS(parseInt(subjectId)), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const testsData = await response.json();
        console.log(`Tests récupérés pour la matière ${subjectId}:`, testsData);
        
        // Filtrer les tests selon la classe de l'utilisateur
        const filteredTests = testsData.filter((test: KnowledgeTest) => {
          // Vérifier si le niveau correspond à la classe de l'utilisateur
          const levelMatch = test.subject.level === user?.userClass;
          return levelMatch;
        });
        
        console.log(`Tests filtrés pour la classe ${user?.userClass}:`, filteredTests);
        setTests(filteredTests);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les tests",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tests:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    loadTestsForSubject(subjectId);
  };

  const startTest = (testId: number) => {
    navigate(`/knowledge-test/${testId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (isPassed: boolean) => {
    return isPassed ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };


  const handleImportTests = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const result = importTestsFromCSV(csvContent, availableSubjects);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleImportFlashcards = async (file: File, options: { defaultSubjectId: number; defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD' }): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const result = importFlashcardsFromCSV(csvContent, availableSubjects, [], options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleImportQuestions = async (file: File, options: { defaultTestId: number }): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const result = importQuestionsFromCSV(csvContent, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleConfirmImportTests = async (data: ImportTestData[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const testData of data) {
        try {
          const response = await fetch('http://localhost:8081/api/admin/knowledge-tests', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: testData.title,
              description: testData.description,
              subjectId: testData.subjectId,
              totalQuestions: testData.totalQuestions,
              timeLimit: testData.timeLimit,
              passingScore: testData.passingScore,
              isActive: testData.isActive
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`Test "${testData.title}": ${errorData.error || 'Erreur inconnue'}`);
            errorCount++;
          }
        } catch (error) {
          console.error('Erreur lors de la création du test:', error);
          errors.push(`Test "${testData.title}": Erreur de connexion`);
          errorCount++;
        }
      }

      // Afficher le résultat
      if (successCount > 0) {
        toast({ 
          title: "Import terminé", 
          description: `${successCount} tests importés avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}` 
        });
      }

      if (errorCount > 0) {
        console.error('Erreurs d\'import:', errors);
        toast({ 
          title: "Erreurs d'import", 
          description: `${errorCount} tests n'ont pas pu être importés. Vérifiez la console pour plus de détails.`, 
          variant: "destructive" 
        });
      }

      // Recharger les tests si on est sur une matière sélectionnée
      if (selectedSubject) {
        loadTestsForSubject(selectedSubject);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({ 
        title: "Erreur d'import", 
        description: "Une erreur est survenue lors de l'import des tests", 
        variant: "destructive" 
      });
    }
  };

  const handleConfirmImportFlashcards = async (data: ImportFlashcardData[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

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
              difficulty: flashcardData.difficulty,
              subjectId: flashcardData.subjectId,
              chapterId: flashcardData.chapterId
            })
          });

          if (response.ok) {
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

      // Recharger les tests si on est sur une matière sélectionnée
      if (selectedSubject) {
        loadTestsForSubject(selectedSubject);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({ 
        title: "Erreur d'import", 
        description: "Une erreur est survenue lors de l'import des flashcards", 
        variant: "destructive" 
      });
    }
  };

  const handleConfirmImportQuestions = async (data: ImportQuestionData[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ 
          title: "Erreur", 
          description: "Token d'authentification manquant", 
          variant: "destructive" 
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const questionData of data) {
        try {
          const response = await fetch('http://localhost:8081/api/admin/knowledge-questions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              testId: questionData.testId,
              question: questionData.question,
              type: questionData.type,
              options: questionData.options,
              correctAnswer: questionData.correctAnswer,
              explanation: questionData.explanation,
              difficulty: questionData.difficulty,
              concept: questionData.concept
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`Question "${questionData.question}": ${errorData.error || 'Erreur inconnue'}`);
            errorCount++;
          }
        } catch (error) {
          console.error('Erreur lors de la création de la question:', error);
          errors.push(`Question "${questionData.question}": Erreur de connexion`);
          errorCount++;
        }
      }

      // Afficher le résultat
      if (successCount > 0) {
        toast({ 
          title: "Import terminé", 
          description: `${successCount} questions importées avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}` 
        });
      }

      if (errorCount > 0) {
        console.error('Erreurs d\'import:', errors);
        toast({ 
          title: "Erreurs d'import", 
          description: `${errorCount} questions n'ont pas pu être importées. Vérifiez la console pour plus de détails.`, 
          variant: "destructive" 
        });
      }

      // Recharger les tests si on est sur une matière sélectionnée
      if (selectedSubject) {
        loadTestsForSubject(selectedSubject);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({ 
        title: "Erreur d'import", 
        description: "Une erreur est survenue lors de l'import des questions", 
        variant: "destructive" 
      });
    }
  };

  const renderTestPreview = (data: ImportTestData[], errors: ImportError[]) => {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.slice(0, 5).map((test, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Titre:</p>
                <p className="text-sm text-gray-900 font-semibold">{test.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Description:</p>
                <p className="text-sm text-gray-900">{test.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {availableSubjects.find(s => s.id === test.subjectId)?.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {test.totalQuestions} questions
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {test.timeLimit} min
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {test.passingScore}% requis
                </Badge>
                <Badge variant={test.isActive ? "default" : "secondary"} className="text-xs">
                  {test.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-sm text-gray-500 text-center">
            ... et {data.length - 5} autres tests
          </p>
        )}
      </div>
    );
  };

  const renderFlashcardPreview = (data: ImportFlashcardData[], errors: ImportError[]) => {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.slice(0, 5).map((flashcard, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Question:</p>
                <p className="text-sm text-gray-900 font-semibold">{flashcard.question}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Réponse:</p>
                <p className="text-sm text-gray-900">{flashcard.answer}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {availableSubjects.find(s => s.id === flashcard.subjectId)?.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {flashcard.difficulty}
                </Badge>
                {flashcard.chapterId && (
                  <Badge variant="secondary" className="text-xs">
                    Chapitre {flashcard.chapterId}
                  </Badge>
                )}
              </div>
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

  const renderQuestionPreview = (data: ImportQuestionData[], errors: ImportError[]) => {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.slice(0, 5).map((question, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Question:</p>
                <p className="text-sm text-gray-900 font-semibold">{question.question}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type:</p>
                <p className="text-sm text-gray-900">{question.type}</p>
              </div>
              {question.options && question.options.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Options:</p>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {question.options.map((option, optIndex) => (
                      <li key={optIndex}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Bonne réponse:</p>
                <p className="text-sm text-gray-900">{question.correctAnswer}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {question.difficulty}
                </Badge>
                {question.concept && (
                  <Badge variant="secondary" className="text-xs">
                    {question.concept}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-sm text-gray-500 text-center">
            ... et {data.length - 5} autres questions
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tests de Connaissances</h1>
        <p className="text-gray-600">
          Évaluez vos connaissances dans chaque matière avec nos tests adaptés au programme de votre classe
        </p>
      </div>

      {/* Sélection de matière */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Sélectionner une matière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Profil actuel :</strong> {user?.userClass} {user?.section ? `- Section ${user.section}` : ''}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Matières disponibles pour votre classe ({user?.userClass})
            </p>
          </div>
          
          {availableSubjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableSubjects.map((subject) => (
                <Button
                  key={subject.id}
                  variant={selectedSubject === subject.id ? "default" : "outline"}
                  onClick={() => handleSubjectChange(subject.id)}
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200"
                >
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-xs text-gray-500">
                    {subject.level}{subject.section ? ` - ${subject.section}` : ''}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Aucune matière disponible pour votre profil ({user?.userClass} {user?.section ? `- ${user.section}` : ''})
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Contactez votre administrateur pour configurer les matières de votre section.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tests disponibles */}
      {selectedSubject && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Tests Disponibles</h2>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Matières de la classe {user?.userClass}
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2 flex-wrap">
                  <CsvImportDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Importer Tests CSV
                      </Button>
                    }
                    title="Importer des tests"
                    description="Importez des tests de connaissances depuis un fichier CSV. Téléchargez d'abord le modèle pour voir le format requis."
                    onImport={handleImportTests}
                    onConfirmImport={handleConfirmImportTests}
                    templateGenerator={generateTestImportTemplate}
                    previewComponent={renderTestPreview}
                  />
                  <CsvImportDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Importer Flashcards CSV
                      </Button>
                    }
                    title="Importer des flashcards"
                    description="Importez des flashcards depuis un fichier CSV. Téléchargez d'abord le modèle pour voir le format requis."
                    onImport={handleImportFlashcards}
                    onConfirmImport={handleConfirmImportFlashcards}
                    templateGenerator={generateFlashcardImportTemplate}
                    previewComponent={renderFlashcardPreview}
                    showSubjectSelector={true}
                    showDifficultySelector={true}
                    subjects={availableSubjects}
                  />
                  <CsvImportDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Importer Questions CSV
                      </Button>
                    }
                    title="Importer des questions"
                    description="Importez des questions de test depuis un fichier CSV. Téléchargez d'abord le modèle pour voir le format requis."
                    onImport={handleImportQuestions}
                    onConfirmImport={handleConfirmImportQuestions}
                    templateGenerator={generateQuestionImportTemplate}
                    previewComponent={renderQuestionPreview}
                    showTestSelector={true}
                    availableTests={tests}
                  />
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des tests...</p>
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun test disponible pour cette matière</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{test.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {test.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {test.subject.level}{test.subject.section ? ` - ${test.subject.section}` : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{test._count.questions} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{test.timeLimit} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{test.passingScore}% pour réussir</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{test._count.results} tentatives</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startTest(test.id)}
                      className="w-full"
                    >
                      Commencer le test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Résultats de l'utilisateur */}
      {userResults.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Mes Résultats</h2>
          </div>
          <div className="grid gap-4">
            {userResults.slice(0, 10).map((result) => (
              <Card key={result.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{result.test.title}</h3>
                      <p className="text-sm text-gray-600">{result.test.subject.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultIcon(result.isPassed)}
                      <Badge variant={result.isPassed ? "default" : "destructive"}>
                        {result.isPassed ? "Réussi" : "Échoué"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="font-semibold">{result.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Temps</p>
                      <p className="font-semibold">{formatTime(result.timeSpent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Progress value={result.percentage} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTests;
