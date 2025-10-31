const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testVoiceUpload() {
  try {
    console.log('🧪 Test d\'upload de message vocal...');
    
    // Créer un fichier audio de test (simulé)
    const testAudioContent = Buffer.from('fake audio content for testing');
    const testAudioPath = './test-audio.webm';
    fs.writeFileSync(testAudioPath, testAudioContent);
    
    const formData = new FormData();
    formData.append('content', 'Test message vocal');
    formData.append('messageType', 'VOICE');
    formData.append('audio', fs.createReadStream(testAudioPath), 'test-voice.webm');
    
    const response = await fetch('http://localhost:8081/api/study-groups/1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token' // Remplacez par un vrai token
      },
      body: formData
    });
    
    console.log('Status:', response.status);
    console.log('Response:', await response.text());
    
    // Nettoyer
    fs.unlinkSync(testAudioPath);
    
  } catch (error) {
    console.error('Erreur test:', error);
  }
}

testVoiceUpload();
