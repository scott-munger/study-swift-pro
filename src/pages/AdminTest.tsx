import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminTest = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Test Page Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Informations de Debug</h2>
              
              {!user ? (
                <div className="text-red-600">
                  <p>❌ Aucun utilisateur connecté</p>
                  <p>Redirection vers /login nécessaire</p>
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>Rôle:</strong> {user.role}</p>
                  <p><strong>Département:</strong> {user.department || 'Non défini'}</p>
                  <p><strong>Classe:</strong> {user.userClass || 'Non définie'}</p>
                  <p><strong>Section:</strong> {user.section || 'Non définie'}</p>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Test de Rôle Admin</h3>
                    {user.role === 'ADMIN' ? (
                      <p className="text-green-600">✅ Rôle ADMIN détecté - Accès autorisé</p>
                    ) : (
                      <p className="text-red-600">❌ Rôle non-admin: {user.role}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center mt-6">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retour à l'accueil
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTest;







