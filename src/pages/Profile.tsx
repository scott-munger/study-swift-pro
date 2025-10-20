import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Calendar, Edit, Save, X, Phone, MapPin, Camera, Trash2, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { validateClassSection } from '@/lib/classConfig';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateProfile, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(user?.firstName || "");
  const [editedLastName, setEditedLastName] = useState(user?.lastName || "");
  const [editedClass, setEditedClass] = useState(user?.userClass || "");
  const [editedSection, setEditedSection] = useState(user?.section || "");
  const [editedDepartment, setEditedDepartment] = useState(user?.department || "");
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");
  const [editedAddress, setEditedAddress] = useState(user?.address || "");
  const [isProfilePrivate, setIsProfilePrivate] = useState(user?.isProfilePrivate || false);
  const [darkMode, setDarkMode] = useState(user?.darkMode || false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rediriger les administrateurs vers le dashboard admin (un profil admin ne devrait pas s'afficher ici)
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard-modern', { replace: true });
    }
  }, [user, navigate]);

  // Synchroniser les états avec les données utilisateur
  useEffect(() => {
    if (user) {
      setEditedFirstName(user.firstName || "");
      setEditedLastName(user.lastName || "");
      setEditedClass(user.userClass || "");
      setEditedSection(user.section || "");
      setEditedDepartment(user.department || "");
      setEditedPhone(user.phone || "");
      setEditedAddress(user.address || "");
      setIsProfilePrivate(user.isProfilePrivate || false);
      setDarkMode(user.darkMode || false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  }, [user]);

  // Fonctions pour gérer la photo
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide",
          variant: "destructive"
        });
        return;
      }

      // Validation de la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La taille du fichier ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedPhoto(file);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Non connecté</h1>
          <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à votre profil</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      console.log('🔄 Début de la sauvegarde du profil...');
      
      // Validation des champs requis
      if (!editedFirstName.trim() || !editedLastName.trim()) {
        toast({
          title: "Erreur",
          description: "Le prénom et le nom sont requis",
          variant: "destructive"
        });
        return;
      }

      // Validation classe/section pour les étudiants
      if (user?.role === 'STUDENT' && editedClass) {
        if (!validateClassSection(editedClass, editedSection || '')) {
          toast({
            title: "Erreur",
            description: "La combinaison classe/section n'est pas valide",
            variant: "destructive"
          });
          return;
        }
      }

      // Upload de la photo si une nouvelle photo a été sélectionnée
      if (selectedPhoto) {
        setIsUploadingPhoto(true);
        try {
          const formData = new FormData();
          formData.append('photo', selectedPhoto);
          
          const response = await fetch('http://localhost:8081/api/profile/photo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Erreur lors de l\'upload de la photo');
          }
          
          console.log('✅ Photo uploadée avec succès');
        } catch (error) {
          console.error('❌ Erreur upload photo:', error);
          toast({
            title: "Erreur",
            description: "Impossible de sauvegarder la photo de profil",
            variant: "destructive"
          });
          setIsUploadingPhoto(false);
          return;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const profileData = {
        firstName: editedFirstName.trim(),
        lastName: editedLastName.trim(),
        userClass: editedClass || null,
        section: editedSection || null,
        department: editedDepartment || null,
        phone: editedPhone || null,
        address: editedAddress || null,
        isProfilePrivate,
        darkMode
      };

      console.log('📤 Données à envoyer:', profileData);

      const success = await updateProfile(profileData);
      
      if (success) {
        console.log('✅ Profil mis à jour avec succès');
        setIsEditing(false);
        setSelectedPhoto(null);
        setPhotoPreview(null);
        toast({
          title: "Profil mis à jour",
          description: selectedPhoto ? "Vos informations et votre photo ont été sauvegardées avec succès" : "Vos informations ont été sauvegardées avec succès",
        });
      } else {
        console.error('❌ Échec de la mise à jour du profil');
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les modifications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditedFirstName(user?.firstName || "");
    setEditedLastName(user?.lastName || "");
    setEditedClass(user?.userClass || "");
    setEditedSection(user?.section || "");
    setEditedDepartment(user?.department || "");
    setEditedPhone(user?.phone || "");
    setEditedAddress(user?.address || "");
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Badge variant="secondary" className="mb-4">
              👤 Profil Utilisateur
            </Badge>
          </div>
          <div className="mb-4">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage 
                src={photoPreview || getProfilePhotoUrl() || undefined} 
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">
              {user.role === 'STUDENT' ? 'Étudiant' : user.role === 'TUTOR' ? 'Tuteur' : 'Administrateur'}
            </Badge>
            {user.userClass && (
              <Badge variant="outline">{user.userClass}</Badge>
            )}
            {user.section && (
              <Badge variant="outline">{user.section}</Badge>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="outline" 
                  size="sm"
                  disabled={isUploadingPhoto}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Informations personnelles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
            {user.department && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{user.department}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-600">{user.address}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'édition */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Modifier les informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Champ Photo de profil */}
              <div className="space-y-2">
                <Label>Photo de profil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={photoPreview || getProfilePhotoUrl() || undefined} 
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {selectedPhoto ? 'Changer la photo' : 'Sélectionner une photo'}
                    </Button>
                    {selectedPhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPhoto 
                    ? `Nouvelle photo sélectionnée: ${selectedPhoto.name}` 
                    : "Aucune nouvelle photo sélectionnée. La photo actuelle sera conservée."
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={editedFirstName}
                    onChange={(e) => setEditedFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={editedLastName}
                    onChange={(e) => setEditedLastName(e.target.value)}
                  />
                </div>
              </div>

              {user.role === 'STUDENT' && (
                <ClassSectionSelector
                  selectedClass={editedClass}
                  selectedSection={editedSection}
                  onClassChange={setEditedClass}
                  onSectionChange={setEditedSection}
                  showLabel={true}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select value={editedDepartment} onValueChange={setEditedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ouest">Ouest</SelectItem>
                      <SelectItem value="Nord">Nord</SelectItem>
                      <SelectItem value="Sud">Sud</SelectItem>
                      <SelectItem value="Artibonite">Artibonite</SelectItem>
                      <SelectItem value="Centre">Centre</SelectItem>
                      <SelectItem value="Grand'Anse">Grand'Anse</SelectItem>
                      <SelectItem value="Nippes">Nippes</SelectItem>
                      <SelectItem value="Nord-Est">Nord-Est</SelectItem>
                      <SelectItem value="Nord-Ouest">Nord-Ouest</SelectItem>
                      <SelectItem value="Sud-Est">Sud-Est</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                />
              </div>

              {/* Paramètres de confidentialité et d'affichage */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Paramètres</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isProfilePrivate ? (
                        <EyeOff className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <Label className="text-base font-medium">Profil privé</Label>
                        <p className="text-sm text-gray-600">
                          {isProfilePrivate 
                            ? "Votre profil est privé - seules les informations publiques sont visibles" 
                            : "Votre profil est public - toutes vos informations sont visibles"
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={isProfilePrivate ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setIsProfilePrivate(!isProfilePrivate)}
                    >
                      {isProfilePrivate ? "Rendre public" : "Rendre privé"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <Label className="text-base font-medium">Mode sombre</Label>
                        <p className="text-sm text-gray-600">
                          {darkMode 
                            ? "Interface en mode sombre activée" 
                            : "Interface en mode clair activée"
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={darkMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      {darkMode ? "Mode clair" : "Mode sombre"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;