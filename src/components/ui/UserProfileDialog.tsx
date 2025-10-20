import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './enhanced-button';
import { Badge } from './badge';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Card } from './card';
import { User, Mail, Phone, MapPin, Calendar, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileDialogProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    userClass?: string;
    section?: string;
    department?: string;
    phone?: string;
    address?: string;
    profilePhoto?: string;
    isProfilePrivate?: boolean;
    createdAt: string;
  } | null;
  open: boolean;
  onClose: () => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  user,
  open,
  onClose
}) => {
  const { user: currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Récupération des détails pour l\'utilisateur:', user.id);
      
      const response = await fetch(`http://localhost:8081/api/users-temp/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données reçues:', data.user);
        setUserDetails(data.user);
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('❌ Détails erreur:', errorData);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isOwnProfile = currentUser?.id === user.id;
  const displayUser = userDetails || user;
  const isProfilePrivate = displayUser.isProfilePrivate && !isOwnProfile;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'TUTOR': return 'Tuteur';
      case 'STUDENT': return 'Étudiant';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'TUTOR': return 'secondary';
      case 'STUDENT': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <>
              {/* Photo de profil et nom */}
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage 
                    src={displayUser.profilePhoto ? `http://localhost:8081/api/profile/photos/${displayUser.profilePhoto}` : undefined} 
                    alt={`${displayUser.firstName} ${displayUser.lastName}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {displayUser.firstName[0]}{displayUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{displayUser.firstName} {displayUser.lastName}</h2>
                <Badge variant={getRoleColor(displayUser.role)} className="mt-2">
                  {getRoleLabel(displayUser.role)}
                </Badge>
              </div>

          {/* Informations publiques */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Informations publiques
            </h3>
            <div className="space-y-3">
              {displayUser.userClass && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Classe :</span>
                  <span>{displayUser.userClass}</span>
                  {displayUser.section && <span>- {displayUser.section}</span>}
                </div>
              )}
              {displayUser.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Département :</span>
                  <span>{displayUser.department}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Membre depuis :</span>
                <span>{new Date(displayUser.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </Card>

          {/* Informations privées */}
          {isProfilePrivate ? (
            <Card className="p-4 bg-muted/50">
              <div className="text-center text-muted-foreground">
                <EyeOff className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Ce profil est privé</p>
                <p className="text-xs mt-1">Seul l'utilisateur peut voir ses informations personnelles</p>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Informations personnelles
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email :</span>
                  <span>{displayUser.email}</span>
                </div>
                {displayUser.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Téléphone :</span>
                    <span>{displayUser.phone}</span>
                  </div>
                )}
                {displayUser.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Adresse :</span>
                    <span>{displayUser.address}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
