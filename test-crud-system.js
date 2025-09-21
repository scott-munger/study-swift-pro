#!/usr/bin/env node

/**
 * Script de test pour vérifier le système CRUD complet
 * Teste les endpoints pour les flashcards et utilisateurs
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8081/api';
let authToken = null;
let testUserId = null;
let testSubjectId = null;
let testFlashcardId = null;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testAuthentication() {
  logInfo('Testing authentication...');
  
  try {
    // Test de connexion avec un compte de test
    const loginData = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });

    authToken = loginData.token;
    testUserId = loginData.user.id;
    
    logSuccess(`Authentication successful. User ID: ${testUserId}`);
    return true;
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    return false;
  }
}

async function testSubjects() {
  logInfo('Testing subjects endpoints...');
  
  try {
    // Récupérer les matières
    const subjects = await makeRequest(`${API_BASE}/subjects`);
    
    if (subjects.length > 0) {
      testSubjectId = subjects[0].id;
      logSuccess(`Found ${subjects.length} subjects. Using subject ID: ${testSubjectId}`);
      return true;
    } else {
      logWarning('No subjects found. Creating a test subject...');
      
      // Créer une matière de test
      const newSubject = await makeRequest(`${API_BASE}/admin/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Subject',
          level: 'Test Level',
          description: 'Test description'
        })
      });
      
      testSubjectId = newSubject.subject.id;
      logSuccess(`Created test subject with ID: ${testSubjectId}`);
      return true;
    }
  } catch (error) {
    logError(`Subjects test failed: ${error.message}`);
    return false;
  }
}

async function testFlashcardCRUD() {
  logInfo('Testing flashcard CRUD operations...');
  
  try {
    // CREATE - Créer une flashcard
    logInfo('Creating a new flashcard...');
    const newFlashcard = await makeRequest(`${API_BASE}/flashcards`, {
      method: 'POST',
      body: JSON.stringify({
        question: 'Test question for CRUD system',
        answer: 'Test answer for CRUD system',
        subjectId: testSubjectId,
        difficulty: 'medium'
      })
    });
    
    testFlashcardId = newFlashcard.id;
    logSuccess(`Flashcard created with ID: ${testFlashcardId}`);
    
    // READ - Récupérer les flashcards de l'utilisateur
    logInfo('Reading user flashcards...');
    const userFlashcards = await makeRequest(`${API_BASE}/user/flashcards`);
    logSuccess(`Found ${userFlashcards.flashcards.length} user flashcards`);
    
    // READ - Récupérer les flashcards par matière
    logInfo('Reading flashcards by subject...');
    const subjectFlashcards = await makeRequest(`${API_BASE}/subject-flashcards/${testSubjectId}`);
    logSuccess(`Found ${subjectFlashcards.length} flashcards for subject ${testSubjectId}`);
    
    // UPDATE - Mettre à jour la flashcard
    logInfo('Updating flashcard...');
    const updatedFlashcard = await makeRequest(`${API_BASE}/flashcards/${testFlashcardId}`, {
      method: 'PUT',
      body: JSON.stringify({
        question: 'Updated test question',
        answer: 'Updated test answer',
        subjectId: testSubjectId,
        difficulty: 'hard'
      })
    });
    logSuccess(`Flashcard updated successfully`);
    
    // Test de tentative de flashcard
    logInfo('Testing flashcard attempt...');
    const attempt = await makeRequest(`${API_BASE}/flashcard-attempt`, {
      method: 'POST',
      body: JSON.stringify({
        flashcardId: testFlashcardId,
        isCorrect: true,
        timeSpent: 30
      })
    });
    logSuccess(`Flashcard attempt recorded with ID: ${attempt.id}`);
    
    return true;
  } catch (error) {
    logError(`Flashcard CRUD test failed: ${error.message}`);
    return false;
  }
}

async function testUserStats() {
  logInfo('Testing user statistics...');
  
  try {
    // Récupérer les statistiques de l'utilisateur
    const userStats = await makeRequest(`${API_BASE}/user/stats`);
    logSuccess(`User stats retrieved: ${userStats.stats.totalFlashcards} flashcards, ${userStats.stats.accuracy}% accuracy`);
    
    // Récupérer les tentatives de l'utilisateur
    const userAttempts = await makeRequest(`${API_BASE}/user/attempts`);
    logSuccess(`User attempts retrieved: ${userAttempts.attempts.length} attempts`);
    
    return true;
  } catch (error) {
    logError(`User stats test failed: ${error.message}`);
    return false;
  }
}

async function testAdminEndpoints() {
  logInfo('Testing admin endpoints...');
  
  try {
    // Récupérer toutes les flashcards (admin)
    const adminFlashcards = await makeRequest(`${API_BASE}/admin/flashcards`);
    logSuccess(`Admin flashcards retrieved: ${adminFlashcards.flashcards.length} flashcards`);
    
    // Récupérer tous les utilisateurs (admin)
    const adminUsers = await makeRequest(`${API_BASE}/admin/users`);
    logSuccess(`Admin users retrieved: ${adminUsers.length} users`);
    
    // Récupérer les statistiques admin
    const adminStats = await makeRequest(`${API_BASE}/admin/stats`);
    logSuccess(`Admin stats retrieved: ${adminStats.totalUsers} users, ${adminStats.totalFlashcards} flashcards`);
    
    return true;
  } catch (error) {
    logError(`Admin endpoints test failed: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  logInfo('Cleaning up test data...');
  
  try {
    // Supprimer la flashcard de test
    if (testFlashcardId) {
      await makeRequest(`${API_BASE}/flashcards/${testFlashcardId}`, {
        method: 'DELETE'
      });
      logSuccess('Test flashcard deleted');
    }
    
    // Supprimer la matière de test si elle a été créée
    if (testSubjectId && testSubjectId > 1000) { // Assuming test subjects have high IDs
      await makeRequest(`${API_BASE}/admin/subjects/${testSubjectId}`, {
        method: 'DELETE'
      });
      logSuccess('Test subject deleted');
    }
    
    return true;
  } catch (error) {
    logWarning(`Cleanup failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('🚀 Starting CRUD System Tests', 'bright');
  log('================================', 'bright');
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Subjects', fn: testSubjects },
    { name: 'Flashcard CRUD', fn: testFlashcardCRUD },
    { name: 'User Statistics', fn: testUserStats },
    { name: 'Admin Endpoints', fn: testAdminEndpoints }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    log(`\n📋 Running ${test.name} test...`, 'cyan');
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        logSuccess(`${test.name} test passed`);
      } else {
        failed++;
        logError(`${test.name} test failed`);
      }
    } catch (error) {
      failed++;
      logError(`${test.name} test failed with error: ${error.message}`);
    }
  }
  
  // Nettoyage
  log('\n🧹 Cleaning up...', 'cyan');
  await cleanup();
  
  // Résumé
  log('\n📊 Test Results', 'bright');
  log('================', 'bright');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  } else {
    logSuccess(`Failed: ${failed}`);
  }
  
  const successRate = (passed / (passed + failed)) * 100;
  if (successRate === 100) {
    logSuccess(`🎉 All tests passed! Success rate: ${successRate}%`);
  } else {
    logWarning(`⚠️  Some tests failed. Success rate: ${successRate}%`);
  }
  
  return successRate === 100;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Test runner failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runTests };
