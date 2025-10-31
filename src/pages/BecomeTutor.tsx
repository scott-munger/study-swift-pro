import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GraduationCap, 
  Award, 
  DollarSign, 
  BookOpen, 
  Loader2,
  CheckCircle,
  Upload,
  X
} from 'lucide-react';
import { API_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface Subject {
  id: number;
  name: string;
  level: string;
  section?: string;
}

export default function BecomeTutor() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    hourlyRate: '',
    education: '',
    certifications: '',
    languages: 'Français, Créole',
    specialties: [] as string[]
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
    // Si l'utilisateur est déjà tuteur, charger ses données
    if (user?.role === 'TUTOR') {
      loadTutorData();
    }
  }, [user]);

  const loadSubjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subjects`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  const loadTutorData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tutor = await response.json();
        setFormData({
          bio: tutor.bio || '',
          experience: tutor.experience?.toString() || '',
          hourlyRate: tutor.hourlyRate?.toString() || '',
          education: tutor.education || '',
          certifications: tutor.certifications || '',
          languages: tutor.languages || 'Français, Créole',
          specialties: tutor.specialties ? JSON.parse(tutor.specialties) : []
        });
        setSelectedSubjects(tutor.tutorSubjects?.map((ts: any) => ts.subjectId) || []);
        if (tutor.user?.profilePhoto) {
          setPhotoPreview(`${API_URL}/api/profile/photos/${tutor.user.profilePhoto}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil tuteur:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubjectToggle = (subjectId: number) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSubjects.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une matière',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.bio || !formData.experience || !formData.hourlyRate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // 1. Upload photo si nécessaire
      let photoUrl = null;
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);

        const photoResponse = await fetch(`${API_URL}/api/profile/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: photoFormData
        });

        if (photoResponse.ok) {
          const photoData = await photoResponse.json();
          photoUrl = photoData.photoUrl;
        }
      }

      // 2. Créer ou mettre à jour le profil tuteur
      const tutorData = {
        bio: formData.bio,
        experience: parseInt(formData.experience),
        hourlyRate: parseFloat(formData.hourlyRate),
        education: formData.education,
        certifications: formData.certifications,
        languages: formData.languages,
        specialties: JSON.stringify(formData.specialties),
        subjectIds: selectedSubjects
      };

      const method = user?.role === 'TUTOR' ? 'PUT' : 'POST';
      const endpoint = user?.role === 'TUTOR' 
        ? `${API_URL}/api/tutors/profile`
        : `${API_URL}/api/tutors/register`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tutorData)
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: user?.role === 'TUTOR' 
            ? 'Votre profil tuteur a été mis à jour avec succès'
            : 'Votre candidature de tuteur a été soumise avec succès',
        });
        
        // Rafraîchir les données de l'utilisateur
        await refreshUser();
        
        // Rediriger vers le profil
        navigate('/profile');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary/90 dark:via-primary/80 dark:to-primary/70 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <GraduationCap className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Devenez Tuteur</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              {user?.role === 'TUTOR' ? 'Mettre à jour mon profil' : 'Rejoignez notre équipe de tuteurs'}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Partagez vos connaissances et aidez les étudiants à réussir tout en gagnant un revenu flexible
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Photo et résumé */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Photo de profil</h3>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} alt="Photo de profil" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-3xl">
                        {user?.firstName[0]}{user?.lastName[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Changer la photo</span>
                    </div>
                  </label>
                  
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-blue-500 rounded-full p-2">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                      Avantages Tuteur
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <li>• Horaires flexibles</li>
                      <li>• Revenu compétitif</li>
                      <li>• Impact positif</li>
                      <li>• Plateforme moderne</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Formulaire principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations générales */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Informations générales
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">
                      Biographie <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Parlez de vous, votre parcours, votre passion pour l'enseignement..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">
                        Années d'expérience <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Ex: 5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourlyRate">
                        Tarif horaire (HTG) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="hourlyRate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          placeholder="Ex: 500"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="education">Formation académique</Label>
                    <Textarea
                      id="education"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      placeholder="Diplômes, universités, formations..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="certifications">Certifications</Label>
                    <Textarea
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="Certifications professionnelles..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="languages">Langues parlées</Label>
                    <Input
                      id="languages"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="Ex: Français, Créole, Anglais"
                    />
                  </div>
                </div>
              </Card>

              {/* Matières enseignées */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Matières enseignées <span className="text-red-500">*</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSubjects.includes(subject.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                      onClick={() => handleSubjectToggle(subject.id)}
                    >
                      <Checkbox
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{subject.name}</div>
                        <div className="text-xs text-gray-500">
                          {subject.level} {subject.section && `• ${subject.section}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSubjects.length === 0 && (
                  <p className="text-sm text-red-500 mt-4">
                    Veuillez sélectionner au moins une matière
                  </p>
                )}
              </Card>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {user?.role === 'TUTOR' ? 'Mettre à jour' : 'Soumettre ma candidature'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

