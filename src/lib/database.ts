import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// In development, store the client on the global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Base de données connectée avec succès');
  } catch (error) {
    console.error('❌ Échec de la connexion à la base de données:', error);
    throw error;
  }
}

// Database disconnection helper
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Base de données déconnectée avec succès');
  } catch (error) {
    console.error('❌ Échec de la déconnexion de la base de données:', error);
    throw error;
  }
}

// Seed data for testing
export async function seedDatabase() {
  try {
    console.log('🌱 Initialisation de la base de données avec des données de test complètes...');
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create comprehensive subjects
    const subjects = await Promise.all([
      // Terminale subjects
      prisma.subject.upsert({
        where: { name: 'Mathématiques' },
        update: {},
        create: {
          name: 'Mathématiques',
          level: 'Terminale',
          description: 'Mathématiques pour la classe de terminale'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Physique' },
        update: {},
        create: {
          name: 'Physique',
          level: 'Terminale',
          description: 'Physique pour la classe de terminale'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Chimie' },
        update: {},
        create: {
          name: 'Chimie',
          level: 'Terminale',
          description: 'Chimie pour la classe de terminale'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Biologie' },
        update: {},
        create: {
          name: 'Biologie',
          level: 'Terminale',
          description: 'Biologie pour la classe de terminale'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'SVT' },
        update: {},
        create: {
          name: 'SVT',
          level: 'Terminale',
          description: 'Sciences de la Vie et de la Terre'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'SMP' },
        update: {},
        create: {
          name: 'SMP',
          level: 'Terminale',
          description: 'Sciences Mathématiques et Physiques'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'SES' },
        update: {},
        create: {
          name: 'SES',
          level: 'Terminale',
          description: 'Sciences Économiques et Sociales'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'LLA' },
        update: {},
        create: {
          name: 'LLA',
          level: 'Terminale',
          description: 'Lettres, Langues et Arts'
        }
      }),
      // 9ème subjects
      prisma.subject.upsert({
        where: { name: 'Français' },
        update: {},
        create: {
          name: 'Français',
          level: '9ème',
          description: 'Français pour la classe de 9ème'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Histoire-Géographie' },
        update: {},
        create: {
          name: 'Histoire-Géographie',
          level: '9ème',
          description: 'Histoire-Géographie pour la classe de 9ème'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Anglais' },
        update: {},
        create: {
          name: 'Anglais',
          level: '9ème',
          description: 'Anglais pour la classe de 9ème'
        }
      }),
      prisma.subject.upsert({
        where: { name: 'Sciences' },
        update: {},
        create: {
          name: 'Sciences',
          level: '9ème',
          description: 'Sciences pour la classe de 9ème'
        }
      })
    ]);

    // Create comprehensive test users with Haitian names
    const testUsers = await Promise.all([
      // Admin
      prisma.user.upsert({
        where: { email: 'admin@tyala.com' },
        update: {},
        create: {
          email: 'admin@tyala.com',
          firstName: 'Admin',
          lastName: 'Tyala',
          password: hashedPassword,
          role: 'ADMIN',
          userClass: null,
          section: null,
          department: 'Ouest',
          phone: '+509 1234-5678',
          address: 'Port-au-Prince, Haïti'
        }
      }),
      // Students
      prisma.user.upsert({
        where: { email: 'carlos.rodriguez@test.com' },
        update: {},
        create: {
          email: 'carlos.rodriguez@test.com',
          firstName: 'Carlos',
          lastName: 'Rodriguez',
          password: hashedPassword,
          role: 'STUDENT',
          userClass: 'Terminale',
          section: 'SMP',
          department: 'Ouest'
        }
      }),
      prisma.user.upsert({
        where: { email: 'maria.gonzalez@test.com' },
        update: {},
        create: {
          email: 'maria.gonzalez@test.com',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          password: hashedPassword,
          role: 'STUDENT',
          userClass: 'Terminale',
          section: 'SVT',
          department: 'Nord'
        }
      }),
      prisma.user.upsert({
        where: { email: 'jose.martinez@test.com' },
        update: {},
        create: {
          email: 'jose.martinez@test.com',
          firstName: 'José',
          lastName: 'Martinez',
          password: hashedPassword,
          role: 'STUDENT',
          userClass: '9ème',
          section: null,
          department: 'Sud'
        }
      }),
      // Tutors
      prisma.user.upsert({
        where: { email: 'prof.marie@test.com' },
        update: {},
        create: {
          email: 'prof.marie@test.com',
          firstName: 'Marie',
          lastName: 'Diop',
          password: hashedPassword,
          role: 'TUTOR',
          department: 'Ouest'
        }
      }),
      prisma.user.upsert({
        where: { email: 'prof.luis@test.com' },
        update: {},
        create: {
          email: 'prof.luis@test.com',
          firstName: 'Luis',
          lastName: 'Fernandez',
          password: hashedPassword,
          role: 'TUTOR',
          department: 'Artibonite'
        }
      }),
      prisma.user.upsert({
        where: { email: 'dr.carmen@test.com' },
        update: {},
        create: {
          email: 'dr.carmen@test.com',
          firstName: 'Carmen',
          lastName: 'Vargas',
          password: hashedPassword,
          role: 'TUTOR',
          department: 'Centre'
        }
      }),
      prisma.user.upsert({
        where: { email: 'prof.ricardo@test.com' },
        update: {},
        create: {
          email: 'prof.ricardo@test.com',
          firstName: 'Ricardo',
          lastName: 'Mendoza',
          password: hashedPassword,
          role: 'TUTOR',
          department: 'Nord-Est'
        }
      })
    ]);

    // Create comprehensive tutors with Haitian names
    const tutors = await Promise.all([
      prisma.tutor.upsert({
        where: { userId: testUsers[3].id },
        update: {},
        create: {
          userId: testUsers[3].id,
          experience: 10,
          rating: 4.8,
          isOnline: true,
          bio: 'Professeur expérimenté en mathématiques et physique avec plus de 10 ans d\'expérience en Haïti.',
          hourlyRate: 25.0
        }
      }),
      prisma.tutor.upsert({
        where: { userId: testUsers[4].id },
        update: {},
        create: {
          userId: testUsers[4].id,
          experience: 8,
          rating: 4.9,
          isOnline: true,
          bio: 'Spécialiste en chimie et biologie, passionné par l\'enseignement en Haïti.',
          hourlyRate: 30.0
        }
      }),
      prisma.tutor.upsert({
        where: { userId: testUsers[5].id },
        update: {},
        create: {
          userId: testUsers[5].id,
          experience: 12,
          rating: 4.7,
          isOnline: false,
          bio: 'Expert en français et littérature, ancien professeur de lycée en Haïti.',
          hourlyRate: 20.0
        }
      }),
      prisma.tutor.upsert({
        where: { userId: testUsers[6].id },
        update: {},
        create: {
          userId: testUsers[6].id,
          experience: 15,
          rating: 4.9,
          isOnline: true,
          bio: 'Professeur agrégé en histoire-géographie, très expérimenté en Haïti.',
          hourlyRate: 28.0
        }
      })
    ]);

    // Create tutor-subject relationships
    await Promise.all([
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[0].id, subjectId: subjects[0].id } },
        update: {},
        create: { tutorId: tutors[0].id, subjectId: subjects[0].id } // Mathématiques
      }),
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[0].id, subjectId: subjects[1].id } },
        update: {},
        create: { tutorId: tutors[0].id, subjectId: subjects[1].id } // Physique
      }),
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[1].id, subjectId: subjects[2].id } },
        update: {},
        create: { tutorId: tutors[1].id, subjectId: subjects[2].id } // Chimie
      }),
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[1].id, subjectId: subjects[3].id } },
        update: {},
        create: { tutorId: tutors[1].id, subjectId: subjects[3].id } // Biologie
      }),
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[2].id, subjectId: subjects[8].id } },
        update: {},
        create: { tutorId: tutors[2].id, subjectId: subjects[8].id } // Français
      }),
      prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutors[3].id, subjectId: subjects[9].id } },
        update: {},
        create: { tutorId: tutors[3].id, subjectId: subjects[9].id } // Histoire-Géographie
      })
    ]);

    // Note: Les flashcards complètes sont maintenant ajoutées via le script seed-flashcards.cjs
    // qui contient 10 flashcards par matière pour un total de 120+ flashcards
    console.log('📝 Les flashcards complètes sont ajoutées via le script dédié seed-flashcards.cjs');

    // Create test messages for chat with Haitian names
    const messages = await Promise.all([
      prisma.message.create({
        data: {
          senderId: testUsers[0].id,
          receiverId: testUsers[3].id,
          content: 'Bonjour professeur, j\'aimerais de l\'aide en mathématiques',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      }),
      prisma.message.create({
        data: {
          senderId: testUsers[3].id,
          receiverId: testUsers[0].id,
          content: 'Bonjour Carlos ! Je serais ravi de vous aider. Quel chapitre vous pose problème ?',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        }
      }),
      prisma.message.create({
        data: {
          senderId: testUsers[0].id,
          receiverId: testUsers[3].id,
          content: 'Les équations du second degré, je n\'arrive pas à comprendre la méthode',
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      }),
      prisma.message.create({
        data: {
          senderId: testUsers[3].id,
          receiverId: testUsers[0].id,
          content: 'Parfait ! Je vais vous expliquer étape par étape. Pouvez-vous me montrer un exemple d\'équation ?',
          createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        }
      }),
      prisma.message.create({
        data: {
          senderId: testUsers[1].id,
          receiverId: testUsers[4].id,
          content: 'Bonjour Dr. Luis, j\'ai besoin d\'aide en biologie',
          createdAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
        }
      }),
      prisma.message.create({
        data: {
          senderId: testUsers[4].id,
          receiverId: testUsers[1].id,
          content: 'Bonjour Maria ! En quoi puis-je vous aider en biologie ?',
          createdAt: new Date(Date.now() - 40 * 60 * 1000) // 40 minutes ago
        }
      })
    ]);

    console.log('✅ Base de données initialisée avec succès avec des données de test complètes');
    console.log(`📚 Créé ${subjects.length} matières`);
    console.log(`👥 Créé ${testUsers.length} utilisateurs (${testUsers.filter(u => u.role === 'STUDENT').length} étudiants, ${testUsers.filter(u => u.role === 'TUTOR').length} tuteurs, ${testUsers.filter(u => u.role === 'ADMIN').length} administrateurs)`);
    console.log(`🎓 Créé ${tutors.length} tuteurs`);
    console.log(`📝 Flashcards complètes disponibles via seed-flashcards.cjs (120+ flashcards)`);
    console.log(`💬 Créé ${messages.length} messages`);

  } catch (error) {
    console.error('❌ Échec de l\'initialisation de la base de données:', error);
    throw error;
  }
}

export default prisma;