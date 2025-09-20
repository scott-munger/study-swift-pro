import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest component rendered!');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#1f2937'
        }}>
          🎉 Page de Test Simple - {new Date().toLocaleTimeString()}
        </h1>
        
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#1e40af', marginBottom: '1rem' }}>
            ✅ React fonctionne !
          </h2>
          <p style={{ color: '#1e40af' }}>
            Si vous voyez cette page, le problème n'est pas dans React.
          </p>
        </div>

        <div style={{ 
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>
            📋 Informations de Debug
          </h3>
          <p style={{ color: '#92400e', fontSize: '0.9rem' }}>
            Timestamp: {new Date().toLocaleString()}
          </p>
          <p style={{ color: '#92400e', fontSize: '0.9rem' }}>
            URL: {window.location.href}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;
