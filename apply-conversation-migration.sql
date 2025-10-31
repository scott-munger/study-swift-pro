-- Migration pour ajouter les tables Conversation et améliorer DirectMessage
-- À exécuter manuellement si nécessaire

-- 1. Créer la table Conversation
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `studentId` INT NOT NULL,
  `tutorId` INT NOT NULL,
  `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `conversations_studentId_tutorId_key` (`studentId`, `tutorId`),
  INDEX `conversations_studentId_idx` (`studentId`),
  INDEX `conversations_tutorId_idx` (`tutorId`),
  INDEX `conversations_lastMessageAt_idx` (`lastMessageAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Modifier la table direct_messages si elle existe déjà
-- Vérifier d'abord si la table existe
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'direct_messages';

-- Si la table existe, la modifier
-- Sinon, la créer
CREATE TABLE IF NOT EXISTS `direct_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversationId` INT NULL,
  `senderId` INT NOT NULL,
  `receiverId` INT NOT NULL,
  `content` TEXT NOT NULL,
  `messageType` ENUM('TEXT', 'VOICE', 'IMAGE', 'FILE') NOT NULL DEFAULT 'TEXT',
  `audioUrl` VARCHAR(255) NULL,
  `fileUrl` VARCHAR(255) NULL,
  `fileName` VARCHAR(255) NULL,
  `fileType` VARCHAR(100) NULL,
  `fileSize` INT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `direct_messages_conversationId_idx` (`conversationId`),
  INDEX `direct_messages_senderId_idx` (`senderId`),
  INDEX `direct_messages_receiverId_idx` (`receiverId`),
  INDEX `direct_messages_isRead_idx` (`isRead`),
  INDEX `direct_messages_createdAt_idx` (`createdAt`),
  CONSTRAINT `direct_messages_conversationId_fkey` 
    FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ajouter la colonne conversationId si la table existait avant
-- Ignorer l'erreur si la colonne existe déjà
ALTER TABLE `direct_messages` 
ADD COLUMN IF NOT EXISTS `conversationId` INT NULL AFTER `id`,
ADD COLUMN IF NOT EXISTS `messageType` ENUM('TEXT', 'VOICE', 'IMAGE', 'FILE') NOT NULL DEFAULT 'TEXT' AFTER `content`,
ADD COLUMN IF NOT EXISTS `audioUrl` VARCHAR(255) NULL AFTER `messageType`,
ADD COLUMN IF NOT EXISTS `fileUrl` VARCHAR(255) NULL AFTER `audioUrl`,
ADD COLUMN IF NOT EXISTS `fileName` VARCHAR(255) NULL AFTER `fileUrl`,
ADD COLUMN IF NOT EXISTS `fileType` VARCHAR(100) NULL AFTER `fileName`,
ADD COLUMN IF NOT EXISTS `fileSize` INT NULL AFTER `fileType`;

-- 4. Ajouter les index si nécessaires
CREATE INDEX IF NOT EXISTS `direct_messages_conversationId_idx` ON `direct_messages`(`conversationId`);

-- 5. Ajouter la contrainte de clé étrangère si elle n'existe pas
-- Note: Cette commande peut échouer si la contrainte existe déjà, c'est normal
-- ALTER TABLE `direct_messages` 
-- ADD CONSTRAINT `direct_messages_conversationId_fkey` 
-- FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Vérifier que tout est ok
SELECT 
  'Conversations table' as verification,
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'conversations'
UNION ALL
SELECT 
  'DirectMessages table' as verification,
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'direct_messages';

