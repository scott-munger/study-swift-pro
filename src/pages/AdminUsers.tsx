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
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      loadUsers(savedToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const loadUsers = async (authToken: string | null = token) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
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
      const response = await fetch(`http://localhost:8081/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder={editingUser ? "Laisser vide pour ne pas changer" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Étudiant</SelectItem>
                      <SelectItem value="TUTOR">Tuteur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="userClass">Classe</Label>
                  <Input
                    id="userClass"
                    value={userForm.userClass}
                    onChange={(e) => setUserForm({...userForm, userClass: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={userForm.section}
                    onChange={(e) => setUserForm({...userForm, section: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    value={userForm.department}
                    onChange={(e) => setUserForm({...userForm, department: e.target.value})}
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



