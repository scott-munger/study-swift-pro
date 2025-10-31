import React from 'react';
import SocialShareButton from './SocialShareButton';

/**
 * Exemple d'utilisation du composant SocialShareButton
 * 
 * Ce composant permet de partager du contenu sur les réseaux sociaux
 * avec un menu déroulant élégant et des options de partage multiples.
 */

const SocialShareButtonExample = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Exemples d'utilisation du SocialShareButton
        </h1>

        {/* Exemple 1: Partage basique */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. Partage basique</h2>
          <p className="text-gray-600 mb-4">
            Bouton de partage simple avec l'URL actuelle
          </p>
          <SocialShareButton />
        </div>

        {/* Exemple 2: Partage avec titre et description */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">2. Partage avec contenu personnalisé</h2>
          <p className="text-gray-600 mb-4">
            Bouton de partage avec titre, description et auteur personnalisés
          </p>
          <SocialShareButton
            url="https://tyala.com/forum/post/123"
            title="Comment réussir son examen de mathématiques"
            description="Découvrez mes conseils pour exceller en mathématiques et obtenir de bons résultats aux examens."
            author="Marie Dubois"
            size="md"
            variant="outline"
          />
        </div>

        {/* Exemple 3: Différentes tailles */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">3. Différentes tailles</h2>
          <p className="text-gray-600 mb-4">
            Boutons de partage en différentes tailles
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <SocialShareButton size="sm" />
              <p className="text-xs text-gray-500 mt-2">Small</p>
            </div>
            <div className="text-center">
              <SocialShareButton size="md" />
              <p className="text-xs text-gray-500 mt-2">Medium</p>
            </div>
            <div className="text-center">
              <SocialShareButton size="lg" />
              <p className="text-xs text-gray-500 mt-2">Large</p>
            </div>
          </div>
        </div>

        {/* Exemple 4: Différents variants */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">4. Différents variants</h2>
          <p className="text-gray-600 mb-4">
            Boutons de partage avec différents styles
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <SocialShareButton variant="ghost" />
              <p className="text-xs text-gray-500 mt-2">Ghost</p>
            </div>
            <div className="text-center">
              <SocialShareButton variant="outline" />
              <p className="text-xs text-gray-500 mt-2">Outline</p>
            </div>
            <div className="text-center">
              <SocialShareButton variant="default" />
              <p className="text-xs text-gray-500 mt-2">Default</p>
            </div>
          </div>
        </div>

        {/* Exemple 5: Partage d'un post de forum */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">5. Partage d'un post de forum</h2>
          <p className="text-gray-600 mb-4">
            Exemple de partage d'un post de forum avec toutes les informations
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">
              "Conseils pour réussir l'examen de physique"
            </h3>
            <p className="text-gray-600 mb-2">
              Voici mes conseils pour bien préparer l'examen de physique...
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Par Jean Dupont • Il y a 2 heures</span>
              <SocialShareButton
                url="https://tyala.com/forum/post/456"
                title="Conseils pour réussir l'examen de physique"
                description="Voici mes conseils pour bien préparer l'examen de physique et obtenir de bons résultats."
                author="Jean Dupont"
                size="sm"
                variant="ghost"
                className="hover:bg-blue-50 hover:text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Exemple 6: Partage d'une flashcard */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">6. Partage d'une flashcard</h2>
          <p className="text-gray-600 mb-4">
            Exemple de partage d'une flashcard d'étude
          </p>
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-blue-600">Mathématiques</Badge>
              <SocialShareButton
                url="https://tyala.com/flashcards/789"
                title="Flashcard: Qu'est-ce que la dérivée d'une fonction ?"
                description="Difficulté: Moyen | Matière: Mathématiques"
                author="Tyala Platform"
                size="sm"
                variant="ghost"
                className="hover:bg-blue-100"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">Question:</h3>
            <p className="text-gray-800 mb-2">
              Qu'est-ce que la dérivée d'une fonction ?
            </p>
            <h3 className="font-semibold text-lg mb-2">Réponse:</h3>
            <p className="text-gray-800">
              La dérivée d'une fonction f(x) est la limite du taux d'accroissement...
            </p>
          </div>
        </div>

        {/* Informations sur les réseaux sociaux supportés */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            Réseaux sociaux supportés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Facebook', icon: 'f', color: 'bg-blue-600' },
              { name: 'Twitter/X', icon: '𝕏', color: 'bg-sky-500' },
              { name: 'WhatsApp', icon: 'W', color: 'bg-green-500' },
              { name: 'LinkedIn', icon: 'in', color: 'bg-blue-700' },
              { name: 'Telegram', icon: 'T', color: 'bg-blue-500' },
              { name: 'Email', icon: '✉', color: 'bg-gray-600' }
            ].map((social) => (
              <div key={social.name} className="flex items-center gap-2">
                <div className={`w-6 h-6 ${social.color} rounded flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{social.icon}</span>
                </div>
                <span className="text-sm text-blue-800">{social.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialShareButtonExample;


