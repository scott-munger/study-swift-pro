import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Role } from '@prisma/client';
import { prisma, connectDatabase, seedDatabase } from '../lib/database';

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || '*',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8082',
    'https://*.netlify.app',
    'https://*.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


// Middleware pour vérifier l'authentification
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur en cours d\'exécution' });
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


// Endpoint d'initialisation des tables et comptes de test
app.post('/api/init', async (req, res) => {
  try {
    console.log('🚀 Initialisation des tables et comptes de test...');
    
    if (!prisma) {
      return res.status(503).json({ 
        error: 'Base de données non connectée - Mode démo activé',
        demo: true,
        message: 'Utilisez les comptes de démonstration'
      });
    }

    // Créer les comptes de test
    const testAccounts = [
      {
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN'
      },
      {
        email: 'etudiant@test.com',
        password: 'etudiant123',
        firstName: 'Étudiant',
        lastName: 'Test',
        role: 'STUDENT',
        userClass: 'Terminale A',
        section: 'A'
      },
      {
        email: 'tuteur@test.com',
        password: 'tuteur123',
        firstName: 'Tuteur',
        lastName: 'Test',
        role: 'TUTOR',
        department: 'Mathématiques'
      }
    ];

    const createdUsers = [];

    for (const account of testAccounts) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: account.email }
        });

        if (existingUser) {
          console.log(`⚠️ Utilisateur ${account.email} existe déjà`);
          createdUsers.push({ email: account.email, status: 'exists' });
          continue;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(account.password, 10);

        // Créer l'utilisateur
        const user = await prisma.user.create({
          data: {
            email: account.email,
            password: hashedPassword,
            firstName: account.firstName,
            lastName: account.lastName,
            role: account.role as any,
            userClass: account.userClass || null,
            section: account.section || null,
            department: account.department || null
          }
        });

        console.log(`✅ Utilisateur créé : ${account.email} (${account.role})`);
        createdUsers.push({ email: account.email, status: 'created', role: account.role });
      } catch (error) {
        console.error(`❌ Erreur lors de la création de ${account.email}:`, error);
        createdUsers.push({ email: account.email, status: 'error', error: error.message });
      }
    }

    res.json({
      status: 'OK',
      message: 'Initialisation terminée',
      users: createdUsers
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'initialisation',
      details: error.message
    });
  }
});

// Endpoint de démonstration qui fonctionne sans base de données
app.post('/api/demo/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
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

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, mot de passe, prénom et nom sont requis' 
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
        address: address || null
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Échec de l\'inscription' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Échec de la connexion' });
  }
});

