import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma, connectDatabase } from '../lib/database';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../lib/emailService';

// Type definitions for authenticated requests
interface AuthenticatedUser {
  userId: number | string;
  id?: number;
  email?: string;
  role?: Role;
  demoMode?: boolean;
  originalEmail?: string;
}

interface AuthenticatedRequest extends express.Request {
  user?: AuthenticatedUser;
}

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || '*',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8082',
    'https://*.netlify.app',
    'https://*.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configuration Multer pour l'upload d'images du forum
const forumStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads/forum-images');
      console.log('Upload directory:', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error in destination:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Générer un nom unique pour éviter les conflits
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `forum-${uniqueSuffix}${ext}`;
      console.log('Generated filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error in filename:', error);
      cb(error, null);
    }
  }
});

// Configuration Multer pour l'upload de photos de profil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads/profile-photos');
      console.log('Profile photo directory:', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating profile photo directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error in profile photo destination:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Générer un nom unique pour éviter les conflits
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `profile-${uniqueSuffix}${ext}`;
      console.log('Generated profile photo filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error in profile photo filename:', error);
      cb(error, null);
    }
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  try {
    console.log('File filter - mimetype:', file.mimetype);
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  } catch (error) {
    console.error('Error in fileFilter:', error);
    cb(error, false);
  }
};

const forumUpload = multer({
  storage: forumStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Maximum 5 images par upload
  }
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max pour les photos de profil
    files: 1 // Une seule photo de profil
  }
});

// Configuration Multer pour l'upload de fichiers audio (messages vocaux)
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads/audio-messages');
      console.log('Audio directory:', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating audio directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error in audio destination:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname) || '.webm';
      const filename = `audio-${uniqueSuffix}${ext}`;
      console.log('Generated audio filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error in audio filename:', error);
      cb(error, null);
    }
  }
});

const audioFileFilter = (req: any, file: any, cb: any) => {
  try {
    console.log('🎵 Audio file filter - mimetype:', file.mimetype, 'originalname:', file.originalname);
    // Accepter les fichiers audio et webm
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype.includes('webm') || 
        file.mimetype.includes('ogg') ||
        file.mimetype === 'audio/webm;codecs=opus' ||
        file.originalname.endsWith('.webm')) {
      console.log('✅ Audio file accepted');
      cb(null, true);
    } else {
      console.log('❌ Audio file rejected - mimetype not supported');
      cb(new Error('Seuls les fichiers audio sont autorisés'), false);
    }
  } catch (error) {
    console.error('Error in audioFileFilter:', error);
    cb(error, false);
  }
};

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max pour les messages vocaux
    files: 1 // Un seul fichier audio par message
  }
});

// Configuration Multer pour l'upload de fichiers de chat (photos et documents)
const chatFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads/chat-files');
      console.log('Chat files directory:', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating chat files directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error in chat files destination:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `chat-${uniqueSuffix}${ext}`;
      console.log('Generated chat file filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error in chat file filename:', error);
      cb(error, null);
    }
  }
});

const chatFileFilter = (req: any, file: any, cb: any) => {
  try {
    console.log('📎 Chat file filter - mimetype:', file.mimetype, 'originalname:', file.originalname);
    
    // Accepter les images
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ Image file accepted');
      cb(null, true);
    }
    // Accepter les documents PDF
    else if (file.mimetype === 'application/pdf') {
      console.log('✅ PDF file accepted');
      cb(null, true);
    }
    // Accepter les documents Word
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             file.mimetype === 'application/msword') {
      console.log('✅ Word document accepted');
      cb(null, true);
    }
    // Accepter les documents Excel
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
             file.mimetype === 'application/vnd.ms-excel') {
      console.log('✅ Excel document accepted');
      cb(null, true);
    }
    // Accepter les documents PowerPoint
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
             file.mimetype === 'application/vnd.ms-powerpoint') {
      console.log('✅ PowerPoint document accepted');
      cb(null, true);
    }
    // Accepter les fichiers texte
    else if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
      console.log('✅ Text file accepted');
      cb(null, true);
    }
    else {
      console.log('❌ File type not supported:', file.mimetype);
      cb(new Error('Type de fichier non supporté. Formats acceptés: images, PDF, Word, Excel, PowerPoint, texte'), false);
    }
  } catch (error) {
    console.error('Error in chatFileFilter:', error);
    cb(error, false);
  }
};

const chatFileUpload = multer({
  storage: chatFileStorage,
  fileFilter: chatFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max pour les fichiers de chat
    files: 1 // Un seul fichier par message
  }
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get default content based on message type
const getDefaultContent = (messageType: string): string => {
  switch (messageType) {
    case 'VOICE':
      return '🎤 Message vocal';
    case 'IMAGE':
      return '📷 Photo';
    case 'FILE':
      return '📎 Fichier';
    default:
      return '';
  }
};


// Middleware pour vérifier l'authentification
const authenticateToken = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.error('❌ Token invalide:', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }
    
    // Vérifier que le token contient bien les informations nécessaires
    if (!decoded || (typeof decoded !== 'object')) {
      console.error('❌ Token décodé invalide:', decoded);
      return res.status(403).json({ error: 'Token invalide' });
    }
    
    // Récupérer l'email ou l'ID depuis le token
    const tokenEmail = decoded.email;
    const tokenUserId = decoded.userId || decoded.id;
    const tokenRole = decoded.role; // Rôle dans le token JWT
    
    console.log('🔐 authenticateToken: Token décodé - email:', tokenEmail, ', userId:', tokenUserId, ', role:', tokenRole);
    
    // Si pas de Prisma ou pas d'email/ID, rejeter
    if (!prisma) {
      console.error('❌ authenticateToken: Prisma non disponible');
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }
    
    if (!tokenEmail && !tokenUserId) {
      console.error('❌ authenticateToken: Pas d\'email ni userId dans token');
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    try {
      // TOUJOURS récupérer l'utilisateur depuis la DB (source de vérité)
      let dbUser = null;
      
      // Priorité 1: Chercher par email (plus fiable)
      if (tokenEmail && typeof tokenEmail === 'string' && tokenEmail.includes('@')) {
        dbUser = await prisma.user.findUnique({
          where: { email: tokenEmail.trim().toLowerCase() },
          select: { id: true, email: true, role: true }
        });
      }
      
      // Priorité 2: Chercher par ID si pas trouvé par email
      if (!dbUser && tokenUserId) {
        const userIdNum = typeof tokenUserId === 'string' ? parseInt(tokenUserId) : tokenUserId;
        if (userIdNum && !isNaN(userIdNum)) {
          dbUser = await prisma.user.findUnique({
            where: { id: userIdNum },
            select: { id: true, email: true, role: true }
          });
        }
      }
      
      // Si utilisateur non trouvé, rejeter
      if (!dbUser) {
        console.error('❌ authenticateToken: Utilisateur non trouvé en DB (email:', tokenEmail, ', userId:', tokenUserId, ')');
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }
      
      // Si le token dit ADMIN mais la DB dit autre chose, mettre à jour la DB immédiatement
      if (tokenRole === 'ADMIN' && dbUser.role !== 'ADMIN') {
        console.warn(`⚠️ authenticateToken: Token dit ADMIN mais DB dit ${dbUser.role}, mise à jour DB vers ADMIN`);
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'ADMIN' },
          select: { id: true, email: true, role: true }
        });
        console.log(`✅ authenticateToken: Rôle mis à jour en ADMIN dans la DB`);
      }
      
      // Gestion spéciale: si email est admin@test.com, s'assurer qu'il est ADMIN
      if (dbUser.email.toLowerCase() === 'admin@test.com' && dbUser.role !== 'ADMIN') {
        console.warn(`⚠️ authenticateToken: admin@test.com n'est pas ADMIN, correction...`);
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'ADMIN' },
          select: { id: true, email: true, role: true }
        });
        console.log(`✅ authenticateToken: admin@test.com mis à jour en ADMIN`);
      }
      
      // Mettre à jour req.user avec les données de la DB (source de vérité, maintenant corrigée)
      req.user = {
        userId: dbUser.id,
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role as Role,
        demoMode: false,
        originalEmail: dbUser.email
      };
      
      // Vérifier que le rôle dans le token correspond au rôle en DB
      if (tokenRole && tokenRole !== dbUser.role) {
        console.warn(`⚠️ authenticateToken: Rôle dans token (${tokenRole}) différent du rôle en DB (${dbUser.role}), utilisation du rôle en DB`);
      }
      
      console.log('✅ authenticateToken: Utilisateur authentifié:', {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        tokenRole: tokenRole
      });
      
      next();
    } catch (error: any) {
      console.error('❌ authenticateToken: Erreur:', error);
      return res.status(500).json({ error: 'Erreur d\'authentification' });
    }
  });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur en cours d\'exécution' });
});


// ============================================
// ROUTES TUTEURS
// ============================================

// GET - Rechercher des tuteurs
app.get('/api/tutors/search', async (req, res) => {
  console.log('🔍 Route /api/tutors/search appelée');
  try {
    // Vérifier si Prisma n'est pas disponible (mode démo)
    if (!prisma) {
      console.log('⚠️ /api/tutors/search: Prisma non disponible, retourne []');
      return res.json([]);
    }
    
    const { subject, minRating, maxPrice, isAvailable, search } = req.query;

    const where: any = {};

    // Filtre par disponibilité
    if (isAvailable === 'true') {
      where.isAvailable = true;
      where.isOnline = true;
    }

    // Filtre par note minimale
    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating as string)
      };
    }

    // Filtre par prix maximum
    if (maxPrice) {
      where.hourlyRate = {
        lte: parseFloat(maxPrice as string)
      };
    }

    // Récupérer TOUS les utilisateurs avec rôle TUTOR
    // Si l'entrée tutors n'existe pas, la créer automatiquement
    console.log('🔍 Récupération de TOUS les tuteurs de la base de données...');
    
    // D'abord, récupérer tous les utilisateurs TUTOR
    const tutorUsers = await prisma.user.findMany({
      where: {
        role: 'TUTOR'
      },
      include: {
        tutor: true
      }
    });
    
    // Créer les entrées tutors manquantes
    for (const tutorUser of tutorUsers) {
      if (!tutorUser.tutor) {
        console.log(`📝 Création automatique de l'entrée tutors pour ${tutorUser.email}`);
        await prisma.tutor.create({
          data: {
            userId: tutorUser.id,
            experience: 0,
            rating: 0,
            isOnline: false,
            isAvailable: true
          }
        });
      }
    }
    
    // Maintenant récupérer les tuteurs avec leurs relations
    const tutors = await prisma.tutor.findMany({
      where: {
        ...where,
        user: {
          role: 'TUTOR' // Seulement les utilisateurs avec le rôle TUTOR dans la base
          // Aucun filtre supplémentaire - tous les tuteurs en base sont inclus
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true
          }
        },
        tutorSubjects: {
          include: {
            subject: true
          }
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            reviews: true,
            sessions: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { totalSessions: 'desc' }
      ]
    });

    // Filtre par matière (après la requête pour filtrer par nom de matière)
    let filteredTutors = tutors;
    if (subject) {
      filteredTutors = tutors.filter(tutor => 
        tutor.tutorSubjects.some(ts => 
          ts.subject.name.toLowerCase().includes((subject as string).toLowerCase())
        )
      );
    }

    // Filtre par recherche textuelle
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTutors = filteredTutors.filter(tutor =>
        tutor.user.firstName.toLowerCase().includes(searchLower) ||
        tutor.user.lastName.toLowerCase().includes(searchLower) ||
        tutor.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrer les tuteurs avec N/A dans firstName ou lastName
    filteredTutors = filteredTutors.filter(tutor => 
      tutor.user.firstName !== 'N/A' && tutor.user.lastName !== 'N/A'
    );

    console.log(`📊 Base de données: ${tutors.length} tuteurs trouvés`);
    console.log(`✅ Après filtres: ${filteredTutors.length} tuteurs retournés`);
    console.log('🔍 Détails des tuteurs:', filteredTutors.map(t => ({
      id: t.id,
      nom: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email
    })));
    res.json(filteredTutors);
  } catch (error) {
    console.error('❌ Erreur recherche tuteurs:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de tuteurs' });
  }
});

// POST - Créer un tuteur
app.post('/api/tutors', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId, bio, hourlyRate, isAvailable, experience, education, certifications, specialties, languages, subjectIds } = req.body;

    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Créer le tuteur
    const tutor = await prisma.tutor.create({
      data: {
        userId,
        bio,
        hourlyRate,
        isAvailable,
        experience,
        education,
        certifications,
        specialties,
        languages,
        tutorSubjects: {
          create: subjectIds.map((subjectId: number) => ({
            subjectId
          }))
        }
      },
      include: {
        user: true,
        tutorSubjects: {
          include: {
            subject: true
          }
        }
      }
    });

    res.json(tutor);
  } catch (error) {
    console.error('❌ Erreur création tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du tuteur' });
  }
});

// PUT - Modifier un tuteur
app.put('/api/tutors/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const tutorId = parseInt(req.params.id);
    const { bio, hourlyRate, isAvailable, experience, education, certifications, specialties, languages, subjectIds } = req.body;

    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Supprimer les anciennes relations matières
    await prisma.tutorSubject.deleteMany({
      where: { tutorId }
    });

    // Mettre à jour le tuteur
    const tutor = await prisma.tutor.update({
      where: { id: tutorId },
      data: {
        bio,
        hourlyRate,
        isAvailable,
        experience,
        education,
        certifications,
        specialties,
        languages,
        tutorSubjects: {
          create: subjectIds.map((subjectId: number) => ({
            subjectId
          }))
        }
      },
      include: {
        user: true,
        tutorSubjects: {
          include: {
            subject: true
          }
        }
      }
    });

    res.json(tutor);
  } catch (error) {
    console.error('❌ Erreur modification tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du tuteur' });
  }
});

// DELETE - Supprimer un tuteur
app.delete('/api/tutors/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const tutorId = parseInt(req.params.id);

    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Supprimer le tuteur (les relations seront supprimées en cascade)
    await prisma.tutor.delete({
      where: { id: tutorId }
    });

    res.json({ message: 'Tuteur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du tuteur' });
  }
});

// Endpoint de test pour générer un token
app.post('/api/test-token', (req, res) => {
  const token = jwt.sign(
    { id: 71, role: 'ADMIN', email: 'admin@tyala.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, secret: JWT_SECRET });
});

// Endpoint pour vérifier les flashcards créées
app.get('/api/test-flashcards', async (req, res) => {
  try {
    const flashcards = await prisma.flashcard.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        user: true
      }
    });
    res.json({ count: flashcards.length, flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de test pour l'authentification
app.post('/api/test-auth', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide', details: err.message });
    }
    res.json({ message: 'Token valide', user });
  });
});


// DÉSACTIVÉ: Endpoint d'initialisation des tables et comptes de test
// Plus de données de test automatiques - Utilisez les comptes réels
/*
app.post('/api/init', async (req, res) => {
  // ... endpoint désactivé pour éviter les données de test
});
*/

// Endpoint de démonstration qui fonctionne sans base de données
app.post('/api/demo/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    // Comptes de démonstration
    const demoAccounts = {
      'admin@test.com': { password: 'admin123', role: 'ADMIN', firstName: 'Admin', lastName: 'Test' },
      'admin@tyala.com': { password: 'password123', role: 'ADMIN', firstName: 'Admin', lastName: 'Tyala' },
      'etudiant@test.com': { password: 'etudiant123', role: 'STUDENT', firstName: 'Étudiant', lastName: 'Test', userClass: 'Terminale A' },
      'tuteur@test.com': { password: 'tuteur123', role: 'TUTOR', firstName: 'Tuteur', lastName: 'Test', department: 'Mathématiques' },
      // Aliases courants
      'student@test.com': { password: 'student123', role: 'STUDENT', firstName: 'Étudiant', lastName: 'Test', userClass: 'Terminale SMP' },
      'tutor@test.com': { password: 'tutor123', role: 'TUTOR', firstName: 'Tuteur', lastName: 'Test', department: 'Éducation' }
    };
    
    const account = demoAccounts[email];
    
    if (!account || account.password !== password) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Créer un token JWT
    const token = jwt.sign(
      { 
        userId: email, 
        email: email, 
        role: account.role as any 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: 1,
        email: email,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role as any,
        userClass: account.userClass || null,
        section: account.section || null,
        department: account.department || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erreur de connexion démo:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Endpoint de santé simple pour Railway
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur en cours d\'exécution' });
});

// Endpoint racine
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'StudySwift Pro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: prisma ? 'Connected' : 'Not connected'
  });
});

// Endpoint de test simple
app.get('/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userClass, section, department, phone, address, role, tutorData } = req.body;

    console.log('📝 Inscription - Données reçues:', {
      email: email ? 'présent' : 'manquant',
      password: password ? 'présent' : 'manquant',
      firstName: firstName ? 'présent' : 'manquant',
      lastName: lastName ? 'présent' : 'manquant',
      role: role || 'non défini',
      hasTutorData: !!tutorData
    });

    if (!email || !password || !firstName || !lastName) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      
      console.error('❌ Inscription - Champs manquants:', missingFields);
      return res.status(400).json({ 
        error: 'Email, mot de passe, prénom et nom sont requis',
        missingFields: missingFields
      });
    }

    // Mode démo si pas de base de données
    if (!prisma) {
      return res.status(503).json({ 
        error: 'Service temporairement indisponible - Base de données non connectée' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Utilisateur déjà existant' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Déterminer le rôle
    let userRole = 'STUDENT'; // Par défaut
    if (role === 'tutor' || role === 'TUTOR') {
      userRole = 'TUTOR';
    } else if (role === 'admin' || role === 'ADMIN') {
      userRole = 'ADMIN';
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 heures

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: userRole as Role,
        userClass: userClass || null,
        section: section || null,
        department: department || null,
        phone: phone || null,
        address: address || null,
        // @ts-ignore - Fields exist in schema but TypeScript types may not be updated
        emailVerified: false,
        // @ts-ignore
        emailVerificationToken: verificationToken,
        // @ts-ignore
        emailVerificationExpires: verificationExpires
      }
    });

    // Si c'est un tuteur, créer le profil tuteur
    if (userRole === 'TUTOR' && tutorData) {
      await prisma.tutor.create({
        data: {
          userId: user.id,
          experience: tutorData.experience || 0,
          hourlyRate: tutorData.hourlyRate || 0,
          bio: tutorData.bio || '',
          rating: 0,
          isOnline: false
        }
      });
    }

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(email, verificationToken, firstName);
      if (emailResult.success) {
        console.log(`✅ Email de vérification envoyé à: ${email}`);
      } else {
        console.warn(`⚠️ Échec envoi email de vérification à: ${email}`, emailResult.error);
        // Continue même si l'email échoue - l'inscription est réussie
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', emailError);
      // Continue même si l'email échoue - l'inscription est réussie
    }

    // NE PAS créer de token JWT - l'utilisateur doit vérifier son email avant de se connecter
    // Return success message only (no token, no automatic login)
    res.json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
      email: email
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Tentative de connexion avec: ${email}`);

    // Vérifier que Prisma est disponible
    if (!prisma) {
      console.error('❌ Prisma non disponible pour login');
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    if (!email || !password) {
      console.error('❌ Email ou mot de passe manquant');
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Gestion spéciale pour admin@test.com - créer/mettre à jour automatiquement si nécessaire
    if (email.toLowerCase() === 'admin@test.com' && password === 'admin123') {
      let user = await prisma.user.findUnique({
        where: { email: 'admin@test.com' }
      });

      if (!user) {
        // Créer le compte admin s'il n'existe pas
        const hashedPassword = await bcrypt.hash('admin123', 10);
        user = await prisma.user.create({
          data: {
            email: 'admin@test.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'Test',
            role: 'ADMIN'
          }
        });
        console.log(`✅ Compte admin@test.com créé automatiquement (ID: ${user.id})`);
      } else if (user.role !== 'ADMIN') {
        // Mettre à jour le rôle si ce n'est pas admin
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
        console.log(`✅ Compte admin@test.com mis à jour en ADMIN (ID: ${user.id})`);
      }

      // Vérifier que le rôle est bien ADMIN avant de générer le token
      if (user.role !== 'ADMIN') {
        console.warn(`⚠️ Login admin@test.com: Rôle en DB est ${user.role}, mise à jour vers ADMIN...`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
        console.log(`✅ Login admin@test.com: Rôle mis à jour en ADMIN`);
      }

      // Générer le token avec le rôle ADMIN confirmé
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log(`✅ Login admin@test.com: Token créé avec role=${user.role}, userId=${user.id}, email=${user.email}`);

      const { password: _, ...userWithoutPassword } = user;
      console.log(`✅ Connexion réussie pour: ${email}`);
      res.json({
        user: userWithoutPassword,
        token
      });
      return;
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

    // Vérifier si l'email est vérifié - OBLIGATOIRE pour se connecter
    // @ts-ignore - Field exists in schema
    if (!user.emailVerified) {
      return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter. Un email de vérification a été envoyé lors de votre inscription.' });
    }

    // Check password
    if (!user.password) {
      console.error(`❌ Utilisateur sans mot de passe: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.error(`❌ Mot de passe invalide pour: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    console.log(`✅ Mot de passe valide pour: ${email}`);

    // Gestion spéciale: si email est admin@test.com, s'assurer qu'il est ADMIN
    if (user.email.toLowerCase() === 'admin@test.com' && user.role !== 'ADMIN') {
      console.warn(`⚠️ Login: admin@test.com n'est pas ADMIN, mise à jour...`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log(`✅ Login: admin@test.com mis à jour en ADMIN`);
    }

    // Generate JWT token avec le rôle confirmé
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login: Token créé avec role=${user.role}, userId=${user.id}, email=${user.email}`);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    console.log(`✅ Connexion réussie pour: ${email}`);
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('❌ Erreur lors de la connexion:', error);
    console.error('❌ Détails erreur login:', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    res.status(500).json({ error: 'Échec de la connexion' });
  }
});

// Endpoint pour rafraîchir le token et mettre à jour le rôle si nécessaire
app.post('/api/auth/refresh-token', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user || !prisma) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const userId = req.user.userId || req.user.id;
    const userEmail = req.user.email || req.user.originalEmail;

    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Informations utilisateur manquantes' });
    }

    // Récupérer l'utilisateur depuis la DB pour avoir le rôle actuel
    let dbUser = null;
    if (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail.trim().toLowerCase() },
        select: { id: true, email: true, role: true, firstName: true, lastName: true }
      });
    }
    
    if (!dbUser && userId) {
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
      if (userIdNum && !isNaN(userIdNum)) {
        dbUser = await prisma.user.findUnique({
          where: { id: userIdNum },
          select: { id: true, email: true, role: true, firstName: true, lastName: true }
        });
      }
    }

    if (!dbUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Gestion spéciale: si email est admin@test.com, s'assurer qu'il est ADMIN
    if (dbUser.email.toLowerCase() === 'admin@test.com' && dbUser.role !== 'ADMIN') {
      console.warn(`⚠️ refresh-token: admin@test.com n'est pas ADMIN, mise à jour...`);
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, role: true, firstName: true, lastName: true }
      });
      console.log(`✅ refresh-token: admin@test.com mis à jour en ADMIN`);
    }

    // Générer un nouveau token avec le rôle actuel de la DB
    const newToken = jwt.sign(
      { userId: dbUser.id, email: dbUser.email, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ refresh-token: Nouveau token créé avec role=${dbUser.role}, userId=${dbUser.id}`);

    res.json({
      token: newToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role
      }
    });
  } catch (error: any) {
    console.error('❌ Erreur refresh-token:', error);
    res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
  }
});

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

// POST /api/auth/verify-email - Vérifier l'email avec un token
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de vérification requis' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    // Trouver l'utilisateur avec ce token
    // @ts-ignore - Field exists in schema
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de vérification invalide' });
    }

    // Vérifier que le token n'a pas expiré
    // @ts-ignore - Field exists in schema
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ error: 'Le token de vérification a expiré. Veuillez demander un nouvel email de vérification.' });
    }

    // Vérifier l'email et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // @ts-ignore - Fields exist in schema
        emailVerified: true,
        // @ts-ignore
        emailVerificationToken: null,
        // @ts-ignore
        emailVerificationExpires: null
      }
    });

    // Envoyer l'email de bienvenue après la vérification
    try {
      const welcomeResult = await sendWelcomeEmail(user.email, user.firstName);
      if (welcomeResult.success) {
        console.log(`✅ Email de bienvenue envoyé à: ${user.email}`);
      } else {
        console.warn(`⚠️ Échec envoi email de bienvenue à: ${user.email}`, welcomeResult.error);
      }
    } catch (welcomeError) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', welcomeError);
      // Continuer même si l'email de bienvenue échoue
    }

    console.log(`✅ Email vérifié pour: ${user.email}`);
    res.json({ message: 'Email vérifié avec succès', email: user.email });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({ error: 'Échec de la vérification de l\'email' });
  }
});

// POST /api/auth/resend-verification - Renvoyer l'email de vérification
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return res.json({ message: 'Si cet email existe et n\'est pas encore vérifié, un email de vérification a été envoyé.' });
    }

    // @ts-ignore - Field exists in schema
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Cet email est déjà vérifié' });
    }

    // Générer un nouveau token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 heures

    // Mettre à jour le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // @ts-ignore - Fields exist in schema
        emailVerificationToken: verificationToken,
        // @ts-ignore
        emailVerificationExpires: verificationExpires
      }
    });

    // Envoyer l'email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
      console.log(`✅ Email de vérification renvoyé à: ${user.email}`);
      res.json({ message: 'Email de vérification envoyé' });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      res.status(500).json({ error: 'Échec de l\'envoi de l\'email de vérification' });
    }
  } catch (error) {
    console.error('Erreur lors de la demande de renvoi de vérification:', error);
    res.status(500).json({ error: 'Échec de la demande' });
  }
});

// ============================================
// PASSWORD RESET ROUTES
// ============================================

// POST /api/auth/forgot-password - Demander la réinitialisation du mot de passe
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
    if (!user || !user.password) {
      // Retourner le même message même si l'utilisateur n'existe pas (sécurité)
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 heure

    // Sauvegarder le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // @ts-ignore - Fields exist in schema
        resetPasswordToken: resetToken,
        // @ts-ignore
        resetPasswordExpires: resetExpires
      }
    });

    // Envoyer l'email
    try {
      const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.firstName);
      if (emailResult.success) {
        console.log(`✅ Email de réinitialisation envoyé à: ${user.email}`);
        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
      } else {
        console.warn(`⚠️ Échec envoi email de réinitialisation à: ${user.email}`, emailResult.error);
        // Continuer même si l'email échoue - retourner le token dans la réponse pour le développement
        // En production, on ne devrait pas retourner le token, mais pour le debug on peut le faire temporairement
        res.json({ 
          message: 'L\'email n\'a pas pu être envoyé (domaine non vérifié). Contactez le support ou utilisez le lien ci-dessous.',
          // En développement seulement - ne pas faire en production
          resetLink: process.env.NODE_ENV === 'development' ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}` : undefined
        });
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Même en cas d'erreur, retourner un message pour que l'utilisateur puisse contacter le support
      res.json({ 
        message: 'L\'email n\'a pas pu être envoyé. Veuillez contacter mail@tyala.online pour obtenir un lien de réinitialisation.',
        // En développement seulement
        resetLink: process.env.NODE_ENV === 'development' ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}` : undefined
      });
    }
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ error: 'Échec de la demande' });
  }
});

// POST /api/auth/reset-password - Réinitialiser le mot de passe avec un token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    // Trouver l'utilisateur avec ce token
    // @ts-ignore - Field exists in schema
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de réinitialisation invalide' });
    }

    // Vérifier que le token n'a pas expiré
    // @ts-ignore - Field exists in schema
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Le token de réinitialisation a expiré. Veuillez demander un nouveau lien.' });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (user.password) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien mot de passe.' });
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // @ts-ignore - Fields exist in schema
        resetPasswordToken: null,
        // @ts-ignore
        resetPasswordExpires: null
      }
    });

    console.log(`✅ Mot de passe réinitialisé pour: ${user.email}`);
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ error: 'Échec de la réinitialisation du mot de passe' });
  }
});

// ============================================
// CONTACT SUPPORT ROUTES
// ============================================

// POST /api/contact/support - Envoyer un message au support
app.post('/api/contact/support', async (req, res) => {
  try {
    const { email, userName, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Email, sujet et message sont requis' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    // Importer le service email
    const { sendSupportEmail } = await import('../lib/emailService');

    // Envoyer l'email au support
    try {
      const emailResult = await sendSupportEmail(email, userName || 'Utilisateur', subject, message);
      if (emailResult.success) {
        console.log(`✅ Email de support envoyé de: ${email}`);
        res.json({ 
          success: true, 
          message: 'Votre message a été envoyé avec succès. Notre équipe vous répondra dans les plus brefs délais.' 
        });
      } else {
        console.error('Erreur envoi email support:', emailResult.error);
        res.status(500).json({ 
          error: 'Échec de l\'envoi de l\'email. Veuillez contacter directement mail@tyala.online' 
        });
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de support:', emailError);
      res.status(500).json({ 
        error: 'Échec de l\'envoi de l\'email. Veuillez contacter directement mail@tyala.online' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la demande de contact support:', error);
    res.status(500).json({ error: 'Échec de la demande' });
  }
});

// ============================================
// CHATBOT API ROUTES
// ============================================

// POST /api/chatbot/search - Rechercher dans la base de données (chapitres, matières)
app.post('/api/chatbot/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Requête de recherche invalide' });
    }

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Rechercher dans les matières
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ],
        name: {
          notIn: ['SMP', 'SVT', 'SES', 'LLA'] // Exclure les sections
        }
      },
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
        description: true
      },
      take: 5
    });

    // Rechercher dans les chapitres
    const chapters = await prisma.chapter.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
        subject: {
          select: { id: true, name: true, level: true, section: true }
        }
      },
      take: 5
    });

    res.json({
      subjects: subjects || [],
      chapters: chapters || []
    });
  } catch (error) {
    console.error('Erreur lors de la recherche chatbot:', error);
    res.status(500).json({ error: 'Échec de la recherche' });
  }
});

// GET /api/chatbot/subjects - Lister toutes les matières disponibles
app.get('/api/chatbot/subjects', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    const subjects = await prisma.subject.findMany({
      where: {
        name: {
          notIn: ['SMP', 'SVT', 'SES', 'LLA'] // Exclure les sections
        }
      },
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
        description: true,
        _count: {
          select: {
            chapters: true,
            flashcards: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ subjects });
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération' });
  }
});

// GET /api/chatbot/chapters/:subjectId - Récupérer les chapitres d'une matière
app.get('/api/chatbot/chapters/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!prisma) {
      return res.status(503).json({ error: 'Service temporairement indisponible' });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      select: { id: true, name: true, level: true, section: true }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId: parseInt(subjectId) },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        description: true
      }
    });

    res.json({ subject, chapters });
  } catch (error) {
    console.error('Erreur lors de la récupération des chapitres:', error);
    res.status(500).json({ error: 'Échec de la récupération' });
  }
});

// GET - Récupérer tous les chapitres
app.get('/api/chapters', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const chapters = await prisma.chapter.findMany({
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        }
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { order: 'asc' }
      ]
    });

    res.json(chapters);
  } catch (error) {
    console.error('Erreur lors de la récupération des chapitres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des chapitres' });
  }
});

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    // Sections à exclure (elles ne sont pas des matières, juste des sections)
    const sectionsToExclude = ['SMP', 'SVT', 'SES', 'LLA'];
    
    const subjects = await prisma.subject.findMany({
      where: {
        name: {
          notIn: sectionsToExclude // Exclure les sections
        }
      },
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
        description: true,
        createdAt: true
      }
    });
    res.json(subjects);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération des matières' });
  }
});

// Get all tutors
app.get('/api/tutors', async (req, res) => {
  try {
    // D'abord, créer les entrées tutors manquantes pour tous les utilisateurs TUTOR
    const tutorUsers = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      include: { tutor: true }
    });
    
    for (const tutorUser of tutorUsers) {
      if (!tutorUser.tutor) {
        await prisma.tutor.create({
          data: {
            userId: tutorUser.id,
            experience: 0,
            rating: 0,
            isOnline: false,
            isAvailable: true
          }
        });
      }
    }
    
    // Maintenant récupérer les tuteurs
    const tutors = await prisma.tutor.findMany({
      where: {
        user: {
          role: 'TUTOR' // Seulement les utilisateurs avec le rôle TUTOR
          // Pas de filtre par email - tous les tuteurs créés depuis l'admin sont inclus
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        tutorSubjects: {
          include: {
            subject: { select: { name: true } }
          }
        }
      }
    });

    // Mapper vers le format attendu par le frontend et filtrer les tuteurs avec N/A
    const mapped = tutors
      .filter(t => t.user.firstName !== 'N/A' && t.user.lastName !== 'N/A')
      .map((t) => ({
        // Expose userId as primary id for chat routing; keep tutorId separately
        id: t.user.id,
        tutorId: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`.trim(),
        subjects: t.tutorSubjects.map(ts => ts.subject.name),
        rating: t.rating ?? 0,
        reviews: 0,
        location: t.user?.department || '—',
        experience: `${t.experience}+ ans`,
        price: t.hourlyRate ? `${t.hourlyRate.toLocaleString('fr-HT', { minimumFractionDigits: 0 })} HTG/heure` : undefined,
        avatar: '/placeholder.svg',
        verified: true,
        isOnline: t.isOnline,
        studentsCount: 0,
        successRate: 0
      }));

    res.json(mapped);
  } catch (error) {
    console.error('Erreur lors de la récupération des tuteurs:', error);
    res.status(500).json({ error: 'Échec de la récupération des tuteurs' });
  }
});

