import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = "/" 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  // Vérifier le rôle depuis le contexte ou localStorage
  let effectiveRole: string | undefined = user?.role;
  let isAuthenticated = !!user;
  
  // Si pas d'utilisateur dans le contexte, vérifier localStorage
  if (!user) {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        effectiveRole = userData.role;
        isAuthenticated = true;
        console.log('ProtectedRoute - Rôle depuis localStorage:', effectiveRole);
      } catch (error) {
        console.error('ProtectedRoute - Erreur parsing user data:', error);
      }
    }
  }

  // Attendre que le chargement soit terminé avant de vérifier l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!isAuthenticated) {
    // Rediriger vers login seulement si on n'y est pas déjà
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      return <Navigate to="/login" replace />;
    }
    return null; // Éviter la double redirection
  }

  // Vérifier les rôles autorisés
  if (allowedRoles.length > 0 && (!effectiveRole || !allowedRoles.includes(effectiveRole))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;






