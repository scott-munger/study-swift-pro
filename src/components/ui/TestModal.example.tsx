import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Clock, BookOpen, Target, Users, CheckCircle, Play, Share2 } from 'lucide-react';
import SocialShareButton from './SocialShareButton';

/**
 * Exemple du modal de confirmation de test
 * 
 * Ce composant montre comment le modal de test s'affiche
 * avec toutes les informations importantes avant de commencer un test.
 */

const TestModalExample = () => {
  const [showModal, setShowModal] = useState(false);

  // Données d'exemple d'un test
  const exampleTest = {
    id: 1,
    title: "Examen de Mathématiques - Chapitre 3",
    description: "Test sur les fonctions dérivées et leurs applications dans la résolution de problèmes pratiques.",
    subject: {
      name: "Mathématiques",
      level: "Terminale",
      section: "SMP"
    },
    timeLimit: 45,
    passingScore: 70,
    _count: {
      questions: 25,
      results: 156
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Exemple du Modal de Confirmation de Test
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Fonctionnalité</h2>
          <p className="text-gray-600 mb-4">
            Quand un utilisateur clique sur "Commencer le test", un modal élégant s'affiche
            avec toutes les informations importantes du test avant de le commencer.
          </p>
          <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
            Voir l'exemple du modal
          </Button>
        </div>

        {/* Modal de démonstration */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {exampleTest.title}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {exampleTest.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations du test */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Questions</p>
                      <p className="font-semibold text-lg">{exampleTest._count.questions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Durée</p>
                      <p className="font-semibold text-lg">{exampleTest.timeLimit} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Score requis</p>
                      <p className="font-semibold text-lg">{exampleTest.passingScore}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tentatives</p>
                      <p className="font-semibold text-lg">{exampleTest._count.results}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations sur la matière */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-blue-900">
                      {exampleTest.subject.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {exampleTest.subject.level}
                      </Badge>
                      {exampleTest.subject.section && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {exampleTest.subject.section}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions importantes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Instructions importantes
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Vous avez {exampleTest.timeLimit} minutes pour compléter le test</li>
                  <li>• Vous devez obtenir au moins {exampleTest.passingScore}% pour réussir</li>
                  <li>• Une fois commencé, le test ne peut pas être interrompu</li>
                  <li>• Assurez-vous d'avoir une connexion internet stable</li>
                </ul>
              </div>

              {/* Bouton de partage */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Partager ce test</h4>
                  <p className="text-sm text-gray-600">Invitez d'autres étudiants à participer</p>
                </div>
                <SocialShareButton
                  url={window.location.href}
                  title={`Test de connaissances: ${exampleTest.title}`}
                  description={`${exampleTest.description} | ${exampleTest._count.questions} questions | ${exampleTest.timeLimit} min`}
                  author="Tyala Platform"
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  alert('Test commencé ! (Démonstration)');
                  setShowModal(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Commencer le test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Avantages de cette approche */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Avantages de cette approche</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Meilleure UX</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• L'utilisateur voit toutes les informations avant de commencer</li>
                <li>• Possibilité d'annuler si les conditions ne conviennent pas</li>
                <li>• Interface claire et professionnelle</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📊 Informations clés</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Nombre de questions et durée</li>
                <li>• Score requis pour réussir</li>
                <li>• Instructions importantes</li>
                <li>• Possibilité de partager le test</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Design moderne</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Interface responsive</li>
                <li>• Couleurs cohérentes avec Tyala</li>
                <li>• Icônes et badges informatifs</li>
                <li>• Animations fluides</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⚡ Fonctionnalités</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bouton de partage intégré</li>
                <li>• Fermeture par clic extérieur</li>
                <li>• Boutons d'action clairs</li>
                <li>• Informations contextuelles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestModalExample;



