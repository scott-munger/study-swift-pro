import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, Mail, Calendar, Edit, Save, X, Phone, MapPin, Camera, 
  Shield, BookOpen, GraduationCap, Eye, EyeOff, Lock, ArrowLeft 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ClassSectionSelector } from '@/components/ui/ClassSectionSelector';
import { cn } from "@/lib/utils";

const ModernProfile = () => {
  const { user, updateProfile, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    userClass: user?.userClass || "",
    section: user?.section || "",
    department: user?.department || "",
    phone: user?.phone || "",
    address: user?.address || "",
    isProfilePrivate: user?.isProfilePrivate || false,
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rediriger les admin vers leur dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard-modern', { replace: true });
    }
  }, [user, navigate]);

  // Sync avec user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        userClass: user.userClass || "",
        section: user.section || "",
        department: user.department || "",
        phone: user.phone || "",
        address: user.address || "",
        isProfilePrivate: user.isProfilePrivate || false,
      });
    }
  }, [user]);

  // Gérer la sélection de photo
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Upload photo
  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;
    
    setIsUploading(true);
    try {
      await uploadProfilePhoto(selectedPhoto);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      toast({
        title: "Succès",
        description: "Photo de profil mise à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'upload de la photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du profil",
        variant: "destructive"
      });
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast({
          title: "Succès",
          description: "Mot de passe modifié avec succès"
        });
      } else {
        const data = await response.json();
        toast({
          title: "Erreur",
          description: data.error || "Échec du changement de mot de passe",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  // Badge de rôle
  const RoleBadge = () => {
    if (user.role === 'ADMIN') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Shield className="w-3 h-3 mr-1" />
          Administrateur
        </Badge>
      );
    }
    if (user.role === 'TUTOR') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <BookOpen className="w-3 h-3 mr-1" />
          Tuteur
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <GraduationCap className="w-3 h-3 mr-1" />
        Étudiant
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* En-tête avec retour */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          
          {!isEditing && !isChangingPassword && (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2"
              size="sm"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Button>
          )}
        </div>

        {/* Card principale du profil */}
        <Card className="overflow-hidden border-none shadow-xl">
          {/* Header avec photo de profil */}
          <div className="relative h-32 sm:h-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
            <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white shadow-2xl">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt={user.firstName} />
                  ) : user.profilePhoto ? (
                    <AvatarImage 
                      src={`http://localhost:8081/api/profile/photos/${user.profilePhoto}`} 
                      alt={user.firstName}
                    />
                  ) : (
                    <AvatarFallback className="text-4xl sm:text-5xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Bouton photo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu du profil */}
          <div className="pt-20 sm:pt-24 pb-6 px-4 sm:px-8">
            {/* Nom et rôle */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <RoleBadge />
                {formData.isProfilePrivate && (
                  <Badge variant="outline" className="gap-1">
                    <Eye className="w-3 h-3" />
                    Privé
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>

            {/* Upload photo */}
            {selectedPhoto && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Nouvelle photo sélectionnée</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUploadPhoto}
                      disabled={isUploading}
                    >
                      {isUploading ? "Upload..." : "Confirmer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire d'édition */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                {user.role === 'STUDENT' && (
                  <ClassSectionSelector
                    selectedClass={formData.userClass}
                    selectedSection={formData.section}
                    onClassChange={(value) => setFormData({ ...formData, userClass: value })}
                    onSectionChange={(value) => setFormData({ ...formData, section: value })}
                    showLabel={true}
                  />
                )}

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      className="pl-10"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {formData.isProfilePrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <Label className="cursor-pointer">Profil privé</Label>
                  </div>
                  <Button
                    variant={formData.isProfilePrivate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, isProfilePrivate: !formData.isProfilePrivate })}
                  >
                    {formData.isProfilePrivate ? "Activé" : "Désactivé"}
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} className="flex-1 gap-2">
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        userClass: user.userClass || "",
                        section: user.section || "",
                        department: user.department || "",
                        phone: user.phone || "",
                        address: user.address || "",
                        isProfilePrivate: user.isProfilePrivate || false,
                      });
                    }}
                    className="flex-1 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              // Affichage des informations
              <div className="space-y-3">
                {user.role === 'STUDENT' && formData.userClass && (
                  <InfoRow icon={<GraduationCap className="w-5 h-5" />} label="Classe" value={`${formData.userClass} ${formData.section || ''}`} />
                )}
                {formData.phone && (
                  <InfoRow icon={<Phone className="w-5 h-5" />} label="Téléphone" value={formData.phone} />
                )}
                {formData.address && (
                  <InfoRow icon={<MapPin className="w-5 h-5" />} label="Adresse" value={formData.address} />
                )}
                <InfoRow 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Membre depuis" 
                  value={new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })} 
                />
              </div>
            )}
          </div>
        </Card>

        {/* Card changement de mot de passe */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Sécurité</h2>
            </div>
            {!isChangingPassword && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
              >
                Changer le mot de passe
              </Button>
            )}
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleChangePassword} className="flex-1">
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// Composant helper pour afficher une ligne d'info
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
    </div>
  </div>
);

export default ModernProfile;







