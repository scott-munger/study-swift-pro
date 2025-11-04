import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanTestConversations() {
  try {
    console.log('🧹 Nettoyage des conversations de test spécifiques...\n');

    // Rechercher les conversations avec "Étudiant Test"
    const testConversations = await prisma.conversation.findMany({
      include: {
        student: {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            content: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`📋 ${testConversations.length} conversations trouvées\n`);

    let deletedCount = 0;
    let messageCount = 0;

    for (const conv of testConversations) {
      const studentName = conv.student?.user ? `${conv.student.user.firstName} ${conv.student.user.lastName}` : 'Inconnu';
      const tutorName = conv.tutor?.user ? `${conv.tutor.user.firstName} ${conv.tutor.user.lastName}` : 'Inconnu';
      
      // Vérifier si c'est une conversation de test avec "Étudiant Test"
      const isTestConversation = 
        studentName.toLowerCase().includes('étudiant test') ||
        studentName.toLowerCase().includes('test') ||
        (conv.messages && conv.messages.some(msg => 
          msg.content.includes('📢') || 
          msg.content.includes('**n**') ||
          msg.content === '2' ||
          msg.content.includes('nn')
        ));

      if (isTestConversation) {
        console.log(`🗑️ Suppression conversation ${conv.id}: ${tutorName} avec ${studentName}`);
        
        // Compter les messages à supprimer
        const msgCount = await prisma.directMessage.count({
          where: { conversationId: conv.id }
        });
        messageCount += msgCount;
        
        // Supprimer tous les messages de la conversation
        await prisma.directMessage.deleteMany({
          where: { conversationId: conv.id }
        });
        
        // Supprimer la conversation
        await prisma.conversation.delete({
          where: { id: conv.id }
        });
        
        deletedCount++;
        console.log(`   ✅ ${msgCount} messages supprimés\n`);
      }
    }

    console.log(`\n✅ Nettoyage terminé:`);
    console.log(`   - ${deletedCount} conversations supprimées`);
    console.log(`   - ${messageCount} messages supprimés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestConversations();

