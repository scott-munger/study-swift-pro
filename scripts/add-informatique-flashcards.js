import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('💻 Ajout de flashcards pour l\'Informatique...');

  // Récupérer la matière Informatique
  const informatique = await prisma.subject.findFirst({
    where: { name: 'Informatique' }
  });

  if (!informatique) {
    console.error('❌ Matière Informatique non trouvée');
    return;
  }

  // Récupérer l'admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    console.error('❌ Aucun administrateur trouvé');
    return;
  }

  // Flashcards pour l'Informatique
  const flashcards = [
    {
      question: 'Qu\'est-ce qu\'un algorithme ?',
      answer: 'Un algorithme est une suite d\'instructions logiques et ordonnées qui permettent de résoudre un problème ou d\'accomplir une tâche.',
      difficulty: 'medium'
    },
    {
      question: 'Qu\'est-ce qu\'une variable en programmation ?',
      answer: 'Une variable est un espace mémoire nommé qui peut stocker une valeur qui peut changer pendant l\'exécution du programme.',
      difficulty: 'easy'
    },
      {
      question: 'Qu\'est-ce qu\'une boucle en programmation ?',
      answer: 'Une boucle est une structure de contrôle qui permet de répéter un bloc d\'instructions plusieurs fois jusqu\'à ce qu\'une condition soit remplie.',
      difficulty: 'medium'
    },
    {
      question: 'Qu\'est-ce qu\'une condition en programmation ?',
      answer: 'Une condition est une structure de contrôle qui permet d\'exécuter un bloc d\'instructions seulement si une condition est vraie.',
      difficulty: 'medium'
    },
    {
      question: 'Qu\'est-ce qu\'une fonction en programmation ?',
      answer: 'Une fonction est un bloc de code réutilisable qui effectue une tâche spécifique et peut retourner une valeur.',
      difficulty: 'hard'
    },
    {
      question: 'Qu\'est-ce que la récursivité ?',
      answer: 'La récursivité est une technique de programmation où une fonction s\'appelle elle-même pour résoudre un problème.',
      difficulty: 'hard'
    },
    {
      question: 'Qu\'est-ce qu\'un tableau (array) ?',
      answer: 'Un tableau est une structure de données qui stocke une collection d\'éléments du même type dans un ordre séquentiel.',
      difficulty: 'medium'
    },
    {
      question: 'Qu\'est-ce que la complexité algorithmique ?',
      answer: 'La complexité algorithmique mesure l\'efficacité d\'un algorithme en termes de temps d\'exécution et d\'espace mémoire utilisé.',
      difficulty: 'hard'
    }
  ];

  console.log(`📚 Ajout de ${flashcards.length} flashcards pour ${informatique.name}...`);

  for (const flashcard of flashcards) {
    try {
      await prisma.flashcard.create({
        data: {
          question: flashcard.question,
          answer: flashcard.answer,
          difficulty: flashcard.difficulty,
          subjectId: informatique.id,
          userId: admin.id
        }
      });
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la flashcard: ${error.message}`);
    }
  }

  console.log(`✅ ${flashcards.length} flashcards ajoutées pour l'Informatique`);
  
  // Statistiques finales
  const totalFlashcards = await prisma.flashcard.count();
  const stats = await prisma.flashcard.groupBy({
    by: ['difficulty'],
    _count: {
      id: true
    }
  });

  console.log(`\n📊 Statistiques finales:`);
  console.log(`- Total flashcards: ${totalFlashcards}`);
  stats.forEach(stat => {
    console.log(`- ${stat.difficulty}: ${stat._count.id} flashcards`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

