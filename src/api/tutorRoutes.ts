import { Router } from 'express';
import { prisma } from '../lib/database';

const router = Router();

// Middleware d'authentification (à importer depuis server.ts)
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
};

// ============================================
// ENDPOINTS TUTEURS - Recherche et Profils
// ============================================

// GET - Rechercher des tuteurs
router.get('/tutors/search', async (req, res) => {
  try {
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

    const tutors = await prisma.tutor.findMany({
      where,
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

    res.json(filteredTutors);
  } catch (error) {
    console.error('Erreur recherche tuteurs:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de tuteurs' });
  }
});

// GET - Profil détaillé d'un tuteur
router.get('/tutors/:id', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.id);

    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            phone: true
          }
        },
        tutorSubjects: {
          include: {
            subject: true
          }
        },
        reviews: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        sessions: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            subject: true,
            rating: true,
            scheduledAt: true
          },
          orderBy: {
            scheduledAt: 'desc'
          },
          take: 10
        },
        tutorGroups: {
          where: {
            isActive: true
          },
          include: {
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            sessions: true
          }
        }
      }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Tuteur non trouvé' });
    }

    res.json(tutor);
  } catch (error) {
    console.error('Erreur récupération profil tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// POST - Devenir tuteur
router.post('/tutors/become-tutor', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { experience, bio, hourlyRate, subjects, specialties, languages, education, certifications } = req.body;

    // Vérifier si l'utilisateur est déjà tuteur
    const existingTutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (existingTutor) {
      return res.status(400).json({ error: 'Vous êtes déjà tuteur' });
    }

    // Créer le profil tuteur
    const tutor = await prisma.tutor.create({
      data: {
        userId,
        experience: parseInt(experience),
        bio,
        hourlyRate: parseFloat(hourlyRate),
        specialties: JSON.stringify(specialties || []),
        languages,
        education,
        certifications,
        isAvailable: true,
        isOnline: true
      }
    });

    // Ajouter les matières
    if (subjects && subjects.length > 0) {
      await Promise.all(
        subjects.map((subjectId: number) =>
          prisma.tutorSubject.create({
            data: {
              tutorId: tutor.id,
              subjectId
            }
          })
        )
      );
    }

    // Mettre à jour le rôle de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'TUTOR' }
    });

    res.json({ 
      message: 'Profil tuteur créé avec succès',
      tutor 
    });
  } catch (error) {
    console.error('Erreur création profil tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du profil tuteur' });
  }
});

