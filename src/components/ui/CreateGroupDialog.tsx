import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Button } from './enhanced-button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Users, BookOpen, GraduationCap } from 'lucide-react';
// Classes disponibles pour les groupes d'étude
const AVAILABLE_CLASSES = [
  {
    value: "9ème",
    label: "9ème Année Fondamentale",
    sections: []
  },
  {
    value: "Terminale",
    label: "Terminale",
    sections: [
      { value: "SMP", label: "SMP - Sciences Mathématiques et Physiques" },
      { value: "SVT", label: "SVT - Sciences de la Vie et de la Terre" },
      { value: "SES", label: "SES - Sciences Économiques et Sociales" },
      { value: "LLA", label: "LLA - Lettres et Langues Africaines" }
    ]
  }
];

const getSectionsForClass = (className: string) => {
  const classConfig = AVAILABLE_CLASSES.find(c => c.value === className);
  return classConfig?.sections || [];
};

interface CreateGroupDialogProps {
  trigger?: React.ReactNode;
  subjects: Array<{ id: number; name: string; level?: string }>;
  onGroupCreated: () => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ 
  trigger,
  subjects, 
  onGroupCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [userClass, setUserClass] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Sections disponibles pour la classe sélectionnée
  const availableSections = userClass ? getSectionsForClass(userClass) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !userClass) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation : si la classe a des sections, la section est obligatoire
    if (availableSections.length > 0 && !section) {
      alert('Veuillez sélectionner une section pour cette classe');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          userClass,
          section: section || undefined,
          isPrivate: false
        })
      });

      if (response.ok) {
        setOpen(false);
        setName('');
        setDescription('');
        setUserClass('');
        setSection('');
        onGroupCreated();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création du groupe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start">
      <Users className="w-4 h-4 mr-2" />
      Créer un Groupe d'Étude
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Créer un Groupe d'Étude
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="group-name">Nom du groupe <span className="text-red-600">*</span></Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Groupe Maths Terminale"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif du groupe..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="group-class" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Classe <span className="text-red-600">*</span>
            </Label>
            <Select 
              value={userClass} 
              onValueChange={(v) => {
                setUserClass(v);
                setSection(''); // Reset section quand on change de classe
              }}
            >
              <SelectTrigger id="group-class" className="mt-2">
                <SelectValue placeholder="Sélectionnez une classe" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CLASSES.map((classe) => (
                  <SelectItem key={classe.value} value={classe.value}>
                    {classe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choisissez entre 9ème ou Terminale
            </p>
          </div>

          {availableSections.length > 0 && (
            <div>
              <Label htmlFor="group-section" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Section <span className="text-red-600">*</span>
              </Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger id="group-section" className="mt-2">
                  <SelectValue placeholder="Sélectionnez une section" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((sec) => (
                    <SelectItem key={sec.value} value={sec.value}>
                      {sec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Section obligatoire pour la Terminale
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le Groupe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;

