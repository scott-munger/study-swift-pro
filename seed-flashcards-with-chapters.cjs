const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données de flashcards par chapitre pour différentes matières
const flashcardDataByChapter = {
  // FRANÇAIS - 9ème
  "Français": {
    "Grammaire": [
      { question: "Qu'est-ce qu'un nom commun ?", answer: "Un nom qui désigne une catégorie", difficulty: "easy" },
      { question: "Qu'est-ce qu'un déterminant ?", answer: "Un mot qui accompagne le nom", difficulty: "easy" },
      { question: "Conjuguer le verbe 'être' au présent", answer: "je suis, tu es, il est, nous sommes, vous êtes, ils sont", difficulty: "medium" },
      { question: "Qu'est-ce qu'un adjectif qualificatif ?", answer: "Un mot qui qualifie le nom", difficulty: "easy" },
      { question: "Accord de 'les enfants' avec 'heureux'", answer: "Les enfants sont heureux", difficulty: "medium" }
    ],
    "Orthographe": [
      { question: "Comment s'écrit 'beaucoup' ?", answer: "b-e-a-u-c-o-u-p", difficulty: "easy" },
      { question: "Écrire 'mille' au pluriel", answer: "mille (invariable)", difficulty: "medium" },
      { question: "Quelle est la règle du pluriel des mots en -al ?", answer: "Ils prennent -aux au pluriel (ex: cheval → chevaux)", difficulty: "medium" },
      { question: "Comment s'écrit 'accent circonflexe' ?", answer: "a-c-c-e-n-t c-i-r-c-o-n-f-l-e-x-e", difficulty: "easy" },
      { question: "Écrire 'vingt' et 'cent' avec des nombres", answer: "Vingt et cent prennent un 's' au pluriel s'ils ne sont pas suivis d'un nombre", difficulty: "hard" }
    ],
    "Expression écrite": [
      { question: "Qu'est-ce qu'une introduction dans un texte ?", answer: "La partie qui présente le sujet", difficulty: "easy" },
      { question: "Comment structurer un paragraphe ?", answer: "Idée principale + arguments + exemple", difficulty: "medium" },
      { question: "Qu'est-ce qu'un connecteur logique ?", answer: "Un mot qui relie les idées (ex: donc, car, mais)", difficulty: "medium" },
      { question: "Comment rédiger une conclusion ?", answer: "Résumé + ouverture sur un autre sujet", difficulty: "hard" },
      { question: "Qu'est-ce qu'un synonyme ?", answer: "Un mot de même sens qu'un autre", difficulty: "easy" }
    ],
    "Compréhension de texte": [
      { question: "Qu'est-ce que le thème d'un texte ?", answer: "Le sujet principal abordé", difficulty: "easy" },
      { question: "Qu'est-ce que le point de vue de l'auteur ?", answer: "L'opinion ou la position de l'auteur sur le sujet", difficulty: "medium" },
      { question: "Comment identifier les idées principales ?", answer: "En trouvant les phrases qui résument chaque paragraphe", difficulty: "medium" },
      { question: "Qu'est-ce qu'une inférence ?", answer: "Une conclusion déduite à partir d'informations implicites", difficulty: "hard" },
      { question: "Comment analyser un texte narratif ?", answer: "Identifier le narrateur, les personnages, le temps et le lieu", difficulty: "medium" }
    ]
  },

  // HISTOIRE-GÉOGRAPHIE - 9ème
  "Histoire-Géographie": {
    "Histoire du Sénégal": [
      { question: "Qui était Léopold Sédar Senghor ?", answer: "Premier président du Sénégal", difficulty: "easy" },
      { question: "Quand le Sénégal a-t-il obtenu son indépendance ?", answer: "En 1960", difficulty: "easy" },
      { question: "Quelle est la capitale du Sénégal ?", answer: "Dakar", difficulty: "easy" },
      { question: "Qu'est-ce que la traite négrière ?", answer: "Le commerce d'esclaves", difficulty: "medium" },
      { question: "Quels sont les principaux royaumes du Sénégal précolonial ?", answer: "Royaumes du Djolof, du Cayor, du Baol, du Sine et du Saloum", difficulty: "hard" }
    ],
    "Géographie du Sénégal": [
      { question: "Quel est le plus grand fleuve du Sénégal ?", answer: "Le fleuve Sénégal", difficulty: "easy" },
      { question: "Quel est le climat du Sénégal ?", answer: "Tropical avec une saison sèche et une saison des pluies", difficulty: "medium" },
      { question: "Quelles sont les principales régions du Sénégal ?", answer: "Dakar, Thiès, Saint-Louis, Ziguinchor, Kaolack, etc.", difficulty: "medium" },
      { question: "Quelle est la superficie du Sénégal ?", answer: "Environ 196 722 km²", difficulty: "hard" },
      { question: "Quels sont les pays frontaliers du Sénégal ?", answer: "Mauritanie, Mali, Guinée, Guinée-Bissau et la Gambie", difficulty: "medium" }
    ],
    "Histoire mondiale": [
      { question: "Quand a eu lieu la Première Guerre mondiale ?", answer: "1914-1918", difficulty: "easy" },
      { question: "Qui était Napoléon Bonaparte ?", answer: "Empereur français et grand stratège militaire", difficulty: "medium" },
      { question: "Quand a eu lieu la Révolution française ?", answer: "En 1789", difficulty: "easy" },
      { question: "Qu'est-ce que la colonisation ?", answer: "L'établissement de colonies par une puissance étrangère", difficulty: "medium" },
      { question: "Quand a eu lieu la Seconde Guerre mondiale ?", answer: "1939-1945", difficulty: "easy" }
    ],
    "Géographie mondiale": [
      { question: "Combien y a-t-il de continents ?", answer: "7 continents", difficulty: "easy" },
      { question: "Quel est le plus grand océan ?", answer: "L'océan Pacifique", difficulty: "easy" },
      { question: "Quelle est la plus haute montagne du monde ?", answer: "L'Everest (8 848 m)", difficulty: "easy" },
      { question: "Quel est le plus grand désert du monde ?", answer: "Le Sahara", difficulty: "easy" },
      { question: "Quels sont les cinq océans ?", answer: "Pacifique, Atlantique, Indien, Arctique, Antarctique", difficulty: "medium" }
    ]
  },

  // MATHÉMATIQUES - 9ème
  "Mathématiques": {
    "Algèbre": [
      { question: "Résoudre l'équation 2x + 5 = 13", answer: "x = 4", difficulty: "easy" },
      { question: "Qu'est-ce qu'une variable ?", answer: "Une quantité inconnue représentée par une lettre", difficulty: "easy" },
      { question: "Résoudre l'équation 3x - 7 = 2", answer: "x = 3", difficulty: "medium" },
      { question: "Qu'est-ce qu'un coefficient ?", answer: "Le nombre qui multiplie une variable", difficulty: "easy" },
      { question: "Résoudre l'inéquation x + 3 > 10", answer: "x > 7", difficulty: "medium" }
    ],
    "Géométrie": [
      { question: "Quelle est la formule de l'aire d'un rectangle ?", answer: "A = longueur × largeur", difficulty: "easy" },
      { question: "Quelle est la formule de l'aire d'un cercle ?", answer: "A = π × r²", difficulty: "medium" },
      { question: "Qu'est-ce que le théorème de Pythagore ?", answer: "a² + b² = c² (dans un triangle rectangle)", difficulty: "medium" },
      { question: "Quelle est la formule du périmètre d'un cercle ?", answer: "P = 2π × r", difficulty: "easy" },
      { question: "Qu'est-ce qu'un triangle équilatéral ?", answer: "Un triangle avec trois côtés égaux", difficulty: "easy" }
    ],
    "Analyse": [
      { question: "Qu'est-ce qu'une fonction ?", answer: "Une relation qui associe à chaque valeur d'entrée une valeur de sortie", difficulty: "medium" },
      { question: "Calculer f(2) si f(x) = x² + 3", answer: "f(2) = 7", difficulty: "easy" },
      { question: "Qu'est-ce qu'une fonction linéaire ?", answer: "Une fonction de la forme f(x) = ax", difficulty: "medium" },
      { question: "Qu'est-ce qu'une fonction affine ?", answer: "Une fonction de la forme f(x) = ax + b", difficulty: "medium" },
      { question: "Qu'est-ce que la pente d'une droite ?", answer: "Le coefficient directeur qui indique l'inclinaison", difficulty: "hard" }
    ],
    "Statistiques": [
      { question: "Qu'est-ce que la moyenne ?", answer: "La somme des valeurs divisée par le nombre de valeurs", difficulty: "easy" },
      { question: "Qu'est-ce que la médiane ?", answer: "La valeur centrale d'une série ordonnée", difficulty: "medium" },
      { question: "Qu'est-ce que le mode ?", answer: "La valeur qui apparaît le plus souvent", difficulty: "medium" },
      { question: "Comment calcule-t-on la moyenne de [5, 7, 9, 11] ?", answer: "(5 + 7 + 9 + 11) / 4 = 8", difficulty: "easy" },
      { question: "Qu'est-ce qu'un diagramme en bâtons ?", answer: "Un graphique qui représente des données avec des barres", difficulty: "easy" }
    ],
    "Probabilités": [
      { question: "Calculer la probabilité d'obtenir un 6 avec un dé", answer: "1/6", difficulty: "easy" },
      { question: "Qu'est-ce qu'un événement certain ?", answer: "Un événement qui se produira toujours (probabilité = 1)", difficulty: "easy" },
      { question: "Qu'est-ce qu'un événement impossible ?", answer: "Un événement qui ne se produira jamais (probabilité = 0)", difficulty: "easy" },
      { question: "Calculer la probabilité d'obtenir pile ou face", answer: "1/2 pour chaque", difficulty: "easy" },
      { question: "Qu'est-ce que l'événement contraire ?", answer: "L'événement opposé à un événement donné", difficulty: "medium" }
    ]
  },

  // SCIENCES - 9ème
  "Sciences": {
    "Physique de base": [
      { question: "Quelle est la formule de la vitesse ?", answer: "v = d/t", difficulty: "easy" },
      { question: "Qu'est-ce que la gravité ?", answer: "La force qui attire les objets vers la Terre", difficulty: "easy" },
      { question: "Quelle est l'unité de mesure de la vitesse ?", answer: "m/s (mètre par seconde) ou km/h", difficulty: "easy" },
      { question: "Qu'est-ce qu'une force ?", answer: "Une action qui modifie le mouvement d'un objet", difficulty: "medium" },
      { question: "Quelle est l'accélération due à la gravité sur Terre ?", answer: "Environ 9,8 m/s²", difficulty: "medium" }
    ],
    "Chimie de base": [
      { question: "Écrire la formule de l'eau", answer: "H₂O", difficulty: "easy" },
      { question: "Qu'est-ce qu'un atome ?", answer: "La plus petite partie d'un élément chimique", difficulty: "medium" },
      { question: "Qu'est-ce qu'une molécule ?", answer: "Un groupe d'atomes liés ensemble", difficulty: "medium" },
      { question: "Quel est le symbole chimique de l'or ?", answer: "Au", difficulty: "easy" },
      { question: "Qu'est-ce que le pH neutre ?", answer: "pH = 7", difficulty: "easy" }
    ],
    "Biologie de base": [
      { question: "Qu'est-ce qu'une cellule ?", answer: "L'unité fondamentale de la vie", difficulty: "easy" },
      { question: "Quels sont les trois types de cellules principales ?", answer: "Cellules animales, végétales et bactériennes", difficulty: "medium" },
      { question: "Qu'est-ce que la photosynthèse ?", answer: "Le processus par lequel les plantes produisent leur nourriture", difficulty: "medium" },
      { question: "Quels sont les cinq règnes du vivant ?", answer: "Animal, végétal, champignon, protiste, monère", difficulty: "hard" },
      { question: "Qu'est-ce qu'un écosystème ?", answer: "Un système formé par des organismes et leur environnement", difficulty: "medium" }
    ],
    "Expérimentation": [
      { question: "Qu'est-ce que la méthode scientifique ?", answer: "Observer, formuler une hypothèse, expérimenter, conclure", difficulty: "medium" },
      { question: "Qu'est-ce qu'une hypothèse ?", answer: "Une supposition à vérifier par l'expérience", difficulty: "easy" },
      { question: "Qu'est-ce qu'une variable contrôlée ?", answer: "Une variable qui reste constante pendant l'expérience", difficulty: "medium" },
      { question: "Qu'est-ce qu'une variable indépendante ?", answer: "La variable qu'on modifie dans une expérience", difficulty: "medium" },
      { question: "Qu'est-ce qu'une variable dépendante ?", answer: "La variable qu'on mesure dans une expérience", difficulty: "medium" }
    ]
  },

  // MATHÉMATIQUES - Terminale SMP
  "Mathématiques": {
    "Algèbre": [
      { question: "Résoudre l'équation du second degré x² - 5x + 6 = 0", answer: "x = 2 ou x = 3", difficulty: "medium" },
      { question: "Quelle est la dérivée de f(x) = x² + 3x + 2 ?", answer: "f'(x) = 2x + 3", difficulty: "medium" },
      { question: "Calculer la limite de (x² - 4)/(x - 2) quand x tend vers 2", answer: "4", difficulty: "medium" },
      { question: "Résoudre l'équation 3x + 2 = 11", answer: "x = 3", difficulty: "easy" },
      { question: "Qu'est-ce qu'un nombre complexe ?", answer: "Un nombre de la forme a + bi où i² = -1", difficulty: "hard" }
    ],
    "Géométrie": [
      { question: "Qu'est-ce que le théorème de Thalès ?", answer: "Dans un triangle, une droite parallèle à un côté coupe les autres côtés proportionnellement", difficulty: "medium" },
      { question: "Calculer l'aire d'un triangle rectangle de côtés 3 et 4", answer: "A = (3 × 4) / 2 = 6", difficulty: "easy" },
      { question: "Qu'est-ce qu'un vecteur ?", answer: "Une quantité qui a une direction et une magnitude", difficulty: "medium" },
      { question: "Quelle est la formule du volume d'une sphère ?", answer: "V = (4/3)πr³", difficulty: "hard" },
      { question: "Qu'est-ce qu'un angle droit ?", answer: "Un angle de 90 degrés", difficulty: "easy" }
    ],
    "Analyse": [
      { question: "Quelle est la dérivée de sin(x) ?", answer: "cos(x)", difficulty: "medium" },
      { question: "Quelle est la dérivée de ln(x) ?", answer: "1/x", difficulty: "medium" },
      { question: "Calculer l'intégrale de 3x² dx", answer: "x³ + C", difficulty: "hard" },
      { question: "Qu'est-ce qu'une fonction continue ?", answer: "Une fonction sans saut ou discontinuité", difficulty: "medium" },
      { question: "Qu'est-ce qu'une asymptote ?", answer: "Une droite vers laquelle une courbe se rapproche", difficulty: "hard" }
    ],
    "Statistiques": [
      { question: "Qu'est-ce qu'un écart-type ?", answer: "Une mesure de la dispersion des données", difficulty: "hard" },
      { question: "Qu'est-ce qu'une loi normale ?", answer: "Une distribution de probabilité en forme de cloche", difficulty: "hard" },
      { question: "Comment calcule-t-on la variance ?", answer: "La moyenne des carrés des écarts à la moyenne", difficulty: "hard" },
      { question: "Qu'est-ce qu'un intervalle de confiance ?", answer: "Un intervalle qui contient probablement la vraie valeur", difficulty: "hard" },
      { question: "Qu'est-ce qu'une corrélation ?", answer: "Une relation entre deux variables", difficulty: "medium" }
    ],
    "Probabilités": [
      { question: "Qu'est-ce qu'une probabilité conditionnelle ?", answer: "La probabilité d'un événement sachant qu'un autre s'est produit", difficulty: "hard" },
      { question: "Calculer P(A et B) si A et B sont indépendants", answer: "P(A) × P(B)", difficulty: "medium" },
      { question: "Qu'est-ce qu'une variable aléatoire ?", answer: "Une variable dont la valeur dépend du hasard", difficulty: "medium" },
      { question: "Qu'est-ce qu'une loi binomiale ?", answer: "Une distribution de probabilité pour des essais répétés", difficulty: "hard" },
      { question: "Calculer la probabilité d'obtenir exactement 3 fois pile sur 5 lancers", answer: "C(5,3) × (1/2)^5 = 10/32", difficulty: "hard" }
    ]
  },

  // PHYSIQUE - Terminale SMP
  "Physique": {
    "Mécanique": [
      { question: "Quelle est la formule de l'énergie cinétique ?", answer: "Ec = (1/2)mv²", difficulty: "medium" },
      { question: "Calculer l'énergie potentielle d'un objet de 5 kg à 10 m de hauteur", answer: "Ep = mgh = 5 × 10 × 10 = 500 J", difficulty: "medium" },
      { question: "Qu'est-ce que la deuxième loi de Newton ?", answer: "F = ma (force = masse × accélération)", difficulty: "medium" },
      { question: "Quelle est la vitesse d'un objet en chute libre après 2 secondes ?", answer: "v = gt = 10 × 2 = 20 m/s", difficulty: "medium" },
      { question: "Qu'est-ce que l'énergie mécanique ?", answer: "La somme de l'énergie cinétique et potentielle", difficulty: "medium" }
    ],
    "Électricité": [
      { question: "Qu'est-ce que la loi d'Ohm ?", answer: "U = R × I (tension = résistance × intensité)", difficulty: "medium" },
      { question: "Calculer la résistance équivalente de deux résistances de 6Ω et 3Ω en parallèle", answer: "R = 1/(1/6 + 1/3) = 2Ω", difficulty: "hard" },
      { question: "Quelle est la formule de la puissance électrique ?", answer: "P = U × I", difficulty: "medium" },
      { question: "Qu'est-ce qu'un courant alternatif ?", answer: "Un courant qui change de direction périodiquement", difficulty: "medium" },
      { question: "Qu'est-ce qu'un circuit série ?", answer: "Un circuit où les composants sont connectés en chaîne", difficulty: "easy" }
    ],
    "Optique": [
      { question: "Quelle est la vitesse de la lumière dans le vide ?", answer: "3 × 10⁸ m/s", difficulty: "easy" },
      { question: "Qu'est-ce que la réfraction ?", answer: "Le changement de direction de la lumière quand elle traverse un milieu", difficulty: "medium" },
      { question: "Qu'est-ce que la réflexion ?", answer: "Le renvoi de la lumière par une surface", difficulty: "easy" },
      { question: "Quelle est la formule de la loi de Snell-Descartes ?", answer: "n₁sin(i) = n₂sin(r)", difficulty: "hard" },
      { question: "Qu'est-ce qu'une lentille convergente ?", answer: "Une lentille qui fait converger les rayons lumineux", difficulty: "medium" }
    ],
    "Thermodynamique": [
      { question: "Qu'est-ce que la température ?", answer: "Une mesure de l'agitation moléculaire", difficulty: "medium" },
      { question: "Quelle est la première loi de la thermodynamique ?", answer: "ΔU = Q - W (variation d'énergie = chaleur - travail)", difficulty: "hard" },
      { question: "Qu'est-ce qu'un gaz parfait ?", answer: "Un gaz qui suit l'équation PV = nRT", difficulty: "hard" },
      { question: "Qu'est-ce que l'entropie ?", answer: "Une mesure du désordre d'un système", difficulty: "hard" },
      { question: "Quelle est la formule de l'énergie cinétique moyenne des molécules ?", answer: "Ec = (3/2)kT", difficulty: "hard" }
    ]
  },

  // CHIMIE - Terminale SMP
  "Chimie": {
    "Chimie organique": [
      { question: "Qu'est-ce qu'un hydrocarbure ?", answer: "Un composé contenant seulement du carbone et de l'hydrogène", difficulty: "easy" },
      { question: "Qu'est-ce qu'un alcane ?", answer: "Un hydrocarbure saturé de formule CnH2n+2", difficulty: "medium" },
      { question: "Qu'est-ce qu'une double liaison ?", answer: "Une liaison où deux atomes partagent deux paires d'électrons", difficulty: "medium" },
      { question: "Qu'est-ce qu'un groupe fonctionnel ?", answer: "Un atome ou groupe d'atomes qui détermine les propriétés d'une molécule", difficulty: "hard" },
      { question: "Qu'est-ce qu'un alcool ?", answer: "Un composé contenant le groupe fonctionnel -OH", difficulty: "medium" }
    ],
    "Chimie inorganique": [
      { question: "Quelle est la masse molaire de H₂SO₄ ? (H=1, S=32, O=16)", answer: "98 g/mol", difficulty: "medium" },
      { question: "Qu'est-ce qu'un acide selon Arrhenius ?", answer: "Une substance qui libère H⁺ en solution aqueuse", difficulty: "medium" },
      { question: "Qu'est-ce qu'une base selon Arrhenius ?", answer: "Une substance qui libère OH⁻ en solution aqueuse", difficulty: "medium" },
      { question: "Quel est le pH d'une solution de HCl 0.1 M ?", answer: "pH = 1", difficulty: "medium" },
      { question: "Qu'est-ce qu'un sel ?", answer: "Un composé ionique résultant de la neutralisation d'un acide et d'une base", difficulty: "medium" }
    ],
    "Électrochimie": [
      { question: "Qu'est-ce qu'une oxydation ?", answer: "Une perte d'électrons", difficulty: "medium" },
      { question: "Qu'est-ce qu'une réduction ?", answer: "Un gain d'électrons", difficulty: "medium" },
      { question: "Qu'est-ce qu'une pile électrochimique ?", answer: "Un dispositif qui convertit l'énergie chimique en énergie électrique", difficulty: "hard" },
      { question: "Qu'est-ce qu'une électrolyse ?", answer: "La décomposition d'un composé par passage d'un courant électrique", difficulty: "hard" },
      { question: "Qu'est-ce qu'une anode ?", answer: "L'électrode où se produit l'oxydation", difficulty: "medium" }
    ]
  },

  // BIOLOGIE - Terminale SVT
  "Biologie": {
    "Biologie cellulaire": [
      { question: "Qu'est-ce qu'une membrane cellulaire ?", answer: "La barrière qui sépare la cellule de son environnement", difficulty: "medium" },
      { question: "Qu'est-ce qu'un noyau ?", answer: "L'organite qui contient l'ADN de la cellule", difficulty: "easy" },
      { question: "Qu'est-ce qu'une mitochondrie ?", answer: "L'organite responsable de la production d'énergie", difficulty: "medium" },
      { question: "Qu'est-ce que la mitose ?", answer: "Le processus de division cellulaire", difficulty: "medium" },
      { question: "Qu'est-ce qu'un chromosome ?", answer: "Une structure qui contient l'ADN condensé", difficulty: "medium" }
    ],
    "Génétique": [
      { question: "Combien de chromosomes a l'être humain ?", answer: "46 chromosomes (23 paires)", difficulty: "easy" },
      { question: "Qu'est-ce qu'un gène ?", answer: "Un segment d'ADN qui code pour une protéine", difficulty: "medium" },
      { question: "Qu'est-ce que l'ADN ?", answer: "Acide désoxyribonucléique - molécule qui contient l'information génétique", difficulty: "medium" },
      { question: "Qu'est-ce qu'un allèle ?", answer: "Une variante d'un gène", difficulty: "medium" },
      { question: "Qu'est-ce qu'un génotype ?", answer: "La composition génétique d'un organisme", difficulty: "medium" }
    ],
    "Écologie": [
      { question: "Qu'est-ce qu'un écosystème ?", answer: "Un système formé par des organismes et leur environnement", difficulty: "easy" },
      { question: "Qu'est-ce qu'une chaîne alimentaire ?", answer: "Une séquence de transfert d'énergie d'un organisme à un autre", difficulty: "medium" },
      { question: "Qu'est-ce qu'un producteur primaire ?", answer: "Un organisme qui produit sa propre nourriture (plantes)", difficulty: "medium" },
      { question: "Qu'est-ce qu'un décomposeur ?", answer: "Un organisme qui décompose la matière organique morte", difficulty: "medium" },
      { question: "Qu'est-ce que la biodiversité ?", answer: "La variété des formes de vie dans un écosystème", difficulty: "easy" }
    ]
  }
};

