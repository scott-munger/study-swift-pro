#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function viewDatabase() {
  try {
    console.log('🔗 Connexion à la base de données MySQL...\n');
    await prisma.$connect();
    console.log('✅ Connecté à la base de données!\n');

    // Afficher les utilisateurs
    console.log('📊 ===== UTILISATEURS =====');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    console.table(users);
    console.log(`\nTotal: ${await prisma.user.count()} utilisateurs\n`);

    // Afficher les conversations
    console.log('💬 ===== CONVERSATIONS =====');
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true
          },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(JSON.stringify(conversations, null, 2));
    console.log(`\nTotal: ${await prisma.conversation.count()} conversations\n`);

    // Afficher les messages directs
    console.log('📨 ===== MESSAGES DIRECTS =====');
    const messages = await prisma.directMessage.findMany({
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        messageType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.table(messages);
    console.log(`\nTotal: ${await prisma.directMessage.count()} messages (incluant système: ${await prisma.directMessage.count({ where: { senderId: 0 } })})\n`);

    // Messages système (senderId: 0)
    console.log('🔧 ===== MESSAGES SYSTÈME (senderId: 0) =====');
    const systemMessages = await prisma.directMessage.findMany({
      where: { senderId: 0 },
      select: {
        id: true,
        conversationId: true,
        content: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.table(systemMessages);
    console.log(`\nTotal messages système: ${systemMessages.length}\n`);

    // Statistiques générales
    console.log('📈 ===== STATISTIQUES =====');
    const stats = {
      users: await prisma.user.count(),
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      tutors: await prisma.user.count({ where: { role: 'TUTOR' } }),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      conversations: await prisma.conversation.count(),
      directMessages: await prisma.directMessage.count(),
      systemMessages: await prisma.directMessage.count({ where: { senderId: 0 } }),
      normalMessages: await prisma.directMessage.count({ where: { senderId: { not: 0 } } }),
      subjects: await prisma.subject.count(),
      flashcards: await prisma.flashcard.count(),
      forumPosts: await prisma.forumPost.count()
    };
    console.table(stats);

    // Afficher les admins
    console.log('\n👑 ===== ADMINISTRATEURS =====');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    console.table(admins);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Déconnecté de la base de données');
  }
}

viewDatabase();

