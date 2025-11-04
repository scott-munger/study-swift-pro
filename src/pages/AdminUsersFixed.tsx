import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { validateClassSection } from '@/lib/classConfig';
import { API_CONFIG } from '@/config/api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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

const AdminUsersFixed = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
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

  // Vérifier l'authentification (tolérant)
  useEffect(() => {
    const storageUser = (() => {
      try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; }
    })();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const tokenPayload = (() => {
      try { return token ? JSON.parse(atob(token.split('.')[1])) : null; } catch { return null; }
    })();
    const isAdminEffective = (user?.role === 'ADMIN') || (storageUser?.role === 'ADMIN') || (tokenPayload?.role === 'ADMIN');

    if (!isAdminEffective) {
      console.log('🔐 AdminUsersFixed - Accès non admin détecté');
      return;
    }

    loadUsers();
  }, [user, toast]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.log('🔐 AdminUsersFixed - Pas de token');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        // Ne pas rediriger automatiquement
        return;
      }

      console.log('🔐 AdminUsersFixed - Token trouvé, chargement des utilisateurs...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔐 AdminUsersFixed - Réponse API:', response.status);

      if (response.status === 204) {
        console.log('🔐 AdminUsersFixed - 204 No Content, aucun utilisateur');
        setUsers([]);
      } else if (response.ok) {
        const data = await response.json();
        const arr = Array.isArray(data) ? data : (data.users || []);
        console.log('🔐 AdminUsersFixed - Données reçues:', arr.length, 'utilisateurs');
        setUsers(arr);
      } else if (response.status === 401) {
        console.log('🔐 AdminUsersFixed - Token invalide (401)');
        toast({
          title: "Session expirée",
          description: "Votre session a expiré, veuillez vous reconnecter",
          variant: "destructive"
        });
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } else if (response.status === 403) {
        console.log('🔐 AdminUsersFixed - Accès refusé (403)');
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits administrateur",
          variant: "destructive"
        });
        // Pas de redirection automatique
      } else {
        console.log('🔐 AdminUsersFixed - Erreur API:', response.status);
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('🔐 AdminUsersFixed - Erreur:', error);
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
      if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.role) {
        toast({ 
          title: "Erreur", 
          description: "Prénom, nom, email et rôle sont requis", 
          variant: "destructive" 
        });
        return;
      }

      // Validation spécifique selon le rôle
      if (userForm.role === 'STUDENT') {
        // Si une classe est fournie, valider la combinaison classe/section
        if (userForm.userClass && !validateClassSection(userForm.userClass, userForm.section || '')) {
          toast({ 
            title: "Erreur", 
            description: "La combinaison classe/section n'est pas valide", 
            variant: "destructive" 
          });
          return;
        }
      }

      // Le département est optionnel pour les tuteurs (peut être ajouté plus tard)

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast({
          title: "Erreur",
          description: "Token d'authentification manquant",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password || 'password123',
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          role: userForm.role,
          userClass: userForm.userClass || null,
          section: userForm.section || null,
          department: userForm.department || null,
          phone: userForm.phone ? userForm.phone.replace(/\D/g, '') : null,
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
          window.location.href = '/';
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

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${editingUser.id}`, {
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
          window.location.href = '/';
        }, 2000);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast({
          title: "Erreur",
          description: "Token d'authentification manquant",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userToDelete}`, {
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
          window.location.href = '/';
        }, 2000);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
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

  const storageUserGuard = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); } catch { return null; } })();
  const tokenGuard = localStorage.getItem('token') || sessionStorage.getItem('token');
  const payloadGuard = (() => { try { return tokenGuard ? JSON.parse(atob(tokenGuard.split('.')[1])) : null; } catch { return null; } })();
  const isAdminEffectiveGuard = (user?.role === 'ADMIN') || (storageUserGuard?.role === 'ADMIN') || (payloadGuard?.role === 'ADMIN');

  if (!isAdminEffectiveGuard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">
            Seuls les administrateurs peuvent accéder à cette page
          </p>
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
              Gestion des Utilisateurs (Version Corrigée)
            </h1>
            <div className="flex gap-2">
              <Button onClick={loadUsers} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
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
                      <Label htmlFor="role">Rôle *</Label>
                      <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
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
                        placeholder="Ex: Éducation, Mathématiques"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 py-2 border border-input bg-muted rounded-l-md text-sm text-muted-foreground">
                          +509
                        </div>
                        <Input
                          id="phone"
                          value={userForm.phone}
                          onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                          placeholder="1234-5678"
                          className="rounded-l-none border-l-0"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: +509 suivi du numéro (ex: 1234-5678)
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                        placeholder="Ex: Abidjan, Cocody, Angré 8ème Tranche"
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
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  <SelectItem value="9ème">9ème</SelectItem>
                  <SelectItem value="Terminale">Terminale</SelectItem>
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
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
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
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteUser}
        title="Supprimer l'utilisateur"
        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
};

export default AdminUsersFixed;
