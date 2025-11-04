import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fr } from '@/lib/translations/fr';
import { ht } from '@/lib/translations/ht';

export type Language = 'fr' | 'ht';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof fr;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook simplifié pour utiliser les traductions
export const useTranslation = () => {
  const { t } = useLanguage();
  return t;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Récupérer la langue depuis localStorage ou utiliser le français par défaut
    const savedLanguage = localStorage.getItem('tyala_language') as Language | null;
    return savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'ht') ? savedLanguage : 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tyala_language', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'ht' : 'fr';
    setLanguage(newLang);
  };

  const translations = language === 'fr' ? fr : ht;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};


