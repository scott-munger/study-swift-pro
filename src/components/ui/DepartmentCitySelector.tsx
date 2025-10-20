import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, getCitiesForDepartment, validateDepartmentCity } from '@/lib/locationConfig';

interface DepartmentCitySelectorProps {
  selectedDepartment: string;
  selectedCity: string;
  onDepartmentChange: (department: string) => void;
  onCityChange: (city: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const DepartmentCitySelector: React.FC<DepartmentCitySelectorProps> = ({
  selectedDepartment,
  selectedCity,
  onDepartmentChange,
  onCityChange,
  disabled = false,
  showLabel = true,
  className = ""
}) => {
  const cities = getCitiesForDepartment(selectedDepartment);
  const isValid = validateDepartmentCity(selectedDepartment, selectedCity);

  const handleDepartmentChange = (department: string) => {
    onDepartmentChange(department);
    // Réinitialiser la ville si elle n'est plus valide pour le nouveau département
    const newCities = getCitiesForDepartment(department);
    if (newCities.length > 0 && !newCities.some(c => c.value === selectedCity)) {
      onCityChange('');
    } else if (newCities.length === 0) {
      onCityChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="text-sm font-medium text-gray-700">
          Département et Ville
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sélecteur de département */}
        <div className="space-y-2">
          <Label htmlFor="department-selector">Département *</Label>
          <Select 
            value={selectedDepartment} 
            onValueChange={handleDepartmentChange}
            disabled={disabled}
          >
            <SelectTrigger id="department-selector">
              <SelectValue placeholder="Sélectionner un département" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((department) => (
                <SelectItem key={department.value} value={department.value}>
                  {department.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélecteur de ville */}
        <div className="space-y-2">
          <Label htmlFor="city-selector">
            Ville {cities.length > 0 ? '*' : '(optionnel)'}
          </Label>
          {cities.length > 0 ? (
            <Select 
              value={selectedCity} 
              onValueChange={onCityChange}
              disabled={disabled}
            >
              <SelectTrigger id="city-selector">
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Aucune ville spécifique pour ce département
            </div>
          )}
        </div>
      </div>

      {/* Indicateur de validation */}
      {selectedDepartment && !isValid && (
        <div className="text-sm text-red-600">
          ⚠️ La combinaison département/ville n'est pas valide
        </div>
      )}
    </div>
  );
};
