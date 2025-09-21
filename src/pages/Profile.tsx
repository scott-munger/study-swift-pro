import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Calendar, Edit, Save, X, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(user?.firstName || "");
  const [editedLastName, setEditedLastName] = useState(user?.lastName || "");
  const [editedClass, setEditedClass] = useState(user?.userClass || "");
  const [editedSection, setEditedSection] = useState(user?.section || "");
  const [editedDepartment, setEditedDepartment] = useState(user?.department || "");
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");
  const [editedAddress, setEditedAddress] = useState(user?.address || "");

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
      const profileData = {
        firstName: editedFirstName,
        lastName: editedLastName,
        userClass: editedClass,
        section: editedSection,
        department: editedDepartment,
        phone: editedPhone,
        address: editedAddress
      };

      const success = await updateProfile(profileData);
      
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été sauvegardées avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les modifications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src="/placeholder.svg" alt="Avatar" />
            <AvatarFallback className="text-2xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
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
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classe</Label>
                    <Select value={editedClass} onValueChange={setEditedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9ème">9ème</SelectItem>
                        <SelectItem value="Terminale">Terminale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editedClass === "Terminale" && (
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={editedSection} onValueChange={setEditedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SVT">SVT</SelectItem>
                          <SelectItem value="SES">SES</SelectItem>
                          <SelectItem value="LLA">LLA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;