import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { offlineStorage } from '@/lib/offlineStorage';
import { API_URL } from '@/config/api';

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
  removeFlashcard: (flashcardId: number) => Promise<void>;
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

  // Charger toutes les flashcards (avec support offline)
  const refreshFlashcards = async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utiliser l'endpoint public pour tous les utilisateurs
      const endpoint = `${API_URL}/api/flashcards`;

      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const flashcardsData = data.flashcards || data;
          
          // S'assurer que flashcardsData est un tableau
          const flashcardsArray = Array.isArray(flashcardsData) ? flashcardsData : [];
          setFlashcards(flashcardsArray);
          
          console.log(`✅ FlashcardContext - ${flashcardsArray.length} flashcards chargées`);
          
          // Sauvegarder en cache pour usage offline et synchroniser (supprimer celles qui n'existent plus)
          await offlineStorage.saveFlashcards(flashcardsArray, true);
          console.log('✅ Flashcards synchronisées avec le cache offline');
          
          if (flashcardsArray.length === 0) {
            console.log('ℹ️ Aucune flashcard trouvée dans la base de données pour cet utilisateur');
          }
        } else {
          console.error('❌ FlashcardContext - Erreur lors du rechargement:', response.status);
          // Charger depuis le cache en cas d'erreur
          await loadFromCache();
        }
      } catch (fetchError) {
        console.log('⚠️ Mode offline - Chargement depuis le cache');
        // En cas d'erreur réseau, charger depuis le cache
        await loadFromCache();
      }
    } catch (error) {
      console.error('❌ FlashcardContext - Erreur lors du rechargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger depuis le cache offline
  const loadFromCache = async () => {
    try {
      const cachedFlashcards = await offlineStorage.getFlashcards();
      if (cachedFlashcards.length > 0) {
        setFlashcards(cachedFlashcards);
        console.log(`✅ ${cachedFlashcards.length} flashcards chargées depuis le cache`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement cache:', error);
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
  const removeFlashcard = async (flashcardId: number) => {
    console.log('🗑️ FlashcardContext - Suppression d\'une flashcard:', flashcardId);
    setFlashcards(prev => prev.filter(flashcard => flashcard.id !== flashcardId));
    
    // Supprimer aussi du cache offline
    try {
      await offlineStorage.deleteFlashcard(flashcardId);
      console.log('✅ Flashcard supprimée du cache offline');
    } catch (error) {
      console.error('❌ Erreur suppression cache offline:', error);
    }
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