// Forum: update reply (doit être avant les routes posts pour éviter les conflits)
app.put('/api/forum/replies/:replyId', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Vérifier que la réponse existe et que l'utilisateur est l'auteur ou admin
    const existingReply = await prisma.forumReply.findUnique({
      where: { id: parseInt(replyId) },
      include: { author: true }
    });

    if (!existingReply) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    if (existingReply.authorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres réponses' });
    }

    const updatedReply = await prisma.forumReply.update({
      where: { id: parseInt(replyId) },
      data: { 
        content,
        updatedAt: new Date()
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, profilePhoto: true } },
        _count: { select: { likes: true } },
        likes: { select: { id: true, userId: true } }
      }
    });

    const mappedReply = {
      id: updatedReply.id,
      content: updatedReply.content,
      author: updatedReply.author,
      createdAt: updatedReply.createdAt.toISOString(),
      updatedAt: updatedReply.updatedAt.toISOString(),
      _count: { likes: updatedReply._count.likes },
      likes: updatedReply.likes
    };

    res.json(mappedReply);
  } catch (error) {
    console.error('Erreur lors de la modification de la réponse:', error);
    res.status(500).json({ error: 'Échec de la modification de la réponse' });
  }
});

// Forum: delete reply (doit être avant les routes posts pour éviter les conflits)
app.delete('/api/forum/replies/:replyId', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { replyId } = req.params;
    // Convertir userId en nombre si nécessaire
    const userIdRaw = req.user?.userId || req.user?.id;
    const userIdNum = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);
    const userRole = req.user?.role;

    // Vérifier que la réponse existe et que l'utilisateur est l'auteur ou admin
    const existingReply = await prisma.forumReply.findUnique({
      where: { id: parseInt(replyId) },
      include: { author: true }
    });

    if (!existingReply) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    // Comparer les IDs numériques
    if (existingReply.authorId !== userIdNum && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres réponses' });
    }

    await prisma.forumReply.delete({
      where: { id: parseInt(replyId) }
    });

    res.json({ message: 'Réponse supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réponse:', error);
    res.status(500).json({ error: 'Échec de la suppression de la réponse' });
  }
});

// Forum: list posts (temporaire)
app.get('/api/forum/posts-temp', async (req, res) => {
  try {
    console.log('🔍 Endpoint /api/forum/posts-temp appelé');
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true, 
            profilePhoto: true,
            isProfilePrivate: true,
            darkMode: true
          }
        },
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        },
        likes: {
          select: { id: true, userId: true }
        },
        images: {
          select: { 
            id: true, 
            filename: true, 
            mimetype: true, 
            size: true,
            createdAt: true
          }
        }
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Erreur lors du chargement des posts:', error);
    res.status(500).json({ error: 'Échec du chargement des posts' });
  }
});

// Forum: list posts
app.get('/api/forum/posts', async (req, res) => {
  try {
    console.log('🔍 Endpoint /api/forum/posts appelé');
    // Filtrer les posts verrouillés (isLocked) pour le forum public
    // Les posts verrouillés ne doivent apparaître que dans la modération admin
    const posts = await prisma.forumPost.findMany({
      where: {
        isLocked: false // Exclure les posts verrouillés du forum public
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true, 
            profilePhoto: true,
            isProfilePrivate: true,
            darkMode: true
          }
        },
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        },
        likes: {
          select: { id: true, userId: true }
        },
        images: {
          select: { 
            id: true, 
            filename: true, 
            mimetype: true, 
            size: true,
            createdAt: true
          }
        }
        // replies can be fetched lazily if needed
      }
    });

    // Map to frontend shape
    const mapped = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      author: {
        id: p.author.id,
        firstName: p.author.firstName,
        lastName: p.author.lastName,
        role: p.author.role
      },
      subject: p.subject ? { id: p.subject.id, name: p.subject.name } : undefined,
      isPinned: p.isPinned,
      isLocked: p.isLocked,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      _count: { replies: p._count.replies, likes: p._count.likes },
      likes: p.likes,
      images: p.images,
      replies: [] as any[]
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts du forum:', error);
    res.status(500).json({ error: 'Échec de la récupération des posts' });
  }
});

// Forum: create post
app.post('/api/forum/posts', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { title, content, subjectId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    // Ensure userId is a number
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : (userId as number);
    
    const created = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: userIdNum,
        subjectId: subjectId ? parseInt(subjectId) : null
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, profilePhoto: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { replies: true, likes: true } },
        likes: { select: { id: true, userId: true } }
      }
    });

    const post = {
      id: created.id,
      title: created.title,
      content: created.content,
      author: {
        id: created.author.id,
        firstName: created.author.firstName,
        lastName: created.author.lastName,
        role: created.author.role
      },
      subject: created.subject ? { id: created.subject.id, name: created.subject.name } : undefined,
      isPinned: created.isPinned,
      isLocked: created.isLocked,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      _count: { replies: created._count.replies, likes: created._count.likes },
      likes: created.likes,
      replies: [] as any[]
    };

    // Créer des notifications pour tous les utilisateurs intéressés par ce sujet
    // (sauf l'auteur du post)
    if (created.subjectId) {
      try {
        // Récupérer tous les utilisateurs qui suivent ce sujet ou qui ont participé au forum
        const interestedUsers = await prisma.user.findMany({
          where: {
            OR: [
              { role: 'STUDENT' },
              { role: 'TUTOR' }
            ],
            NOT: {
              id: userIdNum // Exclure l'auteur
            }
          },
          select: { id: true }
        });

        console.log(`📢 Forum: Notification nouveau post pour ${interestedUsers.length} utilisateurs`);

        // Créer des notifications pour tous les utilisateurs intéressés
        const notifications = await Promise.all(
          interestedUsers.map(user =>
            createNotification(
              user.id,
              'FORUM_POST',
              'Nouveau post sur le forum',
              `${created.author.firstName} ${created.author.lastName} a créé un nouveau post: "${created.title.substring(0, 50)}${created.title.length > 50 ? '...' : ''}"`,
              `/forum?post=${created.id}`
            )
          )
        );

        const successfulNotifications = notifications.filter(n => n !== null).length;
        console.log(`✅ Forum: ${successfulNotifications} notifications créées pour le nouveau post`);
      } catch (notificationError) {
        console.error('❌ Erreur lors de la création des notifications pour le nouveau post:', notificationError);
        // Ne pas bloquer la création du post si les notifications échouent
      }
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Erreur lors de la création du post du forum:', error);
    res.status(500).json({ error: 'Échec de la création du post' });
  }
});

// Forum: update post
app.put('/api/forum/posts/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content, subjectId } = req.body;
    // Convertir userId en nombre si nécessaire
    const userIdRaw = req.user?.userId || req.user?.id;
    const userIdNum = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);
    const userRole = req.user?.role;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    // Vérifier que l'utilisateur est l'auteur du post ou admin
    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(id) },
      select: { authorId: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Comparer les IDs numériques
    if (post.authorId !== userIdNum && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Non autorisé à modifier ce post' });
    }

    const updated = await prisma.forumPost.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        subjectId: subjectId ? parseInt(subjectId) : null
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, profilePhoto: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { replies: true, likes: true } },
        likes: { select: { id: true, userId: true } }
      }
    });

    const postResponse = {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      author: {
        id: updated.author.id,
        firstName: updated.author.firstName,
        lastName: updated.author.lastName,
        role: updated.author.role,
        profilePhoto: updated.author.profilePhoto
      },
      subject: updated.subject ? { id: updated.subject.id, name: updated.subject.name } : undefined,
      isPinned: updated.isPinned,
      isLocked: updated.isLocked,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      _count: { replies: updated._count.replies, likes: updated._count.likes },
      likes: updated.likes,
      replies: [] as any[]
    };

    res.json(postResponse);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du post du forum:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du post' });
  }
});

// Get flashcards by subject
app.get('/api/flashcards/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const flashcards = await prisma.flashcard.findMany({
      where: { subjectId: parseInt(subjectId) },
      include: {
        subject: {
          select: { id: true, name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { createdAt: 'desc' }
      ]
    });
    res.json(flashcards);
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// Create a new flashcard
app.post('/api/flashcards', authenticateToken, async (req: any, res) => {
  try {
    const { question, answer, subjectId, difficulty, chapterId } = req.body;
    const userId = req.user.userId;

    console.log('Données reçues:', { question, answer, subjectId, difficulty, chapterId, userId });

    if (!question || !answer || !subjectId) {
      return res.status(400).json({ error: 'Question, réponse et matière sont requis' });
    }

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(400).json({ error: 'Matière non trouvée' });
    }

    // Vérifier que le chapitre existe si spécifié
    let validatedChapterId = null;
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapterId) },
        select: { id: true, subjectId: true }
      });
      
      if (!chapter) {
        return res.status(400).json({ error: 'Chapitre non trouvé' });
      }
      
      // Vérifier que le chapitre appartient à la matière
      if (chapter.subjectId !== parseInt(subjectId)) {
        return res.status(400).json({ error: 'Le chapitre ne correspond pas à la matière sélectionnée' });
      }
      
      validatedChapterId = chapter.id;
    }

    console.log('Matière trouvée:', subject, 'Chapitre:', validatedChapterId);

    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        chapterId: validatedChapterId,
        userId: userId,
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });
    
    console.log('Flashcard créée avec succès:', flashcard);
    res.status(201).json(flashcard);
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Échec de la création de la flashcard', details: error.message });
  }
});

// GET - Lire une flashcard individuelle
app.get('/api/flashcards/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Récupérer l'utilisateur pour connaître son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Pour les admins, accès complet
    if (user?.role === 'ADMIN') {
      const flashcard = await prisma.flashcard.findUnique({
        where: { id: parseInt(id) },
        include: {
          subject: {
            select: {
              name: true,
              level: true,
              section: true
            }
          },
          chapter: {
            select: {
              id: true,
              name: true,
              subjectId: true,
              order: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              attempts: true
            }
          }
        }
      });

      if (!flashcard) {
        return res.status(404).json({ error: 'Flashcard non trouvée' });
      }

      return res.json(flashcard);
    }

    // Pour les autres utilisateurs, vérifier l'accès
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { userId: userId }, // L'utilisateur peut voir ses propres flashcards
          { subject: { level: { in: ['9ème', 'Terminale'] } } } // Ou les flashcards publiques
        ]
      },
      include: {
        subject: {
          select: {
            name: true,
            level: true,
            section: true
          }
        },
        chapter: {
          select: {
            id: true,
            name: true,
            subjectId: true,
            order: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée ou accès non autorisé' });
    }

    res.json(flashcard);
  } catch (error) {
    console.error('Erreur lors de la récupération de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la récupération de la flashcard' });
  }
});

// Update a flashcard
app.put('/api/flashcards/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { question, answer, subjectId, difficulty, chapterId } = req.body;
    const userId = req.user.userId;

    // Vérifier que la flashcard existe et appartient à l'utilisateur
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingFlashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (existingFlashcard.userId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Non autorisé à modifier cette flashcard' });
    }

    // Validation du chapitre si spécifié
    const finalSubjectId = subjectId ? parseInt(subjectId) : existingFlashcard.subjectId;
    let validatedChapterId = chapterId !== undefined ? null : existingFlashcard.chapterId;
    
    if (chapterId !== undefined && chapterId !== null) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapterId) },
        select: { id: true, subjectId: true }
      });
      
      if (!chapter) {
        return res.status(400).json({ error: 'Chapitre non trouvé' });
      }
      
      // Vérifier que le chapitre appartient à la matière
      if (chapter.subjectId !== finalSubjectId) {
        return res.status(400).json({ error: 'Le chapitre ne correspond pas à la matière sélectionnée' });
      }
      
      validatedChapterId = chapter.id;
    }

    const flashcard = await prisma.flashcard.update({
      where: { id: parseInt(id) },
      data: {
        question: question || existingFlashcard.question,
        answer: answer || existingFlashcard.answer,
        subjectId: finalSubjectId,
        chapterId: validatedChapterId,
        difficulty: difficulty || existingFlashcard.difficulty
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });
    res.json(flashcard);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la flashcard' });
  }
});

// Delete a flashcard
app.delete('/api/flashcards/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Vérifier que la flashcard existe et appartient à l'utilisateur
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingFlashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (existingFlashcard.userId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Non autorisé à supprimer cette flashcard' });
    }

    await prisma.flashcard.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Flashcard supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la suppression de la flashcard' });
  }
});

// Get user's flashcards
app.get('/api/user/flashcards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { userId: userId };
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        include: {
          subject: {
            select: { name: true, level: true, section: true }
          },
          chapter: {
            select: { id: true, name: true, subjectId: true, order: true }
          },
          _count: {
            select: { attempts: true }
          }
        },
        orderBy: [
          { chapter: { order: 'asc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.flashcard.count({ where })
    ]);

    res.json({
      flashcards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards utilisateur:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// Get messages for a tutor session
app.get('/api/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await prisma.message.findMany({
      where: { sessionId: parseInt(sessionId) },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Échec de la récupération des messages' });
  }
});

// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    const { sessionId, senderId, receiverId, content } = req.body;
    const message = await prisma.message.create({
      data: {
        sessionId: sessionId ? parseInt(sessionId) : null,
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content
      }
    });
    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Échec de l\'envoi du message' });
  }
});

// Get all students
app.get('/api/users/students', async (req, res) => {
  try {
    console.log('🔍 Récupération des étudiants...');
    
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true,
        department: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });

    console.log(`📊 ${students.length} étudiants trouvés`);
    res.json(students);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des étudiants:', error);
    res.status(500).json({ error: 'Échec de la récupération des étudiants', details: error.message });
  }
});

// Get all tutors
app.get('/api/users/tutors', async (req, res) => {
  try {
    console.log('🔍 Récupération des tuteurs...');
    
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    const tutors = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true,
        department: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });

    console.log(`📊 ${tutors.length} tuteurs trouvés`);
    res.json(tutors);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tuteurs:', error);
    res.status(500).json({ error: 'Échec de la récupération des tuteurs', details: error.message });
  }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que userId est un nombre valide
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userIdNumber },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la récupération de l\'utilisateur' });
  }
});

// Update user profile
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, userClass, section } = req.body;
    const user = await prisma.user.update({
        where: { id: parseInt(userId) },
      data: { firstName, lastName, userClass, section },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de l\'utilisateur' });
  }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

// Get chat messages between two users
app.get('/api/chat/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: parseInt(userId1), receiverId: parseInt(userId2) },
          { senderId: parseInt(userId2), receiverId: parseInt(userId1) }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages de chat:', error);
    res.status(500).json({ error: 'Échec de la récupération des messages de chat' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [totalUsers, totalTutors, totalMessages, totalFlashcards] = await Promise.all([
      prisma.user.count(),
      prisma.tutor.count(),
      prisma.message.count(),
      prisma.flashcard.count()
    ]);

    res.json({
      totalUsers,
      totalTutors,
      totalMessages,
      totalFlashcards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// Seed database endpoint (for testing)
app.post('/api/seed', async (req, res) => {
  try {
    // DÉSACTIVÉ: seedDatabase() - Plus de données de test automatiques
    // await seedDatabase();
    res.json({ message: 'Base de données initialisée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    res.status(500).json({ error: 'Échec de l\'initialisation de la base de données' });
  }
});

// Dev-only: create or update a tutor profile for an existing user
app.post('/api/dev/create-tutor', async (req, res) => {
  try {
    const { userId, experience = 5, hourlyRate = 25, isOnline = true } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const tutor = await prisma.tutor.upsert({
      where: { userId: Number(userId) },
      update: { experience: Number(experience), hourlyRate: Number(hourlyRate), isOnline: Boolean(isOnline) },
      create: {
        userId: Number(userId),
        experience: Number(experience),
        rating: 4.8,
        isOnline: Boolean(isOnline),
        bio: 'Profil tuteur généré pour les tests',
        hourlyRate: Number(hourlyRate)
      }
    });

    // Attach default subjects if available
    const subjects = await prisma.subject.findMany({ where: { name: { in: ['Mathématiques', 'Physique'] } } });
    if (subjects.length > 0) {
      await prisma.tutorSubject.createMany({
        data: subjects.map((s) => ({ tutorId: tutor.id, subjectId: s.id })),
        skipDuplicates: true
      });
    }

    res.json({ message: 'Tuteur créé/mis à jour', tutor });
  } catch (error) {
    console.error('Erreur dev create-tutor:', error);
    res.status(500).json({ error: 'Échec création tuteur' });
  }
});

// Routes CRUD pour les profils
// GET - Récupérer le profil de l'utilisateur connecté
app.get('/api/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        profilePhoto: true,
        isProfilePrivate: true,
        darkMode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('✅ Profil récupéré pour utilisateur:', user.id, '- Section:', user.section, '- Classe:', user.userClass);
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour le profil de l'utilisateur connecté
app.put('/api/profile', authenticateToken, async (req: any, res) => {
  try {
    const { firstName, lastName, userClass, section, department, phone, address, isProfilePrivate, darkMode } = req.body;

    // Validation des données
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom sont requis' });
    }

    // Validation classe/section pour profil (synchronisée avec classConfig.ts)
    const allowedClasses = ['9ème', 'Terminale'];
    const allowedSectionsByClass: Record<string, string[]> = {
      '9ème': [], // 9ème n'a pas de sections spécifiques
      'Terminale': ['SMP', 'SVT', 'SES', 'LLA']
    };
    
    if (userClass && !allowedClasses.includes(userClass)) {
      return res.status(400).json({ error: `Classe invalide. Valeurs autorisées: ${allowedClasses.join(', ')}` });
    }
    
    // Validation de la section
    if (section) {
      const cls = userClass || (await prisma.user.findUnique({ where: { id: req.user.userId }, select: { userClass: true } }))?.userClass;
      const allowedSections = allowedSectionsByClass[cls || ''] || [];
      
      // Pour 9ème, aucune section n'est autorisée
      if (cls === '9ème' && section) {
        return res.status(400).json({ error: 'La classe 9ème n\'a pas de sections spécifiques. Laissez le champ section vide.' });
      }
      
      // Pour Terminale, vérifier que la section est valide
      if (cls === 'Terminale' && !allowedSections.includes(section)) {
        return res.status(400).json({ error: `Section invalide pour Terminale. Valeurs autorisées: ${allowedSections.join(', ')}` });
      }
    }
    
    // Si classe est Terminale et pas de section, c'est une erreur
    if (userClass === 'Terminale' && !section) {
      return res.status(400).json({ error: 'Une section est requise pour la classe Terminale (SMP, SVT, SES ou LLA)' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName,
        lastName,
        userClass: userClass || null,
        section: section || null,
        department: department || null,
        phone: phone || null,
        address: address || null,
        isProfilePrivate: isProfilePrivate || false,
        darkMode: darkMode || false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        isProfilePrivate: true,
        darkMode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// GET - Récupérer les informations publiques d'un utilisateur (temporaire)
app.get('/api/users-temp/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        profilePhoto: true,
        isProfilePrivate: true,
        darkMode: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Si c'est le profil de l'utilisateur connecté, retourner toutes les infos
    if (userId === currentUserId) {
      return res.json({ user });
    }

    // Si le profil est privé, ne retourner que les infos publiques
    if (user.isProfilePrivate) {
      const publicInfo = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userClass: user.userClass,
        section: user.section,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isProfilePrivate: user.isProfilePrivate,
        createdAt: user.createdAt
      };
      return res.json({ user: publicInfo });
    }

    // Profil public, retourner toutes les infos
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// GET - Récupérer les informations publiques d'un utilisateur
app.get('/api/users/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        profilePhoto: true,
        isProfilePrivate: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Si c'est le profil de l'utilisateur connecté, retourner toutes les infos
    if (userId === currentUserId) {
      return res.json({ user });
    }

    // Si le profil est privé, ne retourner que les infos publiques
    if (user.isProfilePrivate) {
      const publicInfo = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userClass: user.userClass,
        section: user.section,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isProfilePrivate: user.isProfilePrivate,
        createdAt: user.createdAt
      };
      return res.json({ user: publicInfo });
    }

    // Profil public, retourner toutes les infos
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// DELETE - Supprimer le compte de l'utilisateur connecté
app.delete('/api/profile', authenticateToken, async (req: any, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.userId }
    });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

// PUT - Changer le mot de passe
app.put('/api/profile/password', authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// POST - Alias pour changement de mot de passe (compatibilité)
app.post('/api/auth/change-password', authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// PUT - Changer le thème (mode sombre/clair)
app.put('/api/profile/theme', authenticateToken, async (req: any, res) => {
  try {
    const { darkMode } = req.body;

    if (typeof darkMode !== 'boolean') {
      return res.status(400).json({ error: 'darkMode doit être un booléen' });
    }

    // Mettre à jour le thème
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        darkMode,
        updatedAt: new Date()
      },
      select: {
        id: true,
        darkMode: true
      }
    });

    res.json({ 
      message: `Mode ${darkMode ? 'sombre' : 'clair'} activé`,
      darkMode: user.darkMode
    });
  } catch (error) {
    console.error('Erreur lors du changement de thème:', error);
    res.status(500).json({ error: 'Erreur lors du changement de thème' });
  }
});

// Forum: delete post
app.delete('/api/forum/posts/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    // Convertir userId en nombre si nécessaire
    const userIdRaw = req.user?.userId || req.user?.id;
    const userIdNum = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);
    const userRole = req.user?.role;

    // Vérifier que l'utilisateur est l'auteur du post ou admin
    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(id) },
      select: { authorId: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Comparer les IDs numériques
    if (post.authorId !== userIdNum && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Non autorisé à supprimer ce post' });
    }

    // Supprimer les images associées au post
    const postWithImages = await prisma.forumPost.findUnique({
      where: { id: parseInt(id) },
      include: { images: true, replies: { include: { images: true } } }
    });

    // Supprimer les fichiers images
    if (postWithImages) {
      for (const image of postWithImages.images) {
        try {
          if (fs.existsSync(image.filepath)) {
            fs.unlinkSync(image.filepath);
          }
        } catch (fileError) {
          console.error('Erreur lors de la suppression de l\'image:', fileError);
        }
      }

      // Supprimer les images des réponses
      for (const reply of postWithImages.replies) {
        for (const image of reply.images) {
          try {
            if (fs.existsSync(image.filepath)) {
              fs.unlinkSync(image.filepath);
            }
          } catch (fileError) {
            console.error('Erreur lors de la suppression de l\'image de réponse:', fileError);
          }
        }
      }
    }

    await prisma.forumPost.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression du post du forum:', error);
    console.error('Stack:', error?.stack);
    res.status(500).json({ 
      error: 'Échec de la suppression du post',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// Forum: like/unlike post
app.post('/api/forum/posts/:id/like', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const postId = parseInt(id);

    // Récupérer les infos du post et de l'utilisateur qui like
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    // Vérifier si l'utilisateur a déjà liké ce post
    const existingLike = await prisma.forumLike.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId
        }
      }
    });

    if (existingLike) {
      // Supprimer le like
      await prisma.forumLike.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      });
    } else {
      // Ajouter le like
      await prisma.forumLike.create({
        data: {
          userId: userId,
          postId: postId
        }
      });

      // Créer une notification pour l'auteur du post (sauf si c'est lui qui like)
      if (post.authorId !== userId && user) {
        await createNotification(
          post.authorId,
          'FORUM_LIKE',
          'Nouveau like sur votre post',
          `${user.firstName} ${user.lastName} a aimé votre post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
          `/forum?post=${post.id}`
        );
      }
    }

    // Récupérer le nombre de likes mis à jour
    const likeCount = await prisma.forumLike.count({
      where: { postId: postId }
    });

    res.json({ 
      message: existingLike ? 'Like supprimé' : 'Post liké',
      likeCount: likeCount,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Erreur lors du like du post:', error);
    res.status(500).json({ error: 'Échec du like' });
  }
});

// Forum: create reply
app.post('/api/forum/posts/:id/replies', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Contenu de la réponse requis' });
    }

    // Récupérer les infos du post et de son auteur
    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    const reply = await prisma.forumReply.create({
      data: {
        content,
        postId: parseInt(id),
        authorId: userId
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, profilePhoto: true } },
        _count: { select: { likes: true } },
        likes: { select: { id: true, userId: true } }
      }
    });

    // Créer une notification pour l'auteur du post (sauf si c'est lui qui répond)
    if (post.authorId !== userId) {
      await createNotification(
        post.authorId,
        'FORUM_REPLY',
        'Nouvelle réponse à votre post',
        `${reply.author.firstName} ${reply.author.lastName} a répondu à votre post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
        `/forum?post=${post.id}`
      );
    }

    res.status(201).json({
      id: reply.id,
      content: reply.content,
      author: reply.author,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      _count: { likes: reply._count.likes },
      likes: reply.likes
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    res.status(500).json({ error: 'Échec de la création de la réponse' });
  }
});

// Forum: get replies for a post
app.get('/api/forum/posts/:id/replies', async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const replies = await prisma.forumReply.findMany({
      where: { postId: parseInt(id) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, profilePhoto: true } },
        _count: { select: { likes: true } },
        likes: { select: { id: true, userId: true } },
        images: {
          select: { 
            id: true, 
            filename: true, 
            mimetype: true, 
            size: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const mappedReplies = replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      author: reply.author,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      _count: { likes: reply._count.likes },
      likes: reply.likes,
      images: reply.images
    }));

    res.json(mappedReplies);
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({ error: 'Échec de la récupération des réponses' });
  }
});

// Forum: test endpoint simple
app.get('/api/forum/test', async (req, res) => {
  res.json({ message: 'Test endpoint works', timestamp: new Date().toISOString() });
});

// Test endpoint pour l'upload d'images
app.post('/api/forum/test-upload', authenticateToken, async (req: any, res) => {
  try {
    console.log('=== TEST UPLOAD ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    res.json({ message: 'Test upload endpoint works', userId: req.user?.userId });
  } catch (error) {
    console.error('Erreur test upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forum: upload images for posts
app.post('/api/forum/posts/:postId/images', authenticateToken, forumUpload.array('images', 5), async (req: any, res) => {
  try {
    console.log('=== DÉBUT UPLOAD IMAGES ===');
    console.log('PostId:', req.params.postId);
    console.log('UserId:', req.user?.userId);
    console.log('Files:', req.files);
    
    const { postId } = req.params;
    const userId = req.user.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      console.log('Aucune image fournie');
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    console.log('Vérification du post...');
    // Vérifier que le post existe et que l'utilisateur a le droit d'y ajouter des images
    const post = await prisma.forumPost.findFirst({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      console.log('Post non trouvé');
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    console.log('Post trouvé, sauvegarde des images...');
    // Sauvegarder les informations des images en base
    const savedImages = await Promise.all(
      files.map(async (file) => {
        console.log('Sauvegarde image:', file.originalname);
        return await prisma.forumImage.create({
          data: {
            filename: file.filename,
            filepath: file.path,
            mimetype: file.mimetype,
            size: file.size,
            postId: parseInt(postId),
            uploadedBy: userId
          }
        });
      })
    );

    console.log('Images sauvegardées:', savedImages.length);
    res.status(201).json({
      message: 'Images uploadées avec succès',
      images: savedImages
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload des images:', error);
    res.status(500).json({ error: 'Échec de l\'upload des images', details: error.message });
  }
});

// Forum: upload images for replies
app.post('/api/forum/replies/:replyId/images', authenticateToken, forumUpload.array('images', 5), async (req: any, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    // Vérifier que la réponse existe
    const reply = await prisma.forumReply.findFirst({
      where: { id: parseInt(replyId) }
    });

    if (!reply) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    // Sauvegarder les informations des images en base
    const savedImages = await Promise.all(
      files.map(async (file) => {
        return await prisma.forumImage.create({
          data: {
            filename: file.filename,
            filepath: file.path,
            mimetype: file.mimetype,
            size: file.size,
            replyId: parseInt(replyId),
            uploadedBy: userId
          }
        });
      })
    );

    res.status(201).json({
      message: 'Images uploadées avec succès',
      images: savedImages
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload des images:', error);
    res.status(500).json({ error: 'Échec de l\'upload des images' });
  }
});

// Forum: get images for a post
app.get('/api/forum/posts/:postId/images', async (req: any, res) => {
  try {
    const { postId } = req.params;
    
    const images = await prisma.forumImage.findMany({
      where: { postId: parseInt(postId) },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(images);
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({ error: 'Échec de la récupération des images' });
  }
});

// Forum: get images for a reply
app.get('/api/forum/replies/:replyId/images', async (req: any, res) => {
  try {
    const { replyId } = req.params;
    
    const images = await prisma.forumImage.findMany({
      where: { replyId: parseInt(replyId) },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(images);
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({ error: 'Échec de la récupération des images' });
  }
});

// Forum: delete image
app.delete('/api/forum/images/:imageId', authenticateToken, async (req: any, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    // Vérifier que l'image existe et que l'utilisateur a le droit de la supprimer
    const image = await prisma.forumImage.findFirst({
      where: { 
        id: parseInt(imageId),
        OR: [
          { uploadedBy: userId }, // L'utilisateur qui a uploadé l'image
          { post: { authorId: userId } }, // L'auteur du post
          { reply: { authorId: userId } } // L'auteur de la réponse
        ]
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée ou accès non autorisé' });
    }

    // Supprimer le fichier physique
    try {
      if (fs.existsSync(image.filepath)) {
        fs.unlinkSync(image.filepath);
      }
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier:', fileError);
    }

    // Supprimer l'enregistrement de la base de données
    await prisma.forumImage.delete({
      where: { id: parseInt(imageId) }
    });

    res.json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({ error: 'Échec de la suppression de l\'image' });
  }
});

// Forum: serve images (endpoint pour servir les images)
app.get('/api/forum/images/:filename', (req: any, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(process.cwd(), 'uploads/forum-images', filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Erreur lors du service de l\'image:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'image' });
  }
});

// ===== PHOTOS DE PROFIL =====

// Upload photo de profil
app.post('/api/profile/photo', authenticateToken, profileUpload.single('photo'), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucune photo fournie' });
    }

    // Supprimer l'ancienne photo de profil si elle existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    if (user?.profilePhoto) {
      const oldPhotoPath = path.join(process.cwd(), 'uploads/profile-photos', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Mettre à jour la base de données avec le nouveau chemin de la photo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: file.filename },
      select: { id: true, firstName: true, lastName: true, profilePhoto: true }
    });

    res.json({
      message: 'Photo de profil mise à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo de profil:', error);
    res.status(500).json({ error: 'Échec de l\'upload de la photo de profil' });
  }
});

// Supprimer photo de profil
app.delete('/api/profile/photo', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    if (user?.profilePhoto) {
      // Supprimer le fichier
      const photoPath = path.join(process.cwd(), 'uploads/profile-photos', user.profilePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Mettre à jour la base de données
      await prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: null }
      });
    }

    res.json({ message: 'Photo de profil supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo de profil:', error);
    res.status(500).json({ error: 'Échec de la suppression de la photo de profil' });
  }
});

// Servir les photos de profil
app.get('/api/profile/photos/:filename', (req: any, res) => {
  try {
    const { filename } = req.params;
    const photoPath = path.join(process.cwd(), 'uploads/profile-photos', filename);
    
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ error: 'Photo de profil non trouvée' });
    }
    
    res.sendFile(photoPath);
  } catch (error) {
    console.error('Erreur lors du service de la photo de profil:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de la photo de profil' });
  }
});

// Serve audio files for voice messages
app.get('/api/audio/:filename', (req: any, res) => {
  try {
    const { filename } = req.params;
    console.log('🎵 Requête audio reçue pour:', filename);
    
    // Sanitize filename pour éviter les attaques path traversal
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      console.error('❌ Tentative d\'accès non autorisé:', filename);
      return res.status(400).json({ error: 'Nom de fichier invalide' });
    }
    
    const audioPath = path.join(process.cwd(), 'uploads/audio-messages', sanitizedFilename);
    console.log('🎵 Chemin audio:', audioPath);
    
    if (!fs.existsSync(audioPath)) {
      console.error('❌ Fichier audio non trouvé:', audioPath);
      return res.status(404).json({ error: 'Fichier audio non trouvé' });
    }
    
    // Vérifier que c'est un fichier (pas un répertoire)
    const stats = fs.statSync(audioPath);
    if (!stats.isFile()) {
      console.error('❌ Le chemin n\'est pas un fichier:', audioPath);
      return res.status(400).json({ error: 'Le chemin n\'est pas un fichier' });
    }
    
    const fileSize = stats.size;
    console.log('🎵 Taille du fichier:', fileSize, 'bytes');
    
    if (fileSize === 0) {
      console.error('❌ Fichier audio vide:', audioPath);
      return res.status(400).json({ error: 'Fichier audio vide' });
    }
    
    // Déterminer le type MIME selon l'extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = 'audio/webm'; // Par défaut
    
    if (ext === '.webm') {
      contentType = 'audio/webm; codecs=opus';
    } else if (ext === '.mp4' || ext === '.m4a') {
      contentType = 'audio/mp4';
    } else if (ext === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (ext === '.ogg') {
      contentType = 'audio/ogg; codecs=opus';
    } else if (ext === '.wav') {
      contentType = 'audio/wav';
    }
    
    console.log('🎵 Content-Type:', contentType);
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
      return res.status(200).end();
    }
    
    // Définir les headers pour permettre la lecture audio avec CORS
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Lire le fichier et l'envoyer avec gestion du range (pour la lecture progressive)
    const rangeHeader = req.headers.range;
    
    if (rangeHeader) {
      try {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (isNaN(start) || isNaN(end) || start < 0 || end >= fileSize || start > end) {
          console.error('❌ Range invalide:', rangeHeader);
          return res.status(416).json({ error: 'Range invalide' });
        }
        
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(audioPath, { start, end });
        
        file.on('error', (err) => {
          console.error('❌ Erreur lors de la lecture du fichier:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur lors de la lecture du fichier audio' });
          }
        });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } catch (rangeError) {
        console.error('❌ Erreur lors du traitement du range:', rangeError);
        // Si le range est invalide, envoyer tout le fichier
        const file = fs.createReadStream(audioPath);
        file.on('error', (err) => {
          console.error('❌ Erreur lors de la lecture du fichier:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur lors de la lecture du fichier audio' });
          }
        });
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
        };
        res.writeHead(200, head);
        file.pipe(res);
      }
    } else {
      const file = fs.createReadStream(audioPath);
      
      file.on('error', (err) => {
        console.error('❌ Erreur lors de la lecture du fichier:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur lors de la lecture du fichier audio' });
        }
      });
      
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      file.pipe(res);
    }
    
    console.log('✅ Fichier audio servi avec succès:', sanitizedFilename);
  } catch (error: any) {
    console.error('❌ Erreur lors du service du fichier audio:', error);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erreur lors du chargement du fichier audio',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Serve chat files (photos and documents)
app.get('/api/chat-files/:filename', (req: any, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads/chat-files', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erreur lors du service du fichier de chat:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du fichier' });
  }
});

