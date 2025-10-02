import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Shield, GraduationCap, BookOpen, Settings, Users, BarChart3, FileText, MessageSquare, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin: contextIsAdmin } = useAdmin();
  
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

  // Vérifier si l'utilisateur est admin - logique stricte
  const isAdmin = (() => {
    // Sur les pages publiques, toujours afficher le menu général
    const publicPages = ['/', '/login', '/register'];
    if (publicPages.includes(location.pathname)) return false;
    
    // Si pas d'utilisateur connecté, pas d'admin
    if (!user) return false;
    
    // 1. Vérifier via le contexte admin (priorité)
    if (contextIsAdmin) return true;
    
    // 2. Vérifier via le rôle de l'utilisateur connecté
    if (user.role === 'ADMIN') return true;
    
    // 3. Vérifier via les données adminUser stockées (SimpleAdminLogin)
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const parsedAdminUser = JSON.parse(adminUser);
        if (parsedAdminUser.role === 'ADMIN') return true;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // 4. Vérifier si on est sur une page admin ET qu'on a un token valide
    const token = localStorage.getItem('token');
    const isOnAdminPage = location.pathname.startsWith('/simple-admin') || 
                         location.pathname.startsWith('/admin');
    
    if (isOnAdminPage && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'ADMIN') return true;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return false;
  })();

  // Fonction pour obtenir la route d'accueil selon le rôle
  const getHomeRoute = () => {
    if (isAdmin) {
      return "/simple-admin/dashboard";
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
      // Menu admin avec redirection vers les pages d'administration
      return [
        { name: "Dashboard", href: "/simple-admin/dashboard", icon: "dashboard", admin: true },
        { name: "Utilisateurs", href: "/admin/users", icon: "users", admin: true },
        { name: "Matières", href: "/admin/subjects", icon: "subjects", admin: true },
        { name: "Flashcards", href: "/admin/flashcards", icon: "flashcards", admin: true },
        { name: "Modération", href: "/admin/moderation", icon: "moderation", admin: true },
      ];
    } else if (user?.role === 'TUTOR') {
      return [
        { name: "Accueil", href: "/" },
        { name: "Mon Profil", href: "/profile" },
        { name: "Forum", href: "/forum" },
      ];
    } else if (user?.role === 'STUDENT') {
      return [
        { name: "Accueil", href: "/" },
        { name: "Mon Tableau de Bord", href: "/student/dashboard" },
        { name: "Flashcards", href: "/flashcards" },
        { name: "Forum", href: "/forum" },
      ];
    } else {
      // Menu général du site pour les utilisateurs non connectés
      return [
        { name: "Accueil", href: "/" },
      ];
    }
  };

  const navigation = getNavigation();

  const isActive = (path: string) => location.pathname === path;

  // Debug: afficher les informations de debug en mode développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Navbar Debug:', {
      user,
      userRole: user?.role,
      contextIsAdmin,
      isAdmin,
      token: localStorage.getItem('token'),
      adminUser: localStorage.getItem('adminUser'),
      location: location.pathname,
      forceUpdate,
      timestamp: new Date().toISOString()
    });
  }

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
      default:
        return null;
    }
  };

  // Fonction pour obtenir la classe CSS spéciale pour les liens admin
  const getAdminLinkClass = (item: any, isActive: boolean) => {
    // Si c'est un lien admin, appliquer le style admin simple
    if (item.admin) {
      return isActive 
        ? "text-white bg-purple-600 shadow-md" 
        : "text-purple-200 hover:text-white hover:bg-purple-700";
    }
    
    // Style normal pour les autres rôles
    return isActive
      ? "text-white bg-primary shadow-md"
      : "text-muted-foreground hover:text-foreground hover:bg-gray-100";
  };

  return (
    <nav className={`${isAdmin ? 'bg-purple-800 border-b border-purple-600' : 'bg-gradient-card border-b border-border'} backdrop-blur-sm sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={getHomeRoute()} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${isAdmin ? 'text-white' : 'text-[#00aaff]'}`}>Tyala</span>
                {isAdmin && (
                  <span className="text-xs bg-yellow-400 text-purple-900 px-2 py-1 rounded font-bold">
                    ADMIN
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Centré */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className={`flex items-center ${isAdmin ? 'space-x-4' : 'space-x-6'}`}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded ${getAdminLinkClass(item, isActive(item.href))}`}
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
                      <span>Admin</span>
                    </div>
                  ) : user?.role === 'TUTOR' ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      <BookOpen className="w-3 h-3" />
                      <span>Tuteur</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      <GraduationCap className="w-3 h-3" />
                      <span>Étudiant</span>
                    </div>
                  )}
                </div>
                
                <Link to={isAdmin ? "/simple-admin/dashboard?tab=profile" : "/profile"}>
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="premium" size="sm">
                    S'inscrire
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
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Logo mobile */}
                  <div className="flex items-center gap-2 mb-8 pb-4 border-b border-border">
                    <Link to={getHomeRoute()} onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${isAdmin ? 'text-white' : 'text-[#00aaff]'}`}>Tyala</span>
                      {isAdmin && (
                        <span className="text-xs bg-yellow-400 text-purple-900 px-2 py-1 rounded font-bold">
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
                    {isLoggedIn ? (
                      <>
                        <Link to={isAdmin ? "/simple-admin/dashboard?tab=profile" : "/profile"} onClick={() => setIsOpen(false)}>
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;