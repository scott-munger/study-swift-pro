import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Shield,
  User,
  GraduationCap,
  BookOpen,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { validateClassSection } from '@/lib/classConfig';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userClass?: string;
  section?: string;
  department?: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  isProfilePrivate?: boolean;
  darkMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminUsersUnified = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    userClass: '',
    section: '',
    department: '',
    phone: '',
    address: ''
  });

  // Vérifier les permissions admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast({
        title: "Accès non autorisé",
        description: "Seuls les administrateurs peuvent accéder à cette page",
        variant: "destructive"
      });
      // Rediriger vers le dashboard approprié
      setTimeout(() => {
        if (user.role === 'STUDENT') {
          window.location.href = '/student/dashboard';
        } else if (user.role === 'TUTOR') {
          window.location.href = '/profile';
        } else {
          window.location.href = '/';
        }
      }, 2000);
    }
  }, [user, toast]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && user && user.role === 'ADMIN') {
      setToken(savedToken);
      loadUsers(savedToken);
    } else if (!savedToken) {
      console.log('🔐 AdminUsersUnified - Pas de token, redirection vers login');
      window.location.href = '/login';
    }
  }, [user]);

  const loadUsers = async (authToken: string | null = token) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8081/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        // Accès refusé - l'utilisateur n'est pas admin
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        // Rediriger vers le dashboard approprié
        setTimeout(() => {
          if (user?.role === 'STUDENT') {
            window.location.href = '/student/dashboard';
          } else if (user?.role === 'TUTOR') {
            window.location.href = '/profile';
          } else {
            window.location.href = '/';
          }
        }, 2000);
      } else if (response.status === 401) {
        // Token invalide ou expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Validation des champs requis
      if (!userForm.firstName || !userForm.lastName || !userForm.email) {
        toast({ 
          title: "Erreur", 
          description: "Prénom, nom et email sont requis", 
          variant: "destructive" 
        });
        return;
      }

      // Validation classe/section pour les étudiants
      if (userForm.role === 'STUDENT' && userForm.userClass) {
        if (!validateClassSection(userForm.userClass, userForm.section || '')) {
          toast({ 
            title: "Erreur", 
            description: "La combinaison classe/section n'est pas valide", 
            variant: "destructive" 
          });
          return;
        }
      }

      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password || 'password123', // Mot de passe par défaut
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          role: userForm.role,
          userClass: userForm.userClass || null,
          section: userForm.section || null,
          department: userForm.department || null,
          phone: userForm.phone || null,
          address: userForm.address || null
        })
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Utilisateur créé avec succès" });
        setShowUserModal(false);
        resetForm();
        loadUsers();
      } else if (response.status === 401) {
        // Token invalide ou expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (response.status === 403) {
        // Accès refusé
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        setTimeout(() => {
          if (user?.role === 'STUDENT') {
            window.location.href = '/student/dashboard';
          } else if (user?.role === 'TUTOR') {
            window.location.href = '/profile';
          } else {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la création", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      // Validation des champs requis
      if (!userForm.firstName || !userForm.lastName) {
        toast({ 
          title: "Erreur", 
          description: "Prénom et nom sont requis", 
          variant: "destructive" 
        });
        return;
      }

      // Validation classe/section pour les étudiants
      if (userForm.role === 'STUDENT' && userForm.userClass) {
        if (!validateClassSection(userForm.userClass, userForm.section || '')) {
          toast({ 
            title: "Erreur", 
            description: "La combinaison classe/section n'est pas valide", 
            variant: "destructive" 
          });
          return;
        }
      }

      const response = await fetch(`http://localhost:8081/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          role: userForm.role,
          userClass: userForm.userClass || null,
          section: userForm.section || null,
          department: userForm.department || null,
          phone: userForm.phone || null,
          address: userForm.address || null
        })
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Utilisateur mis à jour avec succès" });
        setShowUserModal(false);
        setEditingUser(null);
        resetForm();
        loadUsers();
      } else if (response.status === 401) {
        // Token invalide ou expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (response.status === 403) {
        // Accès refusé
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        setTimeout(() => {
          if (user?.role === 'STUDENT') {
            window.location.href = '/student/dashboard';
          } else if (user?.role === 'TUTOR') {
            window.location.href = '/profile';
          } else {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Utilisateur supprimé avec succès" });
        loadUsers();
      } else if (response.status === 401) {
        // Token invalide ou expiré
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (response.status === 403) {
        // Accès refusé
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        setTimeout(() => {
          if (user?.role === 'STUDENT') {
            window.location.href = '/student/dashboard';
          } else if (user?.role === 'TUTOR') {
            window.location.href = '/profile';
          } else {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleBulkDelete = async (userIds: number[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userIds.length} utilisateur(s) ?`)) {
      return;
    }

    try {
      // Supprimer les utilisateurs un par un (l'API ne supporte pas encore la suppression en masse)
      const deletePromises = userIds.map(userId => 
        fetch(`http://localhost:8081/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(response => response.ok).length;

      setUsers(prev => prev.filter(user => !userIds.includes(user.id)));
      setSelectedUsers([]);
      setIsSelectMode(false);
      
      toast({
        title: "Utilisateurs supprimés",
        description: `${successCount} utilisateur(s) supprimé(s) avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les utilisateurs",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setUserForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STUDENT',
      userClass: '',
      section: '',
      department: '',
      phone: '',
      address: ''
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userClass: user.userClass || '',
      section: user.section || '',
      department: user.department || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowUserModal(true);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedUsers([]);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesClass = filterClass === 'all' || user.userClass === filterClass;
    return matchesSearch && matchesRole && matchesClass;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'TUTOR': return 'bg-blue-100 text-blue-800';
      case 'STUDENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'TUTOR': return <GraduationCap className="w-4 h-4" />;
      case 'STUDENT': return <BookOpen className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // Statistiques
  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'STUDENT').length,
    tutors: users.filter(u => u.role === 'TUTOR').length,
    admins: users.filter(u => u.role === 'ADMIN').length
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Non connecté</h2>
          <p className="text-gray-600 mb-4">
            Vous devez être connecté pour accéder à cette page
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">
            Seuls les administrateurs peuvent accéder à cette page
          </p>
          <Button onClick={() => {
            if (user.role === 'STUDENT') {
              window.location.href = '/student/dashboard';
            } else if (user.role === 'TUTOR') {
              window.location.href = '/profile';
            } else {
              window.location.href = '/';
            }
          }}>
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Utilisateurs
            </h1>
            <div className="flex gap-2">
              {isSelectMode && selectedUsers.length > 0 && (
                <Button 
                  onClick={() => handleBulkDelete(selectedUsers)} 
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer ({selectedUsers.length})
                </Button>
              )}
              <Button 
                onClick={toggleSelectMode} 
                variant={isSelectMode ? "default" : "outline"}
              >
                {isSelectMode ? "Annuler" : "Sélectionner"}
              </Button>
              <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingUser(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={userForm.firstName}
                        onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={userForm.lastName}
                        onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      />
                    </div>
                    {!editingUser && (
                      <div>
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          placeholder="Laissez vide pour mot de passe par défaut"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Étudiant</SelectItem>
                          <SelectItem value="TUTOR">Tuteur</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <ClassSectionSelector
                        selectedClass={userForm.userClass || ''}
                        selectedSection={userForm.section || ''}
                        onClassChange={(className) => setUserForm({...userForm, userClass: className})}
                        onSectionChange={(section) => setUserForm({...userForm, section: section})}
                        showLabel={true}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Département</Label>
                      <Input
                        id="department"
                        value={userForm.department}
                        onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUserModal(false)}>
                      Annuler
                    </Button>
                    <Button onClick={editingUser ? handleEditUser : handleAddUser}>
                      {editingUser ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Utilisateurs</p>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Étudiants</p>
                  <p className="text-2xl font-bold text-green-600">{stats.students}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tuteurs</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.tutors}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administrateurs</p>
                  <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {isSelectMode && filteredUsers.length > 0 && (
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  {selectedUsers.length === filteredUsers.length ? "Tout désélectionner" : "Tout sélectionner"}
                </Button>
              )}
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="STUDENT">Étudiants</SelectItem>
                  <SelectItem value="TUTOR">Tuteurs</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  <SelectItem value="9ème">9ème</SelectItem>
                  <SelectItem value="Terminale">Terminale</SelectItem>
                  <SelectItem value="Terminale A">Terminale A</SelectItem>
                  <SelectItem value="Terminale C">Terminale C</SelectItem>
                  <SelectItem value="Terminale D">Terminale D</SelectItem>
                  <SelectItem value="Université">Université</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Gérer les comptes utilisateurs de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun utilisateur trouvé
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterRole !== 'all' || filterClass !== 'all'
                    ? "Aucun utilisateur ne correspond à vos critères de recherche"
                    : "Aucun utilisateur n'a été créé"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isSelectMode && selectedUsers.includes(user.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    } ${isSelectMode ? 'cursor-pointer' : ''}`}
                    onClick={() => isSelectMode && handleSelectUser(user.id)}
                  >
                    <div className="flex items-center space-x-4">
                      {isSelectMode && (
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.userClass && (
                            <p className="text-xs text-gray-400">
                              {user.userClass} {user.section && `- ${user.section}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      {!isSelectMode && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(user);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersUnified;
