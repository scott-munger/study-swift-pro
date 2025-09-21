import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BookOpen, User, Mail, Lock, Eye, EyeOff, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const { toast } = useToast();
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "student", // "student" ou "tutor"
    classLevel: "",
    section: "",
    wantsTutorAccount: false,
    tutorProof: null as File | null,
    department: "",
    gender: "",
    phone: "",
    address: "",
    // Champs spécifiques aux tuteurs
    experience: "",
    hourlyRate: "",
    bio: "",
  });

  const finalYearSections = ["SMP", "SVT", "SES", "LLA"];
  const departments = ["Ouest", "Nord", "Sud", "Artibonite", "Centre", "Nord-Est", "Nord-Ouest", "Grand'Anse", "Nippes", "Sud-Est"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? e.target.files?.[0] || null : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      wantsTutorAccount: checked
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur de mot de passe",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    // Validation conditionnelle selon le type de compte
    if (formData.accountType === "student" && !formData.classLevel) {
      toast({
        title: "Classe requise",
        description: "Veuillez sélectionner votre niveau de classe",
        variant: "destructive"
      });
      return;
    }

    // Validation pour les tuteurs
    if (formData.accountType === "tutor") {
      if (!formData.experience || !formData.hourlyRate || !formData.bio) {
        toast({
          title: "Informations tuteur requises",
          description: "Veuillez remplir l'expérience, le tarif et la biographie",
          variant: "destructive"
        });
        return;
      }
    }

    // Préparer les données pour l'inscription selon le type de compte
    let userClass, section;
    
    if (formData.accountType === "student") {
      userClass = formData.classLevel === "final-year" ? "Terminale" : "9ème";
      section = formData.classLevel === "final-year" ? formData.section : undefined;
    } else {
      // Pour les tuteurs, pas de classe/section
      userClass = undefined;
      section = undefined;
    }

    const success = await register(
      formData.email, 
      formData.password, 
      formData.firstName, 
      formData.lastName, 
      userClass, 
      section,
      formData.department,
      formData.phone || undefined,
      formData.address || undefined,
      formData.accountType, // Ajouter le rôle
      formData.accountType === "tutor" ? {
        experience: parseInt(formData.experience) || 0,
        hourlyRate: parseInt(formData.hourlyRate) || 0,
        bio: formData.bio || "",
        proofFile: formData.tutorProof
      } : undefined
    );
    
    if (success) {
      // Redirection basée sur le rôle
      if (formData.accountType === "student") {
        toast({
          title: "Inscription réussie",
          description: "Bienvenue étudiant ! Votre compte a été créé avec succès",
        });
        navigate('/student/dashboard');
      } else if (formData.accountType === "tutor") {
        toast({
          title: "Inscription réussie",
          description: "Bienvenue tuteur ! Votre compte a été créé avec succès",
        });
        navigate('/profile');
      } else {
        toast({
          title: "Inscription réussie",
          description: "Bienvenue sur TYALA ! Votre compte a été créé avec succès",
        });
        navigate('/');
      }
    } else {
      toast({
        title: "Erreur d'inscription",
        description: "Une erreur s'est produite lors de la création de votre compte",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <span className="font-bold text-xl sm:text-2xl bg-gradient-primary bg-clip-text text-transparent">
              TYALA
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Créer votre compte
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Rejoignez des milliers d'étudiants préparant leur réussite
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? "bg-primary text-white"
                  : step < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <Card className="p-6 sm:p-8 bg-gradient-card border-border">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Informations de Base</h3>
                  <p className="text-sm text-muted-foreground">Commençons par vos informations personnelles</p>
                </div>

                {/* Type de compte */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Type de compte
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.accountType === "student" 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => handleSelectChange("accountType", "student")}
                    >
                      <div className="text-center">
                        <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h4 className="font-medium text-foreground">Étudiant</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accès aux cours, flashcards et tuteurs
                        </p>
                      </div>
                    </div>
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.accountType === "tutor" 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => handleSelectChange("accountType", "tutor")}
                    >
                      <div className="text-center">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h4 className="font-medium text-foreground">Tuteur</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enseigner et aider les étudiants
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                      Prénom
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                      Nom
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Adresse email
                  </Label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="jean.dupont@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mot de passe
                  </Label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Créez un mot de passe fort"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmez votre mot de passe"
                  />
                </div>

                <Button type="button" onClick={handleNextStep} className="w-full" variant="premium">
                  Continuer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Academic/Professional Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {formData.accountType === "student" ? "Informations Académiques" : "Informations Professionnelles"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.accountType === "student" 
                      ? "Parlez-nous de votre niveau académique" 
                      : "Parlez-nous de votre expérience d'enseignement"
                    }
                  </p>
                </div>

                {formData.accountType === "student" ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Niveau de Classe
                      </Label>
                      <Select value={formData.classLevel} onValueChange={(value) => handleSelectChange("classLevel", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre niveau de classe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="final-year">Terminale</SelectItem>
                          <SelectItem value="9th-grade">9ème</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.classLevel === "final-year" && (
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-2 block">
                          Section
                        </Label>
                        <Select value={formData.section} onValueChange={(value) => handleSelectChange("section", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre section" />
                          </SelectTrigger>
                          <SelectContent>
                            {finalYearSections.map(section => (
                              <SelectItem key={section} value={section}>{section}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="experience" className="text-sm font-medium text-foreground">
                        Années d'expérience
                      </Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Ex: 3"
                        value={formData.experience || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourlyRate" className="text-sm font-medium text-foreground">
                        Tarif horaire (HTG)
                      </Label>
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        min="0"
                        placeholder="Ex: 500"
                        value={formData.hourlyRate || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium text-foreground">
                        Biographie
                      </Label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        placeholder="Parlez-nous de votre expérience et de vos spécialités..."
                        value={formData.bio || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tutorProof" className="text-sm font-medium text-foreground mb-2 block">
                        Preuve d'Emploi/Diplôme (Requis)
                      </Label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-muted border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="flex text-sm text-muted-foreground">
                            <label htmlFor="tutorProof" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                              <span>Télécharger un fichier</span>
                              <Input
                                id="tutorProof"
                                name="tutorProof"
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, PNG, JPG jusqu'à 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex space-x-4">
                  <Button type="button" onClick={handlePrevStep} variant="outline" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button type="button" onClick={handleNextStep} variant="premium" className="flex-1">
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Détails Personnels</h3>
                  <p className="text-sm text-muted-foreground">Dernière étape pour compléter votre inscription</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Département (Zone de Résidence)
                  </Label>
                  <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre département" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Téléphone (Optionnel)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+509 1234-5678"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">
                    Adresse (Optionnel)
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Rue, Ville, Département"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Genre
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                      <SelectItem value="prefer-not-to-say">Préfère ne pas dire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/20 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    En créant un compte, vous acceptez nos Conditions d'Utilisation et notre Politique de Confidentialité. 
                    Nous vous enverrons un email de vérification pour confirmer votre compte.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button type="button" onClick={handlePrevStep} variant="outline" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button type="submit" variant="premium" className="flex-1" disabled={loading}>
                    <User className="w-4 h-4 mr-2" />
                    {loading ? "Création..." : "Créer le Compte"}
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;