import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { BookOpen, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  
  // Récupérer l'email depuis l'état de navigation (après inscription)
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setStatus('idle');
    }
  }, [location.state]);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail(data.email || '');
        toast({
          title: "Email vérifié avec succès !",
          description: "Vous pouvez maintenant vous connecter.",
        });
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        toast({
          title: "Erreur",
          description: data.error || "Le lien de vérification est invalide ou a expiré.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur vérification email:', error);
      setStatus('error');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification.",
        variant: "destructive",
      });
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre email.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email envoyé",
          description: "Un nouvel email de vérification a été envoyé.",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'envoyer l'email de vérification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur renvoi email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="rounded-full bg-blue-100 p-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vérification d'Email
            </h1>
            <p className="text-gray-600">
              {status === 'loading' && 'Vérification en cours...'}
              {status === 'success' && 'Votre email a été vérifié avec succès !'}
              {status === 'error' && 'Le lien de vérification est invalide ou a expiré.'}
              {status === 'idle' && 'Vérifiez votre email pour confirmer votre compte.'}
            </p>
          </div>

          {status === 'loading' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-sm text-gray-600">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <XCircle className="h-16 w-16 text-red-500" />
              
              <div className="w-full space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {resending ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
                </Button>
              </div>
            </div>
          )}

          {status === 'idle' && !token && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <Mail className="h-16 w-16 text-blue-500" />
              
              <div className="w-full space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {resending ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail;

