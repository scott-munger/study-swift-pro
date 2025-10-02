const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDates() {
  try {
    console.log('🔧 Correction des dates des comptes...');
    
    // Corriger les dates des comptes créés en 2025
    const result = await prisma.user.updateMany({
      where: {
        createdAt: {
          gte: new Date('2025-01-01')
        }
      },
      data: {
        createdAt: new Date('2024-10-01T16:45:20.525Z'),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ ${result.count} comptes corrigés`);
    
    // Vérifier les comptes corrigés
    const correctedUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-01-01')
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
    
    if (correctedUsers.length === 0) {
      console.log('✅ Tous les comptes ont été corrigés');
    } else {
      console.log('⚠️  Il reste des comptes à corriger:', correctedUsers);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDates();
