import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  createdAt: string;
  updatedAt: string;
  subjectId: number;
  userId: number;
  chapterId?: number | null;
  subject: {
    id: number;
    name: string;
    level: string;
    section?: string | null;
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

interface FlashcardContextType {
  flashcards: Flashcard[];
  loading: boolean;
  refreshFlashcards: () => Promise<void>;
  addFlashcard: (flashcard: Flashcard) => void;
  updateFlashcard: (flashcard: Flashcard) => void;
  removeFlashcard: (flashcardId: number) => void;
  getFlashcardsBySubject: (subjectId: number) => Flashcard[];
  getFlashcardById: (flashcardId: number) => Flashcard | undefined;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
};

export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Charger toutes les flashcards
  const refreshFlashcards = async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utiliser l'endpoint public pour tous les utilisateurs
      const endpoint = 'http://localhost:8081/api/flashcards';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const flashcardsData = data.flashcards || data;
        setFlashcards(flashcardsData);
      } else {
        console.error('❌ FlashcardContext - Erreur lors du rechargement:', response.status);
      }
    } catch (error) {
      console.error('❌ FlashcardContext - Erreur lors du rechargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une flashcard
  const addFlashcard = (flashcard: Flashcard) => {
    console.log('➕ FlashcardContext - Ajout d\'une flashcard:', flashcard.id);
    setFlashcards(prev => [flashcard, ...prev]);
  };

  // Mettre à jour une flashcard
  const updateFlashcard = (updatedFlashcard: Flashcard) => {
    console.log('✏️ FlashcardContext - Mise à jour d\'une flashcard:', updatedFlashcard.id);
    setFlashcards(prev => 
      prev.map(flashcard => 
        flashcard.id === updatedFlashcard.id ? updatedFlashcard : flashcard
      )
    );
  };

  // Supprimer une flashcard
  const removeFlashcard = (flashcardId: number) => {
    console.log('🗑️ FlashcardContext - Suppression d\'une flashcard:', flashcardId);
    setFlashcards(prev => prev.filter(flashcard => flashcard.id !== flashcardId));
  };

  // Obtenir les flashcards par matière
  const getFlashcardsBySubject = (subjectId: number): Flashcard[] => {
    return flashcards.filter(flashcard => flashcard.subjectId === subjectId);
  };

  // Obtenir une flashcard par ID
  const getFlashcardById = (flashcardId: number): Flashcard | undefined => {
    return flashcards.find(flashcard => flashcard.id === flashcardId);
  };

  // Charger les flashcards au montage du composant
  useEffect(() => {
    if (user) {
      // Délai pour éviter les erreurs de rendu
      setTimeout(() => {
        refreshFlashcards();
      }, 100);
    }
  }, [user]);

  const value: FlashcardContextType = {
    flashcards,
    loading,
    refreshFlashcards,
    addFlashcard,
    updateFlashcard,
    removeFlashcard,
    getFlashcardsBySubject,
    getFlashcardById,
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
};