// Flashcards: get user statistics
app.get('/api/stats-flashcards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Récupérer l'utilisateur pour connaître sa classe et son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userClass: true, section: true, role: true }
    });

    if (!user) {
      return res.json({
        userStats: {
          totalSubjects: 0,
          totalFlashcards: 0,
          completedFlashcards: 0,
          averageAccuracy: 0
        },
        subjectStats: []
      });
    }

    // Si c'est un tuteur, donner accès à toutes les matières
    let subjects;
    let totalFlashcards;
    
    if (user.role === 'TUTOR') {
      // Tuteurs : accès à toutes les matières
      subjects = await prisma.subject.findMany();
      totalFlashcards = await prisma.flashcard.count();
    } else {
      // Étudiants : accès limité à leur niveau
      if (!user.userClass) {
        return res.json({
          userStats: {
            totalSubjects: 0,
            totalFlashcards: 0,
            completedFlashcards: 0,
            averageAccuracy: 0
          },
          subjectStats: []
        });
      }

      subjects = await prisma.subject.findMany({
        where: { level: user.userClass }
      });

      totalFlashcards = await prisma.flashcard.count({
        where: {
          subject: {
            level: user.userClass
          }
        }
      });
    }

    // Récupérer les tentatives de l'utilisateur
    const attempts = await prisma.flashcardAttempt.findMany({
      where: { userId: userId },
      include: {
        flashcard: {
          include: {
            subject: true
          }
        }
      }
    });

    const completedFlashcards = new Set(attempts.map(a => a.flashcardId)).size;
    const correctAttempts = attempts.filter(a => a.isCorrect).length;
    const averageAccuracy = attempts.length > 0 ? (correctAttempts / attempts.length) * 100 : 0;

    // Statistiques par matière
    const subjectStats = await Promise.all(
      subjects.map(async (subject) => {
        const subjectFlashcards = await prisma.flashcard.count({
          where: { subjectId: subject.id }
        });

        const subjectAttempts = attempts.filter(a => a.flashcard.subjectId === subject.id);
        const subjectCompleted = new Set(subjectAttempts.map(a => a.flashcardId)).size;
        const subjectCorrect = subjectAttempts.filter(a => a.isCorrect).length;
        const subjectAccuracy = subjectAttempts.length > 0 ? (subjectCorrect / subjectAttempts.length) * 100 : 0;

        return {
          subjectId: subject.id,
          subjectName: subject.name,
          totalFlashcards: subjectFlashcards,
          completedFlashcards: subjectCompleted,
          accuracy: Math.round(subjectAccuracy * 100) / 100,
          progress: subjectFlashcards > 0 ? Math.round((subjectCompleted / subjectFlashcards) * 100) : 0
        };
      })
    );

    res.json({
      userStats: {
        totalSubjects: subjects.length,
        totalFlashcards: totalFlashcards,
        completedFlashcards: completedFlashcards,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100
      },
      subjectStats: subjectStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques', details: error.message });
  }
});

// Create test flashcard attempts for student (temporary endpoint)
app.post('/api/student/create-test-attempts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    // Récupérer quelques flashcards
    const flashcards = await prisma.flashcard.findMany({
      take: 10,
      select: { id: true }
    });
    
    if (flashcards.length === 0) {
      return res.status(400).json({ error: 'Aucune flashcard disponible' });
    }
    
    // Créer des tentatives de test
    const attempts = [];
    for (let i = 0; i < flashcards.length; i++) {
      const flashcard = flashcards[i];
      const isCorrect = Math.random() > 0.3; // 70% de réussite
      const daysAgo = Math.floor(Math.random() * 7); // Derniers 7 jours
      
      const attemptDate = new Date();
      attemptDate.setDate(attemptDate.getDate() - daysAgo);
      attemptDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      
      attempts.push({
        userId: userId,
        flashcardId: flashcard.id,
        isCorrect: isCorrect,
        timeSpent: 30 + Math.floor(Math.random() * 60), // 30-90 secondes
        createdAt: attemptDate
      });
    }
    
    // Insérer les tentatives
    await prisma.flashcardAttempt.createMany({
      data: attempts
    });
    
    res.json({ 
      message: `${attempts.length} tentatives créées`,
      attempts: attempts.length
    });
  } catch (error) {
    console.error('Erreur lors de la création des tentatives de test:', error);
    res.status(500).json({ error: 'Échec de la création des tentatives' });
  }
});

// Student Dashboard Statistics
app.get('/api/student/dashboard-stats', authenticateToken, async (req: any, res) => {
  try {
    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner des stats par défaut
    if (req.user.demoMode || isDemoMode) {
      console.log('🔵 /api/student/dashboard-stats: Mode démo activé, retourne stats par défaut');
      return res.json({
        flashcardsCompleted: 0,
        studyStreak: 0,
        averageScore: 0,
        timeSpent: '0h 0m',
        totalAttempts: 0,
        subjectProgress: []
      });
    }

    if (!prisma) {
      console.log('⚠️ /api/student/dashboard-stats: Prisma non disponible, retourne stats par défaut');
      return res.json({
        flashcardsCompleted: 0,
        studyStreak: 0,
        averageScore: 0,
        timeSpent: '0h 0m',
        totalAttempts: 0,
        subjectProgress: []
      });
    }

    const userId = req.user.userId;

    // Récupérer toutes les tentatives de l'utilisateur
    const attempts = await prisma.flashcardAttempt.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // 1. Flashcards complétées (nombre unique de flashcards tentées)
    const flashcardsCompleted = new Set(attempts.map(a => a.flashcardId)).size;

    // 2. Score moyen (% de bonnes réponses)
    const correctAttempts = attempts.filter(a => a.isCorrect).length;
    const averageScore = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;

    // 3. Série de jours consécutifs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let studyStreak = 0;
    let currentDate = new Date(today);
    
    // Grouper les tentatives par jour
    const attemptsByDay = new Map();
    attempts.forEach(attempt => {
      const attemptDate = new Date(attempt.createdAt);
      attemptDate.setHours(0, 0, 0, 0);
      const dateKey = attemptDate.toISOString().split('T')[0];
      attemptsByDay.set(dateKey, true);
    });
    
    // Calculer la série en partant d'aujourd'hui
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (attemptsByDay.has(dateKey)) {
        studyStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Si aujourd'hui n'a pas d'activité, vérifier hier
        if (studyStreak === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterdayKey = currentDate.toISOString().split('T')[0];
          if (attemptsByDay.has(yesterdayKey)) {
            studyStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // 4. Temps total d'étude (estimation : 30 secondes par tentative)
    const totalMinutes = Math.round((attempts.length * 0.5)); // 30 secondes par tentative
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeSpent = `${hours}h ${minutes}m`;

    res.json({
      flashcardsCompleted,
      studyStreak,
      averageScore,
      timeSpent,
      totalAttempts: attempts.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// Flashcards: get flashcards for a specific subject
app.get('/api/subjects/:subjectId/flashcards', authenticateToken, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    
    // Gérer les deux formats de token (userId comme email ou comme ID numérique)
    let whereClause;
    if (typeof req.user.userId === 'string' && req.user.userId.includes('@')) {
      // userId est un email
      whereClause = { email: req.user.userId };
    } else {
      // userId est un ID numérique
      whereClause = { id: req.user.userId };
    }
    
    // Récupérer l'utilisateur pour connaître son rôle
    const user = await prisma.user.findUnique({
      where: whereClause,
      select: { id: true, role: true, section: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const userId = user.id;

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    // Pour les admins, accès à toutes les flashcards
    // Pour les autres utilisateurs, accès aux flashcards de leur classe
    let flashcardWhereClause: any = { subjectId: parseInt(subjectId) };
    
    if (user.role !== 'ADMIN') {
      // Récupérer la classe de l'utilisateur pour filtrer correctement
      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
        select: { userClass: true, section: true }
      });
      
      if (userInDb && userInDb.userClass) {
        // Vérifier que la matière correspond au niveau de l'utilisateur
        if (subject.level !== userInDb.userClass) {
          return res.json({
            subject: {
              id: subject.id,
              name: subject.name,
              level: subject.level,
              section: subject.section
            },
            flashcards: [] // Retourner un tableau vide si la matière ne correspond pas au niveau
          });
        }
        
        // Pour la 9ème, on accepte toutes les flashcards de la matière (pas de filtre par section)
        // Pour Terminale, on filtre par section si elle existe
        if (userInDb.userClass === 'Terminale' && userInDb.section) {
          // Pour Terminale avec section, on accepte les flashcards de matières générales (section null) 
          // ou spécifiques à la section de l'utilisateur
          flashcardWhereClause.subject = {
            level: userInDb.userClass,
            OR: [
              { section: null }, // Matières générales
              { section: userInDb.section } // Matières spécifiques à la section
            ]
          };
        }
        // Pour 9ème, pas de filtre supplémentaire par section - toutes les flashcards de la matière sont accessibles
      }
    }

    const flashcards = await prisma.flashcard.findMany({
      where: flashcardWhereClause,
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        },
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      subject: {
        id: subject.id,
        name: subject.name,
        level: subject.level,
        section: subject.section
      },
      flashcards
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des flashcards' });
  }
});

// Flashcards: get available subjects for user's class
app.get('/api/subjects-flashcards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    // Récupérer l'utilisateur pour connaître sa classe et son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userClass: true, section: true, role: true }
    });

    console.log('🔍 API subjects-flashcards - UserID:', userId);
    console.log('🔍 API subjects-flashcards - Utilisateur:', user);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Si c'est un tuteur ou admin, donner accès à toutes les matières
    let subjects;
    
    // Sections à exclure (elles ne sont pas des matières, juste des sections)
    const sectionsToExclude = ['SMP', 'SVT', 'SES', 'LLA'];
    
    if (user.role === 'TUTOR' || user.role === 'ADMIN') {
      // Tuteurs et admins : accès à toutes les matières (sauf les sections)
      subjects = await prisma.subject.findMany({
        where: {
          name: {
            notIn: sectionsToExclude // Exclure les sections
          }
        },
        select: {
          id: true,
          name: true,
          level: true,
          section: true,
          description: true,
          createdAt: true,
          chapters: {
            select: {
              id: true,
              name: true,
              order: true,
              description: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    } else {
      // Étudiants : accès limité à leur niveau et section
      if (!user.userClass) {
        return res.json([]); // Retourner un tableau vide si pas de classe définie
      }

      // Filtrer selon le niveau ET la section, et exclure les sections
      subjects = await prisma.subject.findMany({
        where: {
          name: {
            notIn: sectionsToExclude // Exclure les sections
          },
          level: user.userClass,
          OR: [
            { section: null }, // Matières générales (accessibles à tous)
            { section: user.section } // Matières spécifiques à la section de l'étudiant
          ]
        },
        select: {
          id: true,
          name: true,
          level: true,
          section: true,
          description: true,
          createdAt: true,
          chapters: {
            select: {
              id: true,
              name: true,
              order: true,
              description: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
      
      console.log('🔍 API subjects-flashcards - Matières filtrées:', subjects.length);
      console.log('🔍 API subjects-flashcards - Détail des matières:', subjects.map(s => `${s.name} (${s.section || 'Générale'})`));
    }

    // Récupérer les tentatives de l'utilisateur
    const attempts = await prisma.flashcardAttempt.findMany({
      where: { userId: userId },
      include: {
        flashcard: {
          include: {
            subject: true
          }
        }
      }
    });

    // Enrichir avec les vraies statistiques ET les questions par chapitre
    const enrichedSubjects = await Promise.all(
      subjects.map(async (subject) => {
        // La matière est déjà filtrée selon le niveau et la section de l'utilisateur
        // Donc toutes les flashcards de cette matière sont accessibles
        // Pour la 9ème : toutes les flashcards de la matière sont accessibles
        // Pour Terminale : la matière correspond déjà à la section de l'utilisateur ou est générale
        
        const totalFlashcards = await prisma.flashcard.count({
          where: { subjectId: subject.id }
        });

        const subjectAttempts = attempts.filter(a => a.flashcard.subjectId === subject.id);
        const completedFlashcards = new Set(subjectAttempts.map(a => a.flashcardId)).size;
        const correctAttempts = subjectAttempts.filter(a => a.isCorrect).length;
        const accuracy = subjectAttempts.length > 0 ? (correctAttempts / subjectAttempts.length) * 100 : 0;
        const progress = totalFlashcards > 0 ? (completedFlashcards / totalFlashcards) * 100 : 0;

        // Enrichir les chapitres avec leurs flashcards et questions
        const chaptersWithFlashcards = await Promise.all(
          subject.chapters.map(async (chapter) => {
            // Compter les flashcards pour ce chapitre dans cette matière
            const flashcardCount = await prisma.flashcard.count({
              where: {
                subjectId: subject.id,
                chapterId: chapter.id
              }
            });
            
            // Compter les questions pour ce chapitre dans cette matière
            const questionCount = await prisma.knowledgeQuestion.count({
              where: {
                chapterId: chapter.id,
                test: {
                  subjectId: subject.id,
                  isActive: true
                }
              }
            });

            return {
              ...chapter,
              flashcardCount: flashcardCount,
              questionCount: questionCount
            };
          })
        );

        // Compter aussi les questions sans chapitre (chapterId: null) pour cette matière
        const questionsWithoutChapter = await prisma.knowledgeQuestion.count({
          where: {
            chapterId: null,
            test: {
              subjectId: subject.id,
              isActive: true
            }
          }
        });

        // Compter le total de questions pour cette matière
        const totalQuestions = await prisma.knowledgeQuestion.count({
          where: {
            test: {
              subjectId: subject.id,
              isActive: true
            }
          }
        });

        return {
          id: subject.id,
          name: subject.name,
          level: subject.level,
          section: subject.section,
          description: subject.description,
          chapters: chaptersWithFlashcards,
          totalFlashcards: totalFlashcards,
          completedFlashcards: completedFlashcards,
          accuracy: Math.round(accuracy * 100) / 100,
          progress: Math.round(progress * 100) / 100,
          totalQuestions: totalQuestions,
          questionsWithoutChapter: questionsWithoutChapter
        };
      })
    );

    res.json(enrichedSubjects);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération des matières', details: error.message });
  }
});

// Test endpoint for flashcards
app.get('/api/test-flashcards/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subjectIdInt = parseInt(subjectId);
    
    const flashcards = await prisma.flashcard.findMany({
      where: { subjectId: subjectIdInt },
      take: 5
    });
    
    res.json({ count: flashcards.length, flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chapters for a specific subject (public endpoint)
app.get('/api/subject-chapters/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Validation du paramètre
    if (!subjectId || isNaN(parseInt(subjectId))) {
      return res.status(400).json({ error: 'ID de matière invalide' });
    }

    const subjectIdInt = parseInt(subjectId);
    console.log('🔍 Récupération des chapitres pour la matière ID:', subjectIdInt);

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: subjectIdInt },
      select: { id: true, name: true, level: true, section: true }
    });

    if (!subject) {
      console.log('❌ Matière non trouvée pour ID:', subjectIdInt);
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    console.log('✅ Matière trouvée:', subject.name);

    // Récupérer les chapitres de la matière
    const chapters = await prisma.chapter.findMany({
      where: { subjectId: subjectIdInt },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        description: true
      }
    });

    console.log('📖 Chapitres trouvés:', chapters.length);

    res.json({
      subject,
      chapters
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des chapitres:', error);
    res.status(500).json({ error: 'Échec de la récupération des chapitres', details: error.message });
  }
});

// Flashcards: get flashcards for a specific subject (public endpoint)
app.get('/api/subject-flashcards/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Validation du paramètre
    if (!subjectId || isNaN(parseInt(subjectId))) {
      return res.status(400).json({ error: 'ID de matière invalide' });
    }

    const subjectIdInt = parseInt(subjectId);
    console.log('🔍 Récupération des flashcards pour la matière ID:', subjectIdInt);

    // Récupérer toutes les flashcards de la matière (pas seulement celles de l'utilisateur)
    const flashcards = await prisma.flashcard.findMany({
      where: {
        subjectId: subjectIdInt
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true
          }
        },
        chapter: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer la matière
    const subject = await prisma.subject.findUnique({
      where: { id: subjectIdInt },
      select: { id: true, name: true, level: true, section: true }
    });

    console.log('📝 Flashcards trouvées:', flashcards.length);

    res.json({
      subject,
      flashcards
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// Flashcards: create or update flashcard attempt
app.post('/api/flashcard-attempt', authenticateToken, async (req: any, res) => {
  try {
    const { flashcardId, isCorrect, timeSpent } = req.body;
    const userId = req.user.userId;

    if (!flashcardId || typeof isCorrect !== 'boolean' || !timeSpent) {
      return res.status(400).json({ error: 'Données requises manquantes' });
    }

    const attempt = await prisma.flashcardAttempt.create({
      data: {
        flashcardId: parseInt(flashcardId),
        userId: userId,
        isCorrect: isCorrect,
        timeSpent: parseInt(timeSpent)
      }
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Erreur lors de la création de la tentative:', error);
    res.status(500).json({ error: 'Échec de la création de la tentative' });
  }
});

// Test endpoint
app.get('/api/test-flashcards', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Flashcards API working', userId: req.user.userId });
  } catch (error) {
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// ===== ROUTES ADMINISTRATION =====

// Middleware pour vérifier que l'utilisateur peut accéder à ses propres données ou est ADMIN
const allowStudentOwnData = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction, resourceUserId?: number) => {
  try {
    const currentUserIdRaw = req.user?.userId || req.user?.id;
    const currentUserId = typeof currentUserIdRaw === 'string' ? parseInt(currentUserIdRaw) : currentUserIdRaw;
    
    // Si l'utilisateur est ADMIN, toujours autoriser
    if (req.user?.role === 'ADMIN') {
      return next();
    }
    
    // Si l'utilisateur est STUDENT et accède à ses propres données, autoriser
    if (req.user?.role === 'STUDENT' && resourceUserId && currentUserId === resourceUserId) {
      console.log(`✅ allowStudentOwnData: Étudiant ${currentUserId} accède à ses propres données`);
      return next();
    }
    
    // Si l'utilisateur est TUTOR, autoriser
    if (req.user?.role === 'TUTOR') {
      return next();
    }
    
    console.log(`❌ allowStudentOwnData: Accès refusé - userId=${currentUserId}, role=${req.user?.role}, resourceUserId=${resourceUserId}`);
    return res.status(403).json({ error: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.' });
  } catch (error) {
    console.error('❌ allowStudentOwnData: Erreur:', error);
    res.status(500).json({ error: 'Erreur de vérification des droits' });
  }
};

// Middleware pour vérifier les droits admin
const requireAdmin = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    if (!req.user) {
      console.error('❌ requireAdmin: Pas de req.user');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!prisma) {
      console.error('❌ requireAdmin: Prisma non disponible');
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    const currentRole = req.user.role;
    const currentUserId = req.user.userId || req.user.id;
    const currentUserEmail = req.user.email || req.user.originalEmail;
    
    console.log('🔐 requireAdmin: userId:', currentUserId, ', email:', currentUserEmail, ', role:', currentRole);
    
    // Si le token dit déjà ADMIN, vérifier rapidement en DB puis autoriser
    if (currentRole === 'ADMIN' && currentUserId) {
      // Vérification rapide que l'utilisateur existe toujours en DB
      try {
        const quickCheck = await prisma.user.findUnique({
          where: { id: typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId },
          select: { id: true, email: true, role: true }
        });
        
        if (quickCheck && (quickCheck.role === 'ADMIN' || quickCheck.email.toLowerCase() === 'admin@test.com')) {
          console.log(`✅ requireAdmin: Accès autorisé (token ADMIN confirmé en DB) - ${currentUserEmail}`);
          // Mettre à jour req.user au cas où
          req.user.userId = quickCheck.id;
          req.user.id = quickCheck.id;
          req.user.email = quickCheck.email;
          req.user.role = quickCheck.role as Role;
          next();
          return;
        }
      } catch (err) {
        console.warn('⚠️ requireAdmin: Erreur vérification rapide, continuation avec vérification complète');
      }
    }
    
    // Sinon, vérifier en DB
    let dbUser = null;
    if (currentUserEmail && typeof currentUserEmail === 'string' && currentUserEmail.includes('@')) {
      dbUser = await prisma.user.findUnique({
        where: { email: currentUserEmail.trim().toLowerCase() },
        select: { id: true, email: true, role: true }
      });
    }
    
    if (!dbUser && currentUserId) {
      const userIdNum = typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId;
      if (userIdNum && !isNaN(userIdNum)) {
        dbUser = await prisma.user.findUnique({
          where: { id: userIdNum },
          select: { id: true, email: true, role: true }
        });
      }
    }
    
    if (!dbUser) {
      console.error('❌ requireAdmin: Utilisateur non trouvé en DB');
      return res.status(403).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Gestion spéciale pour admin@test.com
    if (dbUser.email.toLowerCase() === 'admin@test.com' && dbUser.role !== 'ADMIN') {
      console.log('⚠️ requireAdmin: Promotion admin@test.com...');
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, role: true }
      });
      console.log(`✅ requireAdmin: admin@test.com promu en ADMIN`);
    }
    
    // Vérifier le rôle - accepter ADMIN en majuscules ou minuscules
    const dbRole = dbUser.role?.toUpperCase?.() || dbUser.role;
    console.log(`🔐 requireAdmin: Rôle en DB: ${dbUser.role}, normalisé: ${dbRole}`);
    
    // Si le rôle est ADMIN, autoriser immédiatement
    if (dbRole === 'ADMIN') {
      console.log(`✅ requireAdmin: Accès autorisé - ${dbUser.email} (rôle: ${dbRole})`);
      req.user.userId = dbUser.id;
      req.user.id = dbUser.id;
      req.user.email = dbUser.email;
      req.user.role = 'ADMIN' as Role;
      next();
      return;
    }
    
    // Si le rôle n'est pas ADMIN, vérifier s'il y a des admins dans le système
    const allAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    
    console.log(`🔐 requireAdmin: Nombre d'admins trouvés: ${allAdmins.length}`);
    
    // Si aucun admin n'existe, promouvoir automatiquement l'utilisateur actuel
    if (allAdmins.length === 0 && dbUser) {
      console.log(`⚠️ requireAdmin: Aucun admin trouvé, promotion automatique de ${dbUser.email}...`);
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, role: true }
      });
      console.log(`✅ requireAdmin: ${dbUser.email} promu en ADMIN (rôle: ${dbUser.role})`);
      
      req.user.userId = dbUser.id;
      req.user.id = dbUser.id;
      req.user.email = dbUser.email;
      req.user.role = 'ADMIN' as Role;
      next();
      return;
    }
    
    console.error(`❌ requireAdmin: Accès refusé - Rôle: ${dbUser.role}, normalisé: ${dbRole}`);
    console.error(`❌ requireAdmin: Détails utilisateur - ID: ${dbUser.id}, Email: ${dbUser.email}`);
    return res.status(403).json({ 
      error: 'Accès refusé. Droits administrateur requis.',
      details: `Rôle actuel: ${dbUser.role}, normalisé: ${dbRole}`,
      userId: dbUser.id,
      email: dbUser.email
    });
  } catch (error: any) {
    console.error('❌ requireAdmin: Erreur:', error);
    return res.status(500).json({ error: 'Erreur de vérification des droits' });
  }
};

// Route pour se promouvoir admin automatiquement si aucun admin n'existe
app.post('/api/auth/promote-to-admin', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!prisma) {
      return res.status(500).json({ error: 'Prisma non disponible' });
    }
    
    const userId = req.user?.userId || req.user?.id;
    const userEmail = req.user?.email || req.user?.originalEmail;
    
    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    
    // Vérifier s'il existe déjà un admin dans la DB
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      return res.status(403).json({ 
        error: 'Un administrateur existe déjà dans le système',
        adminEmail: existingAdmin.email
      });
    }
    
    // Trouver l'utilisateur actuel
    let dbUser = null;
    if (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail.trim().toLowerCase() }
      });
    }
    
    if (!dbUser && userId) {
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
      if (userIdNum && !isNaN(userIdNum)) {
        dbUser = await prisma.user.findUnique({
          where: { id: userIdNum }
        });
      }
    }
    
    if (!dbUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Promouvoir en admin
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    
    console.log(`✅ Utilisateur ${updatedUser.email} (ID: ${updatedUser.id}) promu en ADMIN`);
    
    // Générer un nouveau token avec le nouveau rôle
    const newToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Vous avez été promu administrateur avec succès',
      user: updatedUser,
      token: newToken
    });
  } catch (error: any) {
    console.error('❌ Erreur promotion admin:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la promotion',
      details: error.message 
    });
  }
});

// Route de debug pour vérifier le statut admin (sans requireAdmin)
app.get('/api/debug/admin-status', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const userEmail = req.user?.email || req.user?.originalEmail;
    
    if (!prisma) {
      return res.status(500).json({ error: 'Prisma non disponible' });
    }
    
    // Vérifier s'il existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    let dbUser = null;
    
    // Chercher par email
    if (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail.trim().toLowerCase() },
        select: { id: true, email: true, role: true, firstName: true, lastName: true }
      });
    }
    
    // Chercher par ID si pas trouvé
    if (!dbUser && userId) {
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
      if (userIdNum && !isNaN(userIdNum)) {
        dbUser = await prisma.user.findUnique({
          where: { id: userIdNum },
          select: { id: true, email: true, role: true, firstName: true, lastName: true }
        });
      }
    }
    
    if (!dbUser) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        debug: { userId, userEmail, reqUser: req.user }
      });
    }
    
    const isAdmin = dbUser.role?.toUpperCase() === 'ADMIN';
    const canPromote = !existingAdmin; // Peut se promouvoir si aucun admin n'existe
    
    res.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role
      },
      isAdmin,
      canAccessAdminRoutes: isAdmin,
      canPromote,
      existingAdmin: existingAdmin ? {
        id: existingAdmin.id,
        email: existingAdmin.email,
        name: `${existingAdmin.firstName} ${existingAdmin.lastName}`
      } : null,
      message: isAdmin 
        ? 'Vous avez les droits administrateur' 
        : canPromote
        ? 'Aucun administrateur n\'existe. Vous pouvez vous promouvoir en admin.'
        : `Vous n'avez pas les droits administrateur. Votre rôle actuel: ${dbUser.role}`,
      promoteEndpoint: canPromote ? '/api/auth/promote-to-admin' : null
    });
  } catch (error: any) {
    console.error('❌ Erreur debug admin-status:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification',
      details: error.message 
    });
  }
});

// Admin: get all forum images
app.get('/api/admin/forum/images', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const images = await prisma.forumImage.findMany({
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true }
        },
        post: {
          select: { id: true, title: true }
        },
        reply: {
          select: { id: true, content: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(images);
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({ error: 'Échec de la récupération des images' });
  }
});

// Admin: get single forum image
app.get('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { imageId } = req.params;
    
    const image = await prisma.forumImage.findUnique({
      where: { id: parseInt(imageId) },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true }
        },
        post: {
          select: { id: true, title: true }
        },
        reply: {
          select: { id: true, content: true }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    res.json(image);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    res.status(500).json({ error: 'Échec de la récupération de l\'image' });
  }
});

// Admin: update forum image metadata
app.put('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { imageId } = req.params;
    const { filename, postId, replyId } = req.body;

    // Vérifier que l'image existe
    const existingImage = await prisma.forumImage.findUnique({
      where: { id: parseInt(imageId) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    // Mettre à jour l'image
    const updatedImage = await prisma.forumImage.update({
      where: { id: parseInt(imageId) },
      data: {
        filename: filename || existingImage.filename,
        postId: postId !== undefined ? (postId ? parseInt(postId) : null) : existingImage.postId,
        replyId: replyId !== undefined ? (replyId ? parseInt(replyId) : null) : existingImage.replyId,
        updatedAt: new Date()
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true }
        },
        post: {
          select: { id: true, title: true }
        },
        reply: {
          select: { id: true, content: true }
        }
      }
    });

    res.json({
      message: 'Image mise à jour avec succès',
      image: updatedImage
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'image:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de l\'image' });
  }
});

