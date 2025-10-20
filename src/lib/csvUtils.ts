/**
 * Utilitaires pour l'export de données au format CSV
 */

export interface FlashcardExportData {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  subject: string;
  level: string;
  section: string | null;
  chapter: string | null;
  author: string;
  createdAt: string;
  attempts: number;
}

export interface TestExportData {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  section: string | null;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  totalAttempts: number;
  createdAt: string;
}

export interface TestResultExportData {
  id: number;
  testTitle: string;
  subject: string;
  studentName: string;
  studentEmail: string;
  score: number;
  percentage: number;
  timeSpent: number;
  isPassed: boolean;
  completedAt: string;
}

/**
 * Convertit un tableau d'objets en format CSV
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return headers.map(h => h.label).join(',') + '\n';
  }

  // En-têtes
  const csvHeaders = headers.map(h => `"${h.label}"`).join(',');
  
  // Lignes de données
  const csvRows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key];
      // Échapper les guillemets et les retours à la ligne
      const escapedValue = String(value || '')
        .replace(/"/g, '""')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ');
      return `"${escapedValue}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Télécharge un fichier CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Génère un nom de fichier avec timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Exporte les flashcards au format CSV
 */
export function exportFlashcardsToCSV(flashcards: any[]): void {
  const exportData: FlashcardExportData[] = flashcards.map(flashcard => ({
    id: flashcard.id,
    question: flashcard.question,
    answer: flashcard.answer,
    difficulty: flashcard.difficulty,
    subject: flashcard.subject.name,
    level: flashcard.subject.level,
    section: flashcard.subject.section || '',
    chapter: flashcard.chapter?.name || '',
    author: `${flashcard.user.firstName} ${flashcard.user.lastName}`,
    createdAt: new Date(flashcard.createdAt).toLocaleDateString('fr-FR'),
    attempts: flashcard._count?.attempts || 0
  }));

  const headers = [
    { key: 'id' as keyof FlashcardExportData, label: 'ID' },
    { key: 'question' as keyof FlashcardExportData, label: 'Question' },
    { key: 'answer' as keyof FlashcardExportData, label: 'Réponse' },
    { key: 'difficulty' as keyof FlashcardExportData, label: 'Difficulté' },
    { key: 'subject' as keyof FlashcardExportData, label: 'Matière' },
    { key: 'level' as keyof FlashcardExportData, label: 'Niveau' },
    { key: 'section' as keyof FlashcardExportData, label: 'Section' },
    { key: 'chapter' as keyof FlashcardExportData, label: 'Chapitre' },
    { key: 'author' as keyof FlashcardExportData, label: 'Auteur' },
    { key: 'createdAt' as keyof FlashcardExportData, label: 'Date de création' },
    { key: 'attempts' as keyof FlashcardExportData, label: 'Tentatives' }
  ];

  const csvContent = convertToCSV(exportData, headers);
  const filename = generateFilename('flashcards_export');
  downloadCSV(csvContent, filename);
}

/**
 * Exporte les tests au format CSV
 */
export function exportTestsToCSV(tests: any[]): void {
  const exportData: TestExportData[] = tests.map(test => ({
    id: test.id,
    title: test.title,
    description: test.description,
    subject: test.subject.name,
    level: test.subject.level,
    section: test.subject.section || '',
    totalQuestions: test.totalQuestions,
    timeLimit: test.timeLimit,
    passingScore: test.passingScore,
    isActive: test.isActive ? 'Oui' : 'Non',
    totalAttempts: test._count?.results || 0,
    createdAt: new Date(test.createdAt).toLocaleDateString('fr-FR')
  }));

  const headers = [
    { key: 'id' as keyof TestExportData, label: 'ID' },
    { key: 'title' as keyof TestExportData, label: 'Titre' },
    { key: 'description' as keyof TestExportData, label: 'Description' },
    { key: 'subject' as keyof TestExportData, label: 'Matière' },
    { key: 'level' as keyof TestExportData, label: 'Niveau' },
    { key: 'section' as keyof TestExportData, label: 'Section' },
    { key: 'totalQuestions' as keyof TestExportData, label: 'Nombre de questions' },
    { key: 'timeLimit' as keyof TestExportData, label: 'Durée (min)' },
    { key: 'passingScore' as keyof TestExportData, label: 'Score requis (%)' },
    { key: 'isActive' as keyof TestExportData, label: 'Actif' },
    { key: 'totalAttempts' as keyof TestExportData, label: 'Tentatives totales' },
    { key: 'createdAt' as keyof TestExportData, label: 'Date de création' }
  ];

  const csvContent = convertToCSV(exportData, headers);
  const filename = generateFilename('tests_export');
  downloadCSV(csvContent, filename);
}

