import React, { useState } from 'react';

const TestLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@tyala.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      setMessage('Connexion en cours...');
      
      const response = await fetch('http://localhost:8081/api/demo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Connexion réussie ! Utilisateur: ${data.user.firstName} ${data.user.lastName} (${data.user.role})`);
        
        // Sauvegarder les données
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Redirection directe
        setTimeout(() => {
          window.location.href = '/admin/dashboard-modern';
        }, 1000);
      } else {
        const error = await response.json();
        setMessage(`❌ Erreur: ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur de connexion: ${error}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '50px auto',
      border: '1px solid #ccc',
      borderRadius: '8px'
    }}>
      <h1>Test de Connexion - Tyala</h1>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Email:</label><br/>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Mot de passe:</label><br/>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <button 
        onClick={handleLogin}
        style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Se connecter
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Comptes de test :</strong></p>
        <p>Admin: admin@tyala.com / password123</p>
        <p>Étudiant: etudiant@test.com / etudiant123</p>
        <p>Tuteur: tuteur@test.com / tuteur123</p>
      </div>
    </div>
  );
};

export default TestLogin;
