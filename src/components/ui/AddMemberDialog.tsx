import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './enhanced-button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Card } from './card';
import { UserPlus, Search, Users, GraduationCap, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AddMemberDialogProps {
  group: any;
  open: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
}

interface AvailableUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userClass: string | null;
  section: string | null;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({ 
  group, 
  open,
  onClose,
  onMemberAdded
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingUser, setAddingUser] = useState<number | null>(null);

  // Charger les utilisateurs disponibles
  useEffect(() => {
    if (open && group?.id) {
      loadAvailableUsers();
    }
  }, [open, group?.id]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/available-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de charger les utilisateurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: number) => {
    try {
      setAddingUser(userId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/study-groups/${group.id}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const newMember = await response.json();
        toast({
          title: "✅ Membre ajouté",
          description: `${newMember.user.firstName} ${newMember.user.lastName} a été ajouté au groupe`,
        });
        
        // Retirer l'utilisateur de la liste des disponibles
        setAvailableUsers(prev => prev.filter(u => u.id !== userId));
        
        // Notifier le parent
        if (onMemberAdded) {
          onMemberAdded();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'ajouter le membre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setAddingUser(null);
    }
  };

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = availableUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ajouter des membres au groupe "{group?.name}"
          </DialogTitle>
        </DialogHeader>

        {/* Informations du groupe */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-blue-900">{group?.name}</span>
                <Badge variant="outline" className="text-xs">
                  {group?.userClass} {group?.section && `- ${group.section}`}
                </Badge>
              </div>
              <p className="text-sm text-blue-700">
                {group?._count?.members || 0} membres
              </p>
            </div>
          </div>
        </Card>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des utilisateurs disponibles */}
        <ScrollArea className="flex-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Chargement des utilisateurs...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tous les étudiants de cette classe sont déjà membres
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((availableUser) => (
                <Card key={availableUser.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {availableUser.firstName[0]}{availableUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {availableUser.firstName} {availableUser.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {availableUser.userClass} {availableUser.section && `- ${availableUser.section}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{availableUser.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMember(availableUser.id)}
                      disabled={addingUser === availableUser.id}
                      className="ml-4"
                    >
                      {addingUser === availableUser.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