// Admin: delete forum image
app.delete('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { imageId } = req.params;

    // Vérifier que l'image existe
    const image = await prisma.forumImage.findUnique({
      where: { id: parseInt(imageId) }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    // Supprimer le fichier physique
    try {
      if (fs.existsSync(image.filepath)) {
        fs.unlinkSync(image.filepath);
        console.log('Fichier supprimé:', image.filepath);
      }
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier:', fileError);
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer l'enregistrement de la base de données
    await prisma.forumImage.delete({
      where: { id: parseInt(imageId) }
    });

    res.json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({ error: 'Échec de la suppression de l\'image' });
  }
});

// Admin: bulk delete forum images
app.delete('/api/admin/forum/images', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'Liste d\'IDs d\'images requise' });
    }

    // Récupérer les images à supprimer
    const images = await prisma.forumImage.findMany({
      where: { id: { in: imageIds.map(id => parseInt(id)) } }
    });

    if (images.length === 0) {
      return res.status(404).json({ error: 'Aucune image trouvée' });
    }

    // Supprimer les fichiers physiques
    const deletedFiles = [];
    const failedFiles = [];
    
    for (const image of images) {
      try {
        if (fs.existsSync(image.filepath)) {
          fs.unlinkSync(image.filepath);
          deletedFiles.push(image.filename);
        }
      } catch (fileError) {
        console.error('Erreur lors de la suppression du fichier:', image.filename, fileError);
        failedFiles.push(image.filename);
      }
    }

    // Supprimer les enregistrements de la base de données
    const deleteResult = await prisma.forumImage.deleteMany({
      where: { id: { in: imageIds.map(id => parseInt(id)) } }
    });

    res.json({
      message: `${deleteResult.count} image(s) supprimée(s) avec succès`,
      deletedCount: deleteResult.count,
      deletedFiles,
      failedFiles
    });
  } catch (error) {
    console.error('Erreur lors de la suppression en masse des images:', error);
    res.status(500).json({ error: 'Échec de la suppression en masse des images' });
  }
});

// GET - Statistiques admin
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      totalDirectMessages,
      totalGroupMessages,
      totalFlashcards,
      totalForumPosts,
      totalSessions,
      activeUsers,
      verifiedTutors
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TUTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.directMessage.count(),
      prisma.groupMessage.count(),
      prisma.flashcard.count(),
      // Compter seulement les posts non verrouillés (comme dans le forum public)
      prisma.forumPost.count({ where: { isLocked: false } }),
      prisma.tutorSession.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        }
      }),
      prisma.tutor.count({
        where: {
          rating: { gte: 4.0 }
        }
      })
    ]);

    // Calculer les revenus (simulation basée sur les sessions)
    const completedSessions = await prisma.tutorSession.count({
      where: { status: 'COMPLETED' }
    });
    const revenue = completedSessions * 25; // 25 HTG par session

    // Déterminer la santé du système
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (totalUsers > 1000 && activeUsers > 500) {
      systemHealth = 'excellent';
    } else if (totalUsers < 100 || activeUsers < 50) {
      systemHealth = 'warning';
    }

    // Statistiques supplémentaires pour l'admin
    const totalForumPostsLocked = await prisma.forumPost.count({ where: { isLocked: true } });
    const totalForumPostsAll = await prisma.forumPost.count(); // Tous les posts pour la modération
    
    // Calculer les statistiques analytiques réelles
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Taux de croissance : Comparer les utilisateurs de ce mois vs mois dernier
    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: thisMonth }
      }
    });
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: thisMonth
        }
      }
    });
    const growthRate = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : usersThisMonth > 0 ? '100.0' : '0.0';
    
    // Taux d'engagement : Utilisateurs actifs aujourd'hui / total utilisateurs
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activeToday = await prisma.user.count({
      where: {
        updatedAt: { gte: today }
      }
    });
    const engagementRate = totalUsers > 0 
      ? ((activeToday / totalUsers) * 100).toFixed(1)
      : '0.0';
    
    // Temps moyen par session (estimation basée sur les sessions complétées)
    const sessionsWithDuration = await prisma.tutorSession.findMany({
      where: { status: 'COMPLETED' },
      select: { duration: true }
    });
    let avgSessionDuration = 0;
    if (sessionsWithDuration.length > 0) {
      const totalSeconds = sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0);
      avgSessionDuration = Math.round(totalSeconds / sessionsWithDuration.length / 60); // Convertir en minutes
    }
    // Si pas de sessions, estimer à partir des conversations (30 min par conversation active)
    if (avgSessionDuration === 0 && totalSessions === 0) {
      const activeConversations = await prisma.conversation.count({
        where: {
          lastMessageAt: { gte: lastWeek }
        }
      });
      avgSessionDuration = activeConversations > 0 ? 30 : 0; // Estimation: 30 min par conversation active
    }
    
    // Vues totales cette semaine (estimation basée sur les messages et posts)
    const [directMessagesThisWeek, groupMessagesThisWeek, postsThisWeek] = await Promise.all([
      prisma.directMessage.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.groupMessage.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.forumPost.count({
        where: { 
          createdAt: { gte: lastWeek },
          isLocked: false
        }
      })
    ]);
    const totalViews = directMessagesThisWeek + groupMessagesThisWeek + postsThisWeek * 10; // Estimer ~10 vues par post

    const response = {
      totalUsers,
      activeUsers,
      totalTutors,
      verifiedTutors,
      totalMessages: totalDirectMessages + totalGroupMessages,
      totalSessions,
      revenue,
      systemHealth,
      breakdown: {
        students: totalStudents,
        tutors: totalTutors,
        admins: totalAdmins,
        flashcards: totalFlashcards,
        forumPosts: totalForumPosts // Ceci compte uniquement les posts non verrouillés (comme dans le forum public)
      },
      // Statistiques supplémentaires pour l'admin
      totalForumPostsLocked,
      totalForumPostsAll, // Tous les posts (y compris verrouillés) pour la modération
      // Statistiques analytiques réelles
      analytics: {
        growthRate: `${growthRate}%`,
        engagementRate: `${engagementRate}%`,
        avgSessionDuration: `${avgSessionDuration} min`,
        totalViewsThisWeek: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString(),
        usersThisMonth,
        usersLastMonth,
        activeToday
      }
    };
    
    console.log('📊 Statistiques admin calculées:', {
      growthRate: response.analytics.growthRate,
      engagementRate: response.analytics.engagementRate,
      avgSessionDuration: response.analytics.avgSessionDuration,
      totalViewsThisWeek: response.analytics.totalViewsThisWeek,
      usersThisMonth: response.analytics.usersThisMonth,
      usersLastMonth: response.analytics.usersLastMonth,
      activeToday: response.analytics.activeToday
    });
    
    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// GET - Posts du forum pour admin (modération)
app.get('/api/admin/forum-posts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { 
            id: true,
            email: true,
            firstName: true, 
            lastName: true, 
            role: true, 
            profilePhoto: true
          }
        },
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        },
        likes: { select: { id: true, userId: true } }
      }
    });

    const mappedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        name: `${post.author.firstName} ${post.author.lastName}`,
        email: post.author.email || '',
        role: post.author.role,
        profilePhoto: post.author.profilePhoto
      },
      subject: post.subject?.name || 'Général',
      createdAt: post.createdAt.toISOString(),
      status: post.isLocked ? 'rejected' : 'approved',
      likes: post._count.likes,
      replies: post._count.replies,
      reports: 0,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      subjectId: post.subject?.id
    }));

    res.json(mappedPosts);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts du forum:', error);
    res.status(500).json({ error: 'Échec de la récupération des posts' });
  }
});

// POST - Modération de post (admin)
app.post('/api/admin/moderate-post/:postId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { postId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    let updatedPost;
    switch (action) {
      case 'approve':
        updatedPost = await prisma.forumPost.update({
          where: { id: parseInt(postId) },
          data: { isLocked: false, isPinned: false }
        });
        break;
      case 'reject':
        updatedPost = await prisma.forumPost.update({
          where: { id: parseInt(postId) },
          data: { isLocked: true }
        });
        break;
      case 'delete':
        await prisma.forumPost.delete({
          where: { id: parseInt(postId) }
        });
        return res.json({ message: 'Post supprimé avec succès' });
      case 'pin':
        updatedPost = await prisma.forumPost.update({
          where: { id: parseInt(postId) },
          data: { isPinned: true }
        });
        break;
      default:
        return res.status(400).json({ error: 'Action non valide' });
    }

    res.json({ 
      message: `Post ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'épinglé'} avec succès`,
      post: updatedPost
    });
  } catch (error) {
    console.error('Erreur lors de la modération du post:', error);
    res.status(500).json({ error: 'Échec de la modération du post' });
  }
});

// GET - Récupérer un post spécifique pour modération
app.get('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { postId } = req.params;
    
    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(postId) },
      include: {
        author: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true, 
            profilePhoto: true,
            email: true
          }
        },
        subject: {
          select: { id: true, name: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        images: true,
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    res.json(post);
  } catch (error) {
    console.error('Erreur lors de la récupération du post:', error);
    res.status(500).json({ error: 'Échec de la récupération du post' });
  }
});

// PUT - Mettre à jour un post (admin)
app.put('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { postId } = req.params;
    const { title, content, isPinned, isLocked, subjectId } = req.body;

    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id: parseInt(postId) },
      data: {
        title: title || post.title,
        content: content || post.content,
        isPinned: isPinned !== undefined ? isPinned : post.isPinned,
        isLocked: isLocked !== undefined ? isLocked : post.isLocked,
        subjectId: subjectId ? parseInt(subjectId) : post.subjectId,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true }
        },
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    res.json({
      message: 'Post mis à jour avec succès',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du post' });
  }
});

// DELETE - Supprimer un post (admin)
app.delete('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(postId) },
      include: {
        images: true,
        replies: {
          include: {
            images: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Supprimer les images associées
    for (const image of post.images) {
      try {
        if (fs.existsSync(image.filepath)) {
          fs.unlinkSync(image.filepath);
        }
      } catch (fileError) {
        console.error('Erreur lors de la suppression de l\'image:', fileError);
      }
    }

    // Supprimer les images des réponses
    for (const reply of post.replies) {
      for (const image of reply.images) {
        try {
          if (fs.existsSync(image.filepath)) {
            fs.unlinkSync(image.filepath);
          }
        } catch (fileError) {
          console.error('Erreur lors de la suppression de l\'image:', fileError);
        }
      }
    }

    // Supprimer le post (cascade supprimera les réponses et images)
    await prisma.forumPost.delete({
      where: { id: parseInt(postId) }
    });

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({ error: 'Échec de la suppression du post' });
  }
});

// DELETE - Suppression en masse de posts (admin)
app.delete('/api/admin/forum-posts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { postIds } = req.body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'Liste d\'IDs de posts requise' });
    }

    // Récupérer les posts avec leurs images
    const posts = await prisma.forumPost.findMany({
      where: { id: { in: postIds.map(id => parseInt(id)) } },
      include: {
        images: true,
        replies: {
          include: {
            images: true
          }
        }
      }
    });

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Aucun post trouvé' });
    }

    // Supprimer les fichiers images
    let deletedFiles = 0;
    for (const post of posts) {
      for (const image of post.images) {
        try {
          if (fs.existsSync(image.filepath)) {
            fs.unlinkSync(image.filepath);
            deletedFiles++;
          }
        } catch (fileError) {
          console.error('Erreur lors de la suppression de l\'image:', fileError);
        }
      }

      for (const reply of post.replies) {
        for (const image of reply.images) {
          try {
            if (fs.existsSync(image.filepath)) {
              fs.unlinkSync(image.filepath);
              deletedFiles++;
            }
          } catch (fileError) {
            console.error('Erreur lors de la suppression de l\'image:', fileError);
          }
        }
      }
    }

    // Supprimer les posts
    const deleteResult = await prisma.forumPost.deleteMany({
      where: { id: { in: postIds.map(id => parseInt(id)) } }
    });

    res.json({
      message: `${deleteResult.count} post(s) supprimé(s) avec succès`,
      deletedCount: deleteResult.count,
      deletedFiles
    });
  } catch (error) {
    console.error('Erreur lors de la suppression en masse des posts:', error);
    res.status(500).json({ error: 'Échec de la suppression en masse des posts' });
  }
});

// GET - Activités récentes admin
app.get('/api/admin/activities', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const activities = [];

    // Récupérer les dernières inscriptions
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_action',
        action: 'Nouvel utilisateur inscrit',
        user: `${user.firstName} ${user.lastName}`,
        details: `Inscription en tant que ${user.role}`,
        timestamp: user.createdAt,
        severity: 'low'
      });
    });

    // Récupérer les derniers messages du forum
    const recentPosts = await prisma.forumPost.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });

    recentPosts.forEach(post => {
      activities.push({
        id: `post_${post.id}`,
        type: 'moderation',
        action: 'Nouveau post du forum',
        user: `${post.author.firstName} ${post.author.lastName}`,
        details: post.title,
        timestamp: post.createdAt,
        severity: 'low'
      });
    });

    // Récupérer les dernières sessions de tutorat
    const recentSessions = await prisma.tutorSession.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        },
        tutor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, profilePhoto: true }
            }
          }
        }
      }
    });

    recentSessions.forEach(session => {
      activities.push({
        id: `session_${session.id}`,
        type: 'system_event',
        action: 'Nouvelle session de tutorat',
        user: `${session.student.firstName} ${session.student.lastName}`,
        details: `Session avec ${session.tutor.user.firstName} ${session.tutor.user.lastName}`,
        timestamp: session.createdAt,
        severity: 'medium'
      });
    });

    // Trier par timestamp décroissant
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities.slice(0, 10)); // Retourner les 10 plus récentes
  } catch (error) {
    console.error('Erreur lors de la récupération des activités admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des activités' });
  }
});

// GET - Tous les utilisateurs (admin)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    console.log('📊 Admin: Récupération de TOUS les utilisateurs de la base de données...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Admin: ${users.length} utilisateurs trouvés dans la base de données`);
    console.log('🔍 Détails des utilisateurs:', users.map(u => ({
      id: u.id,
      email: u.email,
      nom: `${u.firstName} ${u.lastName}`,
      role: u.role
    })));

    res.json(users);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

// GET - Utilisateur individuel (admin)
app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la récupération de l\'utilisateur' });
  }
});

// GET - Tous les tuteurs avec détails (admin)
app.get('/api/admin/tutors', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    console.log('📚 Admin: Récupération de tous les tuteurs...');
    
    // Créer les entrées tutors manquantes pour tous les utilisateurs TUTOR
    const tutorUsers = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      include: { tutor: true }
    });
    
    for (const tutorUser of tutorUsers) {
      if (!tutorUser.tutor) {
        console.log(`📝 Admin: Création automatique de l'entrée tutors pour ${tutorUser.email}`);
        await prisma.tutor.create({
          data: {
            userId: tutorUser.id,
            experience: 0,
            rating: 0,
            isOnline: false,
            isAvailable: true
          }
        });
      }
    }
    
    const tutors = await prisma.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true,
            profilePhoto: true,
            createdAt: true
          }
        },
        tutorSubjects: {
          include: {
            subject: {
              select: { id: true, name: true, level: true, section: true }
            }
          }
        },
        _count: {
          select: {
            sessions: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrer les tuteurs avec N/A dans firstName ou lastName
    const filteredTutors = tutors.filter(tutor => 
      tutor.user.firstName !== 'N/A' && tutor.user.lastName !== 'N/A'
    );

    console.log(`✅ Admin: ${filteredTutors.length} tuteurs trouvés (${tutors.length - filteredTutors.length} avec N/A filtrés)`);
    res.json(filteredTutors);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tuteurs admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des tuteurs' });
  }
});


// PUT - Mettre à jour le rôle d'un utilisateur (admin)
app.put('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'TUTOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Rôle utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du rôle' });
  }
});

// DELETE - Supprimer un utilisateur (admin)
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    const targetUserId = parseInt(userId);

    // Empêcher l'admin de se supprimer lui-même
    if (targetUserId === adminId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.$transaction(async (tx) => {
      // Supprimer les entités dépendantes pour respecter les contraintes FK
      await tx.forumLike.deleteMany({ where: { userId: targetUserId } });
      await tx.forumImage.deleteMany({ where: { uploadedBy: targetUserId } });
      await tx.forumReply.deleteMany({ where: { authorId: targetUserId } });
      await tx.forumPost.deleteMany({ where: { authorId: targetUserId } });

      await tx.groupMessage.deleteMany({ where: { userId: targetUserId } });
      await tx.groupMember.deleteMany({ where: { userId: targetUserId } });
      await tx.studyGroup.deleteMany({ where: { creatorId: targetUserId } });

      await tx.knowledgeTestResult.deleteMany({ where: { userId: targetUserId } });
      await tx.flashcardAttempt.deleteMany({ where: { userId: targetUserId } as any });
      await tx.flashcard.deleteMany({ where: { userId: targetUserId } });

      await tx.message.deleteMany({ where: { OR: [{ senderId: targetUserId }, { receiverId: targetUserId }] } });
      await tx.tutorSession.deleteMany({ where: { OR: [{ studentId: targetUserId }, { tutorId: targetUserId }] } });
      await tx.tutor.deleteMany({ where: { userId: targetUserId } });

      // Enfin, supprimer l'utilisateur
      await tx.user.delete({ where: { id: targetUserId } });
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la suppression de l\'utilisateur' });
  }
});

// POST - Créer un nouvel utilisateur (admin)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { email, password, firstName, lastName, role, userClass, section, department, phone, address } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, mot de passe, prénom et nom sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'STUDENT',
        userClass: userClass || null,
        section: section || null,
        department: department || null,
        phone: phone || null,
        address: address || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Si c'est un tuteur, créer automatiquement l'entrée dans la table tutors
    if (user.role === 'TUTOR') {
      console.log(`📝 Création automatique de l'entrée tutors pour ${user.email}`);
      try {
        await prisma.tutor.create({
          data: {
            userId: user.id,
            experience: 0,
            rating: 0,
            isOnline: false,
            isAvailable: true
          }
        });
        console.log(`✅ Entrée tutors créée pour ${user.email}`);
      } catch (tutorError: any) {
        // Si l'entrée existe déjà, ignorer l'erreur
        if (tutorError.code !== 'P2002') {
          console.error('⚠️ Erreur lors de la création de l\'entrée tutors:', tutorError);
        }
      }
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la création de l\'utilisateur' });
  }
});

// ===== ENDPOINTS POUR LES STATISTIQUES ÉTUDIANT =====

// GET - Récupérer les statistiques d'un étudiant
app.get('/api/students/:studentId/stats', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    if (isDemoMode && !req.user.demoMode) {
      console.log('🔵 Mode démo détecté par fallback dans /api/students/:id/stats');
      req.user.demoMode = true;
      req.user.userId = 1;
      req.user.id = 1;
    }
    
    // Normaliser currentUserId pour comparaison (gérer string/number/email)
    const currentUserIdRaw = req.user.userId || req.user.id;
    let currentUserId: number;
    
    // Si c'est un nombre, l'utiliser directement
    if (typeof currentUserIdRaw === 'number') {
      currentUserId = currentUserIdRaw;
    } 
    // Si c'est une string qui est un nombre, le parser
    else if (typeof currentUserIdRaw === 'string' && !isNaN(parseInt(currentUserIdRaw))) {
      currentUserId = parseInt(currentUserIdRaw);
    }
    // Si c'est un email (mode démo ou token avec email)
    else if (typeof currentUserIdRaw === 'string' && currentUserIdRaw.includes('@')) {
      // En mode démo, utiliser l'ID 1
      if (req.user.demoMode) {
        currentUserId = 1;
      } else {
        // Chercher l'utilisateur par email pour obtenir son ID
        if (prisma) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: currentUserIdRaw },
              select: { id: true }
            });
            if (dbUser) {
              currentUserId = dbUser.id;
            } else {
              // Si l'utilisateur n'existe pas en DB mais qu'on a un token valide, autoriser en mode démo
              currentUserId = 1;
            }
          } catch (err) {
            console.error('❌ Erreur recherche utilisateur par email:', err);
            currentUserId = 1; // Fallback vers mode démo
          }
        } else {
          currentUserId = 1; // Pas de DB, mode démo
        }
      }
    }
    // Fallback: utiliser 1 si on ne peut pas déterminer
    else {
      console.warn(`⚠️ Impossible de déterminer currentUserId depuis: ${currentUserIdRaw}`);
      currentUserId = req.user.demoMode ? 1 : 1; // Fallback
    }

    console.log(`🔍 /api/students/:id/stats DEBUG: studentId=${studentId}, currentUserId=${currentUserId}, currentUserIdRaw=${currentUserIdRaw}, role=${req.user.role}, demoMode=${req.user.demoMode}`);

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID étudiant invalide' });
    }

    // En mode démo, toujours autoriser l'accès et retourner des stats par défaut
    if (req.user.demoMode || isDemoMode) {
      console.log('🔵 /api/students/:id/stats: Mode démo activé, retourne stats par défaut (sans vérification d\'ID)');
      return res.json({
        flashcardsCompleted: 0,
        studyStreak: 0,
        averageScore: 0,
        timeSpent: '0h 0m',
        totalSubjects: 8,
        completedLessons: 0,
        upcomingTests: 0,
        achievements: 0
      });
    }

    // Vérifier que l'utilisateur peut accéder à ces données
    // Permettre l'accès si:
    // - L'utilisateur accède à ses propres stats (STUDENT)
    // - L'utilisateur est ADMIN
    // - L'utilisateur est TUTOR (peut voir les stats de ses étudiants)
    // - Les IDs correspondent
    const idsMatch = studentId === currentUserId;
    
    if (!idsMatch && req.user.role !== 'ADMIN' && req.user.role !== 'TUTOR') {
      console.log(`❌ Accès refusé: studentId=${studentId}, currentUserId=${currentUserId}, role=${req.user.role}, demoMode=${req.user.demoMode}`);
      return res.status(403).json({ error: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres statistiques.' });
    }

    // Autoriser l'accès
    if (idsMatch) {
      console.log(`✅ Étudiant ${currentUserId} accède à ses propres stats`);
    } else if (req.user.role === 'ADMIN') {
      console.log(`✅ Admin accède aux stats de l'utilisateur ${studentId}`);
    } else if (req.user.role === 'TUTOR') {
      console.log(`✅ Tuteur accède aux stats de l'utilisateur ${studentId}`);
    }
    
    console.log(`✅ /api/students/:id/stats: Accès autorisé - studentId=${studentId}, currentUserId=${currentUserId}, role=${req.user.role}, demoMode=${req.user.demoMode}`);

    // Si Prisma n'est pas disponible, retourner des stats par défaut
    if (!prisma) {
      console.log('⚠️ /api/students/:id/stats: Prisma non disponible, retourne stats par défaut');
      return res.json({
        flashcardsCompleted: 0,
        studyStreak: 0,
        averageScore: 0,
        timeSpent: '0h 0m',
        totalSubjects: 8,
        completedLessons: 0,
        upcomingTests: 0,
        achievements: 0
      });
    }

    // Vérifier que l'utilisateur existe (peut être STUDENT, TUTOR, ou ADMIN)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, userClass: true, section: true, role: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les statistiques depuis la base de données
    const stats = await prisma.studentStats.findUnique({
      where: { studentId }
    });

    // Si pas de stats, créer des stats par défaut (seulement pour STUDENT)
    if (!stats) {
      // Créer les stats uniquement si l'utilisateur est un STUDENT
      if (student.role === 'STUDENT') {
      const defaultStats = await prisma.studentStats.create({
        data: {
          studentId,
          flashcardsCompleted: 0,
          studyStreak: 0,
          averageScore: 0,
          timeSpentMinutes: 0,
          totalSubjects: student.userClass === '9ème' ? 5 : 8,
          completedLessons: 0,
          upcomingTests: 0,
          achievements: 0
        }
      });

      return res.json({
        flashcardsCompleted: defaultStats.flashcardsCompleted,
        studyStreak: defaultStats.studyStreak,
        averageScore: defaultStats.averageScore,
        timeSpent: formatTimeSpent(defaultStats.timeSpentMinutes),
        totalSubjects: defaultStats.totalSubjects,
        completedLessons: defaultStats.completedLessons,
        upcomingTests: defaultStats.upcomingTests,
        achievements: defaultStats.achievements
      });
      } else {
        // Pour TUTOR ou ADMIN, retourner des stats par défaut sans créer en DB
        return res.json({
          flashcardsCompleted: 0,
          studyStreak: 0,
          averageScore: 0,
          timeSpent: '0h 0m',
          totalSubjects: 0,
          completedLessons: 0,
          upcomingTests: 0,
          achievements: 0
        });
      }
    }

    // Formater le temps passé
    const timeSpent = formatTimeSpent(stats.timeSpentMinutes);

    res.json({
      flashcardsCompleted: stats.flashcardsCompleted,
      studyStreak: stats.studyStreak,
      averageScore: stats.averageScore,
      timeSpent,
      totalSubjects: stats.totalSubjects,
      completedLessons: stats.completedLessons,
      upcomingTests: stats.upcomingTests,
      achievements: stats.achievements
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques étudiant:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// GET - Récupérer la progression des matières d'un étudiant
app.get('/api/students/:studentId/subjects/progress', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    // Normaliser currentUserId pour comparaison (gérer string/number)
    const currentUserIdRaw = req.user.userId || req.user.id;
    const currentUserId = typeof currentUserIdRaw === 'string' ? parseInt(currentUserIdRaw) : currentUserIdRaw;

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID étudiant invalide' });
    }

    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner une progression vide
    if ((req.user.demoMode || isDemoMode) && studentId === 1) {
      console.log('🔵 /api/students/:id/subjects/progress: Mode démo activé, retourne []');
      return res.json([]);
    }

    // Vérifier que l'utilisateur peut accéder à ces données
    // Permettre l'accès si l'utilisateur accède à ses propres données ou est ADMIN/TUTOR
    if (studentId !== currentUserId) {
      if (req.user.role === 'ADMIN' || req.user.role === 'TUTOR') {
        console.log(`✅ ${req.user.role} accède à la progression de l'utilisateur ${studentId}`);
      } else {
        console.log(`❌ Accès refusé: studentId=${studentId}, currentUserId=${currentUserId}, role=${req.user.role}`);
        return res.status(403).json({ error: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.' });
      }
    }

    if (!prisma) {
      console.log('⚠️ /api/students/:id/subjects/progress: Prisma non disponible, retourne []');
      return res.json([]);
    }

    // Récupérer l'utilisateur pour connaître sa classe (peut être STUDENT, TUTOR, ou ADMIN)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { userClass: true, section: true, role: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les matières accessibles à l'étudiant
    const subjects = await prisma.subject.findMany({
      where: {
        level: student.userClass,
        OR: [
          { section: null }, // Matières générales
          { section: student.section } // Matières de la section
        ]
      },
      include: {
        subjectProgress: {
          where: { studentId }
        }
      }
    });

    // Formater les données de progression
    const subjectProgress = subjects.map(subject => {
      const progress = subject.subjectProgress[0];
      const completedLessons = progress?.completedLessons || 0;
      const totalLessons = subject.totalLessons || 0;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        name: subject.name,
        progress: progressPercentage,
        totalLessons,
        completedLessons,
        nextLesson: progress?.nextLesson || null,
        difficulty: subject.difficulty || 'moyen',
        color: getSubjectColor(subject.name)
      };
    });

    res.json(subjectProgress);

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération de la progression' });
  }
});

// GET - Récupérer l'activité récente d'un étudiant
app.get('/api/students/:studentId/recent-activity', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    // Normaliser currentUserId pour comparaison (gérer string/number)
    const currentUserIdRaw = req.user.userId || req.user.id;
    const currentUserId = typeof currentUserIdRaw === 'string' ? parseInt(currentUserIdRaw) : currentUserIdRaw;

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID étudiant invalide' });
    }

    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner une activité vide
    if ((req.user.demoMode || isDemoMode) && studentId === 1) {
      console.log('🔵 /api/students/:id/recent-activity: Mode démo activé, retourne []');
      return res.json([]);
    }

    // Vérifier que l'utilisateur peut accéder à ces données
    // Permettre l'accès si l'utilisateur accède à ses propres données ou est ADMIN/TUTOR
    if (studentId !== currentUserId) {
      if (req.user.role === 'ADMIN' || req.user.role === 'TUTOR') {
        console.log(`✅ ${req.user.role} accède à la progression de l'utilisateur ${studentId}`);
      } else {
        console.log(`❌ Accès refusé: studentId=${studentId}, currentUserId=${currentUserId}, role=${req.user.role}`);
        return res.status(403).json({ error: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.' });
      }
    }

    if (!prisma) {
      console.log('⚠️ /api/students/:id/recent-activity: Prisma non disponible, retourne []');
      return res.json([]);
    }

    // Récupérer l'activité récente depuis la base de données
    const activities = await prisma.studentActivity.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        subject: {
          select: { name: true }
        }
      }
    });

    // Formater les activités
    const recentActivity = activities.map(activity => ({
      id: activity.id.toString(),
      type: activity.type,
      title: activity.title,
      subject: activity.subject?.name || 'Général',
      time: formatTimeAgo(activity.createdAt),
      score: activity.score,
      color: getActivityColor(activity.type)
    }));

    res.json(recentActivity);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité récente:', error);
    res.status(500).json({ error: 'Échec de la récupération de l\'activité' });
  }
});