// GET - Récupérer tous les chapitres
app.get('/api/chapters', authenticateToken, async (req: any, res) => {
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
    const subjects = await prisma.subject.findMany({
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
    const tutors = await prisma.tutor.findMany({
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

    // Mapper vers le format attendu par le frontend
    const mapped = tutors.map((t) => ({
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
app.put('/api/forum/replies/:replyId', authenticateToken, async (req: any, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Vérifier que la réponse existe et que l'utilisateur est l'auteur
    const existingReply = await prisma.forumReply.findUnique({
      where: { id: parseInt(replyId) },
      include: { author: true }
    });

    if (!existingReply) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    if (existingReply.authorId !== userId) {
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
app.delete('/api/forum/replies/:replyId', authenticateToken, async (req: any, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.userId;

    // Vérifier que la réponse existe et que l'utilisateur est l'auteur
    const existingReply = await prisma.forumReply.findUnique({
      where: { id: parseInt(replyId) },
      include: { author: true }
    });

    if (!existingReply) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    if (existingReply.authorId !== userId) {
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
app.post('/api/forum/posts', async (req, res) => {
  try {
    const { title, content, subjectId, authorId } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ error: 'Titre, contenu et auteur requis' });
    }

    const created = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: parseInt(authorId),
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

    res.status(201).json(post);
  } catch (error) {
    console.error('Erreur lors de la création du post du forum:', error);
    res.status(500).json({ error: 'Échec de la création du post' });
  }
});

// Forum: update post
app.put('/api/forum/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, subjectId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
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

    const post = {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      author: {
        id: updated.author.id,
        firstName: updated.author.firstName,
        lastName: updated.author.lastName,
        role: updated.author.role
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

    res.json(post);
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
        subject: true
      }
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
    const { question, answer, subjectId, difficulty } = req.body;
    const userId = req.user.userId;

    console.log('Données reçues:', { question, answer, subjectId, difficulty, userId });

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

    console.log('Matière trouvée:', subject);

    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        userId: userId,
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
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
    const { question, answer, subjectId, difficulty } = req.body;
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

    const flashcard = await prisma.flashcard.update({
      where: { id: parseInt(id) },
      data: {
        question: question || existingFlashcard.question,
        answer: answer || existingFlashcard.answer,
        subjectId: subjectId ? parseInt(subjectId) : existingFlashcard.subjectId,
        difficulty: difficulty || existingFlashcard.difficulty
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
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
    await seedDatabase();
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
        userClass: true,
        section: true,
        department: true,
        phone: true,
        address: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

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

    // Validation classe/section pour profil
    const allowedClasses = ['9ème', 'Terminale'];
    const allowedSectionsByClass: Record<string, string[]> = {
      '9ème': ['A', 'B', 'C', 'D'],
      'Terminale': ['SMP', 'SVT', 'SES', 'LLA']
    };
    if (userClass && !allowedClasses.includes(userClass)) {
      return res.status(400).json({ error: `Classe invalide. Valeurs autorisées: ${allowedClasses.join(', ')}` });
    }
    if (section) {
      const cls = userClass || (await prisma.user.findUnique({ where: { id: req.user.userId }, select: { userClass: true } }))?.userClass;
      if (!cls || !(allowedSectionsByClass[cls] || []).includes(section)) {
        return res.status(400).json({ error: `Section invalide pour ${cls || 'classe inconnue'}. Autorisées: ${(allowedSectionsByClass[cls || 'Terminale'] || []).join(', ')}` });
      }
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

// Forum: delete post
app.delete('/api/forum/posts/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est l'auteur du post
    const post = await prisma.forumPost.findUnique({
      where: { id: parseInt(id) },
      select: { authorId: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Non autorisé à supprimer ce post' });
    }

    await prisma.forumPost.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du post du forum:', error);
    res.status(500).json({ error: 'Échec de la suppression du post' });
  }
});

// Forum: like/unlike post
app.post('/api/forum/posts/:id/like', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const postId = parseInt(id);

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
      // Filtrer par classe de l'utilisateur
      flashcardWhereClause.subject = {
        section: user.section || 'Général'
      };
    }

    const flashcards = await prisma.flashcard.findMany({
      where: flashcardWhereClause,
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        },
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
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
    
    if (user.role === 'TUTOR' || user.role === 'ADMIN') {
      // Tuteurs et admins : accès à toutes les matières
      subjects = await prisma.subject.findMany({
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

      // Filtrer selon le niveau ET la section
      subjects = await prisma.subject.findMany({
        where: {
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

    // Enrichir avec les vraies statistiques
    const enrichedSubjects = await Promise.all(
      subjects.map(async (subject) => {
        const totalFlashcards = await prisma.flashcard.count({
          where: { subjectId: subject.id }
        });

        const subjectAttempts = attempts.filter(a => a.flashcard.subjectId === subject.id);
        const completedFlashcards = new Set(subjectAttempts.map(a => a.flashcardId)).size;
        const correctAttempts = subjectAttempts.filter(a => a.isCorrect).length;
        const accuracy = subjectAttempts.length > 0 ? (correctAttempts / subjectAttempts.length) * 100 : 0;
        const progress = totalFlashcards > 0 ? (completedFlashcards / totalFlashcards) * 100 : 0;

        return {
          id: subject.id,
          name: subject.name,
          level: subject.level,
          section: subject.section,
          description: subject.description,
          chapters: subject.chapters,
          totalFlashcards: totalFlashcards,
          completedFlashcards: completedFlashcards,
          accuracy: Math.round(accuracy * 100) / 100,
          progress: Math.round(progress * 100) / 100
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

// Middleware pour vérifier les droits admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    // Gérer les deux formats de token (userId comme email ou comme ID numérique, ou id)
    let whereClause;
    const userId = req.user.userId || req.user.id;
    
    if (typeof userId === 'string' && userId.includes('@')) {
      // userId est un email
      whereClause = { email: userId };
    } else {
      // userId est un ID numérique
      whereClause = { id: userId };
    }
    
    const user = await prisma.user.findUnique({
      where: whereClause,
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur de vérification des droits' });
  }
};

// Admin: get all forum images
app.get('/api/admin/forum/images', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/forum/images/:imageId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/forum/images', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      totalMessages,
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
      prisma.message.count(),
      prisma.flashcard.count(),
      prisma.forumPost.count(),
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

    res.json({
      totalUsers,
      activeUsers,
      totalTutors,
      verifiedTutors,
      totalMessages,
      totalSessions,
      revenue,
      systemHealth,
      breakdown: {
        students: totalStudents,
        tutors: totalTutors,
        admins: totalAdmins,
        flashcards: totalFlashcards,
        forumPosts: totalForumPosts
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques' });
  }
});

// GET - Posts du forum pour admin (modération)
app.get('/api/admin/forum-posts', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
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
        email: `${post.author.firstName.toLowerCase()}.${post.author.lastName.toLowerCase()}@test.com`,
        role: post.author.role
      },
      subject: post.subject?.name || 'Général',
      createdAt: post.createdAt.toISOString(),
      status: post.isLocked ? 'rejected' : 'approved', // Simplification pour la démo
      likes: post._count.likes,
      replies: post._count.replies,
      reports: 0, // Pas encore implémenté
      isPinned: post.isPinned
    }));

    res.json(mappedPosts);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts du forum:', error);
    res.status(500).json({ error: 'Échec de la récupération des posts' });
  }
});

// POST - Modération de post (admin)
app.post('/api/admin/moderate-post/:postId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: any, res) => {
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
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        subject: {
          select: { id: true, name: true }
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
app.delete('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/forum-posts', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/activities', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
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

    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des utilisateurs' });
  }
});

// GET - Utilisateur individuel (admin)
app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/tutors', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const tutors = await prisma.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true,
            createdAt: true
          }
        },
        tutorSubjects: {
          include: {
            subject: {
              select: { name: true, level: true }
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

    res.json(tutors);
  } catch (error) {
    console.error('Erreur lors de la récupération des tuteurs admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des tuteurs' });
  }
});

// GET - Posts du forum pour modération (admin)
app.get('/api/admin/forum-posts', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const posts = await prisma.forumPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        subject: {
          select: { name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(posts);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts forum admin:', error);
    res.status(500).json({ error: 'Échec de la récupération des posts' });
  }
});

// PUT - Mettre à jour le rôle d'un utilisateur (admin)
app.put('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
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

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ error: 'Échec de la création de l\'utilisateur' });
  }
});

// PUT - Mettre à jour un utilisateur (admin)
app.put('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { email, firstName, lastName, role, userClass, section, department, phone, address } = req.body;

    // Validation classe/section
    const allowedClasses = ['9ème', 'Terminale'];
    const allowedSectionsByClass: Record<string, string[]> = {
      '9ème': ['A', 'B', 'C', 'D'],
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
    if (section) {
      const current = await prisma.user.findUnique({ where: { id: parseInt(userId) }, select: { userClass: true } });
      const cls = userClass || current?.userClass || '';
      const allowed = allowedSectionsByClass[cls] || [];
      if (!allowed.includes(section)) {
        return res.status(400).json({ error: `Section invalide pour ${cls || 'classe inconnue'}. Autorisées: ${allowed.join(', ')}` });
      }
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
app.put('/api/admin/users/:userId/password', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.post('/api/admin/tutors', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/tutors/:tutorId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/tutors/:tutorId', authenticateToken, requireAdmin, async (req: any, res) => {
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

// PUT - Modérer un post du forum (admin)
app.put('/api/admin/forum-posts/:postId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const { isPinned, isLocked, action } = req.body;

    if (action === 'delete') {
      await prisma.forumPost.delete({
        where: { id: parseInt(postId) }
      });
      return res.json({ message: 'Post supprimé avec succès' });
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id: parseInt(postId) },
      data: {
        isPinned: isPinned !== undefined ? Boolean(isPinned) : undefined,
        isLocked: isLocked !== undefined ? Boolean(isLocked) : undefined,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        subject: {
          select: { name: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    res.json({
      message: 'Post modéré avec succès',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erreur lors de la modération du post:', error);
    res.status(500).json({ error: 'Échec de la modération du post' });
  }
});

// ===== ROUTES CRUD MATIÈRES =====

// GET - Toutes les matières (admin)
app.get('/api/admin/subjects', authenticateToken, requireAdmin, async (req: any, res) => {
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

    res.json(subjects);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Échec de la récupération des matières' });
  }
});

// POST - Créer une nouvelle flashcard (admin)

// POST - Créer une nouvelle matière (admin)
app.post('/api/admin/subjects', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/subjects/:subjectId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/subjects/:subjectId', authenticateToken, requireAdmin, async (req: any, res) => {
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
    const { subjectId, page = 1, limit = 1000 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let whereClause: any = {};
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where: whereClause,
        include: {
          subject: {
            select: { name: true, level: true, section: true }
          },
          user: {
            select: { firstName: true, lastName: true, profilePhoto: true }
          },
          _count: {
            select: { attempts: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.flashcard.count({ where: whereClause })
    ]);

    res.json({
      flashcards,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// GET - Toutes les flashcards (admin)
app.get('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId, page = 1, limit = 1000 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = subjectId ? { subjectId: parseInt(subjectId) } : {};

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        include: {
          subject: {
            select: { name: true, level: true }
          },
          user: {
            select: { firstName: true, lastName: true, profilePhoto: true }
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
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// DELETE - Supprimer une flashcard (admin)
app.put('/api/admin/flashcards/:flashcardId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { flashcardId } = req.params;
    const { question, answer, subjectId, difficulty } = req.body;

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

    // Vérifier que la flashcard existe
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { id: parseInt(flashcardId) }
    });

    if (!existingFlashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée' });
    }

    const flashcard = await prisma.flashcard.update({
      where: { id: parseInt(flashcardId) },
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        user: {
          select: { firstName: true, lastName: true, profilePhoto: true }
        }
      }
    });

    res.json({ 
      message: 'Flashcard mise à jour avec succès', 
      flashcard 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la flashcard', details: error.message });
  }
});

app.delete('/api/admin/flashcards/:flashcardId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { flashcardId } = req.params;

    // Supprimer d'abord les tentatives associées
    await prisma.flashcardAttempt.deleteMany({
      where: { flashcardId: parseInt(flashcardId) }
    });

    // Puis supprimer la flashcard
    await prisma.flashcard.delete({
      where: { id: parseInt(flashcardId) }
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
            concept: true
          },
          orderBy: { id: 'asc' }
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
app.post('/api/admin/knowledge-tests', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.post('/api/admin/tests/import', authenticateToken, requireAdmin, async (req: any, res) => {
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
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      const testTitle = row.title;
      if (!testGroups.has(testTitle)) {
        testGroups.set(testTitle, {
          title: testTitle,
          subject: row.subject,
          description: row.description || '',
          timeLimit: parseInt(row.timeLimit) || 30,
          passingScore: parseInt(row.passingScore) || 60,
          questions: []
        });
      }
      
      // Ajouter la question au test
      const question = {
        question: row.question,
        type: row.type || 'MULTIPLE_CHOICE',
        correctAnswer: row.correctAnswer,
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
app.get('/api/admin/knowledge-tests', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = subjectId ? { subjectId: parseInt(subjectId) } : {};

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
        take: parseInt(limit)
      }),
      prisma.knowledgeTest.count({ where })
    ]);

    res.json({
      tests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    res.status(500).json({ error: 'Échec de la récupération des tests' });
  }
});

// Admin: Get questions for a test (DOIT être avant /:testId)
app.get('/api/admin/knowledge-tests/:testId/questions', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { testId } = req.params;
    
    const questions = await prisma.knowledgeQuestion.findMany({
      where: { testId: parseInt(testId) },
      orderBy: { id: 'asc' }
    });

    res.json(questions);
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ error: 'Échec de la récupération des questions' });
  }
});

// Admin: Add question to test (DOIT être avant /:testId)
app.post('/api/admin/knowledge-tests/:testId/questions', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { testId } = req.params;
    const { question, type, correctAnswer, explanation, difficulty, concept, options } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question et réponse correcte sont requis' });
    }

    const newQuestion = await prisma.knowledgeQuestion.create({
      data: {
        testId: parseInt(testId),
        question,
        type: type || 'MULTIPLE_CHOICE',
        correctAnswer,
        explanation: explanation || '',
        difficulty: difficulty || 'MEDIUM',
        concept: concept || '',
        options: options || null
      }
    });

    res.json(newQuestion);
  } catch (error) {
    console.error('Erreur lors de la création de la question:', error);
    res.status(500).json({ error: 'Échec de la création de la question' });
  }
});

// Admin: Get single knowledge test
app.get('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.put('/api/admin/knowledge-questions/:questionId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { questionId } = req.params;
    const { question, type, correctAnswer, explanation, difficulty, concept, options } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question et réponse correcte sont requis' });
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
        options: options || null
      }
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la question:', error);
    res.status(500).json({ error: 'Échec de la mise à jour de la question' });
  }
});

// Admin: Delete question
app.delete('/api/admin/knowledge-questions/:questionId', authenticateToken, requireAdmin, async (req: any, res) => {
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

// Admin: Get all flashcards
app.get('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId, page = 1, limit = 100 } = req.query;
    
    const where = subjectId ? { subjectId: parseInt(subjectId) } : {};
    
    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        include: {
          subject: {
            select: { id: true, name: true, level: true, section: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.flashcard.count({ where })
    ]);

    res.json({
      flashcards,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    res.status(500).json({ error: 'Échec de la récupération des flashcards' });
  }
});

// Admin: Create flashcard
app.post('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { question, answer, subjectId, difficulty, chapterId } = req.body;

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
      targetUserId = req.user.userId;
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
app.put('/api/admin/flashcards/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { question, answer, subjectId, difficulty, chapterId } = req.body;

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
app.delete('/api/admin/flashcards/:id', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.delete('/api/admin/knowledge-tests/:testId', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.post('/api/admin/chapters', authenticateToken, requireAdmin, async (req: any, res) => {
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

// Get all study groups (avec filtrage optionnel)
app.get('/api/study-groups', authenticateToken, async (req: any, res) => {
  try {
    const { subjectId } = req.query;
    const userId = req.user.userId;

    const where: any = {};
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    const groups = await prisma.studyGroup.findMany({
      where,
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
    const groupsWithMembership = groups.map(group => ({
      ...group,
      isMember: group.members.some(m => m.userId === userId),
      isCreator: group.creatorId === userId
    }));

    res.json(groupsWithMembership);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ error: 'Échec de la récupération des groupes' });
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

    // Récupérer les utilisateurs étudiants qui ne sont pas déjà membres
    const availableUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        id: {
          notIn: memberIds
        },
        // Filtrer par classe et section si spécifiées
        ...(group.userClass && { userClass: group.userClass }),
        ...(group.section && { section: group.section })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userClass: true,
        section: true
      },
      orderBy: [
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

    res.json({ message: 'Vous avez quitté le groupe avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sortie du groupe:', error);
    res.status(500).json({ error: 'Échec de la sortie du groupe' });
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

    await prisma.studyGroup.delete({
      where: { id: groupId }
    });

    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe:', error);
    res.status(500).json({ error: 'Échec de la suppression du groupe' });
  }
});

// Get messages for a study group
app.get('/api/study-groups/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;

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
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100 // Limiter à 100 messages récents
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Échec de la récupération des messages' });
  }
});

// Post a message to a study group
app.post('/api/study-groups/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

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

    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        userId,
        content: content.trim()
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

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Échec de l\'envoi du message' });
  }
});

// GET - Données d'activité pour les graphiques
app.get('/api/admin/activity-data', authenticateToken, requireAdmin, async (req: any, res) => {
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
app.get('/api/admin/system-health', authenticateToken, requireAdmin, async (req: any, res) => {
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

// GET - Statistiques étudiant
app.get('/api/student/dashboard-stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Récupérer les statistiques de l'étudiant
    const [flashcardsCompleted, totalAttempts, averageScore, studyStreak] = await Promise.all([
      // Nombre de flashcards complétées
      prisma.flashcard.count({
        where: { userId: userId }
      }),
      
      // Nombre total de tentatives de tests
      prisma.knowledgeTestResult.count({
        where: { userId: userId }
      }),
      
      // Score moyen des tests
      prisma.knowledgeTestResult.aggregate({
        where: { userId: userId },
        _avg: { score: true }
      }),
      
      // Série d'étude (simulation basée sur l'activité récente)
      prisma.flashcard.count({
        where: {
          userId: userId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
          }
        }
      })
    ]);

    // Calculer le temps d'étude (simulation basée sur l'activité)
    const timeSpent = Math.floor(flashcardsCompleted * 2 + totalAttempts * 5); // minutes
    const hours = Math.floor(timeSpent / 60);
    const minutes = timeSpent % 60;

    // Récupérer les matières avec progression
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            flashcards: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    const subjectProgress = subjects.map(subject => {
      const totalFlashcards = subject._count.flashcards;
      const progress = totalFlashcards > 0 ? Math.min(100, (totalFlashcards / 10) * 100) : 0;
      
      return {
        name: subject.name,
        progress: Math.round(progress),
        color: `text-${['blue', 'green', 'purple', 'orange', 'red', 'yellow'][Math.floor(Math.random() * 6)]}-600`
      };
    });

    const stats = {
      flashcardsCompleted,
      studyStreak: Math.min(studyStreak, 30), // Max 30 jours
      averageScore: Math.round(averageScore._avg.score || 0),
      timeSpent: `${hours}h ${minutes}m`,
      totalAttempts,
      subjectProgress
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques étudiant:', error);
    res.status(500).json({ error: 'Échec de la récupération des statistiques étudiant' });
  }
});

// GET - Statistiques par matière
app.get('/api/admin/subject-stats', authenticateToken, requireAdmin, async (req: any, res) => {
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
    
    // Seed database in development
    if (process.env.NODE_ENV === 'development') {
      try {
        await seedDatabase();
        console.log('🌱 Données de test initialisées avec succès');
      } catch (error) {
        console.log('⚠️ Base de données déjà initialisée ou erreur de connexion:', error.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Serveur API en cours d'exécution sur http://localhost:${PORT}`);
      console.log(`📊 Vérification de santé: http://localhost:${PORT}/api/health`);
      console.log(`🌱 Initialisation de la base de données: POST http://localhost:${PORT}/api/seed`);
    });
  } catch (error) {
    console.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
}

export { app, startServer };

