// Configuration centralisée des classes et sections
export interface ClassConfig {
  value: string;
  label: string;
  sections?: SectionConfig[];
}

export interface SectionConfig {
  value: string;
  label: string;
  description?: string;
}

// Configuration des classes disponibles
export const CLASSES: ClassConfig[] = [
  {
    value: "9ème",
    label: "9ème Année Fondamentale",
    sections: []
  },
  {
    value: "Terminale",
    label: "Terminale",
    sections: [
      { value: "SMP", label: "SMP", description: "Sciences Mathématiques et Physiques" },
      { value: "SVT", label: "SVT", description: "Sciences de la Vie et de la Terre" },
      { value: "SES", label: "SES", description: "Sciences Économiques et Sociales" },
      { value: "LLA", label: "LLA", description: "Lettres et Langues Africaines" }
    ]
  }
];

// Fonction pour obtenir les sections d'une classe
export const getSectionsForClass = (className: string): SectionConfig[] => {
  const classConfig = CLASSES.find(c => c.value === className);
  return classConfig?.sections || [];
};

// Fonction pour valider une combinaison classe/section
export const validateClassSection = (className: string, section: string): boolean => {
  if (!className) return false;
  
  const sections = getSectionsForClass(className);
  if (sections.length === 0) {
    // Classe sans sections spécifiques (comme 9ème)
    return !section || section === '';
  }
  
  return sections.some(s => s.value === section);
};

// Fonction pour obtenir le label complet d'une classe/section
export const getClassSectionLabel = (className: string, section?: string): string => {
  const classConfig = CLASSES.find(c => c.value === className);
  if (!classConfig) return className;
  
  if (!section || section === '') {
    return classConfig.label;
  }
  
  const sectionConfig = classConfig.sections?.find(s => s.value === section);
  if (sectionConfig) {
    return `${classConfig.label} - ${sectionConfig.label}`;
  }
  
  return `${classConfig.label} - ${section}`;
};
