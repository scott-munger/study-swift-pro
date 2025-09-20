import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Users, BookOpen, MessageSquare } from 'lucide-react';

interface DatabaseStats {
  subjects: number;
  tutors: number;
  flashcards: number;
  messages: number;
}

const DatabaseTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8081/api';

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        setIsConnected(true);
        await fetchStats();
      } else {
        throw new Error('Server not responding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [subjectsRes, tutorsRes, flashcardsRes] = await Promise.all([
        fetch(`${API_BASE}/subjects`),
        fetch(`${API_BASE}/tutors`),
        fetch(`${API_BASE}/flashcards/1`) // Test with subject ID 1
      ]);

      const subjects = await subjectsRes.json();
      const tutors = await tutorsRes.json();
      const flashcards = await flashcardsRes.json();

      setStats({
        subjects: subjects.length,
        tutors: tutors.length,
        flashcards: flashcards.length,
        messages: 0 // We'll implement this later
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const seedDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchStats();
        alert('Base de données initialisée avec succès !');
      } else {
        throw new Error('Failed to seed database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test de Connexion Base de Données
          </CardTitle>
          <CardDescription>
            Vérifiez la connexion à MySQL et testez les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="hero"
            >
              {isLoading ? 'Test en cours...' : 'Tester la Connexion'}
            </Button>
            
            {isConnected && (
              <Button 
                onClick={seedDatabase} 
                disabled={isLoading}
                variant="success"
              >
                Initialiser la Base de Données
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Erreur :</p>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-red-500 mt-2">
                Assurez-vous que MySQL est démarré et que le serveur API fonctionne.
              </p>
            </div>
          )}

          {isConnected && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Connexion réussie !</p>
              <p className="text-green-600">La base de données MySQL est accessible.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{stats.subjects}</div>
              <div className="text-sm text-muted-foreground">Matières</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary">{stats.tutors}</div>
              <div className="text-sm text-muted-foreground">Tuteurs</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-success">{stats.flashcards}</div>
              <div className="text-sm text-muted-foreground">Flashcards</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.messages}</div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline">1</Badge>
            <div>
              <p className="font-medium">Démarrer MySQL</p>
              <p className="text-sm text-muted-foreground">
                Assurez-vous que MySQL est installé et démarré sur votre machine
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">2</Badge>
            <div>
              <p className="font-medium">Créer la base de données</p>
              <p className="text-sm text-muted-foreground">
                Créez une base de données nommée "study_swift_pro" dans MySQL
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">3</Badge>
            <div>
              <p className="font-medium">Démarrer le serveur API</p>
              <p className="text-sm text-muted-foreground">
                Exécutez <code className="bg-gray-100 px-2 py-1 rounded">npm run api</code> dans un terminal
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">4</Badge>
            <div>
              <p className="font-medium">Tester la connexion</p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur "Tester la Connexion" pour vérifier que tout fonctionne
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;