/**
 * Exporte les résultats de tests au format CSV
 */
export function exportTestResultsToCSV(results: any[]): void {
  const exportData: TestResultExportData[] = results.map(result => ({
    id: result.id,
    testTitle: result.test.title,
    subject: result.test.subject.name,
    studentName: `${result.user.firstName} ${result.user.lastName}`,
    studentEmail: result.user.email,
    score: result.score,
    percentage: result.percentage,
    timeSpent: result.timeSpent,
    isPassed: result.isPassed ? 'Oui' : 'Non',
    completedAt: new Date(result.completedAt).toLocaleDateString('fr-FR')
  }));

  const headers = [
    { key: 'id' as keyof TestResultExportData, label: 'ID' },
    { key: 'testTitle' as keyof TestResultExportData, label: 'Test' },
    { key: 'subject' as keyof TestResultExportData, label: 'Matière' },
    { key: 'studentName' as keyof TestResultExportData, label: 'Étudiant' },
    { key: 'studentEmail' as keyof TestResultExportData, label: 'Email' },
    { key: 'score' as keyof TestResultExportData, label: 'Score' },
    { key: 'percentage' as keyof TestResultExportData, label: 'Pourcentage' },
    { key: 'timeSpent' as keyof TestResultExportData, label: 'Temps (sec)' },
    { key: 'isPassed' as keyof TestResultExportData, label: 'Réussi' },
    { key: 'completedAt' as keyof TestResultExportData, label: 'Date de completion' }
  ];

  const csvContent = convertToCSV(exportData, headers);
  const filename = generateFilename('resultats_tests_export');
  downloadCSV(csvContent, filename);
}

// ===== FONCTIONS D'IMPORT CSV =====

export interface ImportFlashcardData {
  question: string;
  answer: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subjectId: number;
  chapterId?: number | null;
}

export interface ImportTestData {
  title: string;
  description: string;
  subjectId: number;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  totalRows: number;
}

/**
 * Parse un fichier CSV et retourne les données
 */
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

export interface ImportOptions {
  defaultSubjectId?: number;
  defaultDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  defaultTestId?: number;
}

export interface ImportQuestionData {
  testId: number;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  options: string[] | null;
  correctAnswer: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  concept?: string;
}

/**
 * Valide et importe des flashcards depuis un CSV
 */
export function importFlashcardsFromCSV(
  csvContent: string, 
  subjects: { id: number; name: string }[],
  chapters: { id: number; name: string; subjectId: number }[] = [],
  options: ImportOptions = {}
): ImportResult<ImportFlashcardData> {
  const rows = parseCSV(csvContent);
  const errors: ImportError[] = [];
  const data: ImportFlashcardData[] = [];
  
  if (rows.length < 2) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'Le fichier doit contenir au moins un en-tête et une ligne de données' }],
      totalRows: rows.length
    };
  }
  
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a'));
  
  // Mapper les indices des colonnes avec support de plusieurs variantes
  const findHeaderIndex = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h === name.toLowerCase() || 
        h.replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a') === name.toLowerCase()
      );
      if (index >= 0) return index;
    }
    return -1;
  };
  
  const questionIndex = findHeaderIndex(['question']);
  const answerIndex = findHeaderIndex(['réponse', 'reponse', 'answer']);
  const chapterIndex = findHeaderIndex(['chapitre', 'chapter']);
  
  // Vérifier que les colonnes OBLIGATOIRES existent
  if (questionIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Question" manquante' });
  }
  if (answerIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Réponse" manquante' });
  }
  
  // Matière et Difficulté DOIVENT être fournies dans les options
  if (!options.defaultSubjectId) {
    errors.push({ row: 0, field: 'options', message: 'Vous devez sélectionner une matière avant d\'importer' });
  }
  if (!options.defaultDifficulty) {
    errors.push({ row: 0, field: 'options', message: 'Vous devez sélectionner une difficulté avant d\'importer' });
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors, totalRows: rows.length };
  }
  
  // Traiter chaque ligne de données
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: ImportError[] = [];
    
    // Validation des champs requis
    if (!row[questionIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'question', message: 'Question requise' });
    }
    
    if (!row[answerIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'answer', message: 'Réponse requise' });
    }
    
    // Utiliser directement la difficulté des options (déjà validée)
    const difficultyValue = options.defaultDifficulty!;
    
    // Utiliser directement la matière des options (déjà validée)
    const subject = subjects.find(s => s.id === options.defaultSubjectId);
    
    // Validation du chapitre (optionnel)
    let chapterId: number | null = null;
    if (chapterIndex >= 0 && row[chapterIndex]?.trim()) {
      const chapterName = row[chapterIndex].trim();
      const chapter = chapters.find(c => 
        c.name.toLowerCase() === chapterName.toLowerCase() && 
        c.subjectId === subject?.id
      );
      if (!chapter) {
        rowErrors.push({ 
          row: i + 1, 
          field: 'chapter', 
          message: `Chapitre "${chapterName}" non trouvé pour cette matière` 
        });
      } else {
        chapterId = chapter.id;
      }
    }
    
    if (rowErrors.length === 0 && subject) {
      data.push({
        question: row[questionIndex].trim(),
        answer: row[answerIndex].trim(),
        difficulty: difficultyValue,
        subjectId: subject.id,
        chapterId
      });
    } else {
      errors.push(...rowErrors);
    }
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows: rows.length - 1 // Exclure l'en-tête
  };
}

