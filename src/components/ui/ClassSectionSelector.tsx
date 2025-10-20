import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLASSES, getSectionsForClass, validateClassSection } from '@/lib/classConfig';

interface ClassSectionSelectorProps {
  selectedClass: string;
  selectedSection: string;
  onClassChange: (className: string) => void;
  onSectionChange: (section: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const ClassSectionSelector: React.FC<ClassSectionSelectorProps> = ({
  selectedClass,
  selectedSection,
  onClassChange,
  onSectionChange,
  disabled = false,
  showLabel = true,
  className = ""
}) => {
  const sections = getSectionsForClass(selectedClass);
  const isValid = validateClassSection(selectedClass, selectedSection);

  const handleClassChange = (className: string) => {
    onClassChange(className);
    // Réinitialiser la section si elle n'est plus valide pour la nouvelle classe
    const newSections = getSectionsForClass(className);
    if (newSections.length > 0 && !newSections.some(s => s.value === selectedSection)) {
      onSectionChange('');
    } else if (newSections.length === 0) {
      onSectionChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="text-sm font-medium text-gray-700">
          Classe et Section
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sélecteur de classe */}
        <div className="space-y-2">
          <Label htmlFor="class-selector">Classe *</Label>
          <Select 
            value={selectedClass} 
            onValueChange={handleClassChange}
            disabled={disabled}
          >
            <SelectTrigger id="class-selector">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((classConfig) => (
                <SelectItem key={classConfig.value} value={classConfig.value}>
                  {classConfig.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélecteur de section */}
        <div className="space-y-2">
          <Label htmlFor="section-selector">
            Section {sections.length > 0 ? '*' : '(optionnel)'}
          </Label>
          {sections.length > 0 ? (
            <Select 
              value={selectedSection} 
              onValueChange={onSectionChange}
              disabled={disabled}
            >
              <SelectTrigger id="section-selector">
                <SelectValue placeholder="Sélectionner une section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.value} value={section.value}>
                    <div>
                      <div className="font-medium">{section.label}</div>
                      {section.description && (
                        <div className="text-xs text-gray-500">{section.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Aucune section spécifique pour cette classe
            </div>
          )}
        </div>
      </div>

      {/* Indicateur de validation */}
      {selectedClass && !isValid && (
        <div className="text-sm text-red-600">
          ⚠️ La combinaison classe/section n'est pas valide
        </div>
      )}
    </div>
  );
};
