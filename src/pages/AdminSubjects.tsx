import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Shield,
  FileText,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: number;
  name: string;
  level: string;
  description: string;
  createdAt: string;
  _count?: {
    flashcards: number;
    forumPosts: number;
    tutors: number;
  };
}

const AdminSubjects = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    level: '',
    description: ''
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      loadSubjects(savedToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const loadSubjects = async (authToken: string | null = token) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/subjects', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const subjectsData = await response.json();
        setSubjects(subjectsData);
      } else {
        throw new Error('Erreur lors de la récupération des matières');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      toast({ title: "Erreur", description: "Impossible de charger les matières", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectForm)
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Matière créée avec succès" });
        setShowSubjectModal(false);
        resetForm();
        loadSubjects();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la création", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectForm)
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Matière mise à jour avec succès" });
        setShowSubjectModal(false);
        setEditingSubject(null);
        resetForm();
        loadSubjects();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Matière supprimée avec succès" });
        loadSubjects();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSubjectForm({
      name: '',
      level: '',
      description: ''
    });
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      level: subject.level,
      description: subject.description
    });
    setShowSubjectModal(true);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'débutant': return 'bg-green-100 text-green-800';
      case 'intermédiaire': return 'bg-yellow-100 text-yellow-800';
      case 'avancé': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/simple-admin/dashboard'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Matières</h1>
                <p className="text-gray-600">Gérez toutes les matières de la plateforme</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Administration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingSubject(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Matière
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Modifier la matière' : 'Créer une nouvelle matière'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject ? 'Modifiez les informations de la matière.' : 'Ajoutez une nouvelle matière à la plateforme.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la matière</Label>
                  <Input
                    id="name"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                    placeholder="Ex: Mathématiques, Physique, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="level">Niveau</Label>
                  <Input
                    id="level"
                    value={subjectForm.level}
                    onChange={(e) => setSubjectForm({...subjectForm, level: e.target.value})}
                    placeholder="Ex: Débutant, Intermédiaire, Avancé"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                    placeholder="Description de la matière..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubjectModal(false)}>
                  Annuler
                </Button>
                <Button onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}>
                  {editingSubject ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Matières</p>
                  <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flashcards</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subjects.reduce((total, subject) => total + (subject._count?.flashcards || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tuteurs Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subjects.reduce((total, subject) => total + (subject._count?.tutors || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des matières */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des matières...</p>
            </div>
          ) : (
            filteredSubjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge className={getLevelBadgeColor(subject.level)}>
                        {subject.level}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {subject.description || 'Aucune description disponible'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {subject._count?.flashcards || 0}
                      </p>
                      <p className="text-xs text-gray-600">Flashcards</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {subject._count?.forumPosts || 0}
                      </p>
                      <p className="text-xs text-gray-600">Posts Forum</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {subject._count?.tutors || 0}
                      </p>
                      <p className="text-xs text-gray-600">Tuteurs</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Créée le {new Date(subject.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSubjects;



