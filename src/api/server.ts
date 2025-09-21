import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    'https://*.netlify.app',
    'https://*.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

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
      'etudiant@test.com': { password: 'etudiant123', role: 'STUDENT', firstName: 'Étudiant', lastName: 'Test', userClass: 'Terminale A' },
      'tuteur@test.com': { password: 'tuteur123', role: 'TUTOR', firstName: 'Tuteur', lastName: 'Test', department: 'Mathématiques' }
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

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany();
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

// Forum: list posts
app.get('/api/forum/posts', async (req, res) => {
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true }
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
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
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
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
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
          select: { firstName: true, lastName: true }
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
          select: { firstName: true, lastName: true }
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
    const { firstName, lastName, userClass, section, department, phone, address } = req.body;

    // Validation des données
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom sont requis' });
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
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
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
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { likes: true } },
        likes: { select: { id: true, userId: true } }
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
      likes: reply.likes
    }));

    res.json(mappedReplies);
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({ error: 'Échec de la récupération des réponses' });
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

// Flashcards: get available subjects for user's class
app.get('/api/subjects-flashcards', authenticateToken, async (req: any, res) => {
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

    // Si c'est un tuteur ou admin, donner accès à toutes les matières
    let subjects;
    
    if (user.role === 'TUTOR' || user.role === 'ADMIN') {
      // Tuteurs et admins : accès à toutes les matières
      subjects = await prisma.subject.findMany();
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
          description: subject.description,
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

// Flashcards: get flashcards for a specific subject
app.get('/api/subject-flashcards/:subjectId', authenticateToken, async (req: any, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.userId;

    // Récupérer toutes les flashcards de la matière (pas seulement celles de l'utilisateur)
    const flashcards = await prisma.flashcard.findMany({
      where: {
        subjectId: parseInt(subjectId)
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        attempts: {
          where: {
            userId: userId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(flashcards);
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
          select: { firstName: true, lastName: true }
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
          select: { firstName: true, lastName: true }
        },
        tutor: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
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

    // Empêcher l'admin de se supprimer lui-même
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) }
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
          subjectId: parseInt(subjectId)
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
          subjectId: parseInt(subjectId)
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
app.post('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { question, answer, subjectId, difficulty, userId } = req.body;

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

    // Vérifier que l'utilisateur existe si spécifié
    let targetUserId = userId;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });
      if (!user) {
        return res.status(400).json({ error: 'Utilisateur non trouvé' });
      }
      targetUserId = parseInt(userId);
    } else {
      // Si aucun utilisateur spécifié, utiliser l'admin connecté
      targetUserId = req.user.userId;
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        subjectId: parseInt(subjectId),
        userId: targetUserId,
        difficulty: difficulty || 'MEDIUM'
      },
      include: {
        subject: {
          select: { name: true, level: true, section: true }
        },
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({
      message: 'Flashcard créée avec succès',
      flashcard
    });
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la création de la flashcard' });
  }
});

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

// GET - Toutes les flashcards (admin)
app.get('/api/admin/flashcards', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { subjectId, page = 1, limit = 50 } = req.query;
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
            select: { firstName: true, lastName: true }
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
app.delete('/api/admin/flashcards/:flashcardId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { flashcardId } = req.params;

    await prisma.flashcard.delete({
      where: { id: parseInt(flashcardId) }
    });

    res.json({ message: 'Flashcard supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la flashcard:', error);
    res.status(500).json({ error: 'Échec de la suppression de la flashcard' });
  }
});

// Start server
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
      } catch (error) {
        console.log('Database might already be seeded or connection failed');
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, startServer };

