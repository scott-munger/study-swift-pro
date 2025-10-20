import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Clock, BookOpen, Target, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { API_CONFIG } from '../config/api';

interface Question {
  id: number;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  options: string[] | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  concept: string | null;
}

interface Test {
  id: number;
  title: string;
  description: string;
  subjectId: number;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  subject: {
    name: string;
    level: string;
    section: string | null;
  };
  questions: Question[];
}

interface Answer {
  questionId: number;
  userAnswer: string;
  timeSpent: number;
}

const KnowledgeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (testId) {
      loadTest();
    }
  }, [user, testId, navigate]);

  useEffect(() => {
    if (test && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test, timeRemaining]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_CONFIG.ENDPOINTS.KNOWLEDGE_TEST(parseInt(testId)), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const testData = await response.json();
        setTest(testData);
        setTimeRemaining(testData.timeLimit * 60); // Convertir en secondes
      } else {
        toast({
          title: "Erreur",
          description: "Test non trouvé",
          variant: "destructive"
        });
        navigate('/knowledge-tests');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du test:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
      navigate('/knowledge-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    const currentAnswer = answers.find(a => a.questionId === test?.questions[currentQuestionIndex].id);
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    if (currentAnswer) {
      setAnswers(prev => prev.map(a => 
        a.questionId === test?.questions[currentQuestionIndex].id 
          ? { ...a, userAnswer: answer, timeSpent }
          : a
      ));
    } else {
      setAnswers(prev => [...prev, {
        questionId: test?.questions[currentQuestionIndex].id || 0,
        userAnswer: answer,
        timeSpent
      }]);
    }
  };

  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!test) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const totalTimeSpent = test.timeLimit * 60 - timeRemaining;

      const response = await fetch(API_CONFIG.ENDPOINTS.KNOWLEDGE_TEST_SUBMIT(parseInt(testId)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          timeSpent: totalTimeSpent
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: result.summary.isPassed ? "Félicitations !" : "Test terminé",
          description: `Vous avez obtenu ${result.summary.percentage}% (${result.summary.correctAnswers}/${result.summary.totalQuestions} bonnes réponses)`,
          variant: result.summary.isPassed ? "default" : "destructive"
        });
        navigate('/knowledge-tests');
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de soumettre le test",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentAnswer = () => {
    const currentQuestion = test?.questions[currentQuestionIndex];
    if (!currentQuestion) return '';
    const answer = answers.find(a => a.questionId === currentQuestion.id);
    return answer?.userAnswer || '';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Test non trouvé</p>
          <Button onClick={() => navigate('/knowledge-tests')} className="mt-4">
            Retour aux tests
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600">{test.description}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/knowledge-tests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-sm">{test.questions.length} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm">{formatTime(timeRemaining)} restant</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm">{test.passingScore}% pour réussir</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} sur {test.questions.length}</span>
            <span>{Math.round(progress)}% complété</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {currentQuestionIndex + 1}</span>
            {currentQuestion.concept && (
              <Badge variant="outline">{currentQuestion.concept}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{currentQuestion.question}</p>

          {/* Réponse selon le type */}
          {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
            <RadioGroup
              value={getCurrentAnswer()}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'TRUE_FALSE' && (
            <RadioGroup
              value={getCurrentAnswer()}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="true" />
                <Label htmlFor="true" className="cursor-pointer">Vrai</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="false" />
                <Label htmlFor="false" className="cursor-pointer">Faux</Label>
              </div>
            </RadioGroup>
          )}

          {(currentQuestion.type === 'SHORT_ANSWER' || currentQuestion.type === 'LONG_ANSWER') && (
            <Textarea
              value={getCurrentAnswer()}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Votre réponse..."
              className="min-h-[100px]"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex === test.questions.length - 1 ? (
            <Button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Soumission...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer le test
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Avertissement temps */}
      {timeRemaining <= 300 && timeRemaining > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Attention !</span>
            <span>Il vous reste moins de 5 minutes.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTest;
