import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, Clock, Trophy, RotateCcw, ChevronRight, Play, Eye, EyeOff, 
  CheckCircle, XCircle, User, Brain, Target, Zap, Star, TrendingUp,
  BookMarked, Award, Timer as TimerIcon, Lightbulb, HelpCircle, LogIn,
  Plus, Edit, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Timer from "@/components/ui/timer";

const Flashcards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté et a le bon rôle
  useEffect(() => {
    if (!user) {
      toast({
        title: "Accès restreint",
        description: "Vous devez être connecté pour accéder aux flashcards",
        variant: "destructive"
      });
      navigate('/login');
    } else if (user.role !== 'STUDENT' && user.role !== 'TUTOR' && user.role !== 'ADMIN') {
      toast({
        title: "Accès non autorisé",
        description: "Seuls les étudiants, tuteurs et administrateurs peuvent accéder aux flashcards",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  // Si l'utilisateur n'est pas connecté ou n'a pas le bon rôle, ne rien afficher
  if (!user || (user.role !== 'STUDENT' && user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <LogIn className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6">
            {!user ? "Vous devez être connecté pour accéder aux flashcards" : "Seuls les étudiants, tuteurs et administrateurs peuvent accéder aux flashcards"}
          </p>
          <Button onClick={() => navigate(!user ? '/login' : '/')} className="w-full">
            {!user ? 'Se connecter' : 'Retour à l\'accueil'}
          </Button>
        </Card>
      </div>
    );
  }
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [availableChapters, setAvailableChapters] = useState([]);
  const [showDemo, setShowDemo] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // États pour l'examen
  const [showExam, setShowExam] = useState(false);
  const [currentExamQuestion, setCurrentExamQuestion] = useState(0);
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examScore, setExamScore] = useState(0);
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);

  // États pour les données dynamiques
  const [userStats, setUserStats] = useState<any>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [subjectFlashcards, setSubjectFlashcards] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // États pour la création de flashcards
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    question: '',
    answer: '',
    difficulty: 'medium'
  });

  // Fonction pour charger les statistiques utilisateur
  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8081/api/stats-flashcards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Fonction pour charger les matières disponibles selon le profil
  const loadAvailableSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 Aucun token trouvé pour charger les matières');
        return;
      }

      console.log('🔍 Chargement des matières...');
      const response = await fetch('http://localhost:8081/api/subjects-flashcards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const subjects = await response.json();
        console.log('🔍 Matières reçues:', subjects);
        
        // Attendre que l'utilisateur soit chargé avant de filtrer
        const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
        console.log('🔍 Utilisateur actuel pour filtrage:', currentUser);
        
        // Filtrer les matières selon le profil de l'utilisateur
        const filteredSubjects = filterSubjectsByProfile(subjects);
        console.log('🔍 Matières filtrées:', filteredSubjects);
        console.log('🔍 Nombre de matières filtrées:', filteredSubjects.length);
        setAvailableSubjects(filteredSubjects);
      } else {
        console.error('🔍 Erreur de réponse:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  // Fonction pour filtrer les matières selon le profil utilisateur
  const filterSubjectsByProfile = (subjects: any[]) => {
    // Récupérer les informations du profil
    const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
    
    console.log('🔍 filterSubjectsByProfile - Utilisateur:', currentUser);
    console.log('🔍 filterSubjectsByProfile - Nombre de matières à filtrer:', subjects.length);
    
    if (!currentUser) {
      console.log('🔍 filterSubjectsByProfile - Pas d\'utilisateur, retour de toutes les matières');
      return subjects; // Retourner toutes les matières si pas d'utilisateur
    }

    // Si c'est un tuteur ou admin, donner accès à toutes les matières
    if (currentUser.role === 'TUTOR' || currentUser.role === 'ADMIN') {
      console.log('🔍 filterSubjectsByProfile - Utilisateur TUTOR/ADMIN, retour de toutes les matières');
      return subjects;
    }

    // Pour les étudiants, filtrer selon leur niveau ET leur section
    const userClass = currentUser.userClass;
    const userSection = currentUser.section;
    
    console.log('🔍 filterSubjectsByProfile - Classe utilisateur:', userClass);
    console.log('🔍 filterSubjectsByProfile - Section utilisateur:', userSection);
    
    // Si pas de classe définie, retourner toutes les matières
    if (!userClass) {
      console.log('🔍 filterSubjectsByProfile - Pas de classe définie, retour de toutes les matières');
      return subjects;
    }

    // Filtrer selon le niveau de la matière correspondant à la classe de l'étudiant
    const classToLevel = {
      "9ème": "9ème",
      "Terminale": "Terminale"
    };
    
    const expectedLevel = classToLevel[userClass as keyof typeof classToLevel];
    console.log('🔍 filterSubjectsByProfile - Niveau attendu:', expectedLevel);
    
    const filteredSubjects = subjects.filter(subject => {
      // Vérifier d'abord le niveau
      const levelMatches = subject.level === expectedLevel;
      
      if (!levelMatches) {
        return false;
      }
      
      // Si la matière n'a pas de section spécifique (matières générales), l'étudiant y a accès
      if (!subject.section) {
        console.log(`🔍 filterSubjectsByProfile - Matière générale: ${subject.name} (${subject.level})`);
        return true;
      }
      
      // Si la matière a une section spécifique, vérifier que l'étudiant est dans cette section
      const sectionMatches = subject.section === userSection;
      
      if (sectionMatches) {
        console.log(`🔍 filterSubjectsByProfile - Matière de section: ${subject.name} (${subject.level}, ${subject.section})`);
      } else {
        console.log(`🔍 filterSubjectsByProfile - Matière non accessible: ${subject.name} (${subject.level}, ${subject.section}) - Étudiant en ${userSection}`);
      }
      
      return sectionMatches;
    });
    
    console.log('🔍 filterSubjectsByProfile - Nombre de matières filtrées:', filteredSubjects.length);
    console.log('🔍 filterSubjectsByProfile - Matières accessibles:', filteredSubjects.map(s => `${s.name} (${s.section || 'Générale'})`));
    
    return filteredSubjects;
  };

  // Fonction pour charger les flashcards d'une matière
  const loadSubjectFlashcards = async (subjectId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8081/api/subject-flashcards/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const flashcards = await response.json();
        setSubjectFlashcards(flashcards);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des flashcards:', error);
    }
  };

  // Fonction pour créer une nouvelle flashcard
  const createFlashcard = async (question: string, answer: string, subjectId: number, difficulty: string = 'medium') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('http://localhost:8081/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          answer,
          subjectId,
          difficulty
        })
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard créée avec succès",
        });
        // Recharger les flashcards de la matière
        await loadSubjectFlashcards(subjectId);
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la création",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la création de la flashcard:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
      return false;
    }
  };

  // Fonction pour mettre à jour une flashcard
  const updateFlashcard = async (flashcardId: number, question: string, answer: string, subjectId: number, difficulty: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`http://localhost:8081/api/flashcards/${flashcardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          answer,
          subjectId,
          difficulty
        })
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard mise à jour avec succès",
        });
        // Recharger les flashcards de la matière
        await loadSubjectFlashcards(subjectId);
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la flashcard:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
      return false;
    }
  };

  // Fonction pour supprimer une flashcard
  const deleteFlashcard = async (flashcardId: number, subjectId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`http://localhost:8081/api/flashcards/${flashcardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Flashcard supprimée avec succès",
        });
        // Recharger les flashcards de la matière
        await loadSubjectFlashcards(subjectId);
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la suppression",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la flashcard:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
      return false;
    }
  };

  // Fonction pour gérer la création d'une flashcard
  const handleCreateFlashcard = async () => {
    if (!selectedSubject || !createForm.question || !createForm.answer) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    const subject = availableSubjects.find(s => s.name === selectedSubject);
    if (!subject) {
      toast({
        title: "Erreur",
        description: "Matière non trouvée",
        variant: "destructive"
      });
      return;
    }

    const success = await createFlashcard(
      createForm.question,
      createForm.answer,
      subject.id,
      createForm.difficulty
    );

    if (success) {
      setShowCreateModal(false);
      setCreateForm({ question: '', answer: '', difficulty: 'medium' });
      // Recharger les statistiques
      await loadUserStats();
    }
  };

  // Fonction pour réinitialiser le formulaire de création
  const resetCreateForm = () => {
    setCreateForm({ question: '', answer: '', difficulty: 'medium' });
  };

  // Fonction pour enregistrer une tentative de flashcard
  const saveFlashcardAttempt = async (flashcardId: number, isCorrect: boolean, timeSpent: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:8081/api/flashcard-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flashcardId,
          isCorrect,
          timeSpent
        })
      });

      // Recharger les statistiques après la tentative
      await loadUserStats();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tentative:', error);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté (via user ou localStorage)
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (user || (token && savedUser)) {
      // Utiliser les données du contexte ou du localStorage
      const currentUser = user || JSON.parse(savedUser);
      
      console.log('🔍 useEffect - Utilisateur chargé:', currentUser);
      
      setSelectedClass(currentUser.userClass);
      if (currentUser.section) {
        setSelectedSection(currentUser.section);
      }
      
      // Charger les données depuis l'API
      const loadData = async () => {
        setLoadingStats(true);
        console.log('🔍 useEffect - Chargement des données...');
        await Promise.all([
          loadUserStats(),
          loadAvailableSubjects()
        ]);
        setLoadingStats(false);
        console.log('🔍 useEffect - Données chargées');
      };

      loadData();
    }
  }, [user]);

  // Charger les matières même si l'utilisateur n'est pas encore chargé dans le contexte
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    // Seulement si on a un token et un utilisateur mais pas encore de matières
    if (token && savedUser && availableSubjects.length === 0 && !loadingStats) {
      console.log('🔍 useEffect secondaire - Tentative de chargement des matières...');
      const currentUser = JSON.parse(savedUser);
      console.log('🔍 useEffect secondaire - Utilisateur du localStorage:', currentUser);
      loadAvailableSubjects();
    }
  }, [availableSubjects.length, loadingStats]);

  // Fonction pour gérer le temps écoulé
  const handleTimeUp = () => {
    setTimeUp(true);
    setShowCorrectAnswer(true);
    toast({
      title: "Temps écoulé !",
      description: "Voici la bonne réponse",
      variant: "destructive"
    });
  };

  // Réinitialiser les états du timer pour une nouvelle carte
  const resetTimerStates = () => {
    setTimeUp(false);
    setShowCorrectAnswer(false);
    setUserAnswer("");
  };

  // Vérifier que l'utilisateur est connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Connexion requise</h1>
          <p className="text-muted-foreground mb-6">Veuillez vous connecter pour accéder aux flashcards</p>
          <Button onClick={() => navigate('/login')}>Se connecter</Button>
        </div>
      </div>
    );
  }

  // Gestion d'erreur simple
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur Flashcards</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => setError(null)}>Réessayer</Button>
        </div>
      </div>
    );
  }

  const classes = {
    "9ème": {
      name: "9ème",
      sections: ["Général"],
      subjects: ["Mathématiques", "Français", "Anglais", "Histoire-Géographie", "Sciences Physiques"]
    },
    "Terminale": {
      name: "Terminale",
      sections: ["SMP", "SVT", "SES", "LLA"],
      subjects: {
        "SMP": ["Mathématiques", "Physique", "Chimie"],
        "SVT": ["Biologie", "Sciences de la Terre", "Chimie"],
        "SES": ["Économie", "Sociologie", "Mathématiques"],
        "LLA": ["Littérature", "Philosophie", "Histoire-Géographie"]
      }
    }
  };

  const subjects = {
    // Classe Terminale - Section SMP
    mathematics: {
      name: "Mathématiques",
      chapters: ["Algèbre", "Géométrie", "Analyse", "Statistiques", "Probabilités"],
      color: "text-primary",
      level: "Terminale SMP",
      flashcards: 156,
      accuracy: 85
    },
    physics: {
      name: "Physique",
      chapters: ["Mécanique", "Thermodynamique", "Électricité", "Optique", "Mécanique quantique"],
      color: "text-secondary",
      level: "Terminale SMP",
      flashcards: 142,
      accuracy: 78
    },
    chemistry: {
      name: "Chimie",
      chapters: ["Chimie organique", "Chimie inorganique", "Chimie physique", "Électrochimie"],
      color: "text-accent",
      level: "Terminale SMP",
      flashcards: 128,
      accuracy: 82
    },
    // Classe Terminale - Section SVT
    biology: {
      name: "Biologie",
      chapters: ["Biologie cellulaire", "Génétique", "Écologie", "Physiologie humaine", "Évolution"],
      color: "text-success",
      level: "Terminale SVT",
      flashcards: 134,
      accuracy: 88
    },
    earthSciences: {
      name: "Sciences de la Terre",
      chapters: ["Géologie", "Climatologie", "Sciences de l'environnement", "Géophysique"],
      color: "text-primary",
      level: "Terminale SVT",
      flashcards: 98,
      accuracy: 75
    },
    // Classe Terminale - Section SES
    economics: {
      name: "Économie",
      chapters: ["Microéconomie", "Macroéconomie", "Économie du développement", "Économie internationale"],
      color: "text-secondary",
      level: "Terminale SES",
      flashcards: 112,
      accuracy: 80
    },
    sociology: {
      name: "Sociologie",
      chapters: ["Structures sociales", "Institutions", "Problèmes contemporains", "Méthodes sociologiques"],
      color: "text-success",
      level: "Terminale SES",
      flashcards: 89,
      accuracy: 77
    },
    // Classe Terminale - Section LLA
    literature: {
      name: "Littérature",
      chapters: ["Analyse littéraire", "Composition", "Maîtrise de la langue", "Histoire littéraire"],
      color: "text-accent",
      level: "Terminale LLA",
      flashcards: 145,
      accuracy: 83
    },
    philosophy: {
      name: "Philosophie",
      chapters: ["Pensée critique", "Éthique", "Raisonnement philosophique", "Histoire de la philosophie"],
      color: "text-primary",
      level: "Terminale LLA",
      flashcards: 76,
      accuracy: 79
    },
    // Classe 9ème
    french: {
      name: "Français",
      chapters: ["Grammaire", "Orthographe", "Expression écrite", "Compréhension de texte"],
      color: "text-success",
      level: "9ème",
      flashcards: 167,
      accuracy: 86
    },
    history: {
      name: "Histoire-Géographie",
      chapters: ["Histoire du Sénégal", "Géographie du Sénégal", "Histoire mondiale", "Géographie mondiale"],
      color: "text-secondary",
      level: "9ème",
      flashcards: 123,
      accuracy: 81
    },
    sciences: {
      name: "Sciences Physiques",
      chapters: ["Physique de base", "Chimie de base", "Expériences", "Applications pratiques"],
      color: "text-accent",
      level: "9ème",
      flashcards: 98,
      accuracy: 74
    }
  };

  // Données de test pour les examens
  const examQuestions = {
    "Mathématiques": [
      { 
        question: "Résoudre l'équation du second degré : x² - 5x + 6 = 0", 
        options: ["x = 2 et x = 3", "x = 1 et x = 6", "x = -2 et x = -3", "x = 0 et x = 5"],
        correctAnswer: 0,
        explanation: "En utilisant la formule quadratique ou la factorisation : (x-2)(x-3) = 0",
        difficulty: "Moyen",
        points: 2
      },
      { 
        question: "Calculer la dérivée de f(x) = 3x³ - 2x² + 5x - 1", 
        options: ["9x² - 4x + 5", "6x² - 4x + 5", "9x² - 2x + 5", "3x² - 2x + 5"],
        correctAnswer: 0,
        explanation: "La dérivée de x^n est nx^(n-1). Donc 3x³ devient 9x², -2x² devient -4x, etc.",
        difficulty: "Moyen",
        points: 2
      },
      { 
        question: "Quelle est la probabilité d'obtenir deux fois 'pile' en lançant une pièce deux fois ?", 
        options: ["1/4", "1/2", "3/4", "1"],
        correctAnswer: 0,
        explanation: "Chaque lancer a une probabilité de 1/2. Pour deux lancers : (1/2) × (1/2) = 1/4",
        difficulty: "Facile",
        points: 1
      }
    ],
    "Physique": [
      { 
        question: "Un objet de 5 kg tombe d'une hauteur de 20 m. Quelle est sa vitesse au moment de l'impact ? (g = 10 m/s²)", 
        options: ["20 m/s", "40 m/s", "10 m/s", "200 m/s"],
        correctAnswer: 0,
        explanation: "v = √(2gh) = √(2 × 10 × 20) = √400 = 20 m/s",
        difficulty: "Moyen",
        points: 2
      },
      { 
        question: "Quelle est la résistance équivalente de deux résistances de 6Ω et 3Ω en parallèle ?", 
        options: ["2Ω", "9Ω", "18Ω", "3Ω"],
        correctAnswer: 0,
        explanation: "1/R = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2, donc R = 2Ω",
        difficulty: "Moyen",
        points: 2
      }
    ],
    "Chimie": [
      { 
        question: "Quelle est la masse molaire de H₂SO₄ ? (H=1, S=32, O=16)", 
        options: ["98 g/mol", "82 g/mol", "114 g/mol", "64 g/mol"],
        correctAnswer: 0,
        explanation: "2×1 + 32 + 4×16 = 2 + 32 + 64 = 98 g/mol",
        difficulty: "Facile",
        points: 1
      },
      { 
        question: "Quel est le pH d'une solution de HCl 0.1 M ?", 
        options: ["1", "7", "13", "0.1"],
        correctAnswer: 0,
        explanation: "HCl est un acide fort, donc pH = -log[H⁺] = -log(0.1) = 1",
        difficulty: "Moyen",
        points: 2
      }
    ],
    "Biologie": [
      { 
        question: "Quel processus permet aux plantes de produire leur propre nourriture ?", 
        options: ["La photosynthèse", "La respiration", "La digestion", "La fermentation"],
        correctAnswer: 0,
        explanation: "La photosynthèse utilise la lumière, l'eau et le CO₂ pour produire du glucose",
        difficulty: "Facile",
        points: 1
      },
      { 
        question: "Combien de paires de chromosomes possède l'être humain ?", 
        options: ["23", "46", "22", "24"],
        correctAnswer: 0,
        explanation: "L'être humain a 23 paires de chromosomes (46 chromosomes au total)",
        difficulty: "Facile",
        points: 1
      }
    ],
    "Français": [
      { 
        question: "Quelle est la nature grammaticale du mot 'rapidement' dans 'Il court rapidement' ?", 
        options: ["Adverbe", "Adjectif", "Nom", "Verbe"],
        correctAnswer: 0,
        explanation: "'Rapidement' modifie le verbe 'court', c'est donc un adverbe de manière",
        difficulty: "Moyen",
        points: 2
      },
      { 
        question: "Conjuguez le verbe 'aller' à la 3ème personne du pluriel au futur simple", 
        options: ["ils iront", "ils vont", "ils allèrent", "ils allaient"],
        correctAnswer: 0,
        explanation: "Le futur simple de 'aller' : j'irai, tu iras, il ira, nous irons, vous irez, ils iront",
        difficulty: "Moyen",
        points: 2
      }
    ]
  };

  // Données de test pour les flashcards
  const demoFlashcards = {
    "Mathématiques": [
      { question: "Quelle est la dérivée de x² + 3x + 2 ?", answer: "2x + 3", difficulty: "Facile" },
      { question: "Résoudre l'équation 2x + 5 = 13", answer: "x = 4", difficulty: "Facile" },
      { question: "Calculer l'intégrale de 3x² dx", answer: "x³ + C", difficulty: "Moyen" },
      { question: "Qu'est-ce que le théorème de Pythagore ?", answer: "a² + b² = c²", difficulty: "Facile" },
      { question: "Calculer la probabilité d'obtenir un 6 avec un dé", answer: "1/6", difficulty: "Facile" }
    ],
    "Physique": [
      { question: "Quelle est la formule de la vitesse ?", answer: "v = d/t", difficulty: "Facile" },
      { question: "Qu'est-ce que la loi d'Ohm ?", answer: "U = R × I", difficulty: "Moyen" },
      { question: "Calculer l'énergie cinétique d'un objet de 2kg à 10m/s", answer: "100 J", difficulty: "Moyen" },
      { question: "Quelle est la vitesse de la lumière ?", answer: "3 × 10⁸ m/s", difficulty: "Facile" },
      { question: "Qu'est-ce que l'effet Doppler ?", answer: "Changement de fréquence d'une onde", difficulty: "Difficile" }
    ],
    "Chimie": [
      { question: "Quel est le symbole chimique de l'or ?", answer: "Au", difficulty: "Facile" },
      { question: "Qu'est-ce qu'un acide selon Arrhenius ?", answer: "Substance qui libère H⁺", difficulty: "Moyen" },
      { question: "Écrire la formule de l'eau", answer: "H₂O", difficulty: "Facile" },
      { question: "Qu'est-ce que le pH neutre ?", answer: "pH = 7", difficulty: "Facile" },
      { question: "Nommer la réaction : 2H₂ + O₂ → 2H₂O", answer: "Combustion", difficulty: "Moyen" }
    ],
    "Biologie": [
      { question: "Quels sont les 4 bases de l'ADN ?", answer: "A, T, G, C", difficulty: "Facile" },
      { question: "Qu'est-ce que la photosynthèse ?", answer: "Production de glucose avec la lumière", difficulty: "Moyen" },
      { question: "Combien de chromosomes a l'être humain ?", answer: "46", difficulty: "Facile" },
      { question: "Qu'est-ce que l'ADN ?", answer: "Acide désoxyribonucléique", difficulty: "Moyen" },
      { question: "Nommer les 3 types de vaisseaux sanguins", answer: "Artères, veines, capillaires", difficulty: "Moyen" }
    ],
    "Français": [
      { question: "Conjuguer 'être' au présent", answer: "je suis, tu es, il est...", difficulty: "Facile" },
      { question: "Qu'est-ce qu'un nom commun ?", answer: "Nom qui désigne une catégorie", difficulty: "Facile" },
      { question: "Accord de 'les enfants' avec 'heureux'", answer: "Les enfants sont heureux", difficulty: "Moyen" },
      { question: "Qu'est-ce qu'un synonyme ?", answer: "Mot de même sens", difficulty: "Facile" },
      { question: "Conjuguer 'avoir' au passé composé", answer: "j'ai eu, tu as eu...", difficulty: "Moyen" }
    ],
    "Histoire-Géographie": [
      { question: "Quelle est la capitale du Sénégal ?", answer: "Dakar", difficulty: "Facile" },
      { question: "Qui était Léopold Sédar Senghor ?", answer: "Premier président du Sénégal", difficulty: "Facile" },
      { question: "Quel est le plus grand fleuve du Sénégal ?", answer: "Le Sénégal", difficulty: "Facile" },
      { question: "Qu'est-ce que la traite négrière ?", answer: "Commerce d'esclaves", difficulty: "Moyen" },
      { question: "Quel est le climat du Sénégal ?", answer: "Tropical", difficulty: "Facile" }
    ]
  };

  // Fonction pour calculer les flashcards disponibles (non complétées)
  const getAvailableFlashcards = () => {
    if (!userStats || !selectedSubject) return subjectFlashcards;
    
    const subject = availableSubjects.find(s => s.name === selectedSubject);
    if (!subject) return subjectFlashcards;
    
    // Si toutes les flashcards sont complétées, retourner un tableau vide
    if (subject.completedFlashcards >= subject.totalFlashcards) {
      return [];
    }
    
    // Retourner les flashcards non complétées
    return subjectFlashcards;
  };

  // Fonction pour vérifier si toutes les flashcards sont complétées
  const areAllFlashcardsCompleted = () => {
    if (!selectedSubject) return false;
    
    const subject = availableSubjects.find(s => s.name === selectedSubject);
    if (!subject) return false;
    
    return subject.completedFlashcards >= subject.totalFlashcards;
  };

  const handleStartFlashcards = () => {
    try {
      if (!selectedSubject) {
        toast({
          title: "Sélectionnez une matière",
          description: "Veuillez d'abord choisir une matière pour commencer les flashcards.",
          variant: "destructive"
        });
        return;
      }

      // Vérifier s'il y a des flashcards disponibles pour cette matière
      if (subjectFlashcards.length === 0) {
        toast({
          title: "Aucune flashcard disponible",
          description: "Il n'y a pas encore de flashcards pour cette matière.",
          variant: "destructive"
        });
        return;
      }

      // Vérifier si toutes les flashcards sont déjà complétées
      const subject = availableSubjects.find(s => s.name === selectedSubject);
      if (subject && subject.completedFlashcards >= subject.totalFlashcards) {
        toast({
          title: "Toutes les flashcards sont complétées !",
          description: `Vous avez déjà terminé toutes les ${subject.totalFlashcards} flashcards de ${selectedSubject}. Félicitations ! 🎉`,
          variant: "default"
        });
        return;
      }

      // Démarrer la session de flashcards
      setShowDemo(true);
      setCurrentCard(0);
      setShowAnswer(false);
      setUserAnswer("");
      setScore(0);

      const availableCount = subject ? subject.totalFlashcards - subject.completedFlashcards : subjectFlashcards.length;
      toast({
        title: "Session de flashcards démarrée",
        description: `${availableCount} flashcards restantes pour ${selectedSubject}`,
      });
    } catch (err) {
      console.error('Error starting flashcards:', err);
      setError('Erreur lors du démarrage des flashcards');
    }
  };

  const handleNextCard = () => {
    // Vérifier si toutes les flashcards sont complétées
    const subject = availableSubjects.find(s => s.name === selectedSubject);
    if (subject && subject.completedFlashcards >= subject.totalFlashcards) {
      toast({
        title: "Toutes les flashcards sont complétées !",
        description: `Vous avez terminé toutes les ${subject.totalFlashcards} flashcards de ${selectedSubject}. Félicitations ! 🎉`,
        variant: "default"
      });
      setShowDemo(false);
      return;
    }

    if (currentCard < subjectFlashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
      resetTimerStates(); // Réinitialiser les états du timer
    } else {
      toast({
        title: "Session terminée",
        description: `Score final: ${score}/${subjectFlashcards.length}`,
      });
      setShowDemo(false);
    }
  };

  const handleCheckAnswer = async () => {
    const currentCardData = subjectFlashcards[currentCard];
    if (!currentCardData) return;

    const isCorrect = userAnswer.toLowerCase().includes(currentCardData.answer.toLowerCase());
    
    // Enregistrer la tentative dans la base de données
    await saveFlashcardAttempt(currentCardData.id, isCorrect, 30); // 30 secondes par défaut

    if (isCorrect) {
      setScore(score + 1);
      toast({
        title: "Correct !",
        description: "Bonne réponse !",
      });
    } else {
      toast({
        title: "Incorrect",
        description: `La bonne réponse était : ${currentCardData.answer}`,
        variant: "destructive"
      });
    }
    setShowAnswer(true);

    // Vérifier si toutes les flashcards sont maintenant complétées
    setTimeout(async () => {
      await loadUserStats(); // Recharger les statistiques
      const subject = availableSubjects.find(s => s.name === selectedSubject);
      if (subject && subject.completedFlashcards >= subject.totalFlashcards) {
        toast({
          title: "🎉 Félicitations !",
          description: `Vous avez terminé toutes les ${subject.totalFlashcards} flashcards de ${selectedSubject} !`,
          variant: "default"
        });
        setShowDemo(false);
      }
    }, 1000);
  };

  const handleStartExam = () => {
    const questions = examQuestions[selectedSubject as keyof typeof examQuestions] || [];
    if (questions.length === 0) {
    toast({
        title: "Aucune question disponible",
        description: "Aucune question d'examen n'est disponible pour cette matière.",
        variant: "destructive"
      });
      return;
    }
    
    setShowExam(true);
    setShowDemo(false);
    setCurrentExamQuestion(0);
    setExamAnswers(new Array(questions.length).fill(-1));
    setExamScore(0);
    setExamTimeLeft(questions.length * 60); // 1 minute par question
    setExamCompleted(false);
    
    toast({
      title: "Examen démarré",
      description: `Vous avez ${questions.length} questions à répondre en ${questions.length} minutes.`,
    });
  };

  const handleExamAnswer = (answerIndex: number) => {
    const newAnswers = [...examAnswers];
    newAnswers[currentExamQuestion] = answerIndex;
    setExamAnswers(newAnswers);
  };

  const handleNextExamQuestion = () => {
    const questions = examQuestions[selectedSubject as keyof typeof examQuestions] || [];
    if (currentExamQuestion < questions.length - 1) {
      setCurrentExamQuestion(currentExamQuestion + 1);
    } else {
      // Fin de l'examen
      calculateExamScore();
      setExamCompleted(true);
    }
  };

  const handlePreviousExamQuestion = () => {
    if (currentExamQuestion > 0) {
      setCurrentExamQuestion(currentExamQuestion - 1);
    }
  };

  const calculateExamScore = () => {
    const questions = examQuestions[selectedSubject as keyof typeof examQuestions] || [];
    let totalScore = 0;
    let maxScore = 0;
    
    questions.forEach((question, index) => {
      maxScore += question.points;
      if (examAnswers[index] === question.correctAnswer) {
        totalScore += question.points;
      }
    });
    
    setExamScore(Math.round((totalScore / maxScore) * 100));
  };

  const resetExam = () => {
    setShowExam(false);
    setCurrentExamQuestion(0);
    setExamAnswers([]);
    setExamScore(0);
    setExamTimeLeft(0);
    setExamCompleted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Centre d'<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Apprentissage</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Maîtrisez vos matières avec nos flashcards intelligentes et progressez à votre rythme
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Matières Disponibles</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loadingStats ? '...' : (userStats?.userStats?.totalSubjects || availableSubjects.length || 0)}
                </p>
            </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
          </Card>
          
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Flashcards</p>
                <p className="text-3xl font-bold text-green-600">
                  {loadingStats ? '...' : (userStats?.userStats?.totalFlashcards || 0)}
                </p>
              </div>
              <BookMarked className="w-8 h-8 text-green-500" />
                </div>
          </Card>
          
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de Réussite Moyen</p>
                <p className="text-3xl font-bold text-purple-600">
                  {loadingStats ? '...' : (userStats?.userStats?.averageAccuracy || 0)}%
                </p>
              </div>
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Niveau Actuel</p>
                <p className="text-3xl font-bold text-orange-600">{user?.userClass || 'Non défini'}</p>
            </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>


        {/* Learning Path Selection - Only show if no mode is selected */}
        {!showDemo && !showExam && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Choisissez votre parcours d'apprentissage</h2>
              <p className="text-base md:text-lg text-gray-600">Sélectionnez une matière et un chapitre pour commencer</p>
              
              {/* Message informatif sur les sections */}
              {user && user.role === 'STUDENT' && user.section && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Section {user.section}</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Vous avez accès aux matières générales et aux matières spécifiques à votre section ({user.section}).
                    Pour accéder à d'autres matières, modifiez votre profil.
                  </p>
                </div>
              )}
              
              {user && user.role === 'STUDENT' && !user.section && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">Section non définie</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Vous n'avez accès qu'aux matières générales. Pour accéder aux matières spécifiques (SMP, SVT, LLA, SES), 
                    modifiez votre profil pour définir votre section.
                  </p>
                </div>
              )}
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Subject Selection */}
              <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Matière</h3>
                    <p className="text-sm md:text-base text-gray-600">Sélectionnez la matière</p>
                    {user && (
                      <p className="text-xs text-blue-600 mt-1">
                        📚 Matières de votre profil ({user.userClass}{user.section ? ` - ${user.section}` : ''})
                      </p>
                    )}
                  </div>
        </div>

            <Select value={selectedSubject} onValueChange={async (value) => {
              setSelectedSubject(value);
              setSelectedChapter("");
              setAvailableChapters([]);
              
              // Charger les flashcards de la matière sélectionnée
              const subject = availableSubjects.find(s => s.name === value);
              if (subject) {
                loadSubjectFlashcards(subject.id);
                
                // Charger les chapitres pour cette matière
                if (subject.chapters && subject.chapters.length > 0) {
                  setAvailableChapters(subject.chapters);
                } else {
                  // Fallback: charger depuis l'API
                  try {
                    const response = await fetch(`/api/subject-chapters/${subject.id}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setAvailableChapters(data.chapters);
                    }
                  } catch (error) {
                    console.error('Erreur lors du chargement des chapitres:', error);
                  }
                }
              }
            }}>
              <SelectTrigger className="h-10 md:h-12 text-base md:text-lg">
                <SelectValue placeholder={loadingStats ? "Chargement..." : "Choisissez votre matière"} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{subject.name}</span>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {subject.totalFlashcards} cartes
                        </Badge>
                        {subject.accuracy > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {subject.accuracy}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          {selectedSubject && (() => {
            const subject = availableSubjects.find(s => s.name === selectedSubject);
            return subject ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Matière sélectionnée</p>
                    <p className="text-sm text-blue-700">{selectedSubject}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Total Flashcards</p>
                    <p className="text-lg font-bold text-blue-800">{subject.totalFlashcards}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Progression</p>
                    <p className="text-lg font-bold text-blue-800">{subject.progress}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Complétées</p>
                    <p className="text-lg font-bold text-blue-800">{subject.completedFlashcards}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Restantes</p>
                    <p className={`text-lg font-bold ${subject.totalFlashcards - subject.completedFlashcards === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {subject.totalFlashcards - subject.completedFlashcards}
                    </p>
                  </div>
                  {subject.accuracy > 0 && (
                    <div className="text-center col-span-2">
                      <p className="text-xs text-blue-600">Taux de Réussite</p>
                      <p className="text-lg font-bold text-blue-800">{subject.accuracy}%</p>
                    </div>
                  )}
                </div>
                {subject.totalFlashcards - subject.completedFlashcards === 0 && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-sm font-medium text-green-800">
                        🎉 Toutes les flashcards sont complétées !
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Matière sélectionnée</p>
                    <p className="text-sm text-blue-700">{selectedSubject}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            );
          })()}
          </Card>

              {/* Add Flashcard Button */}
              {selectedSubject && (
                <div className="flex justify-center mb-6 mt-4">
                  <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={resetCreateForm} 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Ajouter une Flashcard
                      </Button>
                    </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Créer une nouvelle flashcard</DialogTitle>
                          <DialogDescription>
                            Ajoutez une nouvelle flashcard pour {selectedSubject}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question">Question *</Label>
                            <Textarea
                              id="question"
                              value={createForm.question}
                              onChange={(e) => setCreateForm({...createForm, question: e.target.value})}
                              placeholder="Posez votre question..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="answer">Réponse *</Label>
                            <Textarea
                              id="answer"
                              value={createForm.answer}
                              onChange={(e) => setCreateForm({...createForm, answer: e.target.value})}
                              placeholder="Donnez la réponse..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="difficulty">Difficulté</Label>
                            <Select value={createForm.difficulty} onValueChange={(value) => setCreateForm({...createForm, difficulty: value})}>
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
                          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Annuler
                          </Button>
                          <Button onClick={handleCreateFlashcard} className="bg-purple-600 hover:bg-purple-700">
                            Créer la flashcard
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
              )}

              {/* Chapter Selection */}
              <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Chapitre</h3>
                    <p className="text-sm md:text-base text-gray-600">Choisissez le chapitre</p>
                  </div>
                </div>
                
                {selectedSubject ? (
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                    <SelectTrigger className="h-10 md:h-12 text-base md:text-lg">
                  <SelectValue placeholder="Choisissez un chapitre" />
                </SelectTrigger>
                <SelectContent>
                  {availableChapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.name}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                ) : (
                  <div className="h-10 md:h-12 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-sm">
                    Sélectionnez d'abord une matière
                  </div>
                )}

                {selectedChapter && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Chapitre sélectionné</p>
                        <p className="text-sm text-green-700">{selectedChapter}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                )}
            </Card>
            </div>
          </div>
        )}

        {/* Study Options - Only show if no mode is selected */}
        {selectedSubject && selectedChapter && !showDemo && !showExam && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Modes d'étude disponibles</h2>
              <p className="text-base md:text-lg text-gray-600">Choisissez le mode qui correspond le mieux à vos besoins</p>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Flashcard Study Mode */}
              <Card className={`p-4 md:p-6 border-0 shadow-xl transition-all duration-300 group ${
                areAllFlashcardsCompleted() 
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl cursor-pointer'
              }`} onClick={areAllFlashcardsCompleted() ? undefined : handleStartFlashcards}>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Étude Interactive</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">Apprenez avec des flashcards adaptatives</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Cartes disponibles</span>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs">
                  {(() => {
                    const subject = Object.values(subjects).find(s => s.name === selectedSubject);
                    return subject ? `${subject.flashcards} cartes` : "0 cartes";
                  })()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Niveau</span>
                      <Badge variant="outline" className="text-xs">Adaptatif</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full text-white text-sm md:text-base ${
                      areAllFlashcardsCompleted() 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={areAllFlashcardsCompleted()}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {areAllFlashcardsCompleted() ? 'Terminé !' : 'Commencer l\'étude'}
                  </Button>
              </div>
            </Card>

              {/* Review Mode */}
              <Card className={`p-4 md:p-6 border-0 shadow-xl transition-all duration-300 group ${
                areAllFlashcardsCompleted() 
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl cursor-pointer'
              }`} onClick={areAllFlashcardsCompleted() ? undefined : handleStartFlashcards}>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <RotateCcw className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Mode Révision</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">Révisez les cartes étudiées</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">À réviser</span>
                      <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                  {(() => {
                    const subject = Object.values(subjects).find(s => s.name === selectedSubject);
                          return subject ? `${Math.floor(subject.flashcards * 0.3)} cartes` : "0 cartes";
                  })()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Efficacité</span>
                      <Badge variant="outline" className="text-xs">Optimisée</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full text-white text-sm md:text-base ${
                      areAllFlashcardsCompleted() 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={areAllFlashcardsCompleted()}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {areAllFlashcardsCompleted() ? 'Terminé !' : 'Commencer la révision'}
                  </Button>
              </div>
            </Card>

              {/* Exam Mode */}
              <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={handleStartExam}>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Test de Connaissance</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">Évaluez vos connaissances</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Questions</span>
                      <Badge variant="secondary" className="bg-purple-200 text-purple-800 text-xs">
                  {(() => {
                          const questions = examQuestions[selectedSubject as keyof typeof examQuestions] || [];
                          return `${questions.length} questions`;
                  })()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Durée</span>
                      <Badge variant="outline" className="text-xs">Chronométré</Badge>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base">
                    <Trophy className="w-4 h-4 mr-2" />
                    Passer le test
                  </Button>
              </div>
            </Card>
            </div>
          </div>
        )}

        {/* Demo Flashcards */}
        {showDemo && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  onClick={() => setShowDemo(false)} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Retour
                </Button>
                <div></div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Session d'étude en cours</h2>
              <p className="text-base md:text-lg text-gray-600 mb-4">Matière: {selectedSubject} • Chapitre: {selectedChapter}</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Carte {currentCard + 1} sur {subjectFlashcards.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Score: {score}</span>
                </div>
              </div>
            </div>

            <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">

            {(() => {
              const currentCardData = subjectFlashcards[currentCard];
              
              if (!currentCardData) {
                return (
                  <div className="text-center p-4">
                    <p className="text-red-600 mb-2">Aucune carte trouvée pour "{selectedSubject}"</p>
                    <p className="text-sm text-gray-600">Chargement des flashcards...</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Question Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl md:rounded-2xl p-4 md:p-6 border-0 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900">Question</h3>
                          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
                        {currentCardData.difficulty || 'Moyen'}
                      </Badge>
                    </div>
                      </div>
                    
                    {/* Timer */}
                    {!showAnswer && !timeUp && (
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                          <TimerIcon className="w-4 h-4 text-blue-600" />
                        <Timer 
                          duration={15} 
                          onTimeUp={handleTimeUp}
                            className="text-blue-600 font-bold text-sm"
                        />
                      </div>
                    )}
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
                      <h4 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                        {currentCardData.question}
                      </h4>
                    </div>
                    
                    {/* Message temps écoulé */}
                    {timeUp && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold text-sm">Temps écoulé !</span>
                        </div>
                        <p className="text-red-700 text-xs mt-1">Voici la bonne réponse :</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Answer Input */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 border-0 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-500 rounded-full flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">Votre réponse</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Tapez votre réponse ici..."
                        className="w-full p-3 md:p-4 text-base md:text-lg border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={showAnswer || timeUp}
                      />
                      
                      {!showAnswer && !timeUp ? (
                        <Button onClick={handleCheckAnswer} className="w-full h-10 md:h-12 text-base md:text-lg bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Vérifier ma réponse
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg md:rounded-xl p-4 md:p-6">
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                              <span className="text-base md:text-lg font-bold text-green-800">Bonne réponse :</span>
                            </div>
                            <p className="text-green-700 text-base md:text-lg leading-relaxed">{currentCardData.answer}</p>
          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleNextCard} className="flex-1 h-10 md:h-12 text-base md:text-lg bg-green-600 hover:bg-green-700">
                              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                              Carte suivante
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowDemo(false)}
                              className="flex-1 h-10 md:h-12 text-base md:text-lg border-2"
                            >
                              <XCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                              Terminer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>
          </div>
        )}

        {/* Exam Interface */}
        {showExam && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  onClick={resetExam} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Retour
                </Button>
                <div></div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Test de Connaissance</h2>
              <p className="text-base md:text-lg text-gray-600 mb-4">Matière: {selectedSubject} • Chapitre: {selectedChapter}</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                  <Trophy className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentExamQuestion + 1} sur {examQuestions[selectedSubject as keyof typeof examQuestions]?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                  <TimerIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Temps restant: {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {!examCompleted ? (
              <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                {(() => {
                  const questions = examQuestions[selectedSubject as keyof typeof examQuestions] || [];
                  const currentQuestion = questions[currentExamQuestion];
                  
                  if (!currentQuestion) {
                    return (
                      <div className="text-center p-4">
                        <p className="text-red-600 mb-2">Aucune question disponible</p>
                        <Button onClick={resetExam} variant="outline">
                          Retour
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Question */}
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl md:rounded-2xl p-4 md:p-6 border-0 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-base md:text-lg font-bold text-gray-900">Question {currentExamQuestion + 1}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 text-xs">
                                  {currentQuestion.difficulty}
                                </Badge>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
                          <h4 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                            {currentQuestion.question}
                          </h4>
                        </div>
                      </div>
                      
                      {/* Options de réponse */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 border-0 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-500 rounded-full flex items-center justify-center">
                            <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900">Choisissez votre réponse</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleExamAnswer(index)}
                              className={`w-full p-3 md:p-4 text-left rounded-lg md:rounded-xl border-2 transition-all duration-200 ${
                                examAnswers[currentExamQuestion] === index
                                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                                  : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-25'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${
                                  examAnswers[currentExamQuestion] === index
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300'
                                }`}>
                                  {examAnswers[currentExamQuestion] === index && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <span className="font-medium text-sm md:text-base">{String.fromCharCode(65 + index)}. {option}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Navigation */}
                        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                          <Button 
                            onClick={handlePreviousExamQuestion}
                            disabled={currentExamQuestion === 0}
                            variant="outline"
                            className="px-4 md:px-6 h-10 md:h-12"
                          >
                            ← Précédent
                          </Button>
                          
                          <Button 
                            onClick={handleNextExamQuestion}
                            disabled={examAnswers[currentExamQuestion] === -1}
                            className="px-4 md:px-6 bg-purple-600 hover:bg-purple-700 h-10 md:h-12"
                          >
                            {currentExamQuestion === questions.length - 1 ? 'Terminer l\'examen' : 'Suivant →'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            ) : (
              /* Résultats de l'examen */
              <Card className="p-4 md:p-6 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Examen Terminé !</h3>
                    <p className="text-base md:text-lg text-gray-600">Voici vos résultats</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-green-200">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{examScore}%</div>
                    <div className="text-base md:text-lg text-gray-600 mb-3 md:mb-4">Score Final</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 md:h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${examScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-blue-50 rounded-lg md:rounded-xl p-3 md:p-4">
                      <div className="text-xl md:text-2xl font-bold text-blue-600">
                        {examQuestions[selectedSubject as keyof typeof examQuestions]?.length || 0}
                      </div>
                      <div className="text-xs md:text-sm text-blue-800">Questions</div>
                    </div>
                    <div className="bg-green-50 rounded-lg md:rounded-xl p-3 md:p-4">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {examAnswers.filter((answer, index) => {
                          const question = examQuestions[selectedSubject as keyof typeof examQuestions]?.[index];
                          return question && answer === question.correctAnswer;
                        }).length}
                      </div>
                      <div className="text-xs md:text-sm text-green-800">Correctes</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg md:rounded-xl p-3 md:p-4">
                      <div className="text-lg md:text-2xl font-bold text-purple-600">
                        {examScore >= 70 ? 'Excellent' : examScore >= 50 ? 'Bien' : 'À améliorer'}
                      </div>
                      <div className="text-xs md:text-sm text-purple-800">Niveau</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    <Button onClick={resetExam} variant="outline" className="px-4 md:px-6 h-10 md:h-12">
                      Nouvel Examen
                    </Button>
                    <Button onClick={() => setShowExam(false)} className="px-4 md:px-6 bg-purple-600 hover:bg-purple-700 h-10 md:h-12">
                      Retour aux Flashcards
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Flashcards;