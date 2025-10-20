import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Camera, X, Upload } from 'lucide-react';

interface ProfilePhotoUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
  className?: string;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ 
  size = 'md', 
  showUploadButton = true,
  className = '' 
}) => {
  const { user, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-24 h-24';
      default:
        return 'w-16 h-16';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      default:
        return 'default';
    }
  };

  const getProfilePhotoUrl = () => {
    if (user?.profilePhoto) {
      return `http://localhost:8081/api/profile/photos/${user.profilePhoto}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La photo doit faire moins de 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const success = await uploadProfilePhoto(file);
      if (success) {
        toast({
          title: "Succès",
          description: "Photo de profil mise à jour avec succès"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Échec de la mise à jour de la photo de profil",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    setIsUploading(true);
    try {
      const success = await deleteProfilePhoto();
      if (success) {
        toast({
          title: "Succès",
          description: "Photo de profil supprimée avec succès"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Échec de la suppression de la photo de profil",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        <Avatar className={getSizeClasses()}>
          <AvatarImage 
            src={getProfilePhotoUrl() || undefined} 
            alt={`${user?.firstName} ${user?.lastName}`}
          />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {user?.profilePhoto && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full"
            onClick={handleDeletePhoto}
            disabled={isUploading}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {showUploadButton && (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size={getButtonSize()}
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {user?.profilePhoto ? 'Changer' : 'Ajouter une photo'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;
