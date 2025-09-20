const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Données de flashcards complètes pour toutes les disciplines
const flashcardData = {
  // MATHÉMATIQUES (Terminale)
  mathématiques: [
    {
      question: "Quelle est la dérivée de f(x) = x² + 3x + 2 ?",
      answer: "f'(x) = 2x + 3",
      difficulty: "medium"
    },
    {
      question: "Résoudre l'équation 2x + 5 = 13",
      answer: "x = 4",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'une fonction dérivée ?",
      answer: "Une fonction qui donne le taux de variation instantané d'une fonction",
      difficulty: "hard"
    },
    {
      question: "Calculer la limite de (x² - 4)/(x - 2) quand x tend vers 2",
      answer: "4 (en utilisant la factorisation : (x-2)(x+2)/(x-2) = x+2)",
      difficulty: "medium"
    },
    {
      question: "Quelle est la formule de l'aire d'un cercle ?",
      answer: "A = π × r²",
      difficulty: "easy"
    },
    {
      question: "Résoudre l'équation du second degré x² - 5x + 6 = 0",
      answer: "x = 2 ou x = 3 (en utilisant la factorisation (x-2)(x-3) = 0)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'un nombre complexe ?",
      answer: "Un nombre de la forme a + bi où a et b sont réels et i² = -1",
      difficulty: "hard"
    },
    {
      question: "Calculer sin(π/2)",
      answer: "1",
      difficulty: "easy"
    },
    {
      question: "Quelle est la dérivée de ln(x) ?",
      answer: "1/x",
      difficulty: "medium"
    },
    {
      question: "Résoudre l'inéquation 3x - 7 > 2",
      answer: "x > 3",
      difficulty: "easy"
    }
  ],

  // PHYSIQUE (Terminale)
  physique: [
    {
      question: "Quelle est la deuxième loi de Newton ?",
      answer: "F = ma (Force = masse × accélération)",
      difficulty: "easy"
    },
    {
      question: "Quelle est la formule de l'énergie cinétique ?",
      answer: "Ec = 1/2 × m × v²",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la vitesse de la lumière dans le vide ?",
      answer: "c = 3 × 10⁸ m/s",
      difficulty: "easy"
    },
    {
      question: "Quelle est la loi d'Ohm ?",
      answer: "U = R × I (Tension = Résistance × Intensité)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'énergie potentielle gravitationnelle ?",
      answer: "Ep = m × g × h (masse × gravité × hauteur)",
      difficulty: "medium"
    },
    {
      question: "Quelle est la fréquence d'une onde ?",
      answer: "f = 1/T (inverse de la période)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la conservation de l'énergie ?",
      answer: "L'énergie totale d'un système isolé reste constante",
      difficulty: "hard"
    },
    {
      question: "Calculer la force gravitationnelle entre deux masses",
      answer: "F = G × (m1 × m2)/r² (G = 6,67 × 10⁻¹¹ N⋅m²/kg²)",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'effet Doppler ?",
      answer: "Changement de fréquence d'une onde due au mouvement relatif",
      difficulty: "hard"
    },
    {
      question: "Quelle est la puissance électrique ?",
      answer: "P = U × I (Puissance = Tension × Intensité)",
      difficulty: "medium"
    }
  ],

  // CHIMIE (Terminale)
  chimie: [
    {
      question: "Qu'est-ce qu'un acide selon Brønsted-Lowry ?",
      answer: "Un donneur de protons (H⁺)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'une base selon Brønsted-Lowry ?",
      answer: "Un accepteur de protons (H⁺)",
      difficulty: "medium"
    },
    {
      question: "Quelle est la formule de l'eau ?",
      answer: "H₂O",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que le pH ?",
      answer: "pH = -log[H⁺] (mesure de l'acidité)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'une réaction d'oxydoréduction ?",
      answer: "Réaction impliquant un transfert d'électrons",
      difficulty: "hard"
    },
    {
      question: "Quelle est la masse molaire de l'hydrogène ?",
      answer: "M(H) = 1 g/mol",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la loi de conservation de la masse ?",
      answer: "La masse totale des réactifs = masse totale des produits",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'un catalyseur ?",
      answer: "Substance qui accélère une réaction sans être consommée",
      difficulty: "medium"
    },
    {
      question: "Quelle est la formule de l'acide chlorhydrique ?",
      answer: "HCl",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la stœchiométrie ?",
      answer: "Calcul des quantités de réactifs et produits dans une réaction",
      difficulty: "hard"
    }
  ],

  // BIOLOGIE/SVT (Terminale)
  biologie: [
    {
      question: "Qu'est-ce que la photosynthèse ?",
      answer: "Processus par lequel les plantes convertissent la lumière en énergie chimique",
      difficulty: "easy"
    },
    {
      question: "Quelle est l'équation de la photosynthèse ?",
      answer: "6CO₂ + 6H₂O + lumière → C₆H₁₂O₆ + 6O₂",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'ADN ?",
      answer: "Acide désoxyribonucléique, molécule qui contient l'information génétique",
      difficulty: "medium"
    },
    {
      question: "Quelles sont les bases azotées de l'ADN ?",
      answer: "Adénine (A), Thymine (T), Guanine (G), Cytosine (C)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la mitose ?",
      answer: "Division cellulaire qui produit deux cellules identiques",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la méiose ?",
      answer: "Division cellulaire qui produit des gamètes avec la moitié des chromosomes",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'évolution ?",
      answer: "Changement des caractéristiques des espèces au fil du temps",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la sélection naturelle ?",
      answer: "Mécanisme par lequel les individus les mieux adaptés survivent",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'écosystème ?",
      answer: "Communauté d'organismes et leur environnement physique",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la respiration cellulaire ?",
      answer: "Processus qui libère l'énergie stockée dans les molécules organiques",
      difficulty: "hard"
    }
  ],

  // FRANÇAIS (9ème)
  français: [
    {
      question: "Qui a écrit 'Les Misérables' ?",
      answer: "Victor Hugo",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'une métaphore ?",
      answer: "Figure de style qui établit une comparaison implicite",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'une allitération ?",
      answer: "Répétition de consonnes identiques dans une phrase",
      difficulty: "medium"
    },
    {
      question: "Qui a écrit 'Le Petit Prince' ?",
      answer: "Antoine de Saint-Exupéry",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'un sonnet ?",
      answer: "Poème de 14 vers avec une structure particulière",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'impératif ?",
      answer: "Mode verbal qui exprime un ordre ou une défense",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'un oxymore ?",
      answer: "Figure de style qui associe deux termes contradictoires",
      difficulty: "hard"
    },
    {
      question: "Qui a écrit 'Candide' ?",
      answer: "Voltaire",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que le subjonctif ?",
      answer: "Mode verbal qui exprime le doute, l'incertitude, le souhait",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce qu'une hyperbole ?",
      answer: "Figure de style qui exagère pour créer un effet",
      difficulty: "medium"
    }
  ],

  // HISTOIRE-GÉOGRAPHIE (9ème)
  "histoire-géographie": [
    {
      question: "En quelle année a eu lieu la Révolution française ?",
      answer: "1789",
      difficulty: "easy"
    },
    {
      question: "Qui était Napoléon Bonaparte ?",
      answer: "Empereur français et général militaire (1769-1821)",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la Déclaration des Droits de l'Homme ?",
      answer: "Document adopté en 1789 qui énonce les droits fondamentaux",
      difficulty: "medium"
    },
    {
      question: "Quelle est la capitale de la France ?",
      answer: "Paris",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la Première Guerre mondiale ?",
      answer: "Conflit mondial de 1914 à 1918",
      difficulty: "easy"
    },
    {
      question: "Qui était Charlemagne ?",
      answer: "Roi des Francs et empereur d'Occident (742-814)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la Renaissance ?",
      answer: "Période de renouveau culturel en Europe (XIVe-XVIe siècles)",
      difficulty: "medium"
    },
    {
      question: "Quelle est la plus longue rivière de France ?",
      answer: "La Loire (1012 km)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la Révolution industrielle ?",
      answer: "Transformation économique et sociale au XVIIIe-XIXe siècles",
      difficulty: "hard"
    },
    {
      question: "Qui était Louis XIV ?",
      answer: "Roi de France surnommé 'le Roi-Soleil' (1638-1715)",
      difficulty: "medium"
    }
  ],

  // ANGLAIS (9ème)
  anglais: [
    {
      question: "Comment dit-on 'Bonjour' en anglais ?",
      answer: "Hello ou Good morning",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que le Present Simple ?",
      answer: "Temps qui exprime une action habituelle ou générale",
      difficulty: "medium"
    },
    {
      question: "Comment conjugue-t-on 'to be' au présent ?",
      answer: "I am, you are, he/she/it is, we are, you are, they are",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'un adjectif possessif ?",
      answer: "Mot qui indique la possession (my, your, his, her, its, our, their)",
      difficulty: "medium"
    },
    {
      question: "Comment dit-on 'Merci' en anglais ?",
      answer: "Thank you ou Thanks",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que le Past Simple ?",
      answer: "Temps qui exprime une action passée terminée",
      difficulty: "medium"
    },
    {
      question: "Comment dit-on 'Au revoir' en anglais ?",
      answer: "Goodbye, Bye, ou See you later",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'un article défini en anglais ?",
      answer: "The (le, la, les)",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'un article indéfini en anglais ?",
      answer: "A (un, une) et An (devant une voyelle)",
      difficulty: "medium"
    },
    {
      question: "Comment dit-on 'Comment allez-vous ?' en anglais ?",
      answer: "How are you?",
      difficulty: "easy"
    }
  ],

  // SCIENCES (9ème)
  sciences: [
    {
      question: "Qu'est-ce que la gravité ?",
      answer: "Force qui attire les objets vers le centre de la Terre",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce qu'un atome ?",
      answer: "Plus petite particule d'un élément qui conserve ses propriétés",
      difficulty: "medium"
    },
    {
      question: "Quels sont les trois états de la matière ?",
      answer: "Solide, liquide, gazeux",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la densité ?",
      answer: "Masse par unité de volume (d = m/V)",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'une réaction chimique ?",
      answer: "Transformation qui modifie la nature des substances",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'énergie ?",
      answer: "Capacité à effectuer un travail ou à produire de la chaleur",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la température ?",
      answer: "Mesure de l'agitation des particules d'une substance",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce qu'un mélange ?",
      answer: "Combinaison de deux ou plusieurs substances",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la pression ?",
      answer: "Force exercée par unité de surface",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la vitesse ?",
      answer: "Distance parcourue par unité de temps (v = d/t)",
      difficulty: "easy"
    }
  ],

  // SVT (Terminale) - Sciences de la Vie et de la Terre
  svt: [
    {
      question: "Qu'est-ce que l'écosystème ?",
      answer: "Communauté d'organismes et leur environnement physique",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la biodiversité ?",
      answer: "Variété de la vie sur Terre à tous les niveaux",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la tectonique des plaques ?",
      answer: "Théorie expliquant les mouvements de la lithosphère terrestre",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que le cycle de l'eau ?",
      answer: "Circulation de l'eau entre l'atmosphère, la terre et les océans",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la photosynthèse ?",
      answer: "Processus par lequel les plantes convertissent la lumière en énergie",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que l'ADN ?",
      answer: "Molécule qui contient l'information génétique",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'évolution ?",
      answer: "Changement des caractéristiques des espèces au fil du temps",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la sélection naturelle ?",
      answer: "Mécanisme par lequel les individus les mieux adaptés survivent",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la respiration cellulaire ?",
      answer: "Processus qui libère l'énergie stockée dans les molécules organiques",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la mitose ?",
      answer: "Division cellulaire qui produit deux cellules identiques",
      difficulty: "medium"
    }
  ],

  // LLA (Terminale) - Lettres, Langues et Arts
  lla: [
    {
      question: "Qu'est-ce que la littérature comparée ?",
      answer: "Étude comparative des littératures de différentes cultures",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce qu'un mouvement littéraire ?",
      answer: "Courant artistique et intellectuel d'une époque donnée",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le romantisme ?",
      answer: "Mouvement littéraire du XIXe siècle prônant l'émotion et l'imagination",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le symbolisme ?",
      answer: "Mouvement littéraire qui utilise des symboles pour exprimer des idées",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'analyse stylistique ?",
      answer: "Étude des procédés d'écriture d'un auteur",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce qu'un genre littéraire ?",
      answer: "Catégorie de textes partageant des caractéristiques communes",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'intertextualité ?",
      answer: "Relations entre différents textes littéraires",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la poésie moderne ?",
      answer: "Poésie qui rompt avec les formes traditionnelles",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le théâtre de l'absurde ?",
      answer: "Mouvement théâtral qui met en scène l'absurdité de l'existence",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la critique littéraire ?",
      answer: "Analyse et évaluation des œuvres littéraires",
      difficulty: "medium"
    }
  ],

  // SES (Terminale) - Sciences Économiques et Sociales
  ses: [
    {
      question: "Qu'est-ce que l'économie ?",
      answer: "Science qui étudie la production, la distribution et la consommation de biens",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'offre et la demande ?",
      answer: "Mécanisme de marché qui détermine les prix",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le PIB ?",
      answer: "Produit Intérieur Brut - mesure de la richesse d'un pays",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'inflation ?",
      answer: "Augmentation générale et durable des prix",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le chômage ?",
      answer: "Situation d'une personne sans emploi mais en recherche active",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la mondialisation ?",
      answer: "Processus d'intégration des économies et sociétés mondiales",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la sociologie ?",
      answer: "Science qui étudie les sociétés humaines et leurs comportements",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la stratification sociale ?",
      answer: "Division de la société en groupes hiérarchisés",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la démocratie ?",
      answer: "Système politique où le pouvoir appartient au peuple",
      difficulty: "easy"
    },
    {
      question: "Qu'est-ce que la justice sociale ?",
      answer: "Principe d'équité dans la répartition des richesses et des droits",
      difficulty: "hard"
    }
  ],

  // SMP (Terminale) - Sciences Mathématiques et Physiques
  smp: [
    {
      question: "Qu'est-ce qu'un vecteur en mathématiques ?",
      answer: "Objet mathématique ayant une direction, un sens et une norme",
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que l'analyse vectorielle ?",
      answer: "Branche des mathématiques qui étudie les vecteurs et leurs propriétés",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la mécanique quantique ?",
      answer: "Théorie physique qui décrit le comportement de la matière à l'échelle atomique",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'électromagnétisme ?",
      answer: "Branche de la physique qui étudie les interactions électriques et magnétiques",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce qu'une équation différentielle ?",
      answer: "Équation qui lie une fonction à ses dérivées",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la relativité restreinte ?",
      answer: "Théorie d'Einstein sur l'espace et le temps",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que l'analyse complexe ?",
      answer: "Branche des mathématiques qui étudie les fonctions complexes",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la thermodynamique ?",
      answer: "Branche de la physique qui étudie les transferts d'énergie",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce qu'un espace vectoriel ?",
      answer: "Structure mathématique formée d'un ensemble de vecteurs",
      difficulty: "hard"
    },
    {
      question: "Qu'est-ce que la mécanique statistique ?",
      answer: "Branche de la physique qui étudie les systèmes à grand nombre de particules",
      difficulty: "hard"
    }
  ]
};

