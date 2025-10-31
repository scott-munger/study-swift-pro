import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Star, BookOpen, Clock, DollarSign, CheckCircle2, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string | null;
}

interface Subject {
  id: number;
  name: string;
}

interface TutorSubject {
  subject: Subject;
}

interface Tutor {
  id: number;
  userId: number;
  user: User;
  bio: string;
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  totalEarnings: number;
  responseTime: number;
  isAvailable: boolean;
  isOnline: boolean;
  experience: number;
  education: string | null;
  certifications: string | null;
  specialties: string | null;
  languages: string | null;
  tutorSubjects: TutorSubject[];
  _count: {
    reviews: number;
    sessions: number;
  };
}

interface TutorFormData {
  userId: number;
  bio: string;
  hourlyRate: number;
  isAvailable: boolean;
  experience: number;
  education: string;
  certifications: string;
  specialties: string;
  languages: string;
  subjectIds: number[];
}

export default function AdminTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [formData, setFormData] = useState<TutorFormData>({
    userId: 0,
    bio: '',
    hourlyRate: 100,
    isAvailable: true,
    experience: 1,
    education: '',
    certifications: '',
    specialties: '',
    languages: 'Français, Créole',
    subjectIds: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTutors();
    fetchUsers();
    fetchSubjects();
  }, []);

  const fetchTutors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutors/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des tuteurs');

      const data = await response.json();
      setTutors(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tuteurs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');

      const data = await response.json();
      setUsers(data.filter((u: any) => u.role === 'TUTOR'));
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des matières');

      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Erreur chargement matières:', error);
    }
  };

  const handleCreate = () => {
    setEditingTutor(null);
    setFormData({
      userId: 0,
      bio: '',
      hourlyRate: 100,
      isAvailable: true,
      experience: 1,
      education: '',
      certifications: '',
      specialties: '',
      languages: 'Français, Créole',
      subjectIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setFormData({
      userId: tutor.userId,
      bio: tutor.bio || '',
      hourlyRate: tutor.hourlyRate,
      isAvailable: tutor.isAvailable,
      experience: tutor.experience || 1,
      education: tutor.education || '',
      certifications: tutor.certifications || '',
      specialties: tutor.specialties || '',
      languages: tutor.languages || 'Français, Créole',
      subjectIds: tutor.tutorSubjects.map(ts => ts.subject.id),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tuteur ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tutors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast({
        title: 'Succès',
        description: 'Tuteur supprimé avec succès',
      });

      fetchTutors();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le tuteur',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingTutor
        ? `${API_URL}/api/tutors/${editingTutor.id}`
        : `${API_URL}/api/tutors`;

      const response = await fetch(url, {
        method: editingTutor ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');

      toast({
        title: 'Succès',
        description: `Tuteur ${editingTutor ? 'modifié' : 'créé'} avec succès`,
      });

      setIsDialogOpen(false);
      fetchTutors();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: `Impossible de ${editingTutor ? 'modifier' : 'créer'} le tuteur`,
        variant: 'destructive',
      });
    }
  };

  const filteredTutors = tutors.filter((tutor) =>
    `${tutor.user.firstName} ${tutor.user.lastName} ${tutor.user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                Gestion des Tuteurs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {tutors.length} tuteur{tutors.length > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un tuteur
            </Button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un tuteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grid des tuteurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
              {/* Actions en haut à droite */}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-primary hover:text-white transition-all"
                  onClick={() => handleEdit(tutor)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0 bg-red-500/90 backdrop-blur-sm hover:bg-red-600 transition-all"
                  onClick={() => handleDelete(tutor.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Badge statut */}
              <div className="absolute top-3 left-3 z-10">
                {tutor.isOnline ? (
                  <Badge className="bg-green-500 text-white">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse mr-1.5"></div>
                    En ligne
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Hors ligne
                  </Badge>
                )}
              </div>

              <div className="p-6 pt-14">
                {/* Avatar et Info */}
                <div className="flex items-start gap-4 mb-5">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-lg">
                    {tutor.user.profilePhoto ? (
                      <AvatarImage 
                        src={`${API_URL}/api/profile/photos/${tutor.user.profilePhoto}`}
                        alt={`${tutor.user.firstName} ${tutor.user.lastName}`}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white text-lg font-bold">
                        {tutor.user.firstName[0]}{tutor.user.lastName[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {tutor.user.firstName} {tutor.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                      {tutor.user.email}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(tutor.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {tutor.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({tutor._count.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Sessions</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{tutor.totalSessions}</p>
                  </div>
                  
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Revenus</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{tutor.totalEarnings.toLocaleString()} HTG</p>
                  </div>
                </div>

                {/* Matières */}
                {tutor.tutorSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tutor.tutorSubjects.slice(0, 3).map((ts, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-primary/10 dark:bg-primary/20 text-primary text-xs"
                      >
                        {ts.subject.name}
                      </Badge>
                    ))}
                    {tutor.tutorSubjects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tutor.tutorSubjects.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Prix */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                        {tutor.hourlyRate.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">HTG/h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tutor.responseTime}h
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <Card className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Aucun tuteur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Essayez une autre recherche' : 'Commencez par ajouter un tuteur'}
            </p>
          </Card>
        )}
      </div>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTutor ? 'Modifier le tuteur' : 'Ajouter un tuteur'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du tuteur
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection utilisateur (uniquement en création) */}
            {!editingTutor && (
              <div>
                <Label>Utilisateur (rôle: TUTOR)</Label>
                <Select
                  value={formData.userId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, userId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bio */}
            <div>
              <Label>Biographie</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Présentez le tuteur..."
                rows={3}
                required
              />
            </div>

            {/* Tarif et Expérience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarif horaire (HTG)</Label>
                <Input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                  min="0"
                  required
                />
              </div>
              <div>
                <Label>Expérience (années)</Label>
                <Input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Éducation */}
            <div>
              <Label>Formation</Label>
              <Input
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="Ex: Master en Mathématiques - Université d'État d'Haïti"
              />
            </div>

            {/* Certifications */}
            <div>
              <Label>Certifications</Label>
              <Input
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="Ex: Certification Enseignement Supérieur"
              />
            </div>

            {/* Spécialités */}
            <div>
              <Label>Spécialités</Label>
              <Input
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="Ex: Algèbre, Géométrie, Analyse"
              />
            </div>

            {/* Langues */}
            <div>
              <Label>Langues</Label>
              <Input
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="Ex: Français, Créole, Anglais"
              />
            </div>

            {/* Matières */}
            <div>
              <Label>Matières enseignées</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`subject-${subject.id}`}
                      checked={formData.subjectIds.includes(subject.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            subjectIds: [...formData.subjectIds, subject.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            subjectIds: formData.subjectIds.filter((id) => id !== subject.id),
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {subject.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Disponibilité */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div>
                <Label className="text-base">Tuteur disponible</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Le tuteur peut accepter de nouvelles sessions
                </p>
              </div>
              <Switch
                checked={formData.isAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingTutor ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



