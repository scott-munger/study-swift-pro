import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { validateClassSection } from '@/lib/classConfig';

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
  createdAt: string;
  updatedAt: string;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔐 AdminUsers - Token trouvé:', savedToken ? 'Oui' : 'Non');
    console.log('🔐 AdminUsers - Token:', savedToken);
    
    if (savedToken) {
      setToken(savedToken);
      loadUsers(savedToken);
    } else {
      console.log('🔐 AdminUsers - Pas de token, redirection vers login');
      window.location.href = '/login';
    }
  }, []);

  const loadUsers = async (authToken?: string | null) => {
    // Toujours relire le token le plus frais depuis le stockage
    const effectiveToken = authToken || localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!effectiveToken) {
      console.log('🔐 AdminUsers - Pas de token pour charger les utilisateurs');
      return;
    }
    setLoading(true);
    console.log('🔐 AdminUsers - Chargement des utilisateurs avec token:', (effectiveToken || '').substring(0, 50) + '...');
    
    try {
      const doFetch = async (tokenToUse: string) => fetch('http://localhost:8081/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      let response = await doFetch(effectiveToken);
      
      console.log('🔐 AdminUsers - Réponse API:', response.status, response.statusText);
      
      if (response.status === 401) {
        // Retenter UNE FOIS en relisant le token depuis le stockage
        const refreshed = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (refreshed && refreshed !== effectiveToken) {
          console.warn('🔐 AdminUsers - 401, nouvel essai avec token rafraîchi');
          response = await doFetch(refreshed);
        }
        if (response.status === 401) {
          console.warn('🔐 AdminUsers - Session expirée confirmée');
          toast({ title: 'Session expirée', description: 'Veuillez vous reconnecter', variant: 'destructive' });
          setLoading(false);
          return; // Ne pas forcer de redirection brutale
        }
      }

      if (response.ok) {
        const body = await response.json();
        const list = Array.isArray(body) ? body : (Array.isArray(body.users) ? body.users : []);
        console.log('🔐 AdminUsers - Données reçues:', list.length, 'utilisateurs');
        setUsers(list);
      } else {
        const errorData = await response.json();
        console.error('🔐 AdminUsers - Erreur API:', errorData);
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      console.error('🔐 AdminUsers - Erreur lors du chargement des utilisateurs:', error);
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Validation des champs requis
      if (!userForm.email || !userForm.password || !userForm.firstName || !userForm.lastName) {
        toast({ 
          title: "Erreur", 
          description: "Veuillez remplir tous les champs requis", 
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
          password: userForm.password,
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
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.error || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'TUTOR': return 'bg-green-100 text-green-800';
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                <p className="text-gray-600">Gérez tous les utilisateurs de la plateforme</p>
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
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateurs</SelectItem>
                <SelectItem value="TUTOR">Tuteurs</SelectItem>
                <SelectItem value="STUDENT">Étudiants</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingUser(null); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Modifiez les informations de l\'utilisateur.' : 'Ajoutez un nouvel utilisateur à la plateforme.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informations personnelles */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-900">Informations Personnelles</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={userForm.firstName}
                        onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                        placeholder="Ex: Jean"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={userForm.lastName}
                        onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                        placeholder="Ex: Mballa"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        placeholder="Ex: jean.mballa@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Mot de passe sécurisé"}
                        required={!editingUser}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                        placeholder="Ex: +237 6XX XXX XXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={userForm.address}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                        placeholder="Ex: Yaoundé, Cameroun"
                      />
                    </div>
                  </div>
                </div>

                {/* Type d'utilisateur */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-900">Type d'Utilisateur *</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        userForm.role === 'STUDENT' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setUserForm({...userForm, role: 'STUDENT', userClass: '', section: '', department: ''})}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-blue-600 font-bold">🎓</span>
                        </div>
                        <h5 className="font-semibold text-gray-900">Étudiant</h5>
                        <p className="text-sm text-gray-600">Accès aux cours et exercices</p>
                      </div>
                    </div>
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        userForm.role === 'TUTOR' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setUserForm({...userForm, role: 'TUTOR', userClass: '', section: '', department: 'Sciences'})}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-green-600 font-bold">👨‍🏫</span>
                        </div>
                        <h5 className="font-semibold text-gray-900">Tuteur</h5>
                        <p className="text-sm text-gray-600">Enseignement et accompagnement</p>
                      </div>
                    </div>
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        userForm.role === 'ADMIN' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setUserForm({...userForm, role: 'ADMIN', userClass: '', section: '', department: 'Administration'})}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-purple-600 font-bold">👑</span>
                        </div>
                        <h5 className="font-semibold text-gray-900">Administrateur</h5>
                        <p className="text-sm text-gray-600">Gestion de la plateforme</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations académiques (pour étudiants) */}
                {userForm.role === 'STUDENT' && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Informations Académiques</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <ClassSectionSelector
                          selectedClass={userForm.userClass || ''}
                          selectedSection={userForm.section || ''}
                          onClassChange={(className) => setUserForm({...userForm, userClass: className})}
                          onSectionChange={(section) => setUserForm({...userForm, section: section})}
                          showLabel={true}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="department">Département</Label>
                        <Input
                          id="department"
                          value={userForm.department}
                          onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                          placeholder="Ex: Sciences, Lettres, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations professionnelles (pour tuteurs) */}
                {userForm.role === 'TUTOR' && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Informations Professionnelles</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="department">Département/Spécialité *</Label>
                        <Select value={userForm.department} onValueChange={(value) => setUserForm({...userForm, department: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une spécialité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sciences">Sciences</SelectItem>
                            <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                            <SelectItem value="Physique">Physique</SelectItem>
                            <SelectItem value="Chimie">Chimie</SelectItem>
                            <SelectItem value="Biologie">Biologie</SelectItem>
                            <SelectItem value="Lettres">Lettres</SelectItem>
                            <SelectItem value="Histoire-Géographie">Histoire-Géographie</SelectItem>
                            <SelectItem value="Langues">Langues</SelectItem>
                            <SelectItem value="Philosophie">Philosophie</SelectItem>
                            <SelectItem value="Économie">Économie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations administratives (pour admins) */}
                {userForm.role === 'ADMIN' && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Informations Administratives</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="department">Département</Label>
                        <Input
                          id="department"
                          value={userForm.department}
                          onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                          placeholder="Ex: Administration, IT, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}
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

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tuteurs</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'TUTOR').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'ADMIN').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Étudiants</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'STUDENT').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Utilisateur</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Rôle</th>
                      <th className="text-left py-3 px-4">Classe/Section</th>
                      <th className="text-left py-3 px-4">Date d'inscription</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.userClass && user.section ? `${user.userClass} - ${user.section}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;



