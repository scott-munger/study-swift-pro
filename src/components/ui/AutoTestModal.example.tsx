import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Clock, BookOpen, Target, Users, CheckCircle, Play, Share2 } from 'lucide-react';
import SocialShareButton from './SocialShareButton';

/**
 * Exemple du comportement automatique du modal de test
 * 
 * Ce composant démontre comment le modal s'ouvre automatiquement
 * quand il n'y a qu'un seul test disponible pour une matière.
 */

const AutoTestModalExample = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);

  // Données d'exemple
  const subjects = [
    { id: '1', name: 'Mathématiques', tests: 1 },
    { id: '2', name: 'Physique', tests: 3 },
    { id: '3', name: 'Chimie', tests: 0 },
    { id: '4', name: 'Biologie', tests: 2 }
  ];

  const testData = {
    '1': [{
      id: 1,
      title: "Examen de Mathématiques - Chapitre 3",
      description: "Test sur les fonctions dérivées et leurs applications.",
      subject: { name: "Mathématiques", level: "Terminale", section: "SMP" },
      timeLimit: 45,
      passingScore: 70,
      _count: { questions: 25, results: 156 }
    }],
    '2': [
      {
        id: 2,
        title: "Test de Physique - Mécanique",
        description: "Questions sur les lois de Newton et le mouvement.",
        subject: { name: "Physique", level: "Terminale", section: "SMP" },
        timeLimit: 60,
        passingScore: 75,
        _count: { questions: 30, results: 89 }
      },
      {
        id: 3,
        title: "Test de Physique - Électricité",
        description: "Circuits électriques et lois d'Ohm.",
        subject: { name: "Physique", level: "Terminale", section: "SMP" },
        timeLimit: 50,
        passingScore: 70,
        _count: { questions: 20, results: 67 }
      },
      {
        id: 4,
        title: "Test de Physique - Optique",
        description: "Réflexion, réfraction et lentilles.",
        subject: { name: "Physique", level: "Terminale", section: "SMP" },
        timeLimit: 40,
        passingScore: 65,
        _count: { questions: 18, results: 45 }
      }
    ],
    '3': [],
    '4': [
      {
        id: 5,
        title: "Test de Biologie - Cellule",
        description: "Structure et fonction des cellules.",
        subject: { name: "Biologie", level: "Terminale", section: "SVT" },
        timeLimit: 35,
        passingScore: 60,
        _count: { questions: 22, results: 78 }
      },
      {
        id: 6,
        title: "Test de Biologie - Génétique",
        description: "Hérédité et génétique mendélienne.",
        subject: { name: "Biologie", level: "Terminale", section: "SVT" },
        timeLimit: 50,
        passingScore: 70,
        _count: { questions: 28, results: 56 }
      }
    ]
  };

  // Simuler le chargement des tests
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    const subjectTests = testData[subjectId as keyof typeof testData] || [];
    setTests(subjectTests);
    
    // Si il n'y a qu'un seul test, ouvrir automatiquement le modal
    if (subjectTests.length === 1) {
      setSelectedTest(subjectTests[0]);
      setShowTestModal(true);
    } else {
      setShowTestModal(false);
      setSelectedTest(null);
    }
  };

  const startTest = (testId: number) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setSelectedTest(test);
      setShowTestModal(true);
    }
  };

  const confirmStartTest = () => {
    if (selectedTest) {
      setShowTestModal(false);
      alert(`Test "${selectedTest.title}" commencé ! (Démonstration)`);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Démonstration - Ouverture Automatique du Modal
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Comportement automatique</h2>
          <p className="text-gray-600 mb-4">
            Sélectionnez une matière pour voir le comportement :
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>• <strong>Mathématiques</strong> (1 test) → Modal s'ouvre automatiquement</li>
            <li>• <strong>Physique</strong> (3 tests) → Liste des tests avec boutons</li>
            <li>• <strong>Chimie</strong> (0 test) → Message "Aucun test disponible"</li>
            <li>• <strong>Biologie</strong> (2 tests) → Liste des tests avec boutons</li>
          </ul>
        </div>

        {/* Sélecteur de matière */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Sélectionner une matière</h3>
          <Select value={selectedSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisissez une matière..." />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.tests} test{subject.tests > 1 ? 's' : ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Affichage des tests */}
        {selectedSubject && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Tests disponibles pour {subjects.find(s => s.id === selectedSubject)?.name}
            </h3>
            
            {tests.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun test disponible pour cette matière</p>
              </div>
            ) : tests.length === 1 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Test unique détecté</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Le modal s'ouvrira automatiquement car il n'y a qu'un seul test disponible.
                </p>
                <div className="bg-white rounded p-3">
                  <h4 className="font-semibold">{tests[0].title}</h4>
                  <p className="text-sm text-gray-600">{tests[0].description}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Tests multiples détectés</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Plusieurs tests disponibles. Cliquez sur "Commencer le test" pour voir le modal.
                  </p>
                </div>
                
                {tests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{test.title}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{test._count.questions} questions</span>
                          <span>{test.timeLimit} min</span>
                          <span>{test.passingScore}% requis</span>
                        </div>
                      </div>
                      <Button onClick={() => startTest(test.id)} size="sm">
                        Commencer le test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de test */}
        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedTest?.title}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedTest?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTest && (
              <div className="space-y-6">
                {/* Message informatif si c'est le seul test */}
                {tests.length === 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Test unique disponible</h4>
                        <p className="text-sm text-blue-700">
                          Il n'y a qu'un seul test disponible pour cette matière. Vous pouvez le commencer directement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations du test */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Questions</p>
                        <p className="font-semibold text-lg">{selectedTest._count.questions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Durée</p>
                        <p className="font-semibold text-lg">{selectedTest.timeLimit} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Score requis</p>
                        <p className="font-semibold text-lg">{selectedTest.passingScore}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Tentatives</p>
                        <p className="font-semibold text-lg">{selectedTest._count.results}</p>
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
                        {selectedTest.subject.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {selectedTest.subject.level}
                        </Badge>
                        {selectedTest.subject.section && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {selectedTest.subject.section}
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
                    <li>• Vous avez {selectedTest.timeLimit} minutes pour compléter le test</li>
                    <li>• Vous devez obtenir au moins {selectedTest.passingScore}% pour réussir</li>
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
                    title={`Test de connaissances: ${selectedTest.title}`}
                    description={`${selectedTest.description} | ${selectedTest._count.questions} questions | ${selectedTest.timeLimit} min`}
                    author="Tyala Platform"
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTestModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={confirmStartTest}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Commencer le test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AutoTestModalExample;