/**
 * Génère un template CSV pour l'import de flashcards
 */
export function generateFlashcardImportTemplate(): void {
  const templateData = [
    ['Question', 'Reponse'],
    ['Quelle est la capitale de la France ?', 'Paris'],
    ['Combien font 2 + 2 ?', '4'],
    ['Qu\'est-ce que la photosynthese ?', 'Processus par lequel les plantes convertissent la lumiere en energie'],
    ['Quelle est la formule de l\'eau ?', 'H2O'],
    ['Qui a ecrit Les Miserables ?', 'Victor Hugo']
  ];
  
  const csvContent = templateData.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const filename = generateFilename('template_import_flashcards');
  downloadCSV(csvContent, filename);
}

/**
 * Valide et importe des tests depuis un CSV
 */
export function importTestsFromCSV(
  csvContent: string, 
  subjects: { id: number; name: string }[]
): ImportResult<ImportTestData> {
  const rows = parseCSV(csvContent);
  const errors: ImportError[] = [];
  const data: ImportTestData[] = [];
  
  if (rows.length < 2) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'Le fichier doit contenir au moins un en-tête et une ligne de données' }],
      totalRows: rows.length
    };
  }
  
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a'));
  
  // Mapper les indices des colonnes avec support de plusieurs variantes
  const findHeaderIndex = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h === name.toLowerCase() || 
        h.replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a') === name.toLowerCase()
      );
      if (index >= 0) return index;
    }
    return -1;
  };
  
  const titleIndex = findHeaderIndex(['titre', 'title', 'nom', 'name']);
  const descriptionIndex = findHeaderIndex(['description', 'desc']);
  const subjectIndex = findHeaderIndex(['matière', 'matiere', 'subject']);
  const questionsIndex = findHeaderIndex(['nombre_questions', 'questions', 'nb_questions', 'totalquestions']);
  const timeIndex = findHeaderIndex(['durée_min', 'duree_min', 'duree', 'temps', 'time', 'timelimit']);
  const scoreIndex = findHeaderIndex(['score_requis', 'score', 'passingscore', 'minimum']);
  const activeIndex = findHeaderIndex(['actif', 'active', 'isactive']);
  
  // Vérifier que les colonnes essentielles existent
  if (titleIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Titre" manquante' });
  }
  if (descriptionIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Description" manquante' });
  }
  if (subjectIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Matière" manquante' });
  }
  if (questionsIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Nombre_Questions" manquante' });
  }
  if (timeIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Durée_Min" manquante' });
  }
  if (scoreIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Score_Requis" manquante' });
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors, totalRows: rows.length };
  }
  
  // Traiter chaque ligne de données
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: ImportError[] = [];
    
    // Validation des champs requis
    if (!row[titleIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'title', message: 'Titre requis' });
    }
    
    if (!row[descriptionIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'description', message: 'Description requise' });
    }
    
    // Validation de la matière (recherche flexible)
    const subjectName = row[subjectIndex]?.trim();
    const normalizeString = (str: string) => 
      str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '');
    
    const subject = subjects.find(s => {
      const normalizedSubject = normalizeString(s.name);
      const normalizedInput = normalizeString(subjectName || '');
      return normalizedSubject === normalizedInput || 
             normalizedSubject.includes(normalizedInput) ||
             s.name.toLowerCase() === subjectName?.toLowerCase();
    });
    
    if (!subject) {
      const availableSubjects = subjects.map(s => s.name).join(', ');
      rowErrors.push({ 
        row: i + 1, 
        field: 'subject', 
        message: `Matière "${subjectName}" non trouvée. Disponibles: ${availableSubjects}` 
      });
    }
    
    // Validation du nombre de questions
    const totalQuestions = parseInt(row[questionsIndex]?.trim() || '0');
    if (isNaN(totalQuestions) || totalQuestions <= 0) {
      rowErrors.push({ 
        row: i + 1, 
        field: 'totalQuestions', 
        message: 'Nombre de questions doit être un entier positif' 
      });
    }
    
    // Validation de la durée
    const timeLimit = parseInt(row[timeIndex]?.trim() || '0');
    if (isNaN(timeLimit) || timeLimit <= 0) {
      rowErrors.push({ 
        row: i + 1, 
        field: 'timeLimit', 
        message: 'Durée doit être un entier positif (en minutes)' 
      });
    }
    
    // Validation du score requis
    const passingScore = parseInt(row[scoreIndex]?.trim() || '0');
    if (isNaN(passingScore) || passingScore < 0 || passingScore > 100) {
      rowErrors.push({ 
        row: i + 1, 
        field: 'passingScore', 
        message: 'Score requis doit être entre 0 et 100' 
      });
    }
    
    // Validation du statut actif (optionnel)
    let isActive = true;
    if (activeIndex >= 0 && row[activeIndex]?.trim()) {
      const activeValue = row[activeIndex].trim().toLowerCase();
      if (['oui', 'yes', 'true', '1'].includes(activeValue)) {
        isActive = true;
      } else if (['non', 'no', 'false', '0'].includes(activeValue)) {
        isActive = false;
      } else {
        rowErrors.push({ 
          row: i + 1, 
          field: 'isActive', 
          message: 'Statut actif doit être: Oui/Non, Yes/No, True/False, ou 1/0' 
        });
      }
    }
    
    if (rowErrors.length === 0 && subject) {
      data.push({
        title: row[titleIndex].trim(),
        description: row[descriptionIndex].trim(),
        subjectId: subject.id,
        totalQuestions,
        timeLimit,
        passingScore,
        isActive
      });
    } else {
      errors.push(...rowErrors);
    }
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows: rows.length - 1 // Exclure l'en-tête
  };
}