// PUT - Mettre à jour les statistiques d'un étudiant
app.put('/api/students/:studentId/stats', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const currentUserId = req.user.userId;

    // Vérifier que l'utilisateur peut modifier ces données
    if (studentId !== currentUserId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID étudiant invalide' });
    }

    const { flashcardsCompleted, studyStreak, averageScore, timeSpentMinutes, completedLessons, upcomingTests, achievements } = req.body;

    // Mettre à jour ou créer les statistiques
    const stats = await prisma.studentStats.upsert({
      where: { studentId },
      update: {
        flashcardsCompleted: flashcardsCompleted !== undefined ? flashcardsCompleted : undefined,
        studyStreak: studyStreak !== undefined ? studyStreak : undefined,
        averageScore: averageScore !== undefined ? averageScore : undefined,
        timeSpentMinutes: timeSpentMinutes !== undefined ? timeSpentMinutes : undefined,
        completedLessons: completedLessons !== undefined ? completedLessons : undefined,
        upcomingTests: upcomingTests !== undefined ? upcomingTests : undefined,
        achievements: achievements !== undefined ? achievements : undefined
      },
      create: {
        studentId,
        flashcardsCompleted: flashcardsCompleted || 0,
        studyStreak: studyStreak || 0,
        averageScore: averageScore || 0,
        timeSpentMinutes: timeSpentMinutes || 0,
        totalSubjects: 0, // Sera calculé automatiquement
        completedLessons: completedLessons || 0,
        upcomingTests: upcomingTests || 0,
        achievements: achievements || 0
      }
    });

    res.json({
      message: 'Statistiques mises à jour avec succès',
      stats: {
        flashcardsCompleted: stats.flashcardsCompleted,
        studyStreak: stats.studyStreak,
        averageScore: stats.averageScore,
        timeSpent: formatTimeSpent(stats.timeSpentMinutes),
        totalSubjects: stats.totalSubjects,
        completedLessons: stats.completedLessons,
        upcomingTests: stats.upcomingTests,
        achievements: stats.achievements
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    res.status(500).json({ error: 'Échec de la mise à jour des statistiques' });
  }
});

// POST - Enregistrer une nouvelle activité d'étudiant
app.post('/api/students/:studentId/activity', authenticateToken, async (req: any, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const currentUserId = req.user.userId;

    // Vérifier que l'utilisateur peut enregistrer cette activité
    if (studentId !== currentUserId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID étudiant invalide' });
    }

    const { type, title, subjectId, score } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type et titre sont requis' });
    }

    // Créer l'activité
    const activity = await prisma.studentActivity.create({
      data: {
        studentId,
        type,
        title,
        subjectId: subjectId || null,
        score: score || null
      },
      include: {
        subject: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      message: 'Activité enregistrée avec succès',
      activity: {
        id: activity.id.toString(),
        type: activity.type,
        title: activity.title,
        subject: activity.subject?.name || 'Général',
        time: formatTimeAgo(activity.createdAt),
        score: activity.score,
        color: getActivityColor(activity.type)
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    res.status(500).json({ error: 'Échec de l\'enregistrement de l\'activité' });
  }
});

// Fonctions utilitaires
function formatTimeSpent(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes}min`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Il y a ${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `Il y a ${days}j`;
  }
}

function getSubjectColor(subjectName: string): string {
  const colors = {
    'Mathématiques': 'bg-blue-500',
    'Français': 'bg-green-500',
    'Sciences': 'bg-purple-500',
    'Histoire-Géo': 'bg-orange-500',
    'Anglais': 'bg-pink-500',
    'Physique': 'bg-red-500',
    'Chimie': 'bg-green-500',
    'Informatique': 'bg-purple-500'
  };
  return colors[subjectName] || 'bg-gray-500';
}

function getActivityColor(type: string): string {
  const colors = {
    'flashcard': 'text-blue-600',
    'test': 'text-red-600',
    'achievement': 'text-yellow-600',
    'lesson': 'text-green-600'
  };
  return colors[type] || 'text-gray-600';
}

// PUT - Mettre à jour un utilisateur (admin)
app.put('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { email, firstName, lastName, role, userClass, section, department, phone, address } = req.body;

    // Validation classe/section (synchronisée avec classConfig.ts)
    const allowedClasses = ['9ème', 'Terminale'];
    const allowedSectionsByClass: Record<string, string[]> = {
      '9ème': [], // 9ème n'a pas de sections spécifiques
      'Terminale': ['SMP', 'SVT', 'SES', 'LLA']
    };

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom sont requis' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: parseInt(userId) }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur' });
      }
    }

    if (userClass && !allowedClasses.includes(userClass)) {
      return res.status(400).json({ error: `Classe invalide. Valeurs autorisées: ${allowedClasses.join(', ')}` });
    }
    
    // Validation de la section
    if (section) {
      const current = await prisma.user.findUnique({ where: { id: parseInt(userId) }, select: { userClass: true } });
      const cls = userClass || current?.userClass || '';
      const allowed = allowedSectionsByClass[cls] || [];
      
      // Pour 9ème, aucune section n'est autorisée
      if (cls === '9ème' && section) {
        return res.status(400).json({ error: 'La classe 9ème n\'a pas de sections spécifiques. Laissez le champ section vide.' });
      }
      
      // Pour Terminale, vérifier que la section est valide
      if (cls === 'Terminale' && !allowed.includes(section)) {
        return res.status(400).json({ error: `Section invalide pour Terminale. Valeurs autorisées: ${allowed.join(', ')}` });
      }
    }
    
    // Si classe est Terminale et pas de section, c'est une erreur
    if (userClass === 'Terminale' && !section) {
      return res.status(400).json({ error: 'Une section est requise pour la classe Terminale (SMP, SVT, SES ou LLA)' });
    }

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
      data: {
        email: email || undefined,
        firstName,
        lastName,
        role: role || undefined,
        userClass: userClass || null,
        section: section || null,
        department: department || null,
        phone: phone || null,
        address: address || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de l\'utilisateur' });
  }
});

// PUT - Changer le mot de passe d'un utilisateur (admin)
app.put('/api/admin/users/:userId/password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: parseInt(userId) },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ error: 'Échec du changement de mot de passe' });
  }
});

// ===== ROUTES CRUD UTILISATEURS (pour les utilisateurs connectés) =====

// GET - Récupérer les flashcards de l'utilisateur connecté
app.get('/api/user/flashcards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { userId: userId };
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        include: {
          subject: {
            select: { name: true, level: true }
          },
          _count: {
            select: { attempts: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.flashcard.count({ where })
    ]);

    res.json({
      flashcards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards utilisateur:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// GET - Récupérer les statistiques de l'utilisateur connecté
app.get('/api/user/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Récupérer l'utilisateur pour connaître sa classe et son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userClass: true, section: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les statistiques des flashcards
    const [totalFlashcards, totalAttempts, correctAttempts] = await Promise.all([
      prisma.flashcard.count({ where: { userId: userId } }),
      prisma.flashcardAttempt.count({ where: { userId: userId } }),
      prisma.flashcardAttempt.count({ 
        where: { 
          userId: userId,
          isCorrect: true 
        } 
      })
    ]);

    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    // Récupérer les statistiques par matière
    const subjectStats = await prisma.flashcard.groupBy({
      by: ['subjectId'],
      where: { userId: userId },
      _count: { id: true }
    });

    const enrichedSubjectStats = await Promise.all(
      subjectStats.map(async (stat) => {
        const subject = await prisma.subject.findUnique({
          where: { id: stat.subjectId },
          select: { name: true, level: true }
        });

        const attempts = await prisma.flashcardAttempt.findMany({
          where: {
            userId: userId,
            flashcard: {
              subjectId: stat.subjectId
            }
          }
        });

        const correctAttempts = attempts.filter(a => a.isCorrect).length;
        const accuracy = attempts.length > 0 ? (correctAttempts / attempts.length) * 100 : 0;

        return {
          subjectId: stat.subjectId,
          subjectName: subject?.name || 'Inconnu',
          level: subject?.level || 'Inconnu',
          totalFlashcards: stat._count.id,
          totalAttempts: attempts.length,
          correctAttempts: correctAttempts,
          accuracy: Math.round(accuracy * 100) / 100
        };
      })
    );

    res.json({
      user: {
        id: userId,
        userClass: user.userClass,
        section: user.section,
        role: user.role
      },
      stats: {
        totalFlashcards,
        totalAttempts,
        correctAttempts,
        accuracy: Math.round(accuracy * 100) / 100
      },
      subjectStats: enrichedSubjectStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// GET - Récupérer les tentatives de flashcards de l'utilisateur
app.get('/api/user/attempts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { userId: userId };
    if (subjectId) {
      where.flashcard = {
        subjectId: parseInt(subjectId)
      };
    }

    const [attempts, total] = await Promise.all([
      prisma.flashcardAttempt.findMany({
        where,
        include: {
          flashcard: {
            include: {
              subject: {
                select: { name: true, level: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.flashcardAttempt.count({ where })
    ]);

    res.json({
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives:', error);
    res.status(500).json({ error: 'Échec de la récupération des tentatives' });
  }
});

// ===== ROUTES CRUD TUTEURS =====

// POST - Créer un profil tuteur (admin)
app.post('/api/admin/tutors', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { userId, experience, hourlyRate, bio, subjectIds } = req.body;

    if (!userId || experience === undefined) {
      return res.status(400).json({ error: 'ID utilisateur et expérience sont requis' });
    }

    // Vérifier que l'utilisateur existe et est un tuteur
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.role !== 'TUTOR') {
      return res.status(400).json({ error: 'L\'utilisateur doit avoir le rôle TUTOR' });
    }

    // Créer ou mettre à jour le profil tuteur
    const tutor = await prisma.tutor.upsert({
      where: { userId: parseInt(userId) },
      update: {
        experience: parseInt(experience),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        bio: bio || null,
        rating: 0,
        isOnline: false
      },
      create: {
        userId: parseInt(userId),
        experience: parseInt(experience),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        bio: bio || null,
        rating: 0,
        isOnline: false
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true
          }
        },
        tutorSubjects: {
          include: {
            subject: {
              select: { name: true, level: true }
            }
          }
        }
      }
    });

    // Ajouter les matières si spécifiées
    if (subjectIds && Array.isArray(subjectIds)) {
      await prisma.tutorSubject.createMany({
        data: subjectIds.map((subjectId: number) => ({
          tutorId: tutor.id,
          subjectId: subjectId
        })),
        skipDuplicates: true
      });
    }

    res.status(201).json({
      message: 'Profil tuteur créé/mis à jour avec succès',
      tutor
    });
  } catch (error) {
    console.error('Erreur lors de la création du profil tuteur:', error);
    res.status(500).json({ error: 'Échec de la création du profil tuteur' });
  }
});

// PUT - Mettre à jour un tuteur (admin)
app.put('/api/admin/tutors/:tutorId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { tutorId } = req.params;
    const { experience, hourlyRate, bio, rating, isOnline, subjectIds } = req.body;

    const updatedTutor = await prisma.tutor.update({
      where: { id: parseInt(tutorId) },
      data: {
        experience: experience ? parseInt(experience) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        bio: bio || undefined,
        rating: rating ? parseFloat(rating) : undefined,
        isOnline: isOnline !== undefined ? Boolean(isOnline) : undefined,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true
          }
        },
        tutorSubjects: {
          include: {
            subject: {
              select: { name: true, level: true }
            }
          }
        }
      }
    });

    // Mettre à jour les matières si spécifiées
    if (subjectIds && Array.isArray(subjectIds)) {
      // Supprimer les anciennes matières
      await prisma.tutorSubject.deleteMany({
        where: { tutorId: parseInt(tutorId) }
      });

      // Ajouter les nouvelles matières
      await prisma.tutorSubject.createMany({
        data: subjectIds.map((subjectId: number) => ({
          tutorId: parseInt(tutorId),
          subjectId: subjectId
        }))
      });
    }

    res.json({
      message: 'Tuteur mis à jour avec succès',
      tutor: updatedTutor
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du tuteur:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du tuteur' });
  }
});

// DELETE - Supprimer un tuteur (admin)
app.delete('/api/admin/tutors/:tutorId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { tutorId } = req.params;

    await prisma.tutor.delete({
      where: { id: parseInt(tutorId) }
    });

    res.json({ message: 'Tuteur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du tuteur:', error);
    res.status(500).json({ error: 'Échec de la suppression du tuteur' });
  }
});

// ===== ROUTES CRUD FORUM =====


// ===== ROUTES CRUD MATIÈRES =====

// GET - Toutes les matières (admin)
app.get('/api/admin/subjects', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            flashcards: true,
            forumPosts: true,
            tutors: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Retourner dans un format compatible avec le frontend (tableau direct pour AdminSubjects)
    res.json(subjects);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération des matières' });
  }
});

// POST - Créer une nouvelle flashcard (admin)

// POST - Créer une nouvelle matière (admin)
app.post('/api/admin/subjects', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { name, level, description } = req.body;

    if (!name || !level) {
      return res.status(400).json({ error: 'Nom et niveau sont requis' });
    }

    // Vérifier si la matière existe déjà
    const existingSubject = await prisma.subject.findUnique({
      where: { name }
    });

    if (existingSubject) {
      return res.status(400).json({ error: 'Une matière avec ce nom existe déjà' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        level,
        description: description || null
      }
    });

    res.status(201).json({
      message: 'Matière créée avec succès',
      subject
    });
  } catch (error) {
    console.error('Erreur lors de la création de la matière:', error);
    res.status(500).json({ error: 'Échec de la création de la matière' });
  }
});

// PUT - Mettre à jour une matière (admin)
app.put('/api/admin/subjects/:subjectId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { subjectId } = req.params;
    const { name, level, description } = req.body;

    if (!name || !level) {
      return res.status(400).json({ error: 'Nom et niveau sont requis' });
    }

    // Vérifier si le nom est déjà utilisé par une autre matière
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name,
        NOT: { id: parseInt(subjectId) }
      }
    });

    if (existingSubject) {
      return res.status(400).json({ error: 'Une matière avec ce nom existe déjà' });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: parseInt(subjectId) },
      data: {
        name,
        level,
        description: description || null
      }
    });

    res.json({
      message: 'Matière mise à jour avec succès',
      subject: updatedSubject
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la matière:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la matière' });
  }
});

// DELETE - Supprimer une matière (admin)
app.delete('/api/admin/subjects/:subjectId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { subjectId } = req.params;

    // Vérifier s'il y a des flashcards ou posts liés
    const [flashcardsCount, postsCount] = await Promise.all([
      prisma.flashcard.count({ where: { subjectId: parseInt(subjectId) } }),
      prisma.forumPost.count({ where: { subjectId: parseInt(subjectId) } })
    ]);

    if (flashcardsCount > 0 || postsCount > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer cette matière. Elle contient ${flashcardsCount} flashcards et ${postsCount} posts du forum.` 
      });
    }

    await prisma.subject.delete({
      where: { id: parseInt(subjectId) }
    });

    res.json({ message: 'Matière supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la matière:', error);
    res.status(500).json({ error: 'Échec de la suppression de la matière' });
  }
});

// ===== ROUTES CRUD FLASHCARDS =====

// GET - Toutes les flashcards (public pour tous les utilisateurs connectés)
app.get('/api/flashcards', authenticateToken, async (req: any, res) => {
  try {
    // Ne PAS bloquer les flashcards en mode démo - permettre l'accès à tous les utilisateurs connectés
    // const isDemoMode = req.user.demoMode || 
    //                    (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
    //                    (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    console.log('🔍 /api/flashcards DEBUG:', { 
      demoMode: req.user.demoMode, 
      userId: req.user.userId, 
      userIdType: typeof req.user.userId,
      originalEmail: req.user.originalEmail 
    });
    
    // Ne plus bloquer en mode démo - permettre l'accès
    // if (req.user.demoMode || isDemoMode) {
    //   console.log('🔵 /api/flashcards: Mode démo activé, retourne []');
    //   return res.json({ flashcards: [], total: 0 });
    // }
    
    console.log('🔵 /api/flashcards: Mode normal, userId =', req.user.userId);

    if (!prisma) {
      console.log('⚠️ /api/flashcards: Prisma non disponible, retourne []');
      return res.json({ flashcards: [], total: 0 });
    }

    const { subjectId, page = 1, limit = 1000 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer l'utilisateur pour connaître son niveau et sa section
    let whereClause: any = {};
    
    // Gérer les deux formats de token (userId comme email ou comme ID numérique)
    let userWhereClause;
    if (typeof req.user.userId === 'string' && req.user.userId.includes('@')) {
      userWhereClause = { email: req.user.userId };
    } else {
      userWhereClause = { id: req.user.userId };
    }
    
    const user = await prisma.user.findUnique({
      where: userWhereClause,
      select: { id: true, role: true, userClass: true, section: true }
    });
    
    if (!user) {
      console.log('⚠️ /api/flashcards: Utilisateur non trouvé');
      return res.json({ flashcards: [], total: 0, pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 } });
    }

    // Pour les admins et tuteurs, accès à toutes les flashcards
    // Pour les étudiants, filtrer selon le niveau et la section (mais être moins restrictif)
    if (user.role !== 'ADMIN' && user.role !== 'TUTOR' && user.userClass) {
      // Filtrer par niveau (classe) de l'utilisateur
      whereClause.subject = {
        level: user.userClass,
        // Pour la 9ème, toutes les matières sont accessibles (section null)
        // Pour Terminale, filtrer par section si elle existe
        ...(user.userClass === '9ème' 
          ? { section: null } // Matières générales pour 9ème
          : user.section
            ? {
                OR: [
                  { section: null }, // Matières générales
                  { section: user.section } // Matières spécifiques à la section
                ]
              }
            : { section: null } // Si pas de section, seulement les matières générales
        )
      };
    }
    // Pour ADMIN et TUTOR, pas de filtre - accès à tout
    
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }

    console.log('🔍 /api/flashcards - Filtre appliqué:', JSON.stringify(whereClause, null, 2));
    console.log('🔍 /api/flashcards - Utilisateur:', { role: user.role, userClass: user.userClass, section: user.section });

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where: whereClause,
        include: {
          subject: {
            select: { id: true, name: true, level: true, section: true }
          },
          chapter: {
            select: { id: true, name: true, subjectId: true, order: true }
          },
          user: {
            select: { firstName: true, lastName: true, profilePhoto: true }
          },
          _count: {
            select: { attempts: true }
          }
        },
        orderBy: [
          { chapter: { order: 'asc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.flashcard.count({ where: whereClause })
    ]);

    console.log('✅ /api/flashcards - Flashcards retournées:', flashcards.length);

    // Retourner un format standardisé avec flashcards et total
    // Le contexte peut gérer les deux formats
    res.json({
      flashcards: flashcards,
      total: total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// GET - Toutes les flashcards (admin)
app.get('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { subjectId, page = '1', limit = '1000' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = subjectId ? { subjectId: parseInt(subjectId as string) } : {};

    const flashcards = await prisma.flashcard.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        },
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });

    // Retourner un tableau direct pour compatibilité avec le frontend
    res.json(flashcards);
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

app.delete('/api/admin/flashcards/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    // Supprimer d'abord les tentatives associées
    await prisma.flashcardAttempt.deleteMany({
      where: { flashcardId: parseInt(id) }
    });

    // Puis supprimer la flashcard
    await prisma.flashcard.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Flashcard supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la suppression de la flashcard', details: error.message });
  }
});


// Test endpoint pour vérifier Prisma
app.get('/api/test-user/:id', async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        isProfilePrivate: true,
        darkMode: true
      }
    });
    
    res.json({ user });
  } catch (error) {
    console.error('Erreur test user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint pour vérifier les posts
app.get('/api/test-posts', async (req: any, res) => {
  try {
    const posts = await prisma.forumPost.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true, 
            profilePhoto: true,
            isProfilePrivate: true,
            darkMode: true
          }
        }
      }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Erreur test posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NOTIFICATIONS ENDPOINTS
// ============================================

// GET - Récupérer toutes les notifications de l'utilisateur
app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  try {
    if (!prisma) {
      console.error('❌ /api/notifications: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }

    // authenticateToken a déjà vérifié et mis req.user.userId avec l'ID de la DB
    const actualUserId = req.user.userId || req.user.id;

    if (!actualUserId || typeof actualUserId !== 'number') {
      console.error('❌ /api/notifications: userId invalide:', actualUserId);
      return res.json([]);
    }

    console.log(`📬 GET /api/notifications pour userId: ${actualUserId}`);
    
    const notifications = await prisma.notification.findMany({
      where: { userId: actualUserId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limiter à 50 notifications
    });
    
    console.log(`📬 ${notifications.length} notification(s) trouvée(s) pour userId ${actualUserId}`);
    console.log(`📬 Types de notifications:`, notifications.map((n: any) => ({ id: n.id, type: n.type, title: n.title, isRead: n.isRead })));
    
    // Transformer pour correspondre au format attendu par le frontend
    const formattedNotifications = notifications.map((notif: any) => {
      // Extraire l'ID du sender depuis le message ou le link si possible
      let sender: any = undefined;
      let relatedId: number | undefined = undefined;
      
      // Si le link contient un ID, l'extraire
      if (notif.link) {
        const linkParts = notif.link.split('/');
        const lastPart = linkParts[linkParts.length - 1];
        if (!isNaN(parseInt(lastPart))) {
          relatedId = parseInt(lastPart);
        }
      }
      
      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.isRead,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
        sender: sender,
        relatedId: relatedId,
        relatedType: notif.type.includes('POST') || notif.type.includes('FORUM') ? 'post' : 
                     notif.type.includes('GROUP') ? 'group' : 
                     notif.type.includes('MESSAGE') || notif.type.includes('TUTOR') ? 'message' : undefined
      };
    });
    
    res.json(formattedNotifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Échec de la récupération des notifications' });
  }
});

// GET - Compter les notifications non lues
app.get('/api/notifications/unread-count', authenticateToken, async (req: any, res) => {
  try {
    if (!prisma) {
      console.error('❌ /api/notifications/unread-count: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }

    // authenticateToken a déjà vérifié et mis req.user.userId avec l'ID de la DB
    const actualUserId = req.user.userId || req.user.id;

    if (!actualUserId || typeof actualUserId !== 'number') {
      console.error('❌ /api/notifications/unread-count: userId invalide:', actualUserId);
      return res.json({ count: 0 });
    }
    
    const count = await prisma.notification.count({
      where: { 
        userId: actualUserId,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ error: 'Échec du comptage des notifications' });
  }
});

// PUT - Marquer une notification comme lue
app.put('/api/notifications/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Échec du marquage de la notification' });
  }
});

// PUT - Marquer toutes les notifications comme lues
app.put('/api/notifications/mark-all-read', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ error: 'Échec du marquage des notifications' });
  }
});

// DELETE - Supprimer une notification
app.delete('/api/notifications/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ error: 'Échec de la suppression de la notification' });
  }
});

// DELETE - Supprimer toutes les notifications lues
app.delete('/api/notifications/clear-read', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    await prisma.notification.deleteMany({
      where: { 
        userId,
        isRead: true
      }
    });
    
    res.json({ message: 'Notifications lues supprimées' });
  } catch (error) {
    console.error('Erreur suppression notifications lues:', error);
    res.status(500).json({ error: 'Échec de la suppression des notifications' });
  }
});

// Helper function pour obtenir/créer le tuteur système TYALA
async function getOrCreateSystemTutor(): Promise<number | null> {
  try {
    if (!prisma) {
      console.error('❌ getOrCreateSystemTutor: Prisma non disponible');
      return null;
    }

    let tyalaUser = await prisma.user.findFirst({
      where: { email: 'system@tyala.com' },
      include: { tutor: true }
    });
    
    if (!tyalaUser) {
      tyalaUser = await prisma.user.findFirst({
        where: { firstName: 'TYALA', role: 'TUTOR' },
        include: { tutor: true }
      });
    }
    
    if (!tyalaUser) {
      try {
        console.log('📢 Création de l\'utilisateur système TYALA...');
        tyalaUser = await prisma.user.create({
          data: {
            email: 'system@tyala.com',
            firstName: 'TYALA',
            lastName: '',
            password: await bcrypt.hash('system_password_' + Date.now(), 10),
            role: 'TUTOR'
          },
          include: { tutor: true }
        });
        console.log(`✅ Utilisateur système TYALA créé: ${tyalaUser.id}`);
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
          console.log('📢 Email system@tyala.com existe déjà, récupération...');
          tyalaUser = await prisma.user.findUnique({
            where: { email: 'system@tyala.com' },
            include: { tutor: true }
          });
          if (tyalaUser && tyalaUser.firstName !== 'TYALA') {
            tyalaUser = await prisma.user.update({
              where: { id: tyalaUser.id },
              data: { firstName: 'TYALA', lastName: '' },
              include: { tutor: true }
            });
          }
        } else {
          throw error;
        }
      }
    }
    
    if (!tyalaUser) return null;
    
    if (!tyalaUser.tutor) {
      console.log('📢 Création du tuteur système TYALA...');
      const tyalaTutor = await prisma.tutor.create({
        data: {
          userId: tyalaUser.id,
          experience: 0,
          rating: 0,
          isOnline: false,
          isAvailable: false
        }
      });
      return tyalaTutor.id;
    }
    
    return tyalaUser.tutor.id;
  } catch (error: any) {
    console.error('❌ Erreur getOrCreateSystemTutor:', error);
    return null;
  }
}

// POST - Créer une notification (helper function pour utilisation interne)
async function createNotification(userId: number, type: string, title: string, message: string, link?: string) {
  try {
    // Vérifier que Prisma est disponible
    if (!prisma) {
      console.error('❌ Erreur création notification: Prisma non disponible');
      return null;
    }

    // Vérifier que userId est valide
    if (!userId || isNaN(userId) || userId <= 0) {
      console.error(`❌ Erreur création notification: userId invalide: ${userId}`);
      return null;
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error(`❌ Erreur création notification: Utilisateur ${userId} non trouvé dans la DB`);
      return null;
    }

    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title: title || 'Notification',
        message: message || '',
        link: link || null,
        isRead: false
      }
    });
    
    console.log('✅ Notification créée avec succès:', { 
      id: notification.id, 
      userId, 
      userEmail: user.email,
      type, 
      title: title.substring(0, 50),
      link 
    });
    
    return notification;
  } catch (error: any) {
    console.error('❌ Erreur création notification:', error);
    console.error('❌ Détails erreur notification:', {
      userId,
      type,
      title: title ? title.substring(0, 30) : 'N/A',
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack?.substring(0, 200)
    });
    // Ne pas bloquer l'exécution si la notification échoue
    return null;
  }
}

// Start server

// ==================== KNOWLEDGE TESTS ENDPOINTS ====================

// Get all knowledge tests for a subject
app.get('/api/knowledge-tests/:subjectId', authenticateToken, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    
    const tests = await prisma.knowledgeTest.findMany({
      where: {
        subjectId: parseInt(subjectId),
        isActive: true
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        _count: {
          select: { questions: true, results: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tests);
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    res.status(500).json({ error: 'Échec de la récupération des tests' });
  }
});

// Get a specific knowledge test with questions
app.get('/api/knowledge-tests/test/:testId', authenticateToken, async (req: any, res) => {
  try {
    const { testId } = req.params;
    
    const test = await prisma.knowledgeTest.findUnique({
      where: { id: parseInt(testId) },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            difficulty: true,
            concept: true,
            chapterId: true,
            chapter: {
              select: {
                id: true,
                name: true,
                order: true
              }
            }
          },
          orderBy: [
            { chapter: { order: 'asc' } },
            { id: 'asc' }
          ]
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test non trouvé' });
    }

    res.json(test);
  } catch (error) {
    console.error('Erreur lors de la récupération du test:', error);
    res.status(500).json({ error: 'Échec de la récupération du test' });
  }
});

// Submit knowledge test answers
app.post('/api/knowledge-tests/:testId/submit', authenticateToken, async (req: any, res) => {
  try {
    const { testId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.userId;

    // Vérifier que le test existe
    const test = await prisma.knowledgeTest.findUnique({
      where: { id: parseInt(testId) },
      include: { questions: true }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test non trouvé' });
    }

    // Calculer le score
    let correctAnswers = 0;
    const testAnswers = [];

    for (const answer of answers) {
      const question = test.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.userAnswer;
      if (isCorrect) correctAnswers++;

      testAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      });
    }

    const percentage = (correctAnswers / test.questions.length) * 100;
    const isPassed = percentage >= test.passingScore;

    // Créer le résultat du test
    const result = await prisma.knowledgeTestResult.create({
      data: {
        testId: parseInt(testId),
        userId,
        score: correctAnswers,
        percentage,
        timeSpent: timeSpent || 0,
        isPassed,
        answers: {
          create: testAnswers
        }
      },
      include: {
        test: {
          select: { title: true, passingScore: true }
        }
      }
    });

    res.json({
      result,
      summary: {
        totalQuestions: test.questions.length,
        correctAnswers,
        percentage: Math.round(percentage * 100) / 100,
        isPassed,
        timeSpent: timeSpent || 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la soumission du test:', error);
    res.status(500).json({ error: 'Échec de la soumission du test' });
  }
});

// Get user's test results
app.get('/api/knowledge-tests/results/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Vérifier que l'utilisateur peut accéder à ces résultats
    if (requestingUserId !== parseInt(userId) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const results = await prisma.knowledgeTestResult.findMany({
      where: { userId: parseInt(userId) },
      include: {
        test: {
          select: { title: true, subject: { select: { name: true } } }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ error: 'Échec de la récupération des résultats' });
  }
});

// Admin: Create knowledge test
app.post('/api/admin/knowledge-tests', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { title, description, subjectId, timeLimit, passingScore } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ error: 'Titre et matière sont requis' });
    }

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(400).json({ error: 'Matière non trouvée' });
    }

    const test = await prisma.knowledgeTest.create({
      data: {
        title,
        description,
        subjectId: parseInt(subjectId),
        totalQuestions: 0, // Sera mis à jour lors de l'ajout de questions
        timeLimit: timeLimit || 60,
        passingScore: passingScore || 70,
        isActive: true
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        }
      }
    });

    res.json({ message: 'Test créé avec succès', test });
  } catch (error) {
    console.error('Erreur lors de la création du test:', error);
    res.status(500).json({ error: 'Échec de la création du test' });
  }
});

// Admin: Import tests from CSV
app.post('/api/admin/tests/import', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'Données CSV manquantes' });
    }

    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Vérifier les en-têtes requis
    const requiredHeaders = ['title', 'subject', 'question', 'type', 'correctAnswer'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        error: `En-têtes manquants: ${missingHeaders.join(', ')}`,
        requiredHeaders,
        foundHeaders: headers
      });
    }

    const results = {
      success: 0,
      errors: [],
      tests: []
    };

    // Grouper les questions par test
    const testGroups = new Map();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        results.errors.push(`Ligne ${i + 1}: Nombre de colonnes incorrect`);
        continue;
      }
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      const testTitle = row.title;
      if (!testTitle) {
        results.errors.push(`Ligne ${i + 1}: Titre de test manquant`);
        continue;
      }
      
      if (!testGroups.has(testTitle)) {
        testGroups.set(testTitle, {
          title: testTitle,
          subject: row.subject || '',
          description: row.description || '',
          timeLimit: parseInt(row.timeLimit) || 30,
          passingScore: parseInt(row.passingScore) || 60,
          questions: []
        });
      }
      
      // Ajouter la question au test
      const question = {
        question: row.question || '',
        type: row.type || 'MULTIPLE_CHOICE',
        correctAnswer: row.correctAnswer || '',
        explanation: row.explanation || '',
        difficulty: row.difficulty || 'MEDIUM',
        concept: row.concept || '',
        options: row.options ? JSON.parse(row.options) : null
      };
      
      testGroups.get(testTitle).questions.push(question);
    }

    // Créer les tests et questions dans la base de données
    for (const [testTitle, testData] of testGroups) {
      try {
        // Trouver ou créer le sujet
        let subject = await prisma.subject.findFirst({
          where: { name: testData.subject }
        });
        
        if (!subject) {
          subject = await prisma.subject.create({
            data: {
              name: testData.subject,
              level: 'Terminale', // Par défaut
              description: `Sujet créé automatiquement pour ${testData.subject}`
            }
          });
        }

        // Créer le test
        const test = await prisma.knowledgeTest.create({
          data: {
            title: testData.title,
            description: testData.description,
            subjectId: subject.id,
            totalQuestions: testData.questions.length,
            timeLimit: testData.timeLimit,
            passingScore: testData.passingScore,
            isActive: true
          }
        });

        // Créer les questions
        for (const questionData of testData.questions) {
          await prisma.knowledgeQuestion.create({
            data: {
              testId: test.id,
              question: questionData.question,
              type: questionData.type,
              options: questionData.options,
              correctAnswer: questionData.correctAnswer,
              explanation: questionData.explanation,
              difficulty: questionData.difficulty,
              concept: questionData.concept
            }
          });
        }

        results.tests.push({
          title: test.title,
          subject: subject.name,
          questionsCount: testData.questions.length
        });
        
        results.success++;
        
      } catch (error) {
        results.errors.push(`Erreur lors de la création du test "${testTitle}": ${error.message}`);
      }
    }

    res.json({
      message: `Import terminé: ${results.success} test(s) créé(s)`,
      results
    });

  } catch (error) {
    console.error('Erreur lors de l\'import des tests:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import des tests' });
  }
});