async function seedFlashcardsWithChapters() {
  try {
    console.log('🌱 Ajout des flashcards avec chapitres pour le système de démo...\n');
    
    // Récupérer un utilisateur admin pour créer les flashcards
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('❌ Aucun utilisateur admin trouvé');
    }
    
    console.log(`✅ Utilisateur admin trouvé: ${adminUser.email}\n`);
    
    // Récupérer toutes les matières (sauf les sections)
    const allSubjects = await prisma.subject.findMany({
      where: {
        name: { notIn: ['SMP', 'SVT', 'SES', 'LLA'] }
      },
      include: {
        chapters: true
      }
    });
    
    let totalFlashcards = 0;
    let totalChapters = 0;
    
    // Pour chaque matière
    for (const subject of allSubjects) {
      const subjectData = flashcardDataByChapter[subject.name];
      
      if (!subjectData) {
        console.log(`⚠️  Aucune donnée pour ${subject.name}`);
        continue;
      }
      
      console.log(`\n📚 ${subject.name} (ID: ${subject.id}):`);
      
      // Pour chaque chapitre de la matière
      for (const chapter of subject.chapters) {
        const chapterFlashcards = subjectData[chapter.name];
        
        if (!chapterFlashcards) {
          console.log(`  ⏭️  Chapitre "${chapter.name}" ignoré (pas de données)`);
          continue;
        }
        
        console.log(`  📖 Chapitre: ${chapter.name} (ID: ${chapter.id})`);
        
        let chapterCount = 0;
        
        // Ajouter chaque flashcard au chapitre
        for (const flashcardData of chapterFlashcards) {
          try {
            // Vérifier si la flashcard existe déjà
            const existing = await prisma.flashcard.findFirst({
              where: {
                question: flashcardData.question,
                subjectId: subject.id,
                chapterId: chapter.id
              }
            });
            
            if (existing) {
              // Mettre à jour pour s'assurer qu'elle a le chapterId
              if (!existing.chapterId) {
                await prisma.flashcard.update({
                  where: { id: existing.id },
                  data: { chapterId: chapter.id }
                });
                chapterCount++;
              }
              continue;
            }
            
            // Créer la flashcard
            await prisma.flashcard.create({
              data: {
                question: flashcardData.question,
                answer: flashcardData.answer,
                subjectId: subject.id,
                chapterId: chapter.id,
                userId: adminUser.id,
                difficulty: flashcardData.difficulty
              }
            });
            
            chapterCount++;
            totalFlashcards++;
          } catch (error) {
            console.log(`    ⚠️  Erreur: ${error.message}`);
          }
        }
        
        console.log(`    ✅ ${chapterCount} flashcards ajoutées`);
        totalChapters++;
      }
    }
    
    console.log(`\n🎉 Terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - ${totalFlashcards} flashcards ajoutées`);
    console.log(`   - ${totalChapters} chapitres avec flashcards`);
    
    // Afficher un résumé par matière
    console.log(`\n📊 Résumé par matière:`);
    for (const subject of allSubjects) {
      const count = await prisma.flashcard.count({
        where: { subjectId: subject.id }
      });
      const chapterCount = await prisma.flashcard.count({
        where: { 
          subjectId: subject.id,
          chapterId: { not: null }
        }
      });
      console.log(`  ${subject.name}: ${count} flashcards totales (${chapterCount} avec chapitres)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
seedFlashcardsWithChapters()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });






