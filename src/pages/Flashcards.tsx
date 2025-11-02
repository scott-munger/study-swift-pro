import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Clock, Trophy, RotateCcw, ChevronRight, Play, Eye, EyeOff, 
  CheckCircle, XCircle, User, Brain, Target, Zap, Star, TrendingUp,
  BookMarked, Award, Timer as TimerIcon, Lightbulb, HelpCircle, LogIn,
  ClipboardCheck, Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFlashcards } from "@/contexts/FlashcardContext";
import Timer from "@/components/ui/timer";
import SocialShareButton from "@/components/ui/SocialShareButton";
import { API_CONFIG } from "@/config/api";

const Flashcards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getFlashcardsBySubject, refreshFlashcards } = useFlashcards();
  const navigate = useNavigate();

  // États déclarés en premier
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

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
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérification d'authentification
  useEffect(() => {
    console.log('🔍 Flashcards - Vérification d\'authentification:', { user: user ? 'Présent' : 'Absent' });
    
    // Vérifier d'abord le contexte React, puis localStorage comme fallback
    let currentUser = user;
    let userRole = null;
    
    if (!currentUser) {
      // Fallback: vérifier localStorage si le contexte React n'a pas l'utilisateur
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          currentUser = JSON.parse(savedUser);
          userRole = currentUser.role;
          console.log('🔍 Flashcards - Utilisateur récupéré depuis localStorage:', {
            email: currentUser.email,
            role: currentUser.role
          });
        } catch (error) {
          console.error('🔍 Flashcards - Erreur parsing utilisateur localStorage:', error);
        }
      }
    } else {
      userRole = currentUser.role;
    }
    
    if (!currentUser) {
      console.log('🔍 Flashcards - Utilisateur non connecté, redirection vers /login');
      toast({
        title: "Accès restreint",
        description: "Vous devez être connecté pour accéder aux flashcards",
        variant: "destructive"
      });
      navigate('/login');
    } else if (userRole !== 'STUDENT' && userRole !== 'TUTOR' && userRole !== 'ADMIN') {
      console.log('🔍 Flashcards - Rôle non autorisé:', userRole);
      toast({
        title: "Accès non autorisé",
        description: "Seuls les étudiants, tuteurs et administrateurs peuvent accéder aux flashcards",
        variant: "destructive"
      });
      navigate('/');
    } else {
      console.log('🔍 Flashcards - Utilisateur connecté:', { 
        email: currentUser.email, 
        role: userRole, 
        userClass: currentUser.userClass,
        section: currentUser.section 
      });
    }
  }, [user, navigate, toast]);

  // Restaurer l'état depuis localStorage au chargement
  useEffect(() => {
    const savedState = localStorage.getItem('flashcards-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setSelectedClass(state.selectedClass || "");
        setSelectedSection(state.selectedSection || "");
        setSelectedSubject(state.selectedSubject || "");
        setSelectedChapter(state.selectedChapter || "");
      } catch (error) {
        console.error('Erreur lors de la restauration de l\'état:', error);
      }
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    const state = {
      selectedClass,
      selectedSection,
      selectedSubject,
      selectedChapter
    };
    localStorage.setItem('flashcards-state', JSON.stringify(state));
  }, [selectedClass, selectedSection, selectedSubject, selectedChapter]);


  // Fonction pour charger les statistiques utilisateur
  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_CONFIG.ENDPOINTS.STATS_FLASHCARDS, {
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
      const user = localStorage.getItem('user');
      console.log('loadAvailableSubjects - Token:', token ? 'Présent' : 'Absent');
      console.log('loadAvailableSubjects - User:', user ? 'Présent' : 'Absent');
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          console.log('loadAvailableSubjects - User data:', {
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName
          });
        } catch (e) {
          console.log('loadAvailableSubjects - Erreur parsing user:', e);
        }
      }
      
      // Essayer d'abord l'endpoint avec authentification si un token existe
      if (token) {
        console.log('Tentative avec authentification:', API_CONFIG.ENDPOINTS.SUBJECTS_FLASHCARDS);
        try {
          const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECTS_FLASHCARDS, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Réponse authentifiée:', response.status, response.statusText);
          
          if (response.ok) {
            const subjects = await response.json();
            console.log('Matières reçues (authentifiées):', subjects);
            console.log('Nombre de matières reçues:', subjects.length);
            
            // Debug: vérifier les propriétés des matières
            if (subjects.length > 0) {
              console.log('Première matière (debug):', {
                name: subjects[0].name,
                totalFlashcards: subjects[0].totalFlashcards,
                completedFlashcards: subjects[0].completedFlashcards,
                hasTotalFlashcards: 'totalFlashcards' in subjects[0]
              });
            }
            
            setAvailableSubjects(subjects);
            console.log('Matières définies dans le state (authentifiées):', subjects.length);
            console.log('Première matière (détail):', subjects[0]);
            return; // Succès, on sort de la fonction
          } else {
            console.log('Échec de l\'authentification, fallback vers endpoint public');
          }
        } catch (authError) {
          console.log('Erreur d\'authentification, fallback vers endpoint public:', authError);
        }
      }
      
      // Fallback vers l'endpoint public
      console.log('Chargement des matières depuis endpoint public:', API_CONFIG.ENDPOINTS.SUBJECTS);
      const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECTS);

      console.log('Réponse publique reçue:', response.status, response.statusText);
      
      if (response.ok) {
        const subjects = await response.json();
        console.log('Matières reçues (publiques):', subjects);
        console.log('Nombre de matières reçues:', subjects.length);
        
        // Filtrer les matières côté frontend selon le profil utilisateur
        const filteredSubjects = filterSubjectsByProfile(subjects);
        console.log('Matières filtrées selon le profil:', filteredSubjects.length);
        
        // Ajouter les statistiques de flashcards pour chaque matière
        const subjectsWithStats = await Promise.all(
          filteredSubjects.map(async (subject) => {
            try {
              const flashcardsResponse = await fetch(API_CONFIG.ENDPOINTS.SUBJECT_FLASHCARDS(subject.id));
              if (flashcardsResponse.ok) {
                const flashcardsData = await flashcardsResponse.json();
                const flashcards = Array.isArray(flashcardsData) ? flashcardsData : flashcardsData.flashcards || [];
                return {
                  ...subject,
                  totalFlashcards: flashcards.length,
                  completedFlashcards: 0,
                  accuracy: 0,
                  progress: 0
                };
              }
            } catch (error) {
              console.error(`Erreur lors du chargement des flashcards pour ${subject.name}:`, error);
            }
            return {
              ...subject,
              totalFlashcards: 0,
              completedFlashcards: 0,
              accuracy: 0,
              progress: 0
            };
          })
        );
        
        setAvailableSubjects(subjectsWithStats);
        console.log('Matières filtrées avec statistiques et définies dans le state:', subjectsWithStats.length);
        console.log('Première matière avec stats (détail):', subjectsWithStats[0]);
      } else {
        console.error('Erreur de réponse publique:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Détails de l\'erreur:', errorText);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  // Fonction pour filtrer les matières selon le profil utilisateur
  const filterSubjectsByProfile = (subjects: any[]) => {
    // Récupérer les informations du profil
    const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
    
    console.log('Filtrage des matières - Utilisateur:', currentUser);
    console.log('Filtrage des matières - Nombre de matières à filtrer:', subjects.length);
    
    if (!currentUser) {
      console.log('Filtrage des matières - Pas d\'utilisateur, retour de toutes les matières');
      return subjects; // Retourner toutes les matières si pas d'utilisateur
    }

    // Si c'est un tuteur ou admin, donner accès à toutes les matières
    if (currentUser.role === 'TUTOR' || currentUser.role === 'ADMIN') {
      console.log('Filtrage des matières - Utilisateur TUTOR/ADMIN, retour de toutes les matières');
      return subjects;
    }

    // Pour les étudiants, filtrer selon leur niveau ET leur section
    const userClass = currentUser.userClass;
    const userSection = currentUser.section;
    
    console.log('Filtrage des matières - Classe utilisateur:', userClass);
    console.log('Filtrage des matières - Section utilisateur:', userSection);
    
    // Si pas de classe définie, retourner toutes les matières
    if (!userClass) {
      console.log('Filtrage des matières - Pas de classe définie, retour de toutes les matières');
      return subjects;
    }

    // Filtrer selon le niveau de la matière correspondant à la classe de l'étudiant
    const classToLevel = {
      "9ème": "9ème",
      "Terminale": "Terminale"
    };
    
    const expectedLevel = classToLevel[userClass as keyof typeof classToLevel];
    console.log('Filtrage des matières - Niveau attendu:', expectedLevel);
    
    const filteredSubjects = subjects.filter(subject => {
      // Vérifier d'abord le niveau
      const levelMatches = subject.level === expectedLevel;
      
      if (!levelMatches) {
        return false;
      }
      
      // Si la matière n'a pas de section spécifique (matières générales), l'étudiant y a accès
      if (!subject.section) {
        console.log(`Filtrage des matières - Matière générale: ${subject.name} (${subject.level})`);
        return true;
      }
      
      // Si la matière a une section spécifique, vérifier que l'étudiant est dans cette section
      const sectionMatches = subject.section === userSection;
      
      if (sectionMatches) {
        console.log(`Filtrage des matières - Matière de section: ${subject.name} (${subject.level}, ${subject.section})`);
      } else {
        console.log(`Filtrage des matières - Matière non accessible: ${subject.name} (${subject.level}, ${subject.section}) - Étudiant en ${userSection}`);
      }
      
      return sectionMatches;
    });
    
    console.log('Filtrage des matières - Nombre de matières filtrées:', filteredSubjects.length);
    console.log('Filtrage des matières - Matières accessibles:', filteredSubjects.map(s => `${s.name} (${s.section || 'Générale'})`));
    
    return filteredSubjects;
  };

  // Fonction pour charger les flashcards d'une matière
  const loadSubjectFlashcards = async (subjectId: number, chapterId?: number | string | null) => {
    try {
      console.log('🔍 Chargement des flashcards pour la matière:', subjectId, 'chapitre:', chapterId);

      // Utiliser le contexte global pour obtenir les flashcards
      const allFlashcards = getFlashcardsBySubject(subjectId);
      console.log('🔍 Flashcards trouvées dans le contexte:', allFlashcards.length);
      
      // Filtrer par chapitre - uniquement si un chapitre est sélectionné
      let filteredFlashcards: any[] = [];
      
      if (chapterId && chapterId !== 'none' && chapterId !== 'all' && chapterId !== null) {
        // Chapitre spécifique : afficher UNIQUEMENT les flashcards de ce chapitre
        const targetChapterId = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
        filteredFlashcards = allFlashcards.filter((card: any) => {
          const cardChapterId = card.chapterId;
          return cardChapterId === targetChapterId;
        });
        console.log('🔍 Flashcards filtrées par chapitre:', filteredFlashcards.length, 'pour chapitre ID:', targetChapterId);
      } else {
        // Si aucun chapitre n'est sélectionné, ne pas afficher de flashcards
        console.log('⚠️ Aucun chapitre sélectionné, aucune flashcard affichée');
        filteredFlashcards = [];
      }
      
      setSubjectFlashcards(filteredFlashcards);
      console.log('🔍 Flashcards définies dans le state:', filteredFlashcards.length);
    } catch (error) {
      console.error('Erreur lors du chargement des flashcards:', error);
    }
  };

  // Fonction pour créer une nouvelle flashcard

  // Fonction pour mettre à jour une flashcard
  const updateFlashcard = async (flashcardId: number, question: string, answer: string, subjectId: number, difficulty: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_CONFIG.BASE_URL}/flashcards/${flashcardId}`, {
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/flashcards/${flashcardId}`, {
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

  // Fonction pour enregistrer une tentative de flashcard
  const saveFlashcardAttempt = async (flashcardId: number, isCorrect: boolean, timeSpent: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(API_CONFIG.ENDPOINTS.FLASHCARD_ATTEMPT, {
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

  // Fonction pour calculer le nombre de cartes disponibles pour l'étude interactive
  const getAvailableCardsCount = () => {
    if (!selectedSubject || !selectedChapter) return 0;
    
    const subjectId = parseInt(selectedSubject);
    if (!subjectId) return 0;
    
    // Utiliser les flashcards du contexte
    const allFlashcards = getFlashcardsBySubject(subjectId);
    
    // Filtrer uniquement par chapitre sélectionné (plus d'option "Tous les chapitres" ou "Sans chapitre")
    if (selectedChapter && selectedChapter !== 'none' && selectedChapter !== 'all' && selectedChapter !== null) {
      const targetChapterId = typeof selectedChapter === 'string' ? parseInt(selectedChapter) : selectedChapter;
      const filteredCards = allFlashcards.filter(card => card.chapterId === targetChapterId);
      return filteredCards.length;
    }
    
    return 0;
  };

  // Fonction pour calculer le nombre de cartes à réviser (basé sur les tentatives)
  const getReviewCardsCount = () => {
    if (!selectedSubject) return 0;
    
    const subjectId = parseInt(selectedSubject);
    const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
    if (!subject) return 0;
    
    // Pour l'instant, on prend 30% des cartes disponibles comme cartes à réviser
    const availableCount = getAvailableCardsCount();
    return Math.floor(availableCount * 0.3);
  };

  // Fonction pour calculer le nombre de tests disponibles
  const getAvailableTestsCount = () => {
    if (!selectedSubject) return 0;
    
    // Retourner un nombre de tests basé sur le nombre de cartes disponibles
    const availableCount = getAvailableCardsCount();
    return Math.max(1, Math.floor(availableCount / 3)); // 1 test pour 3 flashcards
  };

  // Fonction pour charger les chapitres d'une matière
  const loadChapters = async (subjectId: number) => {
    try {
      console.log('🔍 Chargement des chapitres pour la matière:', subjectId);
      
      // Utiliser les chapitres déjà chargés depuis availableSubjects (qui incluent questionCount)
      const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === subjectId.toString());
      
      if (subject && subject.chapters) {
        console.log('🔍 Chapitres trouvés dans availableSubjects:', subject.chapters.length, 'avec questions');
        setAvailableChapters(subject.chapters || []);
        return;
      }
      
      // Fallback : charger depuis l'API si pas trouvé dans availableSubjects
      const response = await fetch(API_CONFIG.ENDPOINTS.SUBJECT_CHAPTERS(subjectId));
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Chapitres reçus depuis API:', data.chapters);
        setAvailableChapters(data.chapters || []);
      } else {
        console.log('🔍 Aucun chapitre trouvé pour cette matière');
        setAvailableChapters([]);
      }
    } catch (error) {
      console.error('🔍 Erreur lors du chargement des chapitres:', error);
      setAvailableChapters([]);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const initializeComponent = async () => {
      // Vérifier si l'utilisateur est connecté (via user ou localStorage)
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('🔍 useEffect - Token:', token ? 'Présent' : 'Absent');
      console.log('🔍 useEffect - User context:', user ? 'Présent' : 'Absent');
      console.log('🔍 useEffect - Saved user:', savedUser ? 'Présent' : 'Absent');
      
      // Charger les données même si l'utilisateur n'est pas connecté
      setLoadingStats(true);
      console.log('🔍 useEffect - Chargement des données...');
      console.log('🔍 useEffect - Appel de loadAvailableSubjects...');
      
      if (user || (token && savedUser)) {
        // Utiliser les données du contexte ou du localStorage
        const currentUser = user || JSON.parse(savedUser);
        
        console.log('🔍 useEffect - Utilisateur chargé:', currentUser);
        
        // Définir les valeurs par défaut seulement si pas déjà définies
        if (!selectedClass && currentUser.userClass) {
          setSelectedClass(currentUser.userClass);
        }
        if (!selectedSection && currentUser.section) {
          setSelectedSection(currentUser.section);
        }
        
        // Charger les données depuis l'API avec authentification
        await Promise.all([
          loadUserStats(),
          loadAvailableSubjects(),
          refreshFlashcards() // Charger les flashcards
        ]);
      } else {
        console.log('🔍 useEffect - Pas d\'utilisateur connecté, chargement des matières publiques');
        // Charger seulement les matières publiques
        await loadAvailableSubjects();
      }
      
      setLoadingStats(false);
      setIsInitialized(true);
      console.log('🔍 useEffect - Données chargées');
    };
    
    initializeComponent();
  }, [user]);

  // Effet pour charger les chapitres quand une matière est sélectionnée
  useEffect(() => {
    if (selectedSubject && availableSubjects.length > 0) {
      const subjectId = parseInt(selectedSubject);
      if (subjectId) {
        // Utiliser les chapitres depuis availableSubjects si disponibles (qui incluent questionCount)
        const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
        if (subject && subject.chapters) {
          console.log('🔍 Utilisation des chapitres depuis availableSubjects:', subject.chapters.length, 'avec questions');
          setAvailableChapters(subject.chapters || []);
        } else {
          // Fallback : charger depuis l'API
          loadChapters(subjectId);
        }
      }
    } else {
      setAvailableChapters([]);
      setSelectedChapter(null);
    }
  }, [selectedSubject, availableSubjects]);

  // Effet pour charger les flashcards quand un chapitre est sélectionné
  useEffect(() => {
    console.log('🔍 useEffect flashcards - selectedSubject:', selectedSubject, 'selectedChapter:', selectedChapter);
    if (selectedSubject && selectedChapter && selectedChapter !== 'all' && selectedChapter !== 'none') {
      const subjectId = parseInt(selectedSubject);
      console.log('🔍 useEffect flashcards - subjectId parsé:', subjectId);
      if (subjectId) {
        console.log('🔍 useEffect flashcards - Appel loadSubjectFlashcards avec:', subjectId, selectedChapter);
        loadSubjectFlashcards(subjectId, selectedChapter);
        // Réinitialiser l'état de la session
        setCurrentCard(0);
        setShowAnswer(false);
        setUserAnswer("");
        setScore(0);
        setError(null);
        setTimeUp(false);
        setShowCorrectAnswer(false);
      }
    } else {
      console.log('🔍 useEffect flashcards - Pas de matière ou chapitre sélectionné, reset flashcards');
      setSubjectFlashcards([]);
    }
  }, [selectedSubject, selectedChapter]);

  // Fonction pour gérer la sélection d'une matière
  const handleSubjectChange = (subjectId: number) => {
    setSelectedSubject(subjectId.toString());
    setSelectedChapter(null); // Réinitialiser le chapitre sélectionné
  };

  // Fonction pour gérer le temps écoulé
  const handleTimeUp = () => {
    setTimeUp(true);
    setShowCorrectAnswer(true);
    toast({
      title: "Temps écoulé !",
      description: "Le temps imparti est terminé",
      variant: "destructive"
    });
  };

  // Réinitialiser les états du timer pour une nouvelle carte
  const resetTimerStates = () => {
    setTimeUp(false);
    setShowCorrectAnswer(false);
    setUserAnswer("");
  };

  // Rendu conditionnel consolidé - Permettre l'accès aux matières même sans connexion
  if (user && (user.role !== 'STUDENT' && user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <LogIn className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6">
            Seuls les étudiants, tuteurs et administrateurs peuvent accéder aux flashcards
          </p>
          <Button onClick={(e) => { e.preventDefault(); navigate('/'); }} className="w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur Flashcards</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={(e) => { e.preventDefault(); setError(null); }}>Réessayer</Button>
        </div>
      </div>
    );
  }

  // Affichage de chargement pendant l'initialisation
  if (!isInitialized || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chargement...</h2>
          <p className="text-gray-500">Préparation de votre centre d'apprentissage</p>
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
    
    const subjectId = parseInt(selectedSubject);
    const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
    if (!subject) return subjectFlashcards;
    
    // Si toutes les flashcards sont complétées, retourner un tableau vide
    if ((subject.completedFlashcards || 0) >= (subject.totalFlashcards || 0)) {
      return [];
    }
    
    // Retourner les flashcards non complétées
    return subjectFlashcards;
  };

  // Fonction pour vérifier si toutes les flashcards sont complétées
  const areAllFlashcardsCompleted = () => {
    if (!selectedSubject) return false;
    
    const subjectId = parseInt(selectedSubject);
    const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
    if (!subject) return false;
    
    return (subject.completedFlashcards || 0) >= (subject.totalFlashcards || 0);
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

      // Vérifier qu'un chapitre est sélectionné
      if (!selectedChapter || selectedChapter === 'all' || selectedChapter === 'none') {
        toast({
          title: "Sélectionnez un chapitre",
          description: "Veuillez d'abord choisir un chapitre pour commencer les flashcards.",
          variant: "destructive"
        });
        return;
      }

      // Vérifier s'il y a des flashcards disponibles pour ce chapitre
      if (subjectFlashcards.length === 0) {
        toast({
          title: "Aucune flashcard disponible",
          description: "Il n'y a pas encore de flashcards pour ce chapitre.",
          variant: "destructive"
        });
        return;
      }

      // Vérifier si toutes les flashcards sont déjà complétées
      const subjectId = parseInt(selectedSubject);
      const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
      if (subject && (subject.completedFlashcards || 0) >= (subject.totalFlashcards || 0)) {
        toast({
          title: "Toutes les flashcards sont complétées !",
          description: `Vous avez déjà terminé toutes les ${subject.totalFlashcards || 0} flashcards de ${subject.name}. Félicitations ! 🎉`,
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
      setLastAnswerCorrect(null); // Réinitialiser le résultat de la réponse

      const availableCount = subject ? (subject.totalFlashcards || 0) - (subject.completedFlashcards || 0) : subjectFlashcards.length;
      toast({
        title: "Session de flashcards démarrée",
        description: `${availableCount} flashcards restantes pour ${subject?.name || selectedSubject}`,
      });
    } catch (err) {
      console.error('Error starting flashcards:', err);
      setError('Erreur lors du démarrage des flashcards');
    }
  };

  const handleNextCard = () => {
    // Vérifier si toutes les flashcards sont complétées
    const subjectId = parseInt(selectedSubject);
    const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
    if (subject && (subject.completedFlashcards || 0) >= (subject.totalFlashcards || 0)) {
      toast({
        title: "Toutes les flashcards sont complétées !",
          description: `Vous avez terminé toutes les ${subject.totalFlashcards || 0} flashcards de ${subject.name}. Félicitations ! 🎉`,
        variant: "default"
      });
      setShowDemo(false);
      return;
    }

    if (currentCard < subjectFlashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
      setLastAnswerCorrect(null); // Réinitialiser le résultat de la réponse
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
    
    // Stocker le résultat pour l'affichage
    setLastAnswerCorrect(isCorrect);
    
    // Enregistrer la tentative dans la base de données
    await saveFlashcardAttempt(currentCardData.id, isCorrect, 30); // 30 secondes par défaut

    if (isCorrect) {
      setScore(score + 1);
      toast({
        title: "Correct !",
        description: "Bonne réponse !",
      });
    }
    setShowAnswer(true);

    // Vérifier si toutes les flashcards sont maintenant complétées
    setTimeout(async () => {
      await loadUserStats(); // Recharger les statistiques
      const subjectId = parseInt(selectedSubject);
      const subject = availableSubjects.find(s => s.id === subjectId || s.id.toString() === selectedSubject);
      if (subject && (subject.completedFlashcards || 0) >= (subject.totalFlashcards || 0)) {
        toast({
          title: "🎉 Félicitations !",
          description: `Vous avez terminé toutes les ${subject.totalFlashcards || 0} flashcards de ${subject.name} !`,
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
                  {loadingStats ? '...' : availableSubjects.length}
                </p>
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pour {user.userClass}{user.section ? ` - ${user.section}` : ''}
                  </p>
                )}
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
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Dans vos matières
                  </p>
                )}
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


        {/* Learning Path Selection - Show when no active session */}
        {!showDemo && !showExam && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Choisissez votre mode d'apprentissage</h2>
              <p className="text-base md:text-lg text-gray-600">Flashcards, Tests de Connaissances ou Révision - Sélectionnez votre matière</p>
              
              {/* Message informatif sur les sections */}
              {!user && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Mode Découverte</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Vous pouvez explorer toutes les matières disponibles. 
                    <span 
                      className="text-green-600 underline cursor-pointer"
                      onClick={() => navigate('/login')}
                    >
                      Connectez-vous
                    </span> pour un accès personnalisé selon votre niveau.
                  </p>
                </div>
              )}
              
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
                  </div>
        </div>

            <Select value={selectedSubject} onValueChange={(value) => {
              const subjectId = parseInt(value);
              handleSubjectChange(subjectId);
            }}>
              <SelectTrigger className="h-10 md:h-12 text-base md:text-lg">
                <SelectValue placeholder={loadingStats ? "Chargement..." : "Choisissez votre matière"} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{subject.name}</span>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {subject.totalFlashcards || 0} cartes
                        </Badge>
                        {subject.totalQuestions > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                            {subject.totalQuestions || 0} questions
                          </Badge>
                        )}
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
            const subject = availableSubjects.find(s => s.id.toString() === selectedSubject || s.name === selectedSubject);
            return subject ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Total Flashcards</p>
                    <p className="text-lg font-bold text-blue-800">{subject.totalFlashcards || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Total Questions</p>
                    <p className="text-lg font-bold text-blue-800">{subject.totalQuestions || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Progression</p>
                    <p className="text-lg font-bold text-blue-800">{subject.progress || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Complétées</p>
                    <p className="text-lg font-bold text-blue-800">{subject.completedFlashcards || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-blue-600">Restantes</p>
                    <p className={`text-lg font-bold ${(subject.totalFlashcards || 0) - (subject.completedFlashcards || 0) === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {(subject.totalFlashcards || 0) - (subject.completedFlashcards || 0)}
                    </p>
                  </div>
                  {subject.accuracy > 0 && (
                    <div className="text-center col-span-2">
                      <p className="text-xs text-blue-600">Taux de Réussite</p>
                      <p className="text-lg font-bold text-blue-800">{subject.accuracy}%</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}
          </Card>


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
              <Select 
                value={selectedChapter?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedChapter(parseInt(value));
                }}
              >
                    <SelectTrigger className="h-10 md:h-12 text-base md:text-lg">
                  <SelectValue placeholder="Choisissez un chapitre" />
                </SelectTrigger>
                <SelectContent>
                  {availableChapters.length > 0 ? (
                    availableChapters.map((chapter: any) => {
                      const chapterFlashcards = getFlashcardsBySubject(parseInt(selectedSubject)).filter((c: any) => c.chapterId === chapter.id);
                      const questionCount = chapter.questionCount || 0;
                      return (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          📖 {chapter.name} ({chapterFlashcards.length} cartes, {questionCount} questions)
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Aucun chapitre disponible pour cette matière
                    </div>
                  )}
                </SelectContent>
              </Select>
                ) : (
                  <div className="h-10 md:h-12 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-sm">
                    Sélectionnez d'abord une matière
                  </div>
                )}

            </Card>
            </div>
          </div>
        )}

        {/* Study Options - Show when no mode is selected */}
        {!showDemo && !showExam && (
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
              }`} onClick={areAllFlashcardsCompleted() ? undefined : (e) => { e.preventDefault(); handleStartFlashcards(); }}>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Étude Interactive</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">Apprenez avec des flashcards adaptatives</p>
                  
                  <div className="space-y-2 mb-4">
                    {getAvailableCardsCount() > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm text-gray-600">Cartes disponibles</span>
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs">
                          {getAvailableCardsCount()} cartes
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Niveau</span>
                      <Badge variant="outline" className="text-xs">Adaptatif</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full text-white text-sm md:text-base bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Commencer l'étude
                  </Button>
              </div>
            </Card>

              {/* Review Mode */}
              <Card className="p-4 md:p-6 border-0 shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl cursor-pointer" onClick={(e) => { e.preventDefault(); handleStartFlashcards(); }}>
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <RotateCcw className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Mode Révision</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">Révisez les cartes étudiées</p>
                  
                  <div className="space-y-2 mb-4">
                    {getReviewCardsCount() > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm text-gray-600">À réviser</span>
                        <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                          {getReviewCardsCount()} cartes
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Efficacité</span>
                      <Badge variant="outline" className="text-xs">Optimisée</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full text-white text-sm md:text-base bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Commencer la révision
                  </Button>
              </div>
            </Card>

            {/* Knowledge Tests - Access to knowledge tests page */}
            <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => {
              navigate('/knowledge-tests');
            }}>
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Tests de Connaissances</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">Évaluez vos connaissances avec des tests adaptés à votre niveau</p>
                
                <div className="space-y-2 mb-4">
                  {getAvailableTestsCount() > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">Tests disponibles</span>
                      <Badge variant="secondary" className="bg-purple-200 text-purple-800 text-xs">{getAvailableTestsCount()} tests</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600">Durée</span>
                    <Badge variant="outline" className="text-xs">60 min</Badge>
                  </div>
                </div>
                
                <Button className="w-full text-white text-sm md:text-base bg-purple-600 hover:bg-purple-700">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Accéder aux tests
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
                  onClick={(e) => { e.preventDefault(); setShowDemo(false); }} 
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
              
              if (!currentCardData || subjectFlashcards.length === 0) {
                return (
                  <div className="text-center p-4">
                    <p className="text-red-600 mb-2">Aucune carte trouvée pour ce chapitre</p>
                    <p className="text-sm text-gray-600">Sélectionnez un chapitre avec des flashcards disponibles.</p>
                    <Button 
                      onClick={(e) => { e.preventDefault(); setShowDemo(false); }} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Retour à la sélection
                    </Button>
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
                    
                    {/* Timer et bouton de partage */}
                    <div className="flex items-center gap-2">
                      {!showAnswer && !timeUp && (
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                          <TimerIcon className="w-4 h-4 text-blue-600" />
                          <Timer 
                            duration={30} 
                            onTimeUp={handleTimeUp}
                            className="text-blue-600 font-bold text-sm"
                          />
                        </div>
                      )}
                      
                      {/* Bouton de partage */}
                      <SocialShareButton
                        url={window.location.href}
                        title={`Flashcard: ${currentCardData.question}`}
                        description={`Difficulté: ${currentCardData.difficulty || 'Moyen'} | Matière: ${selectedSubject}`}
                        author="Tyala Platform"
                        size="sm"
                        variant="ghost"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      />
                    </div>
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
                          {!timeUp && (
                            <div className={`bg-gradient-to-r ${lastAnswerCorrect ? 'from-green-50 to-emerald-50 border-2 border-green-200' : 'from-red-50 to-rose-50 border-2 border-red-200'} rounded-lg md:rounded-xl p-4 md:p-6`}>
                              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                {lastAnswerCorrect ? (
                                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                                )}
                                <span className={`text-base md:text-lg font-bold ${lastAnswerCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                  {lastAnswerCorrect ? 'Bonne réponse :' : 'Mauvaise réponse. La bonne réponse était :'}
                                </span>
                              </div>
                              <p className={`text-base md:text-lg leading-relaxed ${lastAnswerCorrect ? 'text-green-700' : 'text-red-700'}`}>{currentCardData.answer}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleNextCard} className="flex-1 h-10 md:h-12 text-base md:text-lg bg-green-600 hover:bg-green-700">
                              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                              Carte suivante
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={(e) => { e.preventDefault(); setShowDemo(false); }}
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
                              onClick={(e) => { e.preventDefault(); handleExamAnswer(index); }}
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
                    <Button onClick={(e) => { e.preventDefault(); resetExam(); }} variant="outline" className="px-4 md:px-6 h-10 md:h-12">
                      Nouvel Examen
                    </Button>
                    <Button onClick={(e) => { e.preventDefault(); setShowExam(false); }} className="px-4 md:px-6 bg-purple-600 hover:bg-purple-700 h-10 md:h-12">
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