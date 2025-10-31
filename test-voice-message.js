import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testVoiceMessage() {
  try {
    console.log('🧪 Test d\'envoi de message vocal...');
    
    // Créer un fichier audio de test
    const testAudioContent = Buffer.from('fake audio content for testing webm format');
    const testAudioPath = './test-voice.webm';
    fs.writeFileSync(testAudioPath, testAudioContent);
    
    const formData = new FormData();
    formData.append('content', 'Test message vocal');
    formData.append('messageType', 'VOICE');
    formData.append('audio', fs.createReadStream(testAudioPath), 'test-voice.webm');
    
    console.log('📤 Envoi vers: http://localhost:8081/api/study-groups/20/messages');
    
    const response = await fetch('http://localhost:8081/api/study-groups/20/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzM1NDQ0MDAwfQ.test' // Token de test
      },
      body: formData
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    // Nettoyer
    fs.unlinkSync(testAudioPath);
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testVoiceMessage();
