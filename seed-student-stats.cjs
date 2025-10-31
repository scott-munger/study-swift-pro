const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedStudentStats() {
  try {
    console.log('🌱 Début du seeding des statistiques étudiant...');

    // Récupérer tous les étudiants
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, userClass: true, section: true, firstName: true, lastName: true }
    });

    console.log(`📊 ${students.length} étudiants trouvés`);

    // Récupérer les matières
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, level: true, section: true, difficulty: true, totalLessons: true }
    });

    console.log(`📚 ${subjects.length} matières trouvées`);

    for (const student of students) {
      console.log(`👤 Traitement de ${student.firstName} ${student.lastName} (${student.userClass} ${student.section || ''})`);

      // Créer ou mettre à jour les statistiques de l'étudiant
      const stats = await prisma.studentStats.upsert({
        where: { studentId: student.id },
        update: {},
        create: {
          studentId: student.id,
          flashcardsCompleted: Math.floor(Math.random() * 50) + 10,
          studyStreak: Math.floor(Math.random() * 15) + 1,
          averageScore: Math.floor(Math.random() * 30) + 70,
          timeSpentMinutes: Math.floor(Math.random() * 1200) + 300,
          totalSubjects: student.userClass === '9ème' ? 5 : 8,
          completedLessons: Math.floor(Math.random() * 30) + 10,
          upcomingTests: Math.floor(Math.random() * 5) + 1,
          achievements: Math.floor(Math.random() * 10) + 3
        }
      });

      // Filtrer les matières accessibles à l'étudiant
      const accessibleSubjects = subjects.filter(subject => {
        const levelMatches = subject.level === student.userClass;
        if (!levelMatches) return false;
        
        if (!subject.section) return true; // Matières générales
        return subject.section === student.section;
      });

      console.log(`  📖 ${accessibleSubjects.length} matières accessibles`);

      // Créer la progression pour chaque matière accessible
      for (const subject of accessibleSubjects) {
        const completedLessons = Math.floor(Math.random() * (subject.totalLessons || 20)) + 1;
        const progress = await prisma.subjectProgress.upsert({
          where: {
            studentId_subjectId: {
              studentId: student.id,
              subjectId: subject.id
            }
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId: subject.id,
            completedLessons,
            nextLesson: getNextLesson(subject.name, completedLessons),
            lastStudiedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Dernière semaine
          }
        });

        // Créer quelques activités récentes
        const activityTypes = ['FLASHCARD', 'TEST', 'LESSON', 'ACHIEVEMENT'];
        const numActivities = Math.floor(Math.random() * 5) + 3;

        for (let i = 0; i < numActivities; i++) {
          const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
          const daysAgo = Math.floor(Math.random() * 7) + 1;
          const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

          await prisma.studentActivity.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              type: activityType,
              title: getActivityTitle(activityType, subject.name),
              score: activityType === 'TEST' || activityType === 'FLASHCARD' ? Math.floor(Math.random() * 40) + 60 : null,
              createdAt
            }
          });
        }
      }

      console.log(`  ✅ Statistiques créées pour ${student.firstName} ${student.lastName}`);
    }

    console.log('🎉 Seeding des statistiques étudiant terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding des statistiques étudiant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getNextLesson(subjectName, completedLessons) {
  const lessons = {
    'Mathématiques': ['Géométrie', 'Algèbre', 'Calcul', 'Statistiques', 'Probabilités'],
    'Français': ['Grammaire', 'Littérature', 'Expression écrite', 'Analyse de texte'],
    'Sciences': ['Chimie', 'Physique', 'Biologie', 'Géologie'],
    'Histoire-Géo': ['Histoire moderne', 'Géographie physique', 'Géographie humaine'],
    'Anglais': ['Vocabulaire', 'Grammaire', 'Compréhension', 'Expression orale'],
    'Physique': ['Mécanique', 'Électricité', 'Thermodynamique', 'Optique'],
    'Chimie': ['Organique', 'Inorganique', 'Analytique', 'Physique'],
    'Informatique': ['Algorithmes', 'Programmation', 'Bases de données', 'Réseaux']
  };

  const subjectLessons = lessons[subjectName] || ['Leçon suivante'];
  const nextIndex = completedLessons % subjectLessons.length;
  return subjectLessons[nextIndex];
}

function getActivityTitle(type, subjectName) {
  const titles = {
    'FLASHCARD': [`Révise les ${subjectName}`, `Flashcards de ${subjectName}`, `Révision ${subjectName}`],
    'TEST': [`Quiz de ${subjectName}`, `Test ${subjectName}`, `Évaluation ${subjectName}`],
    'LESSON': [`Chapitre terminé`, `Leçon ${subjectName}`, `Cours ${subjectName}`],
    'ACHIEVEMENT': ['Série de 7 jours', 'Premier test réussi', '100 flashcards', 'Matière maîtrisée']
  };

  const typeTitles = titles[type] || ['Activité terminée'];
  return typeTitles[Math.floor(Math.random() * typeTitles.length)];
}

// Exécuter le seeding
seedStudentStats();