// Admin: Get all knowledge tests
app.get('/api/admin/knowledge-tests', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { subjectId, page = '1', limit = '100' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = subjectId ? { subjectId: parseInt(subjectId as string) } : {};

    const [tests, total] = await Promise.all([
      prisma.knowledgeTest.findMany({
        where,
        include: {
          subject: {
            select: { name: true, level: true, section: true }
          },
          _count: {
            select: { questions: true, results: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.knowledgeTest.count({ where })
    ]);

    res.json({
      tests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    res.status(500).json({ error: 'Échec de la récupération des tests' });
  }
});

// Admin: Get questions for a test (DOIT être avant /:testId)
app.get('/api/admin/knowledge-tests/:testId/questions', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { testId } = req.params;
    
    const questions = await prisma.knowledgeQuestion.findMany({
      where: { testId: parseInt(testId) },
      include: {
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { id: 'asc' }
      ]
    });

    res.json(questions);
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ error: 'Échec de la récupération des questions' });
  }
});

// Admin: Add question to test (DOIT être avant /:testId)
app.post('/api/admin/knowledge-tests/:testId/questions', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { testId } = req.params;
    const { question, type, correctAnswer, explanation, difficulty, concept, options, chapterId } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question et réponse correcte sont requis' });
    }

    // Vérifier que le chapitre appartient bien au sujet du test
    let validatedChapterId = null;
    if (chapterId) {
      const test = await prisma.knowledgeTest.findUnique({
        where: { id: parseInt(testId) },
        select: { subjectId: true }
      });
      
      if (test) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: parseInt(chapterId) },
          select: { subjectId: true }
        });
        
        if (chapter && chapter.subjectId === test.subjectId) {
          validatedChapterId = parseInt(chapterId);
        } else if (chapter) {
          return res.status(400).json({ error: 'Le chapitre n\'appartient pas à la matière du test' });
        }
      }
    }

    const newQuestion = await prisma.knowledgeQuestion.create({
      data: {
        testId: parseInt(testId),
        chapterId: validatedChapterId,
        question,
        type: type || 'MULTIPLE_CHOICE',
        correctAnswer,
        explanation: explanation || '',
        difficulty: difficulty || 'MEDIUM',
        concept: concept || '',
        options: options || null
      },
      include: {
        chapter: {
          select: { id: true, name: true, subjectId: true }
        }
      }
    });

    res.json(newQuestion);
  } catch (error) {
    console.error('Erreur lors de la création de la question:', error);
    res.status(500).json({ error: 'Échec de la création de la question' });
  }
});

// Admin: Get single knowledge test
app.get('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { testId } = req.params;
    
    const test = await prisma.knowledgeTest.findUnique({
      where: { id: parseInt(testId) },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        _count: {
          select: { questions: true, results: true }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test non trouvé' });
    }

    res.json(test);
  } catch (error) {
    console.error('Erreur lors de la récupération du test:', error);
    res.status(500).json({ error: 'Échec de la récupération du test' });
  }
});

// Admin: Update knowledge test
app.put('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { testId } = req.params;
    const { title, description, timeLimit, passingScore, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const updatedTest = await prisma.knowledgeTest.update({
      where: { id: parseInt(testId) },
      data: {
        title,
        description,
        timeLimit: parseInt(timeLimit) || 30,
        passingScore: parseInt(passingScore) || 60,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(updatedTest);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du test:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du test' });
  }
});

// Admin: Update question
app.put('/api/admin/knowledge-questions/:questionId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { questionId } = req.params;
    const { question, type, correctAnswer, explanation, difficulty, concept, options, chapterId } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question et réponse correcte sont requis' });
    }

    // Récupérer la question actuelle pour valider le chapterId
    const currentQuestion = await prisma.knowledgeQuestion.findUnique({
      where: { id: parseInt(questionId) },
      include: {
        test: {
          select: { subjectId: true }
        }
      }
    });

    if (!currentQuestion) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    // Vérifier que le chapitre appartient bien au sujet du test
    let validatedChapterId = chapterId !== undefined ? null : currentQuestion.chapterId;
    if (chapterId !== undefined && chapterId !== null) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapterId) },
        select: { subjectId: true }
      });
      
      if (chapter && chapter.subjectId === currentQuestion.test.subjectId) {
        validatedChapterId = parseInt(chapterId);
      } else if (chapter) {
        return res.status(400).json({ error: 'Le chapitre n\'appartient pas à la matière du test' });
      }
    }

    const updatedQuestion = await prisma.knowledgeQuestion.update({
      where: { id: parseInt(questionId) },
      data: {
        question,
        type: type || 'MULTIPLE_CHOICE',
        correctAnswer,
        explanation: explanation || '',
        difficulty: difficulty || 'MEDIUM',
        concept: concept || '',
        options: options || null,
        chapterId: validatedChapterId
      },
      include: {
        chapter: {
          select: { id: true, name: true, subjectId: true }
        }
      }
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la question:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la question' });
  }
});

// Admin: Delete question
app.delete('/api/admin/knowledge-questions/:questionId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { questionId } = req.params;
    
    await prisma.knowledgeQuestion.delete({
      where: { id: parseInt(questionId) }
    });

    res.json({ message: 'Question supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error);
    res.status(500).json({ error: 'Échec de la suppression de la question' });
  }
});


// Admin: Create flashcard
app.post('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // Accepter à la fois 'question/answer' et 'front/back'
    const question = req.body.question || req.body.front;
    const answer = req.body.answer || req.body.back;
    const { subjectId, difficulty, chapterId } = req.body;

    if (!question || !answer || !subjectId) {
      return res.status(400).json({ error: 'Question, réponse et matière sont requis' });
    }

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(400).json({ error: 'Matière non trouvée' });
    }

    // Vérifier que le chapitre existe si spécifié
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapterId) }
      });
      if (!chapter) {
        return res.status(400).json({ error: 'Chapitre non trouvé' });
      }
      // Vérifier que le chapitre appartient à la matière
      if (chapter.subjectId !== parseInt(subjectId)) {
        return res.status(400).json({ error: 'Le chapitre ne correspond pas à la matière sélectionnée' });
      }
    }

    // Utiliser l'admin connecté comme créateur
    let targetUserId;
    if (typeof req.user.userId === 'string' && req.user.userId.includes('@')) {
      // userId est un email
      const adminUser = await prisma.user.findUnique({
        where: { email: req.user.userId },
        select: { id: true }
      });
      if (!adminUser) {
        return res.status(400).json({ error: 'Utilisateur admin non trouvé' });
      }
      targetUserId = adminUser.id;
    } else {
      // userId est un ID numérique
      const userIdRaw = req.user.userId || req.user.id;
      targetUserId = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        chapterId: chapterId ? parseInt(chapterId) : null,
        userId: targetUserId,
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { id: true, name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });

    res.json(flashcard);
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la création de la flashcard' });
  }
});

// Admin: Update flashcard
app.put('/api/admin/flashcards/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    // Accepter à la fois 'question/answer' et 'front/back'
    const question = req.body.question || req.body.front;
    const answer = req.body.answer || req.body.back;
    const { subjectId, difficulty, chapterId } = req.body;

    if (!question || !answer || !subjectId) {
      return res.status(400).json({ error: 'Question, réponse et matière sont requis' });
    }

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(400).json({ error: 'Matière non trouvée' });
    }

    // Vérifier que le chapitre existe si spécifié
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapterId) }
      });
      if (!chapter) {
        return res.status(400).json({ error: 'Chapitre non trouvé' });
      }
      // Vérifier que le chapitre appartient à la matière
      if (chapter.subjectId !== parseInt(subjectId)) {
        return res.status(400).json({ error: 'Le chapitre ne correspond pas à la matière sélectionnée' });
      }
    }

    const flashcard = await prisma.flashcard.update({
      where: { id: parseInt(id) },
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        chapterId: chapterId ? parseInt(chapterId) : null,
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { id: true, name: true, level: true, section: true }
        },
        chapter: {
          select: { id: true, name: true, subjectId: true, order: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });

    res.json(flashcard);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la flashcard' });
  }
});

// Admin: Delete flashcard
app.delete('/api/admin/flashcards/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    await prisma.flashcard.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Flashcard supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la suppression de la flashcard' });
  }
});

// Admin: Delete knowledge test
app.delete('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { testId } = req.params;
    
    // Supprimer d'abord les questions associées
    await prisma.knowledgeQuestion.deleteMany({
      where: { testId: parseInt(testId) }
    });
    
    // Supprimer les résultats associés
    await prisma.knowledgeTestResult.deleteMany({
      where: { testId: parseInt(testId) }
    });
    
    // Supprimer le test
    await prisma.knowledgeTest.delete({
      where: { id: parseInt(testId) }
    });

    res.json({ message: 'Test supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du test:', error);
    res.status(500).json({ error: 'Échec de la suppression du test' });
  }
});

// Admin: Create a new chapter
app.post('/api/admin/chapters', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { title, description, subjectId, order } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ error: 'Titre et matière sont requis' });
    }

    // Vérifier que la matière existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(400).json({ error: 'Matière non trouvée' });
    }

    // Déterminer l'ordre si non fourni
    let chapterOrder = order;
    if (!chapterOrder) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { subjectId: parseInt(subjectId) },
        orderBy: { order: 'desc' }
      });
      chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    const chapter = await prisma.chapter.create({
      data: {
        name: title,
        description: description || null,
        subjectId: parseInt(subjectId),
        order: chapterOrder
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        }
      }
    });

    res.status(201).json({
      message: 'Chapitre créé avec succès',
      chapter
    });
  } catch (error) {
    console.error('Erreur lors de la création du chapitre:', error);
    res.status(500).json({ error: 'Échec de la création du chapitre' });
  }
});

// Endpoint pour les statistiques du forum
app.get('/api/forum/stats', async (req, res) => {
  try {
    const totalPosts = await prisma.forumPost.count();
    const totalReplies = await prisma.forumReply.count();
    const totalLikes = await prisma.forumLike.count();
    const totalUsers = await prisma.user.count({
      where: {
        role: {
          in: ['STUDENT', 'TUTOR']
        }
      }
    });

    res.json({
      totalPosts,
      totalReplies,
      totalLikes,
      totalUsers,
      totalInteractions: totalPosts + totalReplies + totalLikes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Endpoint pour les utilisateurs en ligne
app.get('/api/forum/online-users', async (req, res) => {
  try {
    // Pour l'instant, retourner une liste vide
    // Dans une vraie application, on utiliserait des WebSockets ou Redis
    res.json({
      onlineUsers: [],
      count: 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs en ligne:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs en ligne' });
  }
});

// ============================================
// STUDY GROUPS ROUTES
// ============================================

// Get all study groups (avec filtrage optionnel) - accessible sans authentification
app.get('/api/study-groups', async (req: any, res) => {
  try {
    const { subjectId } = req.query;
    
    // Vérifier le token si présent (optionnel)
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        console.log('🔑 Token décodé pour /api/study-groups:', { userId: decoded.userId, email: decoded.email });
        
        // CORRECTION: Simplifier la logique de décodage
        if (decoded.userId) {
          userId = typeof decoded.userId === 'number' ? decoded.userId : parseInt(decoded.userId);
          console.log('✅ UserId extrait:', userId);
        } else if (decoded.email) {
          // Fallback: utiliser l'email du token
          const user = await prisma.user.findUnique({
            where: { email: decoded.email },
            select: { id: true }
          });
          if (user) {
            userId = user.id;
            console.log('✅ Utilisateur trouvé par email (fallback):', decoded.email, '→ ID:', userId);
          }
        }
      } catch (error) {
        // Token invalide, continuer sans authentification
        console.log('❌ Token invalide pour /api/study-groups, continuation sans authentification:', error);
      }
    }

    const where: any = {};
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    // Récupérer TOUS les groupes (pas de filtre par rôle)
    const groups = await prisma.studyGroup.findMany({
      where: {
        ...where
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Ajouter une propriété pour savoir si l'utilisateur est membre
    console.log('🔍 DEBUG API - userId reçu:', userId, 'type:', typeof userId);
    
    const groupsWithMembership = groups.map(group => {
      // Vérifier si l'utilisateur connecté est membre du groupe
      const isMember = userId ? group.members.some(m => {
        const memberUserId = typeof m.userId === 'number' ? m.userId : parseInt(m.userId);
        const currentUserId = typeof userId === 'number' ? userId : parseInt(userId);
        return memberUserId === currentUserId;
      }) : false;
      
      // Vérifier si l'utilisateur connecté est le créateur du groupe
      const creatorIdNum = typeof group.creatorId === 'number' ? group.creatorId : parseInt(group.creatorId);
      const userIdNum = userId ? (typeof userId === 'number' ? userId : parseInt(userId)) : null;
      const isCreator = userIdNum ? creatorIdNum === userIdNum : false;
      
      return {
        ...group,
        isMember,
        isCreator
      };
    });

    res.json(groupsWithMembership);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ error: 'Échec de la récupération des groupes' });
  }
});

// GET /api/study-groups/my-groups - Récupérer les groupes de l'utilisateur
app.get('/api/study-groups/my-groups', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('🔵 GET /api/study-groups/my-groups - UserId:', userId);

    // Récupérer les groupes où l'utilisateur est membre
    // Note: Avec onDelete: Cascade, si un groupe est supprimé, tous les groupMember sont automatiquement supprimés
    // Donc on récupère uniquement les groupes où l'utilisateur est encore membre
    const userGroups = await prisma.groupMember.findMany({
      where: { 
        userId: parseInt(userId)
      },
      include: {
        group: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                level: true
              }
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePhoto: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true,
                messages: true
              }
            }
          }
        }
      }
    });

    // Filtrer les groupes supprimés (group null) et transformer les données
    const groupsWithUnreadCount = await Promise.all(
      userGroups
        .filter(membership => membership.group !== null) // Exclure les groupes supprimés
        .map(async (membership) => {
          const group = membership.group;
          
          // Double vérification de sécurité
          if (!group) {
            return null;
          }
          
          // Compter les messages non lus (messages créés après la dernière visite de l'utilisateur)
          const unreadCount = await prisma.groupMessage.count({
            where: {
              groupId: group.id,
              userId: { not: parseInt(userId) }, // Messages des autres
              createdAt: { gt: membership.joinedAt }
            }
          });

          return {
            ...group,
            lastMessage: group.messages[0] || null,
            lastMessageAt: group.messages[0]?.createdAt || group.createdAt,
            unreadCount,
            isPinned: false // TODO: implémenter le système de pin si nécessaire
          };
        })
    );
    
    // Filtrer les valeurs null (groupes supprimés)
    const validGroups = groupsWithUnreadCount.filter(group => group !== null);

    // Trier par date du dernier message
    validGroups.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    console.log(`✅ Groupes récupérés pour l'utilisateur ${userId}:`, validGroups.length);
    res.json(validGroups);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create a study group
app.post('/api/study-groups', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, userClass, section, isPrivate, subjectId } = req.body;
    const userId = req.user.userId;

    if (!name || !userClass) {
      return res.status(400).json({ error: 'Nom et classe requis' });
    }

    // Convertir l'email en ID utilisateur si nécessaire
    let creatorId;
    if (typeof userId === 'string' && userId.includes('@')) {
      // userId est un email, trouver l'ID correspondant
      const user = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (!user) {
        return res.status(400).json({ error: 'Utilisateur non trouvé' });
      }
      creatorId = user.id;
    } else {
      // userId est déjà un ID numérique
      creatorId = parseInt(userId);
    }

    // Créer le groupe
    const group = await prisma.studyGroup.create({
      data: {
        name,
        description,
        subjectId: subjectId || 21, // Utiliser le subjectId fourni ou 21 par défaut
        creatorId: creatorId,
        userClass,
        section: section || null,
        isPrivate: isPrivate || false
      },
      include: {
        subject: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Ajouter automatiquement le créateur comme membre admin
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: creatorId,
        role: 'ADMIN'
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Erreur lors de la création du groupe:', error);
    res.status(500).json({ error: 'Échec de la création du groupe' });
  }
});

// Join a study group
app.post('/api/study-groups/:id/join', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Vérifier si le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Vous êtes déjà membre de ce groupe' });
    }

    // Note: Limite de membres supprimée - les groupes peuvent avoir un nombre illimité de membres

    // Ajouter l'utilisateur au groupe
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Erreur lors de la jointure au groupe:', error);
    res.status(500).json({ error: 'Échec de la jointure au groupe' });
  }
});

// Add member to study group (creator/admin only)
app.post('/api/study-groups/:id/add-member', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;
    const currentUserId = req.user.userId;

    // Vérifier que le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        creator: true,
        _count: {
          select: { members: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur actuel est le créateur ou un admin
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isCreator = group.creatorId === currentUserId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Seul le créateur ou un administrateur peut ajouter des membres' });
    }

    // Vérifier que l'utilisateur à ajouter existe
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'Utilisateur à ajouter non trouvé' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Cet utilisateur est déjà membre du groupe' });
    }

    // Note: Limite de membres supprimée - les groupes peuvent avoir un nombre illimité de membres

    // Ajouter l'utilisateur au groupe
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userClass: true,
            section: true
          }
        }
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    res.status(500).json({ error: 'Échec de l\'ajout du membre' });
  }
});

// Get available users to add to study group (creator/admin only)
app.get('/api/study-groups/:id/available-users', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    // Vérifier que le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        creator: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur actuel est le créateur ou un admin
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isCreator = group.creatorId === currentUserId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Seul le créateur ou un administrateur peut voir les utilisateurs disponibles' });
    }

    // Récupérer les membres actuels du groupe
    const currentMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true }
    });

    const memberIds = currentMembers.map(m => m.userId);

    // Récupérer TOUS les utilisateurs qui ne sont pas déjà membres (style Facebook Messenger)
    // Permet d'ajouter n'importe quel utilisateur au groupe
    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: memberIds.length > 0 ? memberIds : [-1] // Éviter empty array error
        }
        // Plus de filtre par rôle/classe - tous les utilisateurs sont disponibles
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true,
        role: true,
        profilePhoto: true
      },
      orderBy: [
        { role: 'asc' }, // Étudiants d'abord
        { userClass: 'asc' },
        { section: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json(availableUsers);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs disponibles:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

// Leave a study group
app.post('/api/study-groups/:id/leave', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Vérifier si l'utilisateur est membre
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(400).json({ error: 'Vous n\'êtes pas membre de ce groupe' });
    }

    // Ne pas permettre au créateur de quitter son propre groupe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId }
    });

    if (group && group.creatorId === userId) {
      return res.status(400).json({ error: 'Le créateur ne peut pas quitter son groupe. Supprimez-le à la place.' });
    }

    // Retirer l'utilisateur du groupe
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    console.log(`✅ Utilisateur ${userId} a quitté le groupe ${groupId} avec succès`);
    console.log(`✅ Le groupe ne sera plus visible dans /api/study-groups/my-groups pour cet utilisateur`);
    
    res.json({ message: 'Vous avez quitté le groupe avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sortie du groupe:', error);
    res.status(500).json({ error: 'Échec de la sortie du groupe' });
  }
});

// Remove member from study group (creator/admin only)
app.delete('/api/study-groups/:id/members/:userId', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userIdToRemove = parseInt(req.params.userId);
    const currentUserId = req.user.userId;

    // Vérifier que le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        creator: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier les permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isCreator = group.creatorId === currentUserId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Seul le créateur ou un administrateur peut retirer des membres' });
    }

    // Ne pas permettre au créateur de se retirer lui-même
    if (userIdToRemove === group.creatorId) {
      return res.status(400).json({ error: 'Le créateur ne peut pas être retiré du groupe' });
    }

    // Vérifier que l'utilisateur est membre
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: userIdToRemove
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Cet utilisateur n\'est pas membre du groupe' });
    }

    // Retirer l'utilisateur du groupe
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: userIdToRemove
        }
      }
    });

    res.json({ message: 'Membre retiré du groupe avec succès' });
  } catch (error) {
    console.error('Erreur lors du retrait du membre:', error);
    res.status(500).json({ error: 'Échec du retrait du membre' });
  }
});

// Get all members of a study group
app.get('/api/study-groups/:id/members', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est membre
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour voir ses membres' });
    }

    // Récupérer tous les membres
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            userClass: true,
            section: true,
            role: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    res.json(members);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    res.status(500).json({ error: 'Échec de la récupération des membres' });
  }
});

// Update study group settings (creator only)
app.put('/api/study-groups/:id', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { name, description, userClass, section } = req.body;

    // Vérifier que le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (group.creatorId !== userId) {
      return res.status(403).json({ error: 'Seul le créateur peut modifier les paramètres du groupe' });
    }

    // Construire les données à mettre à jour
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (userClass !== undefined) updateData.userClass = userClass;
    if (section !== undefined) updateData.section = section;

    // Mettre à jour le groupe
    const updatedGroup = await prisma.studyGroup.update({
      where: { id: groupId },
      data: updateData,
      include: {
        _count: {
          select: { members: true }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du groupe:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du groupe' });
  }
});

// Update member role (creator only)
app.put('/api/study-groups/:id/members/:userId/role', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userIdToUpdate = parseInt(req.params.userId);
    const currentUserId = req.user.userId;
    const { role } = req.body;

    // Vérifier que le groupe existe
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (group.creatorId !== currentUserId) {
      return res.status(403).json({ error: 'Seul le créateur peut modifier les rôles' });
    }

    // Vérifier le rôle
    if (!['MEMBER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Ne pas permettre de modifier le rôle du créateur
    if (userIdToUpdate === group.creatorId) {
      return res.status(400).json({ error: 'Le rôle du créateur ne peut pas être modifié' });
    }

    // Vérifier que l'utilisateur est membre
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: userIdToUpdate
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Cet utilisateur n\'est pas membre du groupe' });
    }

    // Mettre à jour le rôle
    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId: userIdToUpdate
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            userClass: true,
            section: true
          }
        }
      }
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du rôle' });
  }
});

// Delete a study group (creator only)
app.delete('/api/study-groups/:id', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: 'Seul le créateur peut supprimer ce groupe' });
    }

    // Supprimer le groupe (cascade supprimera automatiquement tous les groupMember et groupMessage)
    await prisma.studyGroup.delete({
      where: { id: groupId }
    });

    console.log(`✅ Groupe ${groupId} supprimé avec succès par l'utilisateur ${userId}`);
    console.log('✅ Les membres et messages associés seront supprimés en cascade');
    
    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe:', error);
    res.status(500).json({ error: 'Échec de la suppression du groupe' });
  }
});

// Get messages for a study group
app.get('/api/study-groups/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner un tableau vide
    if (req.user.demoMode || isDemoMode) {
      console.log('🔵 /api/study-groups/:id/messages: Mode démo activé, retourne []');
      return res.json([]);
    }

    if (!prisma) {
      console.log('⚠️ /api/study-groups/:id/messages: Prisma non disponible, retourne []');
      return res.json([]);
    }

    const groupId = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;

    // Vérifier si l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour voir les messages' });
    }

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100 // Limiter à 100 messages récents
    });

    // Enrichir les messages avec le message cité (replyTo)
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        let replyTo = null;
        if (msg.replyToId) {
          const replyToMsg = await prisma.groupMessage.findUnique({
            where: { id: msg.replyToId },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePhoto: true
                }
              }
            }
          });
          if (replyToMsg) {
            replyTo = {
              id: replyToMsg.id,
              content: replyToMsg.content,
              messageType: replyToMsg.messageType,
              fileName: replyToMsg.fileName,
              user: replyToMsg.user
            };
          }
        }
        return {
          ...msg,
          replyTo
        };
      })
    );

    res.json(enrichedMessages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Échec de la récupération des messages' });
  }
});

// Post a message to a study group (supports text, voice, image, and file messages)
app.post('/api/study-groups/:id/messages', authenticateToken, (req: any, res: any, next: any) => {
  console.log('📤 Middleware multer - Headers:', req.headers);
  
  // Utiliser multer.any() pour accepter n'importe quel champ de fichier
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadDir;
        if (file.fieldname === 'audio') {
          uploadDir = path.join(process.cwd(), 'uploads/audio-messages');
        } else if (file.fieldname === 'file') {
          uploadDir = path.join(process.cwd(), 'uploads/chat-files');
        } else {
          return cb(new Error('Type de fichier non supporté'), '');
        }
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || (file.fieldname === 'audio' ? '.webm' : '');
        const prefix = file.fieldname === 'audio' ? 'audio' : 'chat';
        const filename = `${prefix}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'audio') {
        // Filtre pour les fichiers audio
        if (file.mimetype.startsWith('audio/') || 
            file.mimetype.includes('webm') || 
            file.mimetype.includes('ogg') ||
            file.mimetype === 'audio/webm;codecs=opus' ||
            file.originalname.endsWith('.webm')) {
          cb(null, true);
        } else {
          cb(new Error('Seuls les fichiers audio sont autorisés pour les messages vocaux') as any, false);
        }
      } else if (file.fieldname === 'file') {
        // Filtre pour les fichiers de chat
        if (file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.mimetype === 'text/plain' ||
            file.mimetype === 'text/csv') {
          cb(null, true);
        } else {
          cb(new Error('Type de fichier non supporté. Formats acceptés: images, PDF, Word, Excel, PowerPoint, texte') as any, false);
        }
      } else {
        cb(new Error('Champ de fichier non reconnu') as any, false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
      files: 1 // Un seul fichier par message
    }
  });

  upload.any()(req, res, (err: any) => {
    if (err) {
      console.error('❌ Erreur multer:', err);
      return res.status(400).json({ error: 'Erreur upload fichier: ' + err.message });
    }
    console.log('✅ Multer OK - Files:', req.files);
    
    // Vérifier les fichiers uploadés
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      files.forEach((file) => {
        console.log('📁 Fichier uploadé:', {
          fieldname: file.fieldname,
          originalname: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });
        
        // Vérifier que le fichier a une taille valide
        if (file.size === 0) {
          console.error('❌ Fichier vide détecté:', file.filename);
        }
        
        // Vérifier que le fichier existe sur le disque
        if (file.path && fs.existsSync(file.path)) {
          const stats = fs.statSync(file.path);
          console.log('📊 Stats fichier:', {
            size: stats.size,
            isFile: stats.isFile(),
            modified: stats.mtime
          });
          
          if (stats.size === 0) {
            console.error('❌ Fichier sauvegardé mais vide:', file.path);
          }
        }
      });
    }
    
    next();
  });
}, async (req: any, res) => {
  try {
    console.log('📤 === DÉBUT ENVOI MESSAGE ===');
    console.log('GroupId:', req.params.id);
    console.log('UserId:', req.user.userId);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('Headers:', req.headers);
    
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { content, messageType, replyToId } = req.body;
    
    // Récupérer les fichiers uploadés
    const files = req.files as Express.Multer.File[];
    const audioFile = files?.find(f => f.fieldname === 'audio');
    const chatFile = files?.find(f => f.fieldname === 'file');

    // Vérifier si l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour envoyer un message' });
    }

    // Déterminer le type de message
    let finalMessageType = messageType || 'TEXT';
    if (audioFile) {
      finalMessageType = 'VOICE';
    } else if (chatFile) {
      if (chatFile.mimetype.startsWith('image/')) {
        finalMessageType = 'IMAGE';
      } else {
        finalMessageType = 'FILE';
      }
    }

    console.log('Final message type:', finalMessageType, 'audioFile:', !!audioFile, 'chatFile:', !!chatFile);
    
    // Vérifier que le message n'est pas vide
    if (finalMessageType === 'TEXT' && (!content || !content.trim())) {
      console.log('❌ Message vide rejeté');
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    // Vérifier que replyToId existe et appartient au groupe si fourni
    if (replyToId) {
      const replyToMsg = await prisma.groupMessage.findUnique({
        where: { id: parseInt(replyToId) }
      });
      if (!replyToMsg || replyToMsg.groupId !== groupId) {
        return res.status(400).json({ error: 'Le message auquel vous répondez n\'existe pas ou n\'appartient pas à ce groupe' });
      }
    }

    // Construire les données du message
    const messageData: any = {
      groupId,
      userId,
      messageType: finalMessageType as 'TEXT' | 'VOICE' | 'IMAGE' | 'FILE',
      content: content?.trim() || getDefaultContent(finalMessageType),
      replyToId: replyToId ? parseInt(replyToId) : null
    };

    // Ajouter les informations de fichier selon le type
    if (audioFile) {
      messageData.audioUrl = audioFile.filename;
      console.log('✅ Audio file added:', audioFile.filename);
    } else if (chatFile) {
      messageData.fileUrl = chatFile.filename;
      messageData.fileName = chatFile.originalname;
      messageData.fileType = chatFile.mimetype;
      messageData.fileSize = chatFile.size;
      console.log('✅ Chat file added:', chatFile.filename, 'type:', chatFile.mimetype);
    }
    
    console.log('Message data avant création:', JSON.stringify(messageData, null, 2));

    const message = await prisma.groupMessage.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    console.log('✅ Message créé avec succès:', message.id);

    // Récupérer le nom du groupe et tous les membres (sauf l'auteur)
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        members: {
          where: { userId: { not: userId } },
          select: { userId: true }
        }
      }
    });

    // Créer une notification pour chaque membre du groupe
    if (group) {
      const notificationPromises = group.members.map(member =>
        createNotification(
          member.userId,
          'GROUP_MESSAGE',
          `Nouveau message dans ${group.name}`,
          `${message.user.firstName} ${message.user.lastName}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          `/forum` // Les groupes sont accessibles depuis le forum
        )
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json(message);
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    console.error('Erreur stack:', error?.stack);
    console.error('Message error:', error?.message);
    res.status(500).json({ 
      error: 'Échec de l\'envoi du message',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// GET - Récupérer les messages épinglés d'un groupe (DOIT être avant les routes avec :messageId)
app.get('/api/study-groups/:groupId/pinned-messages', authenticateToken, async (req: any, res) => {
  try {
    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner un tableau vide
    if (req.user.demoMode || isDemoMode) {
      console.log('🔵 /api/study-groups/:groupId/pinned-messages: Mode démo activé, retourne []');
      return res.json([]);
    }

    if (!prisma) {
      console.log('⚠️ /api/study-groups/:groupId/pinned-messages: Prisma non disponible, retourne []');
      return res.json([]);
    }

    const { groupId } = req.params;
    const userId = req.user.userId || req.user.id;

    // Vérifier que l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour voir les messages épinglés' });
    }

    // Récupérer les messages épinglés
    const pinnedMessages = await prisma.groupMessage.findMany({
      where: { 
        groupId: parseInt(groupId),
        isPinned: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    res.json(pinnedMessages);
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des messages épinglés:', error);
    res.status(500).json({ 
      error: 'Échec de la récupération des messages épinglés',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// PUT - Modifier un message de groupe
app.put('/api/study-groups/:groupId/messages/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    // Convertir userId en nombre si nécessaire
    const userIdRaw = req.user?.userId || req.user?.id;
    const userIdNum = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);
    const { content } = req.body;

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) },
      include: { group: true }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Comparer les IDs numériques
    if (message.userId !== userIdNum) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres messages' });
    }

    if (message.groupId !== parseInt(groupId)) {
      return res.status(400).json({ error: 'Le message n\'appartient pas à ce groupe' });
    }

    // Ne pas permettre la modification des messages vocaux
    if (message.messageType === 'VOICE') {
      return res.status(400).json({ error: 'Les messages vocaux ne peuvent pas être modifiés' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    const updatedMessage = await prisma.groupMessage.update({
      where: { id: parseInt(messageId) },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    res.json(updatedMessage);
  } catch (error: any) {
    console.error('❌ Erreur lors de la modification du message:', error);
    res.status(500).json({ 
      error: 'Échec de la modification du message',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// DELETE - Supprimer un message de groupe
app.delete('/api/study-groups/:groupId/messages/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    // Convertir userId en nombre si nécessaire
    const userIdRaw = req.user?.userId || req.user?.id;
    const userIdNum = typeof userIdRaw === 'string' ? parseInt(userIdRaw) : (userIdRaw as number);

    // Vérifier que le message existe
    const message = await prisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) },
      include: { 
        group: {
          select: {
            creatorId: true
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (message.groupId !== parseInt(groupId)) {
      return res.status(400).json({ error: 'Le message n\'appartient pas à ce groupe' });
    }

    // Permettre la suppression si :
    // - L'utilisateur est l'auteur du message
    // - L'utilisateur est le créateur du groupe
    // - L'utilisateur est admin
    // Comparer les IDs numériques
    const isAuthor = message.userId === userIdNum;
    const isGroupCreator = message.group.creatorId === userIdNum;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAuthor && !isGroupCreator && !isAdmin) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer ce message' });
    }

    // Supprimer les fichiers associés selon le type de message
    try {
      if (message.messageType === 'VOICE' && message.audioUrl) {
        // Message vocal : supprimer le fichier audio
        const audioPath = path.join(process.cwd(), 'uploads/audio-messages', message.audioUrl);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          console.log('✅ Fichier audio supprimé:', message.audioUrl);
        }
      } else if ((message.messageType === 'IMAGE' || message.messageType === 'FILE') && message.fileUrl) {
        // Message avec fichier : supprimer le fichier
        // Déterminer le chemin selon le type
        let filePath: string;
        if (message.messageType === 'IMAGE') {
          // Les images peuvent être dans chat-images ou chat-files selon l'endpoint
          const chatImagePath = path.join(process.cwd(), 'uploads/chat-images', message.fileUrl);
          const chatFilePath = path.join(process.cwd(), 'uploads/chat-files', message.fileUrl);
          if (fs.existsSync(chatImagePath)) {
            filePath = chatImagePath;
          } else if (fs.existsSync(chatFilePath)) {
            filePath = chatFilePath;
          } else {
            filePath = chatImagePath; // Par défaut
          }
        } else {
          filePath = path.join(process.cwd(), 'uploads/chat-files', message.fileUrl);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Fichier supprimé:', message.fileUrl);
        }
      }
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier:', fileError);
      // Continuer même si la suppression du fichier échoue
    }

    await prisma.groupMessage.delete({
      where: { id: parseInt(messageId) }
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression du message:', error);
    res.status(500).json({ 
      error: 'Échec de la suppression du message',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// ===== ENDPOINTS POUR LES RÉACTIONS AUX MESSAGES =====

// POST - Ajouter une réaction à un message
app.post('/api/study-groups/:groupId/messages/:messageId/reactions', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji requis' });
    }

    // Vérifier que l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour réagir aux messages' });
    }

    // Vérifier que le message existe
    const message = await prisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!message || message.groupId !== parseInt(groupId)) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Créer ou supprimer la réaction (toggle)
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: parseInt(messageId),
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Supprimer la réaction existante
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });
      
      res.json({ 
        action: 'removed',
        emoji,
        message: 'Réaction supprimée'
      });
    } else {
      // Ajouter une nouvelle réaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId: parseInt(messageId),
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          }
        }
      });
      
      res.json({ 
        action: 'added',
        reaction,
        message: 'Réaction ajoutée'
      });
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la gestion de la réaction:', error);
    res.status(500).json({ 
      error: 'Échec de la gestion de la réaction',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// GET - Récupérer les réactions d'un message
app.get('/api/study-groups/:groupId/messages/:messageId/reactions', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour voir les réactions' });
    }

    // Récupérer les réactions groupées par emoji
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: parseInt(messageId) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Grouper les réactions par emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      if (reaction.userId === userId) {
        acc[reaction.emoji].userReacted = true;
      }
      return acc;
    }, {} as Record<string, any>);

    res.json(Object.values(groupedReactions));
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des réactions:', error);
    res.status(500).json({ 
      error: 'Échec de la récupération des réactions',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// ===== ENDPOINTS POUR LES MESSAGES ÉPINGLÉS =====

// POST - Épingler un message
app.post('/api/study-groups/:groupId/messages/:messageId/pin', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour épingler des messages' });
    }

    // Vérifier que le message existe
    const message = await prisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!message || message.groupId !== parseInt(groupId)) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Vérifier les permissions (seuls les admins et modérateurs peuvent épingler)
    if (member.role !== 'ADMIN' && member.role !== 'MODERATOR') {
      return res.status(403).json({ error: 'Seuls les administrateurs et modérateurs peuvent épingler des messages' });
    }

    // Désépingler tous les autres messages du groupe
    await prisma.groupMessage.updateMany({
      where: { 
        groupId: parseInt(groupId),
        isPinned: true
      },
      data: { 
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null
      }
    });

    // Épingler le message
    const pinnedMessage = await prisma.groupMessage.update({
      where: { id: parseInt(messageId) },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    res.json({ 
      message: 'Message épinglé avec succès',
      pinnedMessage
    });
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'épinglage du message:', error);
    res.status(500).json({ 
      error: 'Échec de l\'épinglage du message',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// DELETE - Désépingler un message
app.delete('/api/study-groups/:groupId/messages/:messageId/pin', authenticateToken, async (req: any, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est membre du groupe
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Vous devez être membre du groupe pour désépingler des messages' });
    }

    // Vérifier les permissions (seuls les admins et modérateurs peuvent désépingler)
    if (member.role !== 'ADMIN' && member.role !== 'MODERATOR') {
      return res.status(403).json({ error: 'Seuls les administrateurs et modérateurs peuvent désépingler des messages' });
    }

    // Désépingler le message
    await prisma.groupMessage.update({
      where: { id: parseInt(messageId) },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null
      }
    });

    res.json({ message: 'Message désépinglé avec succès' });
  } catch (error: any) {
    console.error('❌ Erreur lors du désépinglage du message:', error);
    res.status(500).json({ 
      error: 'Échec du désépinglage du message',
      details: error?.message || 'Erreur inconnue'
    });
  }
});

// GET - Données d'activité pour les graphiques
app.get('/api/admin/activity-data', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // Générer des données d'activité pour les 7 derniers jours
    const activityData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Compter les utilisateurs actifs ce jour
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const [users, posts, sessions] = await Promise.all([
        prisma.user.count({
          where: {
            OR: [
              { forumPosts: { some: { createdAt: { gte: startOfDay, lte: endOfDay } } } },
              { messages: { some: { createdAt: { gte: startOfDay, lte: endOfDay } } } }
            ]
          }
        }),
        prisma.forumPost.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.tutorSession.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
      ]);
      
      activityData.push({
        date: dateStr,
        users,
        posts,
        sessions
      });
    }
    
    res.json(activityData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'activité:', error);
    res.status(500).json({ error: 'Échec de la récupération des données d\'activité' });
  }
});

// GET - Données de santé du système
app.get('/api/admin/system-health', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // Calculer l'utilisation de la mémoire (simulation basée sur les données)
    const totalUsers = await prisma.user.count();
    const totalPosts = await prisma.forumPost.count();
    const totalFlashcards = await prisma.flashcard.count();
    
    // Calculer l'utilisation de la mémoire basée sur les données
    const memoryUsage = Math.min(95, Math.max(20, (totalUsers * 0.1 + totalPosts * 0.05 + totalFlashcards * 0.02)));
    
    // Calculer l'utilisation CPU basée sur l'activité
    const recentActivity = await prisma.forumPost.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
        }
      }
    });
    const cpuUsage = Math.min(90, Math.max(10, recentActivity * 2));
    
    // Calculer l'utilisation disque basée sur les données
    const diskUsage = Math.min(95, Math.max(30, (totalUsers * 0.2 + totalPosts * 0.1 + totalFlashcards * 0.05)));
    
    // Calculer les connexions base de données
    const databaseConnections = Math.min(50, Math.max(5, Math.floor(totalUsers / 10) + 5));
    
    // Déterminer le statut de santé
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (memoryUsage > 90 || cpuUsage > 85 || diskUsage > 90) {
      status = 'critical';
    } else if (memoryUsage > 80 || cpuUsage > 70 || diskUsage > 80) {
      status = 'warning';
    } else if (memoryUsage < 50 && cpuUsage < 40 && diskUsage < 60) {
      status = 'excellent';
    }
    
    // Calculer l'uptime (simulation)
    const uptime = '99.9%';
    
    const systemHealth = {
      status,
      uptime,
      memoryUsage: Math.round(memoryUsage),
      cpuUsage: Math.round(cpuUsage),
      diskUsage: Math.round(diskUsage),
      databaseConnections
    };
    
    res.json(systemHealth);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de santé du système:', error);
    res.status(500).json({ error: 'Échec de la récupération des données de santé du système' });
  }
});

// GET - Statistiques étudiant (DOUBLON - Route déjà définie ligne 3053)
// Cette route a été supprimée pour éviter les conflits
// Utiliser la route définie ligne 3053 qui gère correctement le mode démo

// GET - Données de croissance mensuelle pour les graphiques
app.get('/api/admin/growth-data', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { month } = req.query;
    const targetDate = month ? new Date(month as string) : new Date();
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const [users, tutors, posts] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      prisma.user.count({
        where: {
          role: 'TUTOR',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      prisma.forumPost.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          isLocked: false
        }
      })
    ]);
    
    res.json({ users, tutors, posts });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de croissance:', error);
    res.status(500).json({ error: 'Échec de la récupération des données de croissance' });
  }
});

