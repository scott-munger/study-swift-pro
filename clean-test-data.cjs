const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestData() {
  try {
    console.log('🧹 Nettoyage de toutes les données de test...\n');

    // 1. Supprimer tous les messages de test
    console.log('📨 Suppression des messages de test...');
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          { content: { contains: 'Bonjour professeur' } },
          { content: { contains: 'aide en mathématiques' } },
          { content: { contains: 'j\'aimerais de l\'aide' } },
          { content: { contains: 'équations du second degré' } },
          { content: { contains: 'aide en biologie' } },
        ]
      }
    });
    console.log(`✅ ${deletedMessages.count} messages supprimés`);

    // 2. Supprimer toutes les conversations de test
    console.log('\n💬 Suppression des conversations de test...');
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`✅ ${deletedConversations.count} conversations supprimées`);

    // 3. Supprimer tous les messages de groupe
    console.log('\n👥 Suppression des messages de groupe...');
    const deletedGroupMessages = await prisma.groupMessage.deleteMany({});
    console.log(`✅ ${deletedGroupMessages.count} messages de groupe supprimés`);

    // 4. Supprimer tous les groupes d'étude de test
    console.log('\n📚 Suppression des groupes d\'étude de test...');
    const deletedGroups = await prisma.studyGroup.deleteMany({});
    console.log(`✅ ${deletedGroups.count} groupes d'étude supprimés`);

    // 5. Supprimer d'abord les réponses du forum (pour éviter les contraintes de clé étrangère)
    console.log('\n💬 Suppression des réponses du forum...');
    const deletedReplies = await prisma.forumReply.deleteMany({});
    console.log(`✅ ${deletedReplies.count} réponses supprimées`);

    // 6. Supprimer tous les posts du forum (après les réponses)
    console.log('\n📝 Suppression des posts du forum...');
    const deletedPosts = await prisma.forumPost.deleteMany({});
    console.log(`✅ ${deletedPosts.count} posts supprimés`);

    // 7. Supprimer d'abord les tentatives de flashcards (pour éviter les contraintes de clé étrangère)
    console.log('\n📊 Suppression des tentatives de flashcards...');
    const deletedFlashcardAttempts = await prisma.flashcardAttempt.deleteMany({});
    console.log(`✅ ${deletedFlashcardAttempts.count} tentatives de flashcards supprimées`);

    // 8. Supprimer toutes les flashcards de test
    console.log('\n🎴 Suppression des flashcards de test...');
    const deletedFlashcards = await prisma.flashcard.deleteMany({});
    console.log(`✅ ${deletedFlashcards.count} flashcards supprimées`);

    // 9. Supprimer toutes les statistiques d'étudiants
    console.log('\n📊 Suppression des statistiques d\'étudiants...');
    const deletedStats = await prisma.studentStats.deleteMany({});
    console.log(`✅ ${deletedStats.count} statistiques supprimées`);

    // 10. Supprimer toutes les notifications
    console.log('\n🔔 Suppression des notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ ${deletedNotifications.count} notifications supprimées`);

    // 11. Supprimer les relations tutor-subject
    console.log('\n🔗 Suppression des relations tutor-subject...');
    const deletedTutorSubjects = await prisma.tutorSubject.deleteMany({});
    console.log(`✅ ${deletedTutorSubjects.count} relations tutor-subject supprimées`);

    // 12. Supprimer tous les tuteurs de test
    console.log('\n👨‍🏫 Suppression des tuteurs de test...');
    const deletedTutors = await prisma.tutor.deleteMany({});
    console.log(`✅ ${deletedTutors.count} tuteurs supprimés`);

    // 13. Note: Les utilisateurs de test ne sont pas supprimés automatiquement
    // car il peut y avoir des contraintes de clé étrangère complexes
    // Si nécessaire, supprimez-les manuellement via Prisma Studio ou l'interface admin
    console.log('\n👥 Note: Les utilisateurs de test ne sont pas supprimés automatiquement');
    console.log('   Pour les supprimer, utilisez Prisma Studio ou l\'interface admin');
    
    const deletedUsers = { count: 0 };

    // 14. Note: On garde les matières (subjects) car elles sont nécessaires pour le fonctionnement

    console.log('\n✅ Nettoyage terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`   - Messages: ${deletedMessages.count}`);
    console.log(`   - Conversations: ${deletedConversations.count}`);
    console.log(`   - Messages de groupe: ${deletedGroupMessages.count}`);
    console.log(`   - Groupes d'étude: ${deletedGroups.count}`);
    console.log(`   - Réponses forum: ${deletedReplies.count}`);
    console.log(`   - Posts forum: ${deletedPosts.count}`);
    console.log(`   - Tentatives flashcards: ${deletedFlashcardAttempts.count}`);
    console.log(`   - Flashcards: ${deletedFlashcards.count}`);
    console.log(`   - Statistiques: ${deletedStats.count}`);
    console.log(`   - Notifications: ${deletedNotifications.count}`);
    console.log(`   - Relations tutor-subject: ${deletedTutorSubjects.count}`);
    console.log(`   - Tuteurs: ${deletedTutors.count}`);
    console.log(`   - Utilisateurs: Non supprimés automatiquement (contraintes FK)`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData()
  .then(() => {
    console.log('\n🎉 Toutes les données de test ont été supprimées !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  });

