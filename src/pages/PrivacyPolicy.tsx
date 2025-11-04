import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, Eye, Users, CheckCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold mb-2">
              Politique de Confidentialité
            </CardTitle>
            <CardDescription className="text-lg">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                1. Collecte des Informations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Nous collectons les informations que vous nous fournissez directement lorsque vous créez un compte, 
                utilisez nos services, communiquez avec nous ou participez à nos activités éducatives. Ces informations 
                incluent votre nom, adresse e-mail, informations de profil, et autres données que vous choisissez de partager.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                2. Utilisation des Informations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Nous utilisons vos informations pour :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Fournir, maintenir et améliorer nos services éducatifs</li>
                <li>Faciliter la communication entre étudiants et tuteurs</li>
                <li>Personnaliser votre expérience d'apprentissage</li>
                <li>Envoyer des notifications importantes concernant nos services</li>
                <li>Assurer la sécurité et prévenir les activités frauduleuses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                3. Partage des Informations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Nous partageons 
                vos informations uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Avec votre consentement explicite</li>
                <li>Pour fournir nos services (par exemple, faciliter les conversations entre étudiants et tuteurs)</li>
                <li>Pour répondre aux obligations légales</li>
                <li>Pour protéger nos droits et ceux de nos utilisateurs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                4. Sécurité des Données
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger 
                vos informations personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction. 
                Cela inclut le chiffrement des données sensibles, l'accès restreint aux informations, et des audits de sécurité réguliers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                5. Modération et Modération des Conversations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Pour maintenir un environnement d'apprentissage sûr et respectueux, nous nous réservons le droit de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Modérer le contenu des conversations et messages</li>
                <li>Bloquer des conversations qui violent nos conditions d'utilisation ou nos règles de communauté</li>
                <li>Prendre des mesures disciplinaires, y compris la suspension ou le bannissement d'utilisateurs</li>
                <li>Supprimer tout contenu inapproprié, offensant ou illégal</li>
              </ul>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Note importante :</strong> Si votre conversation a été bloquée, vous avez le droit de la supprimer. 
                  Vous pouvez également consulter cette politique de confidentialité pour comprendre les règles et réglementations 
                  qui s'appliquent à l'utilisation de notre plateforme.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                6. Vos Droits
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Vous avez le droit de :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Accéder à vos informations personnelles</li>
                <li>Corriger ou mettre à jour vos informations</li>
                <li>Demander la suppression de vos données personnelles</li>
                <li>Vous opposer au traitement de vos données</li>
                <li>Demander la portabilité de vos données</li>
                <li>Retirer votre consentement à tout moment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                7. Contact
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
                veuillez nous contacter à l'adresse suivante : 
                <a href="mailto:privacy@tyala.com" className="text-primary hover:underline ml-1">
                  privacy@tyala.com
                </a>
              </p>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                En utilisant notre plateforme, vous acceptez cette politique de confidentialité et nos conditions d'utilisation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