/**
 * Génère un template CSV pour l'import de tests
 */
export function generateTestImportTemplate(): void {
  const templateData = [
    ['Titre', 'Description', 'Matière', 'Nombre_Questions', 'Durée_Min', 'Score_Requis', 'Actif'],
    [
      'Test de Géographie - Capitales',
      'Test sur les capitales des pays européens',
      'Géographie',
      '20',
      '30',
      '70',
      'Oui'
    ],
    [
      'Quiz Biologie - Photosynthèse',
      'Questions sur le processus de photosynthèse',
      'Biologie',
      '15',
      '20',
      '60',
      'Oui'
    ]
  ];
  
  const csvContent = templateData.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const filename = generateFilename('template_import_tests');
  downloadCSV(csvContent, filename);
}

/**
 * Valide et importe des questions depuis un CSV
 */
export function importQuestionsFromCSV(
  csvContent: string, 
  options: ImportOptions
): ImportResult<ImportQuestionData> {
  const rows = parseCSV(csvContent);
  const errors: ImportError[] = [];
  const data: ImportQuestionData[] = [];
  
  if (rows.length < 2) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'Le fichier doit contenir au moins un en-tête et une ligne de données' }],
      totalRows: rows.length
    };
  }
  
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a'));
  
  // Mapper les indices des colonnes avec support de plusieurs variantes
  const findHeaderIndex = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h === name.toLowerCase() || 
        h.replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a') === name.toLowerCase()
      );
      if (index >= 0) return index;
    }
    return -1;
  };
  
  const questionIndex = findHeaderIndex(['question', 'texte']);
  const typeIndex = findHeaderIndex(['type', 'type_question']);
  const optionsIndex = findHeaderIndex(['options', 'choix', 'reponses']);
  const correctAnswerIndex = findHeaderIndex(['bonne_reponse', 'reponse_correcte', 'correct_answer', 'reponse']);
  const explanationIndex = findHeaderIndex(['explication', 'explanation']);
  const difficultyIndex = findHeaderIndex(['difficulte', 'difficulty', 'niveau']);
  const conceptIndex = findHeaderIndex(['concept', 'theme', 'sujet']);
  
  // Vérifier que les colonnes OBLIGATOIRES existent
  if (questionIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Question" manquante' });
  }
  if (typeIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Type" manquante' });
  }
  if (correctAnswerIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'Colonne "Bonne_Reponse" manquante' });
  }
  
  // Test ID DOIT être fourni dans les options
  if (!options.defaultTestId) {
    errors.push({ row: 0, field: 'options', message: 'Vous devez sélectionner un test avant d\'importer' });
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors, totalRows: rows.length };
  }
  
  // Traiter chaque ligne de données
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: ImportError[] = [];
    
    // Validation des champs requis
    if (!row[questionIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'question', message: 'Question requise' });
    }
    
    if (!row[typeIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'type', message: 'Type de question requis' });
    }
    
    if (!row[correctAnswerIndex]?.trim()) {
      rowErrors.push({ row: i + 1, field: 'correctAnswer', message: 'Bonne réponse requise' });
    }
    
    // Validation du type de question
    const questionType = row[typeIndex]?.trim().toUpperCase();
    const validTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER'];
    if (!validTypes.includes(questionType)) {
      rowErrors.push({ 
        row: i + 1, 
        field: 'type', 
        message: `Type invalide. Types acceptés: ${validTypes.join(', ')}` 
      });
    }
    
    // Validation des options pour les questions à choix multiples
    let options: string[] | null = null;
    if (questionType === 'MULTIPLE_CHOICE') {
      if (optionsIndex >= 0 && row[optionsIndex]?.trim()) {
        options = row[optionsIndex].split('|').map(opt => opt.trim()).filter(opt => opt);
        if (options.length < 2) {
          rowErrors.push({ 
            row: i + 1, 
            field: 'options', 
            message: 'Les questions à choix multiples doivent avoir au moins 2 options' 
          });
        }
      } else {
        rowErrors.push({ 
          row: i + 1, 
          field: 'options', 
          message: 'Les questions à choix multiples nécessitent des options' 
        });
      }
    }
    
    // Validation de la difficulté
    const difficultyValue = difficultyIndex >= 0 && row[difficultyIndex]?.trim() 
      ? row[difficultyIndex].trim().toUpperCase() 
      : 'MEDIUM';
    
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
    if (!validDifficulties.includes(difficultyValue)) {
      rowErrors.push({ 
        row: i + 1, 
        field: 'difficulty', 
        message: `Difficulté invalide. Valeurs acceptées: ${validDifficulties.join(', ')}` 
      });
    }
    
    if (rowErrors.length === 0) {
      data.push({
        testId: options.defaultTestId!,
        question: row[questionIndex].trim(),
        type: questionType as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER',
        options,
        correctAnswer: row[correctAnswerIndex].trim(),
        explanation: explanationIndex >= 0 ? row[explanationIndex]?.trim() : undefined,
        difficulty: difficultyValue as 'EASY' | 'MEDIUM' | 'HARD',
        concept: conceptIndex >= 0 ? row[conceptIndex]?.trim() : undefined
      });
    } else {
      errors.push(...rowErrors);
    }
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows: rows.length - 1 // Exclure l'en-tête
  };
}

/**
 * Génère un template CSV pour l'import de questions
 */
export function generateQuestionImportTemplate(): void {
  const templateData = [
    ['Question', 'Type', 'Options', 'Bonne_Reponse', 'Explication', 'Difficulte', 'Concept'],
    [
      'Quelle est la capitale de la France ?',
      'MULTIPLE_CHOICE',
      'Paris|Londres|Berlin|Madrid',
      'Paris',
      'Paris est la capitale et la plus grande ville de France.',
      'EASY',
      'Géographie'
    ],
    [
      'La Terre tourne autour du Soleil.',
      'TRUE_FALSE',
      '',
      'Vrai',
      'La Terre effectue une révolution autour du Soleil en 365,25 jours.',
      'EASY',
      'Astronomie'
    ],
    [
      'Expliquez le processus de photosynthèse.',
      'LONG_ANSWER',
      '',
      'La photosynthèse est le processus par lequel les plantes convertissent la lumière du soleil en énergie chimique.',
      'Processus vital pour la production d\'oxygène et de glucose.',
      'MEDIUM',
      'Biologie'
    ]
  ];
  
  const csvContent = templateData.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const filename = generateFilename('template_import_questions');
  downloadCSV(csvContent, filename);
}