async function seedFlashcards() {
  try {
    console.log('🌱 Ajout des flashcards de test pour toutes les disciplines...');
    
    // Récupérer tous les sujets
    const subjects = await prisma.subject.findMany();
    console.log(`📚 Trouvé ${subjects.length} matières dans la base de données`);
    
    // Récupérer un utilisateur admin pour créer les flashcards
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('Aucun utilisateur admin trouvé');
    }
    
    let totalFlashcards = 0;
    
    // Ajouter les flashcards pour chaque matière
    for (const subject of subjects) {
      const subjectName = subject.name.toLowerCase();
      const flashcards = flashcardData[subjectName];
      
      if (flashcards) {
        console.log(`📝 Ajout des flashcards pour ${subject.name}...`);
        
        for (const flashcard of flashcards) {
          try {
            await prisma.flashcard.create({
              data: {
                question: flashcard.question,
                answer: flashcard.answer,
                subjectId: subject.id,
                userId: adminUser.id,
                difficulty: flashcard.difficulty
              }
            });
            totalFlashcards++;
          } catch (error) {
            console.log(`⚠️  Flashcard déjà existante pour ${subject.name}: ${flashcard.question}`);
          }
        }
        
        console.log(`✅ ${flashcards.length} flashcards ajoutées pour ${subject.name}`);
      } else {
        console.log(`⚠️  Aucune donnée de flashcard trouvée pour ${subject.name}`);
      }
    }
    
    console.log(`🎉 Terminé ! ${totalFlashcards} flashcards ajoutées au total`);
    
    // Afficher un résumé par matière
    console.log('\n📊 Résumé par matière:');
    for (const subject of subjects) {
      const count = await prisma.flashcard.count({
        where: { subjectId: subject.id }
      });
      console.log(`  ${subject.name}: ${count} flashcards`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des flashcards:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  seedFlashcards()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { seedFlashcards, flashcardData };