// PUT - Mettre à jour le profil tuteur
router.put('/tutors/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { bio, hourlyRate, isAvailable, specialties, languages, education, certifications, subjects } = req.body;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    // Mettre à jour le profil
    const updatedTutor = await prisma.tutor.update({
      where: { id: tutor.id },
      data: {
        bio,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        isAvailable,
        specialties: specialties ? JSON.stringify(specialties) : undefined,
        languages,
        education,
        certifications
      }
    });

    // Mettre à jour les matières si fournies
    if (subjects && subjects.length > 0) {
      // Supprimer les anciennes matières
      await prisma.tutorSubject.deleteMany({
        where: { tutorId: tutor.id }
      });

      // Ajouter les nouvelles
      await Promise.all(
        subjects.map((subjectId: number) =>
          prisma.tutorSubject.create({
            data: {
              tutorId: tutor.id,
              subjectId
            }
          })
        )
      );
    }

    res.json({ 
      message: 'Profil mis à jour avec succès',
      tutor: updatedTutor 
    });
  } catch (error) {
    console.error('Erreur mise à jour profil tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT - Changer le statut en ligne/hors ligne
router.put('/tutors/status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { isOnline } = req.body;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    await prisma.tutor.update({
      where: { id: tutor.id },
      data: { isOnline }
    });

    res.json({ message: `Statut mis à jour: ${isOnline ? 'en ligne' : 'hors ligne'}` });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// ============================================
// ENDPOINTS SESSIONS - Réservations
// ============================================

// POST - Réserver une session
router.post('/sessions/book', authenticateToken, async (req: any, res) => {
  try {
    const studentId = req.user.userId;
    const { tutorId, subject, duration, scheduledAt, notes } = req.body;

    // Vérifier que le tuteur existe et est disponible
    const tutor = await prisma.tutor.findUnique({
      where: { id: parseInt(tutorId) }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Tuteur non trouvé' });
    }

    if (!tutor.isAvailable) {
      return res.status(400).json({ error: 'Ce tuteur n\'accepte pas de nouvelles sessions' });
    }

    // Calculer le prix
    const price = tutor.hourlyRate ? (tutor.hourlyRate * duration) / 60 : 0;

    // Calculer l'heure de fin
    const scheduledDate = new Date(scheduledAt);
    const endDate = new Date(scheduledDate.getTime() + duration * 60000);

    // Créer la session
    const session = await prisma.tutorSession.create({
      data: {
        tutorId: parseInt(tutorId),
        studentId,
        subject,
        duration: parseInt(duration),
        scheduledAt: scheduledDate,
        endAt: endDate,
        notes,
        price,
        status: 'SCHEDULED'
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Créer une notification pour le tuteur
    await prisma.notification.create({
      data: {
        userId: tutor.userId,
        type: 'SESSION_REQUEST',
        title: 'Nouvelle demande de session',
        message: `${session.student.firstName} ${session.student.lastName} a réservé une session de ${subject} pour le ${scheduledDate.toLocaleDateString('fr-FR')}`,
        link: `/tutor/sessions/${session.id}`
      }
    });

    res.json({ 
      message: 'Session réservée avec succès',
      session 
    });
  } catch (error) {
    console.error('Erreur réservation session:', error);
    res.status(500).json({ error: 'Erreur lors de la réservation de la session' });
  }
});

// GET - Récupérer les sessions d'un étudiant
router.get('/sessions/student', authenticateToken, async (req: any, res) => {
  try {
    const studentId = req.user.userId;

    const sessions = await prisma.tutorSession.findMany({
      where: { studentId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Erreur récupération sessions étudiant:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// GET - Récupérer les sessions d'un tuteur
router.get('/sessions/tutor', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    const sessions = await prisma.tutorSession.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            profilePhoto: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Erreur récupération sessions tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// PUT - Confirmer/Annuler une session (tuteur)
router.put('/sessions/:id/status', authenticateToken, async (req: any, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user.userId;

    const session = await prisma.tutorSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: true,
        student: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier que c'est le tuteur qui modifie
    if (session.tutor.userId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updatedSession = await prisma.tutorSession.update({
      where: { id: sessionId },
      data: { status }
    });

    // Créer une notification pour l'étudiant
    let notificationMessage = '';
    if (status === 'IN_PROGRESS') {
      notificationMessage = `Votre session avec ${session.tutor.user.firstName} ${session.tutor.user.lastName} a commencé`;
    } else if (status === 'COMPLETED') {
      notificationMessage = `Votre session avec ${session.tutor.user.firstName} ${session.tutor.user.lastName} est terminée`;
    } else if (status === 'CANCELLED') {
      notificationMessage = `Votre session avec ${session.tutor.user.firstName} ${session.tutor.user.lastName} a été annulée`;
    }

    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          userId: session.studentId,
          type: 'SESSION_REMINDER',
          title: 'Mise à jour de session',
          message: notificationMessage,
          link: `/student/sessions/${sessionId}`
        }
      });
    }

    res.json({ 
      message: 'Statut de la session mis à jour',
      session: updatedSession 
    });
  } catch (error) {
    console.error('Erreur mise à jour statut session:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// PUT - Noter une session (étudiant)
router.put('/sessions/:id/rate', authenticateToken, async (req: any, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { rating, feedback } = req.body;
    const userId = req.user.userId;

    const session = await prisma.tutorSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier que c'est l'étudiant qui note
    if (session.studentId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (session.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Vous ne pouvez noter que les sessions terminées' });
    }

    // Mettre à jour la session
    await prisma.tutorSession.update({
      where: { id: sessionId },
      data: {
        rating: parseInt(rating),
        feedback
      }
    });

    // Créer ou mettre à jour l'avis
    await prisma.review.upsert({
      where: {
        tutorId_studentId: {
          tutorId: session.tutorId,
          studentId: userId
        }
      },
      create: {
        tutorId: session.tutorId,
        studentId: userId,
        rating: parseInt(rating),
        comment: feedback
      },
      update: {
        rating: parseInt(rating),
        comment: feedback
      }
    });

    // Recalculer la note moyenne du tuteur
    const reviews = await prisma.review.findMany({
      where: { tutorId: session.tutorId }
    });

    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await prisma.tutor.update({
      where: { id: session.tutorId },
      data: { rating: avgRating }
    });

    res.json({ message: 'Session notée avec succès' });
  } catch (error) {
    console.error('Erreur notation session:', error);
    res.status(500).json({ error: 'Erreur lors de la notation de la session' });
  }
});

// ============================================
// ENDPOINTS MESSAGERIE DIRECTE
// ============================================

// POST - Envoyer un message à un tuteur
router.post('/messages/send', authenticateToken, async (req: any, res) => {
  try {
    const senderId = req.user.userId;
    const { tutorId, content } = req.body;

    const message = await prisma.directMessage.create({
      data: {
        senderId,
        receiverId: parseInt(tutorId),
        content
      }
    });

    // Créer une notification pour le tuteur
    const tutor = await prisma.tutor.findUnique({
      where: { id: parseInt(tutorId) },
      include: {
        user: true
      }
    });

    if (tutor) {
      await prisma.notification.create({
        data: {
          userId: tutor.userId,
          type: 'TUTOR_MESSAGE',
          title: 'Nouveau message',
          message: `Vous avez reçu un nouveau message`,
          link: `/tutor/messages`
        }
      });
    }

    res.json({ message: 'Message envoyé', data: message });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

// GET - Récupérer les messages avec un tuteur
router.get('/messages/conversation/:tutorId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const tutorId = parseInt(req.params.tutorId);

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: tutorId },
          { senderId: tutorId, receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Marquer les messages comme lus
    await prisma.directMessage.updateMany({
      where: {
        receiverId: userId,
        senderId: tutorId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// GET - Récupérer toutes les conversations d'un tuteur
router.get('/messages/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    // Récupérer tous les messages
    const messages = await prisma.directMessage.findMany({
      where: {
        receiverId: tutor.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Grouper par expéditeur
    const conversationsMap = new Map();
    
    for (const message of messages) {
      if (!conversationsMap.has(message.senderId)) {
        const sender = await prisma.user.findUnique({
          where: { id: message.senderId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        });

        conversationsMap.set(message.senderId, {
          user: sender,
          lastMessage: message,
          unreadCount: messages.filter(m => m.senderId === message.senderId && !m.isRead).length
        });
      }
    }

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
});

// ============================================
// ENDPOINTS GROUPES DE TUTEURS
// ============================================

// POST - Créer un groupe (tuteur)
router.post('/tutor-groups/create', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, subjectId, maxStudents, price, schedule, startDate, endDate, meetingLink } = req.body;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    const group = await prisma.tutorGroup.create({
      data: {
        tutorId: tutor.id,
        name,
        description,
        subjectId: subjectId ? parseInt(subjectId) : undefined,
        maxStudents: parseInt(maxStudents) || 10,
        price: parseFloat(price),
        schedule: JSON.stringify(schedule || {}),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        meetingLink,
        isActive: true
      }
    });

    res.json({ 
      message: 'Groupe créé avec succès',
      group 
    });
  } catch (error) {
    console.error('Erreur création groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la création du groupe' });
  }
});

// GET - Récupérer les groupes d'un tuteur
router.get('/tutor-groups/my-groups', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Profil tuteur non trouvé' });
    }

    const groups = await prisma.tutorGroup.findMany({
      where: { tutorId: tutor.id },
      include: {
        members: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true,
                email: true
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

    res.json(groups);
  } catch (error) {
    console.error('Erreur récupération groupes tuteur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des groupes' });
  }
});

// GET - Rechercher des groupes (étudiants)
router.get('/tutor-groups/search', async (req, res) => {
  try {
    const { subject, maxPrice } = req.query;

    const where: any = {
      isActive: true
    };

    if (maxPrice) {
      where.price = {
        lte: parseFloat(maxPrice as string)
      };
    }

    if (subject) {
      where.subjectId = parseInt(subject as string);
    }

    const groups = await prisma.tutorGroup.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: {
              select: {
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

    res.json(groups);
  } catch (error) {
    console.error('Erreur recherche groupes:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de groupes' });
  }
});

// POST - Rejoindre un groupe (étudiant)
router.post('/tutor-groups/:id/join', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const studentId = req.user.userId;

    const group = await prisma.tutorGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    if (!group.isActive) {
      return res.status(400).json({ error: 'Ce groupe n\'est plus actif' });
    }

    if (group._count.members >= group.maxStudents) {
      return res.status(400).json({ error: 'Ce groupe est complet' });
    }

    // Vérifier si l'étudiant est déjà membre
    const existingMember = await prisma.tutorGroupMember.findUnique({
      where: {
        groupId_studentId: {
          groupId,
          studentId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Vous êtes déjà membre de ce groupe' });
    }

    const member = await prisma.tutorGroupMember.create({
      data: {
        groupId,
        studentId,
        status: 'PENDING' // En attente de paiement
      }
    });

    // Incrémenter le compteur de membres
    await prisma.tutorGroup.update({
      where: { id: groupId },
      data: {
        currentStudents: {
          increment: 1
        }
      }
    });

    res.json({ 
      message: 'Demande d\'adhésion envoyée',
      member 
    });
  } catch (error) {
    console.error('Erreur adhésion groupe:', error);
    res.status(500).json({ error: 'Erreur lors de l\'adhésion au groupe' });
  }
});

export default router;



