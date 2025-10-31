import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConversations() {
  try {
    console.log('🔍 Test 1: Vérification des tables...');
    
    // Test si la table conversations existe
    const conversationsCount = await prisma.conversation.count();
    console.log(`✅ Table 'conversations' existe avec ${conversationsCount} entrées`);
    
    // Test si la table direct_messages existe  
    const messagesCount = await prisma.directMessage.count();
    console.log(`✅ Table 'direct_messages' existe avec ${messagesCount} entrées`);
    
    console.log('\n🔍 Test 2: Liste des tuteurs...');
    const tutors = await prisma.tutor.findMany({
      take: 3,
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
    
    console.log(`✅ ${tutors.length} tuteurs trouvés:`);
    tutors.forEach(t => {
      console.log(`   - Tuteur ID: ${t.id}, User ID: ${t.userId}, Nom: ${t.user.firstName} ${t.user.lastName}`);
    });
    
    console.log('\n🔍 Test 3: Test création conversation...');
    if (tutors.length > 0) {
      // Essayer de créer une conversation de test
      const testConv = await prisma.conversation.create({
        data: {
          studentId: 107, // ID étudiant de test
          tutorId: tutors[0].id
        }
      });
      console.log(`✅ Conversation créée: ID ${testConv.id}`);
      
      // Nettoyer
      await prisma.conversation.delete({
        where: { id: testConv.id }
      });
      console.log('✅ Conversation de test nettoyée');
    }
    
    console.log('\n✅ Tous les tests sont passés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('   Code erreur:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConversations();

