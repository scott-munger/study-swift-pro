import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield,
  Database,
  Activity,
  CheckCircle,
  ArrowRight,
  Bell
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter } from "@/components/ui/notification-center";

const Admin = () => {
  const { isAdmin, adminUser } = useAdmin();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([]);
  const [forumNotifications] = useState([]);
  const [isConnected] = useState(true);
  

  useEffect(() => {
    if (isAdmin && adminUser) {
      // Rediriger vers le dashboard si déjà connecté
      window.location.href = '/admin/dashboard';
    }
  }, [isAdmin, adminUser]);

  // Si pas connecté en tant qu'admin, afficher la page d'accueil admin
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 bg-gradient-card border-border shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              
              {/* Bouton de notifications pour admin */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {(notifications.length > 0 || forumNotifications.length > 0) && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs"
                    >
                      {notifications.length + forumNotifications.length}
                    </Badge>
                  )}
                </Button>
                
                {/* Indicateur de connexion */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Administration Study Swift Pro
          </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Accès sécurisé au panneau d'administration complet
          </p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-muted/20 rounded-lg">
              <div className="flex items-center mb-4">
                <Database className="w-6 h-6 text-primary mr-3" />
                <h3 className="font-semibold text-foreground">Base de Données</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Gestion complète des données utilisateurs, tuteurs et messages
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                MySQL Connecté
              </Badge>
            </div>

            <div className="p-6 bg-muted/20 rounded-lg">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-secondary mr-3" />
                <h3 className="font-semibold text-foreground">Monitoring</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Surveillance en temps réel et analytics avancés
              </p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Activity className="w-3 h-3 mr-1" />
                Temps Réel
              </Badge>
            </div>
        </div>

          <div className="text-center space-y-4">
            <Button 
              onClick={() => window.location.href = '/login'}
              size="lg"
              className="w-full md:w-auto"
            >
              Accéder à l'Administration
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="text-sm text-muted-foreground">ou</div>
            
        <Button
          onClick={() => window.location.href = '/login'}
          size="lg"
          variant="outline"
          className="w-full md:w-auto"
        >
          Se connecter en tant qu'Admin
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
          </div>

          <div className="mt-8 p-4 bg-muted/20 rounded-lg">
            <h3 className="font-semibold text-sm text-foreground mb-2">Fonctionnalités disponibles :</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• Gestion des utilisateurs et tuteurs</div>
              <div>• Modération des messages</div>
              <div>• Analytics et rapports</div>
              <div>• Configuration système</div>
              <div>• Logs et audit trail</div>
              <div>• Alertes et notifications</div>
                </div>
              </div>
            </Card>
      </div>
      
      {/* Centre de Notifications */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );

};

export default Admin;