// GET - Toutes les conversations pour l'admin (contrôle du messenger)
app.get('/api/admin/conversations', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    console.log('📊 Admin: Début récupération conversations');
    
    if (!prisma) {
      console.error('❌ Admin: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }
    
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Admin: ${conversations.length} conversations trouvées dans la DB`);
    
    // Enrichir avec les informations de l'étudiant et du tuteur
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const [student, tutor] = await Promise.all([
            prisma.user.findUnique({
              where: { id: conv.studentId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                role: true
              }
            }).catch(() => {
              console.warn(`⚠️ Étudiant ${conv.studentId} non trouvé pour conversation ${conv.id}`);
              return null;
            }),
            prisma.tutor.findUnique({
              where: { id: conv.tutorId },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePhoto: true,
                    role: true
                  }
                }
              }
            }).catch(() => {
              console.warn(`⚠️ Tuteur ${conv.tutorId} non trouvé pour conversation ${conv.id}`);
              return null;
            })
          ]);
          
          // Récupérer le dernier message (DirectMessage pour les conversations)
          // Exclure les messages système/broadcast (senderId: 0)
          const lastMessage = await prisma.directMessage.findFirst({
            where: { 
              conversationId: conv.id,
              senderId: { not: 0 } // Exclure les messages système/broadcast
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true
            }
          }).catch(() => null);
          
          // Compter les messages (exclure les messages système/broadcast)
          const messageCount = await prisma.directMessage.count({
            where: { 
              conversationId: conv.id,
              senderId: { not: 0 } // Exclure les messages système/broadcast
            }
          }).catch(() => 0);
          
          // Toujours retourner la conversation, même si student ou tutor est null
          // L'admin doit pouvoir voir toutes les conversations, même celles avec des données manquantes
          return {
            ...conv,
            student: student ? { user: student } : {
              user: {
                id: conv.studentId,
                firstName: 'Utilisateur',
                lastName: 'Supprimé',
                email: 'supprimé@example.com',
                profilePhoto: null,
                role: 'STUDENT'
              }
            },
            tutor: tutor || {
              id: conv.tutorId,
              user: {
                id: 0,
                firstName: 'Tuteur',
                lastName: 'Supprimé',
                email: 'supprimé@example.com',
                profilePhoto: null,
                role: 'TUTOR'
              }
            },
            lastMessage: lastMessage || null,
            messageCount: messageCount || 0
          };
        } catch (error) {
          console.error(`❌ Erreur pour conversation ${conv.id}:`, error);
          // Retourner quand même la conversation avec des données de base
          return {
            ...conv,
            student: {
              user: {
                id: conv.studentId,
                firstName: 'Utilisateur',
                lastName: 'Inconnu',
                email: 'inconnu@example.com',
                profilePhoto: null,
                role: 'STUDENT'
              }
            },
            tutor: {
              id: conv.tutorId,
              user: {
                id: 0,
                firstName: 'Tuteur',
                lastName: 'Inconnu',
                email: 'inconnu@example.com',
                profilePhoto: null,
                role: 'TUTOR'
              }
            },
            lastMessage: null,
            messageCount: 0
          };
        }
      })
    );
    
    // Ne plus filtrer les conversations null - toutes les conversations doivent être retournées
    const validConversations = enrichedConversations;
    console.log(`✅ Admin: ${validConversations.length} conversations enrichies`);
    
    res.json(validConversations);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Échec de la récupération des conversations' });
  }
});

// GET - Tous les messages d'une conversation pour l'admin
app.get('/api/admin/conversations/:conversationId/messages', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { conversationId } = req.params;
    const convId = parseInt(conversationId);
    
    console.log(`📊 Admin: Récupération messages pour conversation ${convId}`);
    
    if (!prisma) {
      console.error('❌ Admin: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }
    
    // Exclure les messages système/broadcast (senderId: 0) - ils ne doivent pas apparaître dans les conversations normales
    const messages = await prisma.directMessage.findMany({
      where: { 
        conversationId: convId,
        senderId: { not: 0 } // Exclure les messages système/broadcast
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Admin: ${messages.length} messages trouvés pour conversation ${convId} (messages système exclus)`);
    
    // Enrichir avec les informations de l'expéditeur et du destinataire
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          let sender = null;
          let receiver = null;
          
          // Gérer les messages système (senderId = 0) - Afficher TYALA avec badge certifié
          if (msg.senderId === 0) {
            sender = {
              id: 0,
              firstName: 'TYALA',
              lastName: '',
              profilePhoto: null
            };
          } else {
            sender = await prisma.user.findUnique({
              where: { id: msg.senderId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            });
          }
          
          if (msg.receiverId) {
            receiver = await prisma.user.findUnique({
              where: { id: msg.receiverId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            });
          }
          
          return {
            ...msg,
            sender: sender || null,
            receiver: receiver || null
          };
        } catch (error) {
          console.error(`❌ Erreur pour message ${msg.id}:`, error);
          return {
            ...msg,
            sender: msg.senderId === 0 ? {
              id: 0,
              firstName: 'TYALA',
              lastName: '',
              profilePhoto: null
            } : null,
            receiver: null
          };
        }
      })
    );
    
    console.log(`✅ Admin: ${enrichedMessages.length} messages enrichis`);
    res.json(enrichedMessages);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Échec de la récupération des messages' });
  }
});

// POST - Envoyer un message broadcast à tous les utilisateurs (admin)
// IMPORTANT: Définir cette route AVANT les routes avec paramètres pour éviter les conflits
app.post('/api/admin/messages/broadcast', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { title, message, targetAudience, userId } = req.body; // targetAudience: 'all', 'students', 'tutors', 'admins', 'specific', userId: number (si targetAudience === 'specific')
    
    console.log(`📢 Admin: Envoi message broadcast - Audience: ${targetAudience}, userId: ${userId}`);
    console.log(`📢 Admin: Broadcast - Title: ${title}, Message length: ${message?.length || 0}`);
    
    if (!title || !message) {
      console.error('❌ Admin: Broadcast - Titre ou message manquant');
      return res.status(400).json({ error: 'Le titre et le message sont requis' });
    }

    // Déterminer les utilisateurs cibles
    let targetUsers: any[] = [];
    
    if (targetAudience === 'specific' && userId) {
      // Envoyer à un utilisateur spécifique
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      targetUsers = [user];
      console.log(`📢 Admin: Envoi à un utilisateur spécifique: ${userId}`);
    } else if (targetAudience === 'all') {
      targetUsers = await prisma.user.findMany({
        select: { id: true }
      });
    } else if (targetAudience === 'students') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      });
    } else if (targetAudience === 'tutors') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'TUTOR' },
        select: { id: true }
      });
    } else if (targetAudience === 'admins') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
    } else {
      return res.status(400).json({ error: 'Audience cible invalide ou userId manquant pour audience spécifique' });
    }

    console.log(`📢 Admin: ${targetUsers.length} utilisateurs cibles trouvés`);
    console.log(`📢 Admin: Utilisateurs cibles:`, targetUsers.map(u => u.id));

    // Créer ou trouver le tuteur système TYALA pour les conversations système
    const systemTutorId = await getOrCreateSystemTutor();
    if (!systemTutorId) {
      console.error('❌ Admin: Impossible de créer/obtenir le tuteur système TYALA');
      return res.status(500).json({ error: 'Erreur lors de la création du tuteur système' });
    }
    console.log(`✅ Admin: Tuteur système TYALA: ${systemTutorId}`);

    // Créer les notifications ET les messages dans le messenger pour tous les utilisateurs
    const notifications = await Promise.all(
      targetUsers.map(async (user) => {
        console.log(`📢 Admin: Création notification et message pour utilisateur ${user.id}`);
        try {
          let conversationId: number | null = null;
          
          // Si on a un tuteur système, créer ou récupérer une conversation système avec l'utilisateur
          if (systemTutorId) {
            // IMPORTANT: Utiliser findUnique avec la clé unique pour être sûr de récupérer la BONNE conversation système
            // et jamais une conversation tutor-étudiant normale
            let conversation = await prisma.conversation.findUnique({
              where: {
                studentId_tutorId: {
                  studentId: user.id,
                  tutorId: systemTutorId
                }
              }
            });
            
            // Si elle n'existe pas, la créer (conversation système TYALA uniquement)
            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  studentId: user.id,
                  tutorId: systemTutorId, // TOUJOURS utiliser systemTutorId (TYALA système)
                  lastMessageAt: new Date()
                }
              });
              console.log(`✅ Admin: Conversation système TYALA créée pour utilisateur ${user.id}: ${conversation.id} (tutorId: ${systemTutorId})`);
            } else {
              // Vérifier que c'est bien la conversation système (sécurité supplémentaire)
              if (conversation.tutorId !== systemTutorId) {
                console.error(`❌ Admin: ERREUR - Conversation trouvée n'est PAS système (tutorId: ${conversation.tutorId}, attendu: ${systemTutorId})`);
                // Créer une nouvelle conversation système
                conversation = await prisma.conversation.create({
                  data: {
                    studentId: user.id,
                    tutorId: systemTutorId,
                    lastMessageAt: new Date()
                  }
                });
                console.log(`✅ Admin: Conversation système TYALA créée (correction) pour utilisateur ${user.id}: ${conversation.id}`);
              } else {
                console.log(`✅ Admin: Conversation système TYALA existante trouvée pour utilisateur ${user.id}: ${conversation.id} (tutorId: ${systemTutorId})`);
              }
            }
            
            conversationId = conversation.id;
            
            // Créer un message direct dans cette conversation
            // Si c'est un utilisateur spécifique, utiliser le vrai ID de l'admin comme senderId
            // Sinon, utiliser senderId: 0 pour messages système/broadcast
            const adminId = req.user.userId || req.user.id;
            const adminIdNum = typeof adminId === 'string' ? parseInt(adminId) : adminId;
            const messageSenderId = (targetAudience === 'specific' && userId) ? adminIdNum : 0;
            
            await prisma.directMessage.create({
              data: {
                conversationId: conversation.id,
                senderId: messageSenderId, // ID de l'admin si message spécifique, 0 si broadcast
                receiverId: user.id,
                content: targetAudience === 'specific' ? message : `📢 **${title}**\n\n${message}`,
                messageType: 'TEXT',
                isRead: false
              }
            });
            
            // Mettre à jour la date du dernier message
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { lastMessageAt: new Date() }
            });
            
            console.log(`✅ Admin: Message broadcast créé dans la conversation ${conversation.id} pour utilisateur ${user.id}`);
          }
          
          // Créer la notification avec le conversationId dans le link
          // Pour les messages spécifiques, utiliser TUTOR_MESSAGE, sinon SYSTEM
          const adminIdForNotification = req.user.userId || req.user.id;
          const adminIdNumForNotification = typeof adminIdForNotification === 'string' ? parseInt(adminIdForNotification) : adminIdForNotification;
          const notificationType = (targetAudience === 'specific' && userId) ? 'TUTOR_MESSAGE' : 'SYSTEM';
          const notificationTitle = (targetAudience === 'specific' && userId) ? 'Nouveau message' : `📢 ${title}`;
          
          // Pour les messages spécifiques, inclure le nom de l'admin dans le message de notification
          const notificationMessage = (targetAudience === 'specific' && userId) 
            ? message 
            : message;
          
          const notification = await createNotification(
            user.id,
            notificationType,
            notificationTitle,
            notificationMessage,
            conversationId ? `/messages?conversationId=${conversationId}` : `/messages`
          );
          if (notification) {
            console.log(`✅ Admin: Notification créée pour utilisateur ${user.id}:`, notification.id);
          } else {
            console.error(`❌ Admin: Échec création notification pour utilisateur ${user.id}`);
          }
          return { notification, conversationId };
        } catch (error) {
          console.error(`❌ Admin: Erreur création notification/message pour utilisateur ${user.id}:`, error);
          return { notification: null, conversationId: null };
        }
      })
    );

    const successfulNotifications = notifications.filter(n => n.notification !== null).length;
    const successfulMessages = notifications.filter(n => n.conversationId !== null).length;
    const failedNotifications = targetUsers.length - successfulNotifications;
    
    console.log(`✅ Admin: Broadcast réussi - ${successfulNotifications}/${targetUsers.length} notifications créées, ${successfulMessages}/${targetUsers.length} messages dans le messenger`);
    console.log(`✅ Admin: Broadcast - Total utilisateurs: ${targetUsers.length}, Notifications réussies: ${successfulNotifications}, Messages réussis: ${successfulMessages}, Échecs: ${failedNotifications}`);
    
    if (failedNotifications > 0) {
      console.warn(`⚠️ Admin: ${failedNotifications} notification(s) n'ont pas pu être créée(s)`);
    }
    
    res.json({ 
      message: `Message broadcast envoyé à ${successfulNotifications} utilisateur(s)`,
      sentCount: successfulNotifications,
      messagesCount: successfulMessages,
      totalUsers: targetUsers.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message broadcast:', error);
    res.status(500).json({ error: 'Échec de l\'envoi du message broadcast' });
  }
});

// POST - Nettoyer les messages broadcast mal placés (admin)
// Déplace les messages avec senderId: 0 qui sont dans des conversations tutor-étudiant vers les conversations système TYALA
app.post('/api/admin/messages/broadcast/cleanup', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    console.log('🧹 Admin: Début du nettoyage des messages broadcast mal placés...');
    
    if (!prisma) {
      console.error('❌ Admin: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }
    
    // Obtenir le tuteur système TYALA
    const systemTutorId = await getOrCreateSystemTutor();
    if (!systemTutorId) {
      console.error('❌ Admin: Impossible de créer/obtenir le tuteur système TYALA');
      return res.status(500).json({ error: 'Erreur lors de la création du tuteur système' });
    }
    console.log(`✅ Admin: Tuteur système TYALA: ${systemTutorId}`);
    
    // Trouver tous les messages avec senderId: 0 (messages système)
    const systemMessages = await prisma.directMessage.findMany({
      where: {
        senderId: 0
      },
      select: {
        id: true,
        conversationId: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        content: true
      }
    });
    
    console.log(`📊 Admin: ${systemMessages.length} messages système trouvés`);
    
    let movedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const msg of systemMessages) {
      try {
        // Récupérer la conversation pour ce message
        const conversation = await prisma.conversation.findUnique({
          where: { id: msg.conversationId },
          select: {
            id: true,
            studentId: true,
            tutorId: true
          }
        });
        
        if (!conversation) {
          console.error(`❌ Admin: Conversation ${msg.conversationId} non trouvée pour message ${msg.id}`);
          errorCount++;
          continue;
        }
        
        const studentId = conversation.studentId;
        const tutorId = conversation.tutorId;
        
        // Vérifier si c'est une conversation système TYALA
        const isSystemConversation = tutorId === systemTutorId;
        
        if (!isSystemConversation) {
          console.log(`⚠️ Admin: Message système trouvé dans conversation non-système (conversation ${conversation.id}, tutorId: ${tutorId}, attendu: ${systemTutorId})`);
          
          // Trouver ou créer la conversation système TYALA pour cet étudiant
          let systemConversation = await prisma.conversation.findUnique({
            where: {
              studentId_tutorId: {
                studentId: studentId,
                tutorId: systemTutorId
              }
            }
          });
          
          if (!systemConversation) {
            systemConversation = await prisma.conversation.create({
              data: {
                studentId: studentId,
                tutorId: systemTutorId,
                lastMessageAt: msg.createdAt || new Date()
              }
            });
            console.log(`✅ Admin: Conversation système TYALA créée pour étudiant ${studentId}: ${systemConversation.id}`);
          }
          
          // Déplacer le message vers la conversation système
          await prisma.directMessage.update({
            where: { id: msg.id },
            data: {
              conversationId: systemConversation.id
            }
          });
          
          // Mettre à jour la date du dernier message de la conversation système
          await prisma.conversation.update({
            where: { id: systemConversation.id },
            data: { lastMessageAt: msg.createdAt || new Date() }
          });
          
          console.log(`✅ Admin: Message ${msg.id} déplacé vers conversation système ${systemConversation.id}`);
          movedCount++;
        } else {
          console.log(`✅ Admin: Message ${msg.id} déjà dans la bonne conversation système`);
        }
      } catch (error: any) {
        console.error(`❌ Admin: Erreur traitement message ${msg.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Admin: Nettoyage terminé - ${movedCount} messages déplacés, ${deletedCount} messages supprimés, ${errorCount} erreurs`);
    
    res.json({
      message: `Nettoyage terminé avec succès`,
      totalMessages: systemMessages.length,
      movedCount,
      deletedCount,
      errorCount,
      alreadyCorrect: systemMessages.length - movedCount - deletedCount - errorCount
    });
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage des messages broadcast:', error);
    res.status(500).json({ error: 'Échec du nettoyage des messages broadcast' });
  }
});

// DELETE - Supprimer une conversation (admin)
app.delete('/api/admin/conversations/:conversationId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { conversationId } = req.params;
    const convId = parseInt(conversationId);
    
    console.log(`🗑️ Admin: Suppression conversation ${convId}`);
    
    // Supprimer tous les messages de la conversation d'abord
    await prisma.directMessage.deleteMany({
      where: { conversationId: convId }
    });
    
    // Ensuite supprimer la conversation
    await prisma.conversation.delete({
      where: { id: convId }
    });
    
    console.log(`✅ Admin: Conversation ${convId} supprimée avec succès`);
    res.json({ message: 'Conversation supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la conversation:', error);
    res.status(500).json({ error: 'Échec de la suppression de la conversation' });
  }
});

// PUT - Bloquer/Débloquer une conversation (admin)
app.put('/api/admin/conversations/:conversationId/block', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { conversationId } = req.params;
    const { isBlocked, reason } = req.body;
    const convId = parseInt(conversationId);
    
    console.log(`🔒 Admin: ${isBlocked ? 'Blocage' : 'Déblocage'} conversation ${convId}`);
    
    // Mettre à jour la conversation avec un champ isBlocked
    // Si le champ n'existe pas dans le schéma, on peut utiliser une autre méthode
    // Par exemple, créer un enregistrement de modération ou utiliser un champ existant
    
    // Mettre à jour le statut de blocage de la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: convId }
    });

    if (conversation) {
      // Récupérer le tuteur séparément car la relation tutor n'existe pas directement dans Conversation
      const tutor = await prisma.tutor.findUnique({
        where: { id: conversation.tutorId },
        include: { user: { select: { id: true } } }
      });

      // Mettre à jour la conversation avec le statut de blocage
      // Utiliser une requête raw SQL car Prisma Client n'a peut-être pas encore détecté les nouveaux champs
      await prisma.$executeRaw`
        UPDATE conversations 
        SET isBlocked = ${isBlocked}, 
            blockReason = ${isBlocked ? (reason || 'Violation des règlements du site') : null},
            blockedAt = ${isBlocked ? new Date() : null}
        WHERE id = ${convId}
      `;

      if (isBlocked) {
        // Créer un message système de blocage (utiliser TEXT car SYSTEM n'existe pas dans MessageType)
        await prisma.directMessage.create({
          data: {
            conversationId: convId,
            senderId: 0, // ID spécial pour messages système
            receiverId: conversation.studentId,
            content: `🚫 Cette conversation a été bloquée par l'administrateur.${reason ? ` Raison: ${reason}` : ''}`,
            messageType: 'TEXT', // Utiliser TEXT car SYSTEM n'est pas dans l'enum MessageType
            isRead: false
          }
        });

        // Créer des notifications pour les deux participants
        await createNotification(
          conversation.studentId,
          'SYSTEM',
          'Conversation bloquée',
          reason || 'Cette conversation a été bloquée par l\'administrateur pour violation des règlements.',
          `/messages`
        );

        if (tutor?.user) {
          await createNotification(
            tutor.user.id,
            'SYSTEM',
            'Conversation bloquée',
            reason || 'Cette conversation a été bloquée par l\'administrateur pour violation des règlements.',
            `/messages`
          );
        }
      }
    }
    
    console.log(`✅ Admin: Conversation ${convId} ${isBlocked ? 'bloquée' : 'débloquée'}`);
    res.json({ 
      message: `Conversation ${isBlocked ? 'bloquée' : 'débloquée'} avec succès`,
      isBlocked 
    });
  } catch (error) {
    console.error('❌ Erreur lors du blocage/déblocage de la conversation:', error);
    res.status(500).json({ error: 'Échec du blocage/déblocage de la conversation' });
  }
});

// GET - Tous les groupes pour l'admin
app.get('/api/admin/study-groups', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const groups = await prisma.studyGroup.findMany({
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(groups);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ error: 'Échec de la récupération des groupes' });
  }
});

// DELETE - Supprimer un message direct (admin)
app.delete('/api/admin/messages/:messageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { messageId } = req.params;
    const msgId = parseInt(messageId);
    
    console.log(`🗑️ Admin: Suppression message direct ${msgId}`);
    
    // Vérifier que le message existe
    const message = await prisma.directMessage.findUnique({
      where: { id: msgId }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }
    
    // Supprimer le message
    await prisma.directMessage.delete({
      where: { id: msgId }
    });
    
    // Mettre à jour la date du dernier message de la conversation si c'était le dernier
    const lastMessage = await prisma.directMessage.findFirst({
      where: { conversationId: message.conversationId },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { 
        lastMessageAt: lastMessage ? lastMessage.createdAt : new Date()
      }
    });
    
    console.log(`✅ Admin: Message direct ${msgId} supprimé avec succès`);
    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du message:', error);
    res.status(500).json({ error: 'Échec de la suppression du message' });
  }
});

// DELETE - Supprimer un message de groupe (admin)
app.delete('/api/admin/group-messages/:messageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { messageId } = req.params;
    await prisma.groupMessage.delete({
      where: { id: parseInt(messageId) }
    });
    
    res.json({ message: 'Message de groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message de groupe:', error);
    res.status(500).json({ error: 'Échec de la suppression du message de groupe' });
  }
});

// GET - Statistiques du messenger pour l'admin
app.get('/api/admin/messenger-stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalConversations,
      totalMessages,
      totalGroupMessages,
      totalStudyGroups,
      messagesToday,
      conversationsToday
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.groupMessage.count(),
      prisma.studyGroup.count(),
      prisma.message.count({
        where: {
          createdAt: { gte: today }
        }
      }),
      prisma.conversation.count({
        where: {
          createdAt: { gte: today }
        }
      })
    ]);
    
    res.json({
      totalConversations,
      totalMessages,
      totalGroupMessages,
      totalStudyGroups,
      messagesToday,
      conversationsToday,
      avgMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du messenger:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques du messenger' });
  }
});

// GET - Statistiques par matière
app.get('/api/admin/subject-stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            flashcards: true,
            forumPosts: true,
            chapters: true
          }
        }
      }
    });

    // Calculer le nombre réel d'étudiants par matière
    const subjectStats = await Promise.all(subjects.map(async (subject) => {
      // Compter les étudiants qui ont des flashcards ou des posts dans cette matière
      const studentsCount = await prisma.user.count({
        where: {
          role: 'STUDENT',
          OR: [
            { flashcards: { some: { subjectId: subject.id } } },
            { forumPosts: { some: { subjectId: subject.id } } }
          ]
        }
      });

      return {
        name: subject.name,
        flashcards: subject._count.flashcards,
        posts: subject._count.forumPosts,
        chapters: subject._count.chapters,
        students: studentsCount
      };
    }));

    res.json(subjectStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par matière:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques par matière' });
  }
});

// ==================== ROUTES TUTEUR PROFIL ====================

// POST /api/tutors/register - Inscription comme tuteur
app.post('/api/tutors/register', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bio, experience, hourlyRate, education, certifications, languages, specialties, subjectIds } = req.body;

    // Vérifier que l'utilisateur n'est pas déjà tuteur
    const existingTutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (existingTutor) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit comme tuteur' });
    }

    // Créer le profil tuteur
    const tutor = await prisma.tutor.create({
      data: {
        userId,
        bio,
        experience,
        hourlyRate,
        education,
        certifications,
        languages,
        specialties,
        rating: 0,
        isOnline: true,
        isAvailable: true
      }
    });

    // Ajouter les matières enseignées
    if (subjectIds && subjectIds.length > 0) {
      await prisma.tutorSubject.createMany({
        data: subjectIds.map((subjectId: number) => ({
          tutorId: tutor.id,
          subjectId
        })),
        skipDuplicates: true
      });
    }

    // Mettre à jour le rôle de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'TUTOR' }
    });

    res.json({
      message: 'Inscription comme tuteur réussie',
      tutor
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription tuteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/tutors/profile - Récupérer le profil tuteur de l'utilisateur connecté
app.get('/api/tutors/profile', authenticateToken, async (req: any, res) => {
  try {
    // Détecter le mode démo si ce n'est pas déjà fait (fallback)
    const isDemoMode = req.user.demoMode || 
                       (typeof req.user.userId === 'string' && req.user.userId.includes('@')) ||
                       (typeof req.user.originalEmail === 'string' && req.user.originalEmail.includes('@'));
    
    // En mode démo, retourner un profil factice
    if (req.user.demoMode || isDemoMode) {
      console.log('🔵 /api/tutors/profile: Mode démo activé, retourne profil factice');
      return res.json({
        id: 1,
        bio: 'Tuteur en mode démo',
        hourlyRate: 1000,
        experience: 2,
        rating: 4.5,
        isOnline: true,
        isAvailable: true,
        education: '',
        certifications: '',
        specialties: '',
        languages: 'Français',
        tutorSubjects: [],
        user: {
          id: req.user.userId || 1,
          firstName: req.user.originalEmail?.split('@')[0] || req.user.firstName || 'Tuteur',
          lastName: req.user.lastName || 'Demo',
          email: req.user.originalEmail || req.user.email || 'tutor@test.com',
          profilePhoto: null
        },
        _count: {
          sessions: 0,
          reviews: 0
        }
      });
    }

    if (!prisma) {
      return res.status(404).json({ error: 'Base de données non disponible' });
    }

    const userId = req.user.userId || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutor: {
          include: {
            tutorSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    // Récupérer les compteurs (_count) pour reviews et sessions
    const reviewsCount = await prisma.review.count({
      where: { tutorId: user.tutor.id }
    });

    const sessionsCount = await prisma.tutoringSession.count({
      where: { tutorId: user.tutor.id }
    });

    res.json({
      ...user.tutor,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto
      },
      _count: {
        reviews: reviewsCount,
        sessions: sessionsCount
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil tuteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/tutors/profile - Mettre à jour le profil tuteur
app.put('/api/tutors/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bio, experience, hourlyRate, education, certifications, languages, specialties, subjectIds, isAvailable, isOnline } = req.body;

    // Vérifier que l'utilisateur est tuteur
    const existingTutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!existingTutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    // Mettre à jour le profil tuteur
    const tutor = await prisma.tutor.update({
      where: { id: existingTutor.id },
      data: {
        bio,
        experience,
        hourlyRate,
        education,
        certifications,
        languages,
        specialties,
        isAvailable: isAvailable !== undefined ? isAvailable : existingTutor.isAvailable,
        isOnline: isOnline !== undefined ? isOnline : existingTutor.isOnline
      }
    });

    // Mettre à jour les matières si fournies
    if (subjectIds && Array.isArray(subjectIds)) {
      // Supprimer les anciennes associations
      await prisma.tutorSubject.deleteMany({
        where: { tutorId: tutor.id }
      });

      // Créer les nouvelles associations
      if (subjectIds.length > 0) {
        await prisma.tutorSubject.createMany({
          data: subjectIds.map((subjectId: number) => ({
            tutorId: tutor.id,
            subjectId
          })),
          skipDuplicates: true
        });
      }
    }

    // Récupérer le profil complet
    const updatedTutor = await prisma.tutor.findUnique({
      where: { id: tutor.id },
      include: {
        tutorSubjects: {
          include: {
            subject: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true
          }
        }
      }
    });

    res.json({
      message: 'Profil tuteur mis à jour avec succès',
      tutor: updatedTutor
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil tuteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTES CONVERSATIONS ====================

// GET /api/conversations - Récupérer toutes les conversations de l'utilisateur
app.get('/api/conversations', authenticateToken, async (req: any, res) => {
  try {
    if (!prisma) {
      console.error('❌ /api/conversations: Prisma non disponible');
      return res.status(500).json({ error: 'Base de données non disponible' });
    }

    // authenticateToken a déjà vérifié et mis req.user.userId avec l'ID de la DB
    const actualUserId = req.user.userId || req.user.id;

    if (!actualUserId || typeof actualUserId !== 'number') {
      console.error('❌ /api/conversations: userId invalide:', actualUserId);
      return res.json([]);
    }

    console.log('📬 GET /api/conversations pour userId:', actualUserId);

    // Récupérer l'utilisateur pour connaître son rôle
    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: { tutor: true }
    });

    if (!user) {
      console.error('❌ /api/conversations: Utilisateur non trouvé (userId:', actualUserId, ')');
      return res.json([]);
    }

    let conversations;

    if (user.role === 'TUTOR' && user.tutor) {
      // Obtenir le tuteur système TYALA pour l'exclure des conversations des tuteurs
      const systemTutorId = await getOrCreateSystemTutor();
      
      // Si c'est un tuteur, récupérer les conversations où il est le tuteur
      // EXCLURE les conversations système TYALA (ne doivent PAS apparaître dans les conversations des tuteurs)
      conversations = await prisma.conversation.findMany({
        where: {
          tutorId: user.tutor.id,
          // Exclure les conversations système TYALA si ce n'est pas le tuteur système lui-même
          ...(systemTutorId && user.tutor.id !== systemTutorId ? {
            NOT: {
              tutorId: systemTutorId
            }
          } : {})
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              content: true,
              messageType: true,
              createdAt: true,
              isRead: true
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      // Enrichir avec les informations de l'étudiant
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Charger l'étudiant avec gestion d'erreur
          let student = null;
          try {
            student = await prisma.user.findUnique({
              where: { id: conv.studentId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            });
          } catch (error) {
            console.error(`❌ Erreur lors du chargement de l'étudiant ${conv.studentId}:`, error);
          }

          const unreadCount = await prisma.directMessage.count({
            where: {
              conversationId: conv.id,
              receiverId: actualUserId,
              isRead: false
            }
          });

          return {
            ...conv,
            student: student || { id: conv.studentId, firstName: null, lastName: null, profilePhoto: null },
            tutor: {
              id: user.tutor!.id,
              userId: user.id,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto
              },
              isOnline: user.tutor!.isOnline
            },
            lastMessage: conv.messages[0] || null,
            unreadCount
          };
        })
      );

      return res.json(enrichedConversations);
    } else {
      // Si c'est un étudiant, récupérer les conversations où il est l'étudiant
      conversations = await prisma.conversation.findMany({
        where: {
          studentId: actualUserId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
              isRead: true,
              senderId: true,
              receiverId: true
            }
          }
        },
        orderBy: { 
          lastMessageAt: 'desc'
        }
      });

      console.log(`📬 Conversations trouvées pour étudiant ${actualUserId}:`, conversations.length);
      console.log('📬 Détails conversations brutes:', conversations.map(c => ({ 
        id: c.id, 
        tutorId: c.tutorId, 
        studentId: c.studentId,
        lastMessageAt: c.lastMessageAt 
      })));

      // Enrichir avec les informations du tuteur
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          try {
            let tutor = await prisma.tutor.findUnique({
              where: { id: conv.tutorId },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePhoto: true,
                    email: true // Ajouter email pour détecter TYALA système
                  }
                }
              }
            });

            // Si le tutor n'est pas trouvé, créer un tutor par défaut pour éviter de perdre la conversation
            if (!tutor) {
              console.warn(`⚠️ Tutor ${conv.tutorId} non trouvé pour conversation ${conv.id}, création tutor par défaut`);
              // Essayer de récupérer l'utilisateur du tutor depuis la table User
              const tutorUser = await prisma.user.findFirst({
                where: {
                  tutor: {
                    id: conv.tutorId
                  }
                },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                  email: true
                }
              });

              if (tutorUser) {
                tutor = {
                  id: conv.tutorId,
                  userId: tutorUser.id,
                  isOnline: false,
                  isAvailable: false,
                  rating: 0,
                  experience: 0,
                  user: tutorUser
                } as any;
              } else {
                // Si même l'utilisateur n'est pas trouvé, utiliser des valeurs par défaut
                tutor = {
                  id: conv.tutorId,
                  userId: 0,
                  isOnline: false,
                  isAvailable: false,
                  rating: 0,
                  experience: 0,
                  user: {
                    id: 0,
                    firstName: 'Tuteur',
                    lastName: 'Inconnu',
                    profilePhoto: null,
                    email: 'unknown@example.com'
                  }
                } as any;
              }
            }

            const unreadCount = await prisma.directMessage.count({
              where: {
                conversationId: conv.id,
                receiverId: actualUserId,
                isRead: false
              }
            });

            // S'assurer que lastMessageAt est toujours défini
            const lastMessageAt = conv.lastMessageAt || conv.messages[0]?.createdAt || conv.createdAt || new Date();

            return {
              ...conv,
              tutor,
              lastMessage: conv.messages[0] || null,
              lastMessageAt: lastMessageAt, // S'assurer que lastMessageAt est toujours présent
              unreadCount,
              isBlocked: conv.isBlocked || false,
              blockReason: conv.blockReason || null
            };
          } catch (error: any) {
            console.error(`❌ Erreur enrichissement conversation ${conv.id}:`, error);
            // Même en cas d'erreur, retourner la conversation avec des données par défaut
            const lastMessageAt = conv.lastMessageAt || conv.messages[0]?.createdAt || conv.createdAt || new Date();
            
            return {
              ...conv,
              tutor: {
                id: conv.tutorId,
                userId: 0,
                isOnline: false,
                isAvailable: false,
                rating: 0,
                experience: 0,
                user: {
                  id: 0,
                  firstName: 'Tuteur',
                  lastName: 'Inconnu',
                  profilePhoto: null,
                  email: 'unknown@example.com'
                }
              },
              lastMessage: conv.messages[0] || null,
              lastMessageAt: lastMessageAt, // S'assurer que lastMessageAt est toujours présent
              unreadCount: 0,
              isBlocked: conv.isBlocked || false,
              blockReason: conv.blockReason || null
            };
          }
        })
      );

      // Ne plus filtrer les conversations null - toutes doivent être retournées
      console.log('✅ Conversations enrichies pour étudiant:', enrichedConversations.length);
      console.log('📊 Détails conversations:', enrichedConversations.map(c => ({ 
        id: c.id, 
        tutorName: c.tutor?.user?.firstName || 'Inconnu',
        tutorEmail: c.tutor?.user?.email || 'N/A',
        lastMessage: c.lastMessage?.content?.substring(0, 30) || 'Aucun'
      })));
      
      return res.json(enrichedConversations);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations - Créer ou récupérer une conversation
app.post('/api/conversations', authenticateToken, async (req: any, res) => {
  try {
    console.log('🔵 POST /api/conversations appelée');
    const userId = req.user.userId || req.user.id;
    const { tutorId } = req.body;
    console.log(`🔵 userId: ${userId}, tutorId: ${tutorId}`);

    if (!tutorId) {
      console.log('❌ tutorId manquant');
      return res.status(400).json({ error: 'tutorId est requis' });
    }

    // Vérifier que le tuteur existe
    console.log(`🔍 Recherche du tuteur ID: ${tutorId}`);
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    if (!tutor) {
      console.log(`❌ Tuteur non trouvé pour ID: ${tutorId}`);
      return res.status(404).json({ error: 'Tuteur non trouvé' });
    }
    console.log(`✅ Tuteur trouvé: ${tutor.user.firstName} ${tutor.user.lastName}`);

    // Chercher ou créer la conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        studentId_tutorId: {
          studentId: userId,
          tutorId: tutorId
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          studentId: userId,
          tutorId: tutorId
        },
        include: {
          messages: true
        }
      });
    }

    res.json({
      ...conversation,
      tutor,
      lastMessage: conversation.messages[0] || null,
      unreadCount: 0
    });
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/conversations/:id - Supprimer une conversation (utilisateur)
app.delete('/api/conversations/:id', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;
    const isDemoMode = req.user.demoMode || false;
    const originalEmail = req.user.originalEmail;

    // Si mode démo et email disponible, chercher l'utilisateur par email
    let actualUserId = userId;
    if (isDemoMode && originalEmail) {
      const user = await prisma.user.findUnique({
        where: { email: originalEmail },
        select: { id: true }
      });
      if (user) {
        actualUserId = user.id;
      } else {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
    }

    // Récupérer la conversation et vérifier que l'utilisateur y a accès
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === actualUserId;
    const isTutor = user.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Vous n\'avez pas accès à cette conversation' });
    }

    console.log(`🗑️ Suppression conversation ${conversationId} par utilisateur ${actualUserId}`);

    // Supprimer tous les messages de la conversation
    await prisma.directMessage.deleteMany({
      where: { conversationId: conversationId }
    });

    // Supprimer la conversation
    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    console.log(`✅ Conversation ${conversationId} supprimée avec succès`);
    res.json({ message: 'Conversation supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la conversation:', error);
    res.status(500).json({ error: 'Échec de la suppression de la conversation' });
  }
});

// GET /api/conversations/:id/messages - Récupérer les messages d'une conversation
app.get('/api/conversations/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    // Gérer les deux formats de userId
    let actualUserId = userId;
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        actualUserId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      actualUserId = parseInt(userId);
    }

    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === actualUserId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      console.error('❌ Accès non autorisé - userId:', actualUserId, 'conversation:', conversation.id, 'studentId:', conversation.studentId, 'tutorId:', conversation.tutorId, 'user.tutor.id:', user?.tutor?.id);
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer TOUS les messages (inclure les messages système/broadcast avec senderId: 0)
    const messages = await prisma.directMessage.findMany({
      where: { 
        conversationId
        // Ne plus exclure senderId: 0 pour inclure les messages système TYALA
      },
      orderBy: { createdAt: 'asc' }
    });

    // Enrichir les messages avec les informations utilisateur et le message cité
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          // Si senderId = 0, c'est un message système TYALA
          if (msg.senderId === 0) {
            let replyTo = null;
            if (msg.replyToId) {
              const replyToMsg = await prisma.directMessage.findUnique({
                where: { id: msg.replyToId }
              });
              if (replyToMsg) {
                const replyToUser = await prisma.user.findUnique({
                  where: { id: replyToMsg.senderId },
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePhoto: true
                  }
                });
                replyTo = {
                  id: replyToMsg.id,
                  content: replyToMsg.content,
                  messageType: replyToMsg.messageType,
                  fileName: replyToMsg.fileName,
                  user: replyToUser
                };
              }
            }
            return {
              ...msg,
              userId: 0, // Pour compatibilité avec le frontend
              user: {
                id: 0,
                firstName: 'TYALA',
                lastName: '',
                profilePhoto: null,
                email: 'system@tyala.com'
              },
              replyTo
            };
          }

          // Sinon, récupérer l'utilisateur expéditeur
          const sender = await prisma.user.findUnique({
            where: { id: msg.senderId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              email: true
            }
          });

          // Récupérer le message cité si présent
          let replyTo = null;
          if (msg.replyToId) {
            const replyToMsg = await prisma.directMessage.findUnique({
              where: { id: msg.replyToId }
            });
            if (replyToMsg) {
              const replyToUser = await prisma.user.findUnique({
                where: { id: replyToMsg.senderId },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePhoto: true
                }
              });
              replyTo = {
                id: replyToMsg.id,
                content: replyToMsg.content,
                messageType: replyToMsg.messageType,
                fileName: replyToMsg.fileName,
                user: replyToUser
              };
            }
          }

          return {
            ...msg,
            userId: msg.senderId, // Pour compatibilité avec le frontend
            user: sender || {
              id: msg.senderId,
              firstName: 'Utilisateur',
              lastName: 'Inconnu',
              profilePhoto: null
            },
            replyTo
          };
        } catch (error) {
          console.error(`❌ Erreur enrichissement message ${msg.id}:`, error);
          return {
            ...msg,
            userId: msg.senderId,
            user: msg.senderId === 0 ? {
              id: 0,
              firstName: 'TYALA',
              lastName: '',
              profilePhoto: null
            } : null,
            replyTo: null
          };
        }
      })
    );

    console.log(`✅ Messages récupérés et enrichis: ${enrichedMessages.length}`);
    res.json(enrichedMessages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/conversations/:conversationId/messages - Envoyer un message direct (admin)
app.post('/api/admin/conversations/:conversationId/messages', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const adminId = req.user.userId || req.user.id;
    const adminIdNum = typeof adminId === 'string' ? parseInt(adminId) : adminId;
    const { content, messageType = 'TEXT' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Le contenu du message est requis' });
    }

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Récupérer les informations de l'étudiant et du tuteur
    const student = await prisma.user.findUnique({
      where: { id: conversation.studentId }
    });
    
    const tutor = await prisma.tutor.findUnique({
      where: { id: conversation.tutorId },
      include: { user: true }
    });

    // Déterminer le receiverId (l'utilisateur qui recevra le message de l'admin)
    const receiverId = conversation.studentId === adminIdNum ? (tutor?.userId || null) : conversation.studentId;

    if (!receiverId) {
      return res.status(400).json({ error: 'Impossible de déterminer le destinataire' });
    }

    // Créer le message
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: adminIdNum, // ID de l'admin comme expéditeur
        receiverId,
        content,
        messageType,
        isRead: false
      }
    });
    
    // Récupérer les informations de l'expéditeur
    const sender = await prisma.user.findUnique({
      where: { id: adminIdNum },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true
      }
    });

    // Mettre à jour la date du dernier message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Créer une notification pour le destinataire
    await createNotification(
      receiverId,
      'TUTOR_MESSAGE',
      'Nouveau message',
      `Message de l'administrateur: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      `/messages?conversationId=${conversationId}`
    );

    // Enrichir le message avec les informations de l'expéditeur
    const enrichedMessage = {
      ...message,
      sender: sender || {
        id: adminIdNum,
        firstName: 'Admin',
        lastName: '',
        profilePhoto: null
      }
    };
    
    res.json(enrichedMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message admin:', error);
    res.status(500).json({ error: 'Échec de l\'envoi du message' });
  }
});

// POST /api/conversations/:id/messages - Envoyer un message texte
app.post('/api/conversations/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    let userId = req.user.userId || req.user.id;
    const { content, messageType = 'TEXT', receiverId, replyToId } = req.body;

    console.log('📤 POST /api/conversations/:id/messages:', { 
      conversationId, 
      userId, 
      userIdType: typeof userId,
      hasContent: !!content,
      hasReceiverId: !!receiverId,
      replyToId 
    });

    if (!content || !receiverId) {
      return res.status(400).json({ error: 'content et receiverId sont requis' });
    }

    // Gérer les deux formats de userId
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      userId = parseInt(userId);
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      console.error('❌ Conversation non trouvée:', conversationId);
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé:', userId);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      console.error('❌ Accès non autorisé - userId:', userId, 'conversation:', conversation.id);
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    // CORRECTION CRITIQUE : Déterminer automatiquement le receiverId depuis la conversation
    // pour éviter les erreurs où l'utilisateur s'envoie son propre message
    let actualReceiverId: number;
    
    if (isStudent) {
      // Si c'est l'étudiant qui envoie, le receiverId doit être l'userId du tuteur
      const tutor = await prisma.tutor.findUnique({
        where: { id: conversation.tutorId },
        select: { userId: true }
      });
      
      if (!tutor || !tutor.userId) {
        console.error('❌ Tuteur non trouvé dans la conversation:', conversation.tutorId);
        return res.status(404).json({ error: 'Tuteur non trouvé dans la conversation' });
      }
      
      actualReceiverId = tutor.userId;
      console.log('📤 Étudiant envoie au tuteur - receiverId déterminé:', actualReceiverId);
    } else if (isTutor) {
      // Si c'est le tuteur qui envoie, le receiverId doit être le studentId
      actualReceiverId = conversation.studentId;
      console.log('📤 Tuteur envoie à l\'étudiant - receiverId déterminé:', actualReceiverId);
    } else {
      console.error('❌ Impossible de déterminer le receiverId');
      return res.status(400).json({ error: 'Impossible de déterminer le destinataire' });
    }

    // Vérifier que le receiverId envoyé par le frontend correspond (pour sécurité)
    // mais utiliser celui déterminé automatiquement
    const frontendReceiverId = typeof receiverId === 'string' ? parseInt(receiverId) : receiverId;
    if (frontendReceiverId && frontendReceiverId !== actualReceiverId) {
      console.warn('⚠️ receiverId frontend ne correspond pas, utilisation de celui déterminé:', {
        frontend: frontendReceiverId,
        backend: actualReceiverId
      });
    }

    // Vérifier que replyToId existe et appartient à la conversation si fourni
    let replyToMessage = null;
    if (replyToId) {
      replyToMessage = await prisma.directMessage.findUnique({
        where: { id: parseInt(replyToId) }
      });
      if (!replyToMessage || replyToMessage.conversationId !== conversationId) {
        return res.status(400).json({ error: 'Le message auquel vous répondez n\'existe pas ou n\'appartient pas à cette conversation' });
      }
      // Récupérer l'utilisateur du message cité
      const replyToUser = await prisma.user.findUnique({
        where: { id: replyToMessage.senderId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhoto: true
        }
      });
      replyToMessage.user = replyToUser;
    }

    // Créer le message avec le receiverId déterminé automatiquement
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId: actualReceiverId, // Utiliser le receiverId déterminé automatiquement
        content,
        messageType,
        replyToId: replyToId ? parseInt(replyToId) : null
      }
    });

    console.log('✅ Message créé:', { 
      id: message.id, 
      senderId: message.senderId, 
      receiverId: message.receiverId,
      conversationId: conversation.id,
      isStudent,
      isTutor
    });

    // Récupérer l'expéditeur pour enrichir le message et créer la notification
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true
      }
    });

    // Mettre à jour la date du dernier message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Créer une notification pour le destinataire (sauf si c'est lui qui envoie)
    if (actualReceiverId !== userId && sender) {
      console.log('📬 Création notification pour receiverId:', actualReceiverId, 'depuis senderId:', userId);
      await createNotification(
        actualReceiverId,
        'TUTOR_MESSAGE',
        'Nouveau message',
        `${sender.firstName} ${sender.lastName}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        `/messages`
      );
      console.log('✅ Notification créée avec succès');
    } else {
      console.warn('⚠️ Notification non créée - même utilisateur ou sender non trouvé', {
        actualReceiverId,
        userId,
        hasSender: !!sender
      });
    }

    // Enrichir le message avec les informations utilisateur et le message cité
    const enrichedMessage = {
      ...message,
      userId: message.senderId,
      user: sender || {
        id: message.senderId,
        firstName: 'Utilisateur',
        lastName: 'Inconnu',
        profilePhoto: null
      },
      replyTo: replyToMessage ? {
        id: replyToMessage.id,
        content: replyToMessage.content,
        messageType: replyToMessage.messageType,
        fileName: replyToMessage.fileName,
        user: replyToMessage.user || {
          id: replyToMessage.senderId,
          firstName: 'Utilisateur',
          lastName: 'Inconnu',
          profilePhoto: null
        }
      } : null
    };

    res.json(enrichedMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Configuration multer pour les messages
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/chat-files';
    
    if (file.mimetype.startsWith('audio/')) {
      uploadPath = 'uploads/audio-messages';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = 'uploads/chat-images';
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const chatUpload = multer({ 
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// POST /api/conversations/:id/messages/audio - Envoyer un message vocal
app.post('/api/conversations/:id/messages/audio', authenticateToken, chatUpload.single('audio'), async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    let userId = req.user.userId || req.user.id;
    const { receiverId } = req.body;

    console.log('🎤 POST /api/conversations/:id/messages/audio:', { conversationId, userId, hasFile: !!req.file, receiverId });

    if (!req.file || !receiverId) {
      return res.status(400).json({ error: 'Fichier audio et receiverId requis' });
    }

    // Gérer les deux formats de userId
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      userId = parseInt(userId);
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    // CORRECTION CRITIQUE : Déterminer automatiquement le receiverId depuis la conversation
    let actualReceiverId: number;
    
    if (isStudent) {
      const tutor = await prisma.tutor.findUnique({
        where: { id: conversation.tutorId },
        select: { userId: true }
      });
      if (!tutor || !tutor.userId) {
        return res.status(404).json({ error: 'Tuteur non trouvé dans la conversation' });
      }
      actualReceiverId = tutor.userId;
    } else if (isTutor) {
      actualReceiverId = conversation.studentId;
    } else {
      return res.status(400).json({ error: 'Impossible de déterminer le destinataire' });
    }

    const audioUrl = `/uploads/audio-messages/${req.file.filename}`;

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId: actualReceiverId, // Utiliser le receiverId déterminé automatiquement
        content: 'Message vocal',
        messageType: 'VOICE',
        audioUrl,
        fileSize: req.file.size
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Récupérer l'expéditeur pour la notification
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    // Créer une notification pour le destinataire (sauf si c'est lui qui envoie)
    if (actualReceiverId !== userId && sender) {
      await createNotification(
        actualReceiverId,
        'TUTOR_MESSAGE',
        'Nouveau message vocal',
        `${sender.firstName} ${sender.lastName} vous a envoyé un message vocal`,
        `/messages`
      );
    }

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message vocal:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations/:id/messages/file - Envoyer un fichier
app.post('/api/conversations/:id/messages/file', authenticateToken, chatUpload.single('file'), async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    let userId = req.user.userId || req.user.id;
    const { receiverId } = req.body;

    console.log('📎 POST /api/conversations/:id/messages/file:', { conversationId, userId, hasFile: !!req.file, receiverId });

    if (!req.file || !receiverId) {
      return res.status(400).json({ error: 'Fichier et receiverId requis' });
    }

    // Gérer les deux formats de userId
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      userId = parseInt(userId);
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    // CORRECTION CRITIQUE : Déterminer automatiquement le receiverId depuis la conversation
    let actualReceiverId: number;
    
    if (isStudent) {
      const tutor = await prisma.tutor.findUnique({
        where: { id: conversation.tutorId },
        select: { userId: true }
      });
      if (!tutor || !tutor.userId) {
        return res.status(404).json({ error: 'Tuteur non trouvé dans la conversation' });
      }
      actualReceiverId = tutor.userId;
    } else if (isTutor) {
      actualReceiverId = conversation.studentId;
    } else {
      return res.status(400).json({ error: 'Impossible de déterminer le destinataire' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const fileUrl = isImage 
      ? `/uploads/chat-images/${req.file.filename}`
      : `/uploads/chat-files/${req.file.filename}`;

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId: actualReceiverId, // Utiliser le receiverId déterminé automatiquement
        content: req.file.originalname,
        messageType: isImage ? 'IMAGE' : 'FILE',
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Récupérer l'expéditeur pour la notification
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    // Créer une notification pour le destinataire (sauf si c'est lui qui envoie)
    if (actualReceiverId !== userId && sender) {
      const fileType = isImage ? 'image' : 'fichier';
      await createNotification(
        actualReceiverId,
        'TUTOR_MESSAGE',
        'Nouveau message',
        `${sender.firstName} ${sender.lastName} vous a envoyé une ${fileType}: ${req.file.originalname}`,
        `/messages`
      );
    }

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du fichier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/conversations/:conversationId/messages/:messageId - Modifier un message
app.put('/api/conversations/:conversationId/messages/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const messageId = parseInt(req.params.messageId);
    let userId = req.user.userId || req.user.id;
    const { content } = req.body;

    // Gérer les deux formats de userId
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      userId = parseInt(userId);
    }

    // Convertir userId en nombre pour comparaison
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId as string);

    // Vérifier que le message existe et appartient à la conversation
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (message.conversationId !== conversationId) {
      return res.status(400).json({ error: 'Le message n\'appartient pas à cette conversation' });
    }

    // Vérifier que l'utilisateur est l'auteur du message (comparer en nombres)
    if (message.senderId !== userIdNum) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres messages' });
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu du message ne peut pas être vide' });
    }

    // Mettre à jour le message
    const updatedMessage = await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim()
      }
    });

    // Récupérer l'expéditeur pour enrichir le message
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true
      }
    });

    // Enrichir le message avec les informations utilisateur
    const enrichedMessage = {
      ...updatedMessage,
      userId: updatedMessage.senderId,
      user: sender || {
        id: updatedMessage.senderId,
        firstName: 'Utilisateur',
        lastName: 'Inconnu',
        profilePhoto: null
      }
    };

    res.json(enrichedMessage);
  } catch (error) {
    console.error('Erreur lors de la modification du message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/conversations/:conversationId/messages/:messageId - Supprimer un message
app.delete('/api/conversations/:conversationId/messages/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const messageId = parseInt(req.params.messageId);
    let userId = req.user.userId || req.user.id;

    // Gérer les deux formats de userId
    if (typeof userId === 'string' && userId.includes('@')) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    } else if (typeof userId === 'string') {
      userId = parseInt(userId);
    }

    // Convertir userId en nombre pour comparaison
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId as string);

    // Vérifier que le message existe et appartient à la conversation
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (message.conversationId !== conversationId) {
      return res.status(400).json({ error: 'Le message n\'appartient pas à cette conversation' });
    }

    // Vérifier que l'utilisateur est l'auteur du message (comparer en nombres)
    if (message.senderId !== userIdNum) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres messages' });
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    // Supprimer les fichiers associés selon le type de message
    try {
      if (message.messageType === 'VOICE' && message.audioUrl) {
        // Message vocal : supprimer le fichier audio
        const audioPath = path.join(process.cwd(), 'uploads/audio-messages', message.audioUrl.replace(/^\/uploads\/audio-messages\//, ''));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          console.log('✅ Fichier audio supprimé:', message.audioUrl);
        }
      } else if ((message.messageType === 'IMAGE' || message.messageType === 'FILE') && message.fileUrl) {
        // Message avec fichier : supprimer le fichier
        // Déterminer le chemin selon le type
        let filePath: string;
        const fileName = message.fileUrl.replace(/^\/uploads\//, '');
        
        if (message.messageType === 'IMAGE') {
          // Les images peuvent être dans chat-images ou chat-files selon l'endpoint
          const chatImagePath = path.join(process.cwd(), 'uploads/chat-images', fileName);
          const chatFilePath = path.join(process.cwd(), 'uploads/chat-files', fileName);
          if (fs.existsSync(chatImagePath)) {
            filePath = chatImagePath;
          } else if (fs.existsSync(chatFilePath)) {
            filePath = chatFilePath;
          } else {
            filePath = chatImagePath; // Par défaut
          }
        } else {
          filePath = path.join(process.cwd(), 'uploads/chat-files', fileName);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Fichier supprimé:', message.fileUrl);
        }
      }
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier:', fileError);
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer le message
    await prisma.directMessage.delete({
      where: { id: messageId }
    });

    // Mettre à jour la date du dernier message de la conversation si c'était le dernier
    const lastMessage = await prisma.directMessage.findFirst({
      where: { conversationId: conversationId },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: lastMessage ? lastMessage.createdAt : new Date()
      }
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/conversations/:id/mark-read - Marquer les messages comme lus
app.put('/api/conversations/:id/mark-read', authenticateToken, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;

    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage des messages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

async function startServer() {
  try {
    // Essayer de se connecter à la base de données, mais ne pas échouer si impossible
    try {
      await connectDatabase();
      console.log('✅ Base de données connectée');
    } catch (dbError) {
      console.log('⚠️ Base de données non accessible:', dbError.message);
      console.log('🚀 Serveur démarré sans base de données (mode démo)');
    }
    
    // Seed database désactivé - les données seront ajoutées via l'interface admin
    // Si vous voulez réactiver le seed automatique, décommentez le code ci-dessous
    /*
    if (process.env.NODE_ENV === 'development') {
      try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          console.log('🌱 Base de données vide, initialisation avec des données de test...');
          await seedDatabase();
          console.log('✅ Données de test initialisées avec succès');
        } else {
          console.log(`📊 Base de données contient déjà ${userCount} utilisateurs`);
        }
      } catch (error: any) {
        console.log('⚠️ Erreur lors de l\'initialisation:', error.message);
      }
    }
    */
    console.log('📝 Seed automatique désactivé - Utilisez l\'interface admin pour ajouter des données');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur API en cours d'exécution sur http://localhost:${PORT}`);
      console.log(`📊 Vérification de santé: http://localhost:${PORT}/api/health`);
      console.log(`👨‍🏫 Recherche tuteurs: GET http://localhost:${PORT}/api/tutors/search`);
    });
  } catch (error) {
    console.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
}

export { app, startServer };

// Démarrer le serveur automatiquement
startServer();

