import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration multer pour les fichiers
const storage = multer.diskStorage({
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

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Middleware pour vérifier l'authentification
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  // Dans un vrai projet, vérifiez le JWT ici
  // Pour simplifier, on extrait l'userId du token (à sécuriser en production)
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

router.use(authenticateToken);

// GET /api/conversations - Récupérer toutes les conversations de l'utilisateur
router.get('/', async (req: any, res) => {
  try {
    const userId = req.userId;

    // Récupérer l'utilisateur pour savoir s'il est tuteur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    let conversations;

    if (user.role === 'TUTOR' && user.tutor) {
      // Si c'est un tuteur, récupérer les conversations où il est le tuteur
      conversations = await prisma.conversation.findMany({
        where: {
          tutorId: user.tutor.id
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
          },
          _count: {
            select: {
              messages: {
                where: {
                  receiverId: userId,
                  isRead: false
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      // Enrichir avec les informations de l'étudiant
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const student = await prisma.user.findUnique({
            where: { id: conv.studentId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          });

          return {
            ...conv,
            student,
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
            unreadCount: conv._count.messages
          };
        })
      );

      return res.json(enrichedConversations);
    } else {
      // Si c'est un étudiant, récupérer les conversations où il est l'étudiant
      conversations = await prisma.conversation.findMany({
        where: {
          studentId: userId
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
          },
          _count: {
            select: {
              messages: {
                where: {
                  receiverId: userId,
                  isRead: false
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      // Enrichir avec les informations du tuteur
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const tutor = await prisma.tutor.findUnique({
            where: { id: conv.tutorId },
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

          return {
            ...conv,
            tutor,
            lastMessage: conv.messages[0] || null,
            unreadCount: conv._count.messages
          };
        })
      );

      return res.json(enrichedConversations);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations - Créer ou récupérer une conversation
router.post('/', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { tutorId } = req.body;

    if (!tutorId) {
      return res.status(400).json({ error: 'tutorId est requis' });
    }

    // Vérifier que le tuteur existe
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
      return res.status(404).json({ error: 'Tuteur non trouvé' });
    }

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

// GET /api/conversations/:id/messages - Récupérer les messages d'une conversation
router.get('/:id/messages', async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;

    // Vérifier que l'utilisateur a accès à cette conversation
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

    const isStudent = conversation.studentId === userId;
    const isTutor = user?.tutor && conversation.tutorId === user.tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer les messages
    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations/:id/messages - Envoyer un message texte
router.post('/:id/messages', async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;
    const { content, messageType = 'TEXT', receiverId } = req.body;

    if (!content || !receiverId) {
      return res.status(400).json({ error: 'content et receiverId sont requis' });
    }

    // Vérifier l'accès à la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Créer le message
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content,
        messageType
      }
    });

    // Mettre à jour la date du dernier message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations/:id/messages/audio - Envoyer un message vocal
router.post('/:id/messages/audio', upload.single('audio'), async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;
    const { receiverId } = req.body;

    if (!req.file || !receiverId) {
      return res.status(400).json({ error: 'Fichier audio et receiverId requis' });
    }

    const audioUrl = `/uploads/audio-messages/${req.file.filename}`;

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId: parseInt(receiverId),
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

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message vocal:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/conversations/:id/messages/file - Envoyer un fichier
router.post('/:id/messages/file', upload.single('file'), async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;
    const { receiverId } = req.body;

    if (!req.file || !receiverId) {
      return res.status(400).json({ error: 'Fichier et receiverId requis' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const fileUrl = isImage 
      ? `/uploads/chat-images/${req.file.filename}`
      : `/uploads/chat-files/${req.file.filename}`;

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId: parseInt(receiverId),
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

    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du fichier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/conversations/:id/mark-read - Marquer les messages comme lus
router.put('/:id/mark-read', async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.userId;

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

export default router;

