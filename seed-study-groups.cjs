const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedStudyGroups() {
  try {
    console.log('🌱 Début du seeding des groupes d\'étude...');

    // Récupérer quelques utilisateurs et matières
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 5,
      select: { id: true, firstName: true, lastName: true, userClass: true, section: true }
    });

    const subjects = await prisma.subject.findMany({
      take: 5,
      select: { id: true, name: true, level: true, section: true }
    });

    console.log(`👥 ${users.length} utilisateurs trouvés`);
    console.log(`📚 ${subjects.length} matières trouvées`);

    if (users.length === 0 || subjects.length === 0) {
      console.log('❌ Pas assez d\'utilisateurs ou de matières pour créer des groupes');
      return;
    }

    // Créer des groupes d'étude
    const groupsData = [
      {
        name: 'Groupe Mathématiques Terminale SMP',
        description: 'Groupe d\'étude pour les mathématiques de Terminale SMP. Révisions, exercices et entraide.',
        userClass: 'Terminale',
        section: 'SMP',
        isPrivate: false,
        subjectId: subjects.find(s => s.name.includes('Mathématiques'))?.id || subjects[0].id,
        creatorId: users[0].id
      },
      {
        name: 'Physique-Chimie Terminale',
        description: 'Groupe de révision pour la physique et la chimie. Partageons nos connaissances !',
        userClass: 'Terminale',
        section: 'SVT',
        isPrivate: false,
        subjectId: subjects.find(s => s.name.includes('Physique') || s.name.includes('Chimie'))?.id || subjects[1].id,
        creatorId: users[1].id
      },
      {
        name: 'Français 9ème',
        description: 'Groupe d\'étude pour le français en 9ème. Littérature, grammaire et expression écrite.',
        userClass: '9ème',
        section: null,
        isPrivate: false,
        subjectId: subjects.find(s => s.name.includes('Français'))?.id || subjects[2].id,
        creatorId: users[2].id
      },
      {
        name: 'Informatique Avancée',
        description: 'Groupe pour les passionnés d\'informatique. Programmation, algorithmes et projets.',
        userClass: 'Terminale',
        section: 'SMP',
        isPrivate: true,
        subjectId: subjects.find(s => s.name.includes('Informatique'))?.id || subjects[3].id,
        creatorId: users[3].id
      },
      {
        name: 'Révisions Générales',
        description: 'Groupe de révisions générales pour tous. Partageons nos méthodes d\'étude !',
        userClass: 'Terminale',
        section: null,
        isPrivate: false,
        subjectId: subjects[4].id,
        creatorId: users[4].id
      }
    ];

    for (const groupData of groupsData) {
      try {
        const group = await prisma.studyGroup.create({
          data: groupData
        });

        console.log(`✅ Groupe créé: ${group.name}`);

        // Ajouter le créateur comme membre admin
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: groupData.creatorId,
            role: 'ADMIN'
          }
        });

        // Ajouter quelques autres membres aléatoires
        const otherUsers = users.filter(u => u.id !== groupData.creatorId);
        const randomMembers = otherUsers.slice(0, Math.floor(Math.random() * 3) + 1);

        for (const member of randomMembers) {
          await prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId: member.id,
              role: 'MEMBER'
            }
          });
        }

        // Ajouter quelques messages de test
        const messages = [
          'Salut tout le monde ! 👋',
          'Qui veut réviser ensemble ?',
          'J\'ai une question sur le chapitre 3...',
          'Merci pour l\'aide !',
          'Bon courage pour les révisions ! 💪'
        ];

        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          const randomUser = randomMembers[Math.floor(Math.random() * randomMembers.length)] || users[0];
          await prisma.groupMessage.create({
            data: {
              groupId: group.id,
              userId: randomUser.id,
              content: messages[Math.floor(Math.random() * messages.length)]
            }
          });
        }

        console.log(`  👥 ${randomMembers.length + 1} membres ajoutés`);
        console.log(`  💬 ${Math.floor(Math.random() * 3) + 1} messages ajoutés`);

      } catch (error) {
        console.error(`❌ Erreur lors de la création du groupe ${groupData.name}:`, error.message);
      }
    }

    console.log('🎉 Seeding des groupes d\'étude terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding des groupes d\'étude:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
seedStudyGroups();



