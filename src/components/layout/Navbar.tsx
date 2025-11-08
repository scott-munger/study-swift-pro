import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, User, LogOut, Shield, GraduationCap, BookOpen, Settings, Users, BarChart3, FileText, MessageSquare, Eye, ClipboardCheck, Image, Mail, Languages, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/ui/NotificationBell";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import LanguageSelector from "@/components/ui/LanguageSelector";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin: contextIsAdmin } = useAdmin();
  const { language, setLanguage, t } = useLanguage();
  
  // Vérification de l'état de connexion
  const isLoggedIn = (() => {
    // Si pas d'utilisateur dans le contexte, pas connecté
    if (!user) return false;
    
    // Si l'utilisateur est dans le contexte React, il est connecté
    // (même si pas persisté dans localStorage)
    return true;
  })();

  // Forcer la mise à jour du menu quand on change de page
  React.useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Vérifier si l'utilisateur est admin - logique simplifiée
  const isAdmin = (() => {
    // Si pas d'utilisateur connecté, pas d'admin
    if (!user) {
      return false;
    }
    
    // Vérifier via le rôle de l'utilisateur connecté
    if (user.role === 'ADMIN') {
      return true;
    }
    
    // Vérifier via le contexte admin
    if (contextIsAdmin) {
      return true;
    }
    
    return false;
  })();

  // Fonction pour obtenir la route d'accueil selon le rôle
  const getHomeRoute = () => {
    if (isAdmin) {
      return "/admin/dashboard-modern";
    } else if (user?.role === 'TUTOR') {
      return "/";
    } else if (user?.role === 'STUDENT') {
      return "/student/dashboard";
    } else {
      return "/";
    }
  };

  // Navigation basée sur le rôle
  const getNavigation = () => {
    if (isAdmin) {
      // Menu admin - tout est dans le dashboard avec sidebar
      return [
        { name: t.nav.dashboard, href: "/admin/dashboard", icon: "dashboard", admin: true },
      ];
    } else if (user?.role === 'TUTOR') {
      return [
        { name: t.nav.profile, href: "/profile" },
        { name: t.nav.messages, href: "/messages", icon: "messages" },
        { name: t.nav.forum, href: "/forum" },
      ];
    } else if (user?.role === 'STUDENT') {
      return [
        { name: t.nav.dashboard, href: "/student/dashboard" },
        { name: t.nav.flashcards, href: "/flashcards" },
        { name: t.nav.tests, href: "/knowledge-tests" },
        { name: t.nav.tutors, href: "/tutors" },
        { name: t.nav.messages, href: "/messages", icon: "messages" },
        { name: t.nav.forum, href: "/forum" },
      ];
    } else {
      // Menu général du site pour les utilisateurs non connectés
      return [];
    }
  };

  const navigation = getNavigation();

  const isActive = (path: string) => {
    // Pour les routes exactes
    if (location.pathname === path) return true;
    
    // Pour les routes admin avec des paramètres (comme /admin/dashboard-modern?tab=...)
    if (path.startsWith('/admin/') && location.pathname.startsWith('/admin/')) {
      const basePath = path.split('?')[0];
      const currentBasePath = location.pathname.split('?')[0];
      return basePath === currentBasePath;
    }
    
    return false;
  };

  // Debug: afficher les informations de debug en mode développement
  // Debug logs supprimés pour production

  // Fonction pour obtenir l'icône appropriée
  const getNavIcon = (name: string, iconType?: string) => {
    // Pour les admins, utiliser les icônes spécifiques
    if (iconType) {
      switch (iconType) {
        case "dashboard":
          return <Settings className="w-4 h-4 mr-2" />;
        case "users":
          return <Users className="w-4 h-4 mr-2" />;
        case "subjects":
          return <BookOpen className="w-4 h-4 mr-2" />;
        case "flashcards":
          return <FileText className="w-4 h-4 mr-2" />;
        case "images":
          return <Image className="w-4 h-4 mr-2" />;
        case "knowledge-tests":
          return <ClipboardCheck className="w-4 h-4 mr-2" />;
        case "stats":
          return <BarChart3 className="w-4 h-4 mr-2" />;
        case "moderation":
          return <Eye className="w-4 h-4 mr-2" />;
        default:
          return null;
      }
    }
    
    // Pour les autres rôles
    switch (name) {
      case "Mon Profil":
        return <User className="w-4 h-4 mr-2" />;
      case "Forum":
        return <MessageSquare className="w-4 h-4 mr-2" />;
      case "Messages":
      case "messages":
        return <Mail className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  // Fonction pour obtenir la classe CSS spéciale pour les liens admin
  const getAdminLinkClass = (item: any, isActive: boolean) => {
    // Si c'est un lien admin, appliquer le style admin moderne avec border-bottom
    if (item.admin) {
      return isActive 
        ? "text-white border-b-2 border-purple-400 transition-all duration-300" 
        : "text-purple-200 hover:text-white hover:border-b-2 hover:border-purple-300 border-b-2 border-transparent transition-all duration-300";
    }
    
    // Style normal pour les autres rôles - Border-bottom bleu moderne
    return isActive
      ? "text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 font-medium transition-all duration-300"
      : "text-muted-foreground hover:text-primary dark:hover:text-blue-400 hover:border-b-2 hover:border-primary/50 dark:hover:border-blue-400/50 border-b-2 border-transparent transition-all duration-300";
  };

  return (
    <nav className={`${isAdmin ? 'bg-purple-800 dark:bg-purple-900 border-b border-purple-600 dark:border-purple-700' : 'bg-white dark:bg-card border-b border-border'} backdrop-blur-sm sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo cliquable */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/Asset 2Tyala copie.png" 
                alt="Tyala Logo" 
                className="h-6 w-auto object-contain cursor-pointer"
                style={{ maxWidth: '90px', height: 'auto' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation - Centré */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className={`flex items-center ${isAdmin ? 'space-x-1' : 'space-x-6'}`}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 pb-4 pt-5 text-sm font-medium ${getAdminLinkClass(item, isActive(item.href))}`}
                >
                  {getNavIcon(item.name, item.icon)}
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                {/* Indicateur de rôle */}
                <div className="flex items-center space-x-2">
                  {isAdmin ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      <Shield className="w-3 h-3" />
                      <span>{t.nav.admin}</span>
                    </div>
                  ) : user?.role === 'TUTOR' ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                      <BookOpen className="w-3 h-3" />
                      <span>{t.nav.tutors}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                      <GraduationCap className="w-3 h-3" />
                      <span>{t.nav.home}</span>
                    </div>
                  )}
                </div>
                
                {/* Sélecteur de langue */}
                <LanguageSelector />
                
                {/* Toggle de thème */}
                <ThemeToggle />
                
                {/* Centre de notifications moderne */}
                <NotificationCenter />
                
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {t.nav.profile}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.nav.logout}
                </Button>
              </>
            ) : (
              <>
                {/* Sélecteur de langue */}
                <LanguageSelector />
                
                {/* Toggle de thème - Visible même non connecté */}
                <ThemeToggle />
                
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="premium" size="sm">
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
                  <SheetTitle>Menu de navigation</SheetTitle>
                  <SheetDescription>
                    Accédez aux différentes sections de l'application
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 px-6">
                <div className="flex flex-col space-y-4 py-4">
                  {/* Logo mobile */}
                  <div className="flex items-center gap-2 mb-8 pb-4 border-b border-border">
                    <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <img 
                        src="/Asset 2Tyala copie.png" 
                        alt="Tyala Logo" 
                        className="h-5 w-auto object-contain cursor-pointer"
                        style={{ maxWidth: '85px', height: 'auto' }}
                      />
                      {isAdmin && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded font-medium">
                          ADMIN
                        </span>
                      )}
                    </Link>
                  </div>
                  
                  {/* Navigation mobile */}
                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-4 py-3 text-base font-medium transition-all duration-200 rounded-lg ${getAdminLinkClass(item, isActive(item.href))}`}
                      >
                        {getNavIcon(item.name, item.icon)}
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-border space-y-3">
                    {/* Sélecteur de langue mobile */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t.nav.home === 'Accueil' ? 'Langue' : 'Lang'}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant={language === 'fr' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setLanguage('fr');
                            setIsOpen(false);
                          }}
                          className="text-xs"
                        >
                          🇫🇷 FR
                        </Button>
                        <Button
                          variant={language === 'ht' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setLanguage('ht');
                            setIsOpen(false);
                          }}
                          className="text-xs"
                        >
                          🇭🇹 HT
                        </Button>
                      </div>
                    </div>
                    
                    {/* Toggle de thème - Toujours visible */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Mode d'affichage</span>
                      <ThemeToggle />
                    </div>
                    
                    {/* Lien Privacy Policy */}
                    <Link to="/privacy-policy" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Politique de Confidentialité
                      </Button>
                    </Link>
                    
                    {isLoggedIn ? (
                      <>
                        <Link to="/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <User className="w-4 h-4 mr-2" />
                            Profil
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full">
                            Connexion
                          </Button>
                        </Link>
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          <Button variant="premium" className="w-full">
                            S'inscrire
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;