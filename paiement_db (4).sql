-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 07 avr. 2026 à 07:51
-- Version du serveur : 8.0.31
-- Version de PHP : 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `paiement_db`
--

DELIMITER $$
--
-- Procédures
--
DROP PROCEDURE IF EXISTS `effectuerTransfert`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `effectuerTransfert` (IN `p_utilisateur_id` INT, IN `p_montant` DECIMAL(15,2), IN `p_type` ENUM('LOCAL','INTERNATIONAL'), IN `p_paysSource` VARCHAR(100), IN `p_paysDestination` VARCHAR(100))   BEGIN
    DECLARE solde_actuel DECIMAL(15,2);
    DECLARE transaction_id INT;

    START TRANSACTION;

    SELECT solde INTO solde_actuel
    FROM Compte
    WHERE utilisateur_id = p_utilisateur_id
    FOR UPDATE;

    IF solde_actuel < p_montant THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solde insuffisant pour effectuer le transfert';
    ELSE

        INSERT INTO Transaction (montant, statut, utilisateur_id)
        VALUES (p_montant, 'EN_ATTENTE', p_utilisateur_id);

        SET transaction_id = LAST_INSERT_ID();

        INSERT INTO Transfert (type, paysSource, paysDestination, transaction_id)
        VALUES (p_type, p_paysSource, p_paysDestination, transaction_id);

        UPDATE Transaction
        SET statut = 'VALIDEE'
        WHERE id = transaction_id;

        COMMIT;
    END IF;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `administrateur`
--

DROP TABLE IF EXISTS `administrateur`;
CREATE TABLE IF NOT EXISTS `administrateur` (
  `id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cartevirtuelle`
--

DROP TABLE IF EXISTS `cartevirtuelle`;
CREATE TABLE IF NOT EXISTS `cartevirtuelle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `dateExpiration` date NOT NULL,
  `cvv` varchar(5) NOT NULL,
  `type` varchar(50) DEFAULT 'Mastercard',
  `devise` varchar(10) DEFAULT 'XAF',
  `design` varchar(20) DEFAULT 'violet',
  `solde` decimal(15,2) DEFAULT '0.00',
  `dateCreation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('ACTIVE','BLOQUEE') DEFAULT 'ACTIVE',
  `utilisateur_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `cartevirtuelle`
--

INSERT INTO `cartevirtuelle` (`id`, `numero`, `dateExpiration`, `cvv`, `type`, `devise`, `design`, `solde`, `dateCreation`, `statut`, `utilisateur_id`, `created_at`, `updated_at`) VALUES
(6, '6365734472817075', '2029-04-01', '326', 'Mastercard', 'XAF', 'violet', '0.00', '2026-04-06 21:41:16', 'ACTIVE', 6, '2026-04-02 22:26:27', '2026-04-02 22:26:27'),
(2, '1027 8803 2172 7050', '0000-00-00', '447', 'Mastercard', 'XAF', 'violet', '0.00', '2026-04-06 21:41:16', 'ACTIVE', 2, '2026-03-16 16:05:18', '2026-03-28 11:08:55'),
(3, '8506612620907043', '2029-03-01', '695', 'Mastercard', 'XAF', 'violet', '0.00', '2026-04-06 21:41:16', 'ACTIVE', 2, '2026-03-28 11:09:08', '2026-03-28 11:09:08'),
(7, '6101103226048319', '2029-04-01', '983', 'Mastercard', 'XAF', 'violet', '0.00', '2026-04-06 21:41:16', 'ACTIVE', 6, '2026-04-03 03:28:33', '2026-04-03 03:28:33'),
(8, '5400287499819777', '2029-04-01', '259', 'Mastercard', 'XAF', 'violet', '0.00', '2026-04-06 21:41:16', 'ACTIVE', 6, '2026-04-03 03:29:00', '2026-04-03 03:29:00'),
(9, '8908962278634691', '2029-04-01', '660', 'Mastercard Argent', 'XAF', 'violet', '0.00', '2026-04-06 22:03:27', 'ACTIVE', 8, '2026-04-06 22:03:27', '2026-04-06 22:06:15');

-- --------------------------------------------------------

--
-- Structure de la table `compte`
--

DROP TABLE IF EXISTS `compte`;
CREATE TABLE IF NOT EXISTS `compte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `devise` varchar(10) NOT NULL,
  `solde` decimal(15,2) DEFAULT '0.00',
  `utilisateur_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `compte`
--

INSERT INTO `compte` (`id`, `devise`, `solde`, `utilisateur_id`, `created_at`, `updated_at`) VALUES
(1, 'XAF', '46704.00', 2, '2026-03-16 16:32:06', '2026-04-03 00:09:36'),
(2, 'XAF', '2821.00', 3, '2026-03-16 16:32:06', '2026-04-03 00:09:36'),
(3, 'XAF', '0.00', 4, '2026-03-16 16:32:06', '2026-03-16 16:32:06'),
(4, 'XAF', '50.00', 8, '2026-04-06 20:47:21', '2026-04-06 21:13:53');

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) DEFAULT NULL,
  `message` text,
  `dateEnvoi` datetime DEFAULT CURRENT_TIMESTAMP,
  `utilisateur_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `notification`
--

INSERT INTO `notification` (`id`, `titre`, `message`, `dateEnvoi`, `utilisateur_id`, `created_at`, `updated_at`) VALUES
(1, 'avertissemnet', 'les transactions effectué doivent etres securisée', '2026-03-26 14:45:14', 2, '2026-03-26 13:45:14', '2026-03-26 13:45:14'),
(2, '[URGENT] alerte', 'alerte fraude', '2026-03-26 15:51:03', 3, '2026-03-26 14:51:03', '2026-03-26 14:51:03'),
(3, 'bienvenu', 'bienvenu moussa', '2026-03-28 01:24:50', 5, '2026-03-28 00:24:50', '2026-03-28 00:24:50'),
(4, 'Dépôt en attente ⏳', 'Confirmez votre dépôt de 25 XAF en entrant votre code PIN Mobile Money sur votre téléphone.', '2026-04-06 22:47:26', 8, '2026-04-06 20:47:26', '2026-04-06 20:47:26'),
(5, 'Dépôt reçu ✅', '25 XAF ont été crédités sur votre wallet PayVirtual.', '2026-04-06 22:47:54', 8, '2026-04-06 20:47:54', '2026-04-06 20:47:54'),
(6, 'Dépôt en attente ⏳', 'Confirmez votre dépôt de 25 XAF en entrant votre code PIN Mobile Money sur votre téléphone.', '2026-04-06 23:12:44', 8, '2026-04-06 21:12:44', '2026-04-06 21:12:44'),
(7, 'Dépôt reçu ✅', '25 XAF ont été crédités sur votre wallet PayVirtual.', '2026-04-06 23:13:53', 8, '2026-04-06 21:13:53', '2026-04-06 21:13:53');

-- --------------------------------------------------------

--
-- Structure de la table `portefeuille`
--

DROP TABLE IF EXISTS `portefeuille`;
CREATE TABLE IF NOT EXISTS `portefeuille` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('PRINCIPAL','SECONDAIRE') NOT NULL,
  `utilisateur_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `telephone`
--

DROP TABLE IF EXISTS `telephone`;
CREATE TABLE IF NOT EXISTS `telephone` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `numero` varchar(20) NOT NULL,
  `indicatif` varchar(6) DEFAULT '+237',
  `type` enum('PRINCIPAL','SECONDAIRE','PROFESSIONNEL') DEFAULT 'PRINCIPAL',
  `statut` enum('ACTIF','INACTIF') DEFAULT 'ACTIF',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_numero` (`numero`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
CREATE TABLE IF NOT EXISTS `transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dateTransaction` datetime DEFAULT CURRENT_TIMESTAMP,
  `montant` decimal(15,2) NOT NULL,
  `statut` enum('EN_ATTENTE','VALIDEE','ANNULEE') DEFAULT 'EN_ATTENTE',
  `reference_externe` varchar(255) DEFAULT NULL,
  `utilisateur_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `idx_reference_externe` (`reference_externe`(250))
) ENGINE=MyISAM AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `transaction`
--

INSERT INTO `transaction` (`id`, `dateTransaction`, `montant`, `statut`, `reference_externe`, `utilisateur_id`, `created_at`, `updated_at`) VALUES
(1, '2026-03-16 19:07:02', '-1000.00', 'VALIDEE', NULL, 2, '2026-03-16 18:07:02', '2026-03-16 18:07:02'),
(2, '2026-03-16 21:35:15', '-200.00', 'VALIDEE', NULL, 2, '2026-03-16 20:35:15', '2026-03-16 20:35:15'),
(3, '2026-03-16 21:46:42', '-300.00', 'VALIDEE', NULL, 2, '2026-03-16 20:46:42', '2026-03-16 20:46:42'),
(4, '2026-03-16 22:04:04', '-700.00', 'VALIDEE', NULL, 2, '2026-03-16 21:04:04', '2026-03-16 21:04:04'),
(5, '2026-03-16 22:36:16', '-500.00', 'VALIDEE', NULL, 2, '2026-03-16 21:36:16', '2026-03-16 21:36:16'),
(6, '2026-03-24 14:33:08', '100.00', 'ANNULEE', NULL, 2, '2026-03-24 13:33:08', '2026-03-24 13:33:10'),
(7, '2026-03-24 22:17:23', '-100.00', 'VALIDEE', NULL, 2, '2026-03-24 21:17:23', '2026-03-24 21:17:23'),
(8, '2026-03-24 22:17:23', '100.00', 'VALIDEE', NULL, 3, '2026-03-24 21:17:23', '2026-03-24 21:17:23'),
(9, '2026-03-24 22:18:35', '-500.00', 'VALIDEE', NULL, 2, '2026-03-24 21:18:35', '2026-03-24 21:18:35'),
(10, '2026-03-24 22:18:35', '500.00', 'VALIDEE', NULL, 3, '2026-03-24 21:18:35', '2026-03-24 21:18:35'),
(11, '2026-03-27 14:00:12', '-196.00', 'VALIDEE', NULL, 2, '2026-03-27 13:00:12', '2026-03-27 13:00:12'),
(12, '2026-03-27 14:00:12', '196.00', 'VALIDEE', NULL, 3, '2026-03-27 13:00:12', '2026-03-27 13:00:12'),
(13, '2026-03-27 17:25:02', '123.00', 'ANNULEE', NULL, 3, '2026-03-27 16:25:02', '2026-03-27 16:25:07'),
(14, '2026-03-27 19:13:12', '100.00', 'ANNULEE', NULL, 2, '2026-03-27 18:13:12', '2026-03-27 18:13:23'),
(15, '2026-03-27 19:13:47', '100.00', 'ANNULEE', NULL, 2, '2026-03-27 18:13:47', '2026-03-27 18:13:53'),
(16, '2026-03-27 19:14:14', '100.00', 'ANNULEE', NULL, 2, '2026-03-27 18:14:14', '2026-03-27 18:14:17'),
(17, '2026-03-27 19:15:15', '125.00', 'ANNULEE', NULL, 2, '2026-03-27 18:15:15', '2026-03-27 18:15:30'),
(18, '2026-03-27 19:18:28', '500.00', 'ANNULEE', NULL, 2, '2026-03-27 18:18:28', '2026-03-27 18:19:34'),
(19, '2026-03-27 22:51:25', '500.00', 'ANNULEE', NULL, 2, '2026-03-27 21:51:25', '2026-03-27 21:51:28'),
(20, '2026-03-27 22:54:42', '1000.00', 'ANNULEE', NULL, 2, '2026-03-27 21:54:42', '2026-03-27 21:54:44'),
(21, '2026-03-28 00:16:02', '25.00', 'VALIDEE', NULL, 2, '2026-03-27 23:16:02', '2026-03-27 23:32:13'),
(22, '2026-03-28 00:18:11', '25.00', 'VALIDEE', NULL, 2, '2026-03-27 23:18:11', '2026-03-27 23:32:07'),
(23, '2026-03-28 01:23:24', '25.00', 'VALIDEE', NULL, 3, '2026-03-28 00:23:24', '2026-03-28 00:23:24'),
(24, '2026-03-28 02:03:38', '25.00', 'ANNULEE', NULL, 2, '2026-03-28 01:03:38', '2026-03-28 01:08:12'),
(25, '2026-03-28 14:29:40', '24.00', 'EN_ATTENTE', NULL, 2, '2026-03-28 13:29:40', '2026-03-28 13:29:40'),
(26, '2026-04-03 02:09:36', '-1000.00', 'VALIDEE', NULL, 2, '2026-04-03 00:09:36', '2026-04-03 00:09:36'),
(27, '2026-04-03 02:09:36', '1000.00', 'VALIDEE', NULL, 3, '2026-04-03 00:09:36', '2026-04-03 00:09:36'),
(28, '2026-04-03 02:32:49', '10.00', 'ANNULEE', NULL, 3, '2026-04-03 00:32:49', '2026-04-03 00:32:54'),
(29, '2026-04-03 02:33:15', '10.00', 'EN_ATTENTE', NULL, 3, '2026-04-03 00:33:15', '2026-04-03 00:33:15'),
(30, '2026-04-03 17:08:02', '25.00', 'EN_ATTENTE', NULL, 2, '2026-04-03 15:08:02', '2026-04-03 15:08:02'),
(31, '2026-04-03 17:18:44', '25.00', 'EN_ATTENTE', NULL, 2, '2026-04-03 15:18:44', '2026-04-03 15:18:44'),
(32, '2026-04-03 18:47:46', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 16:47:46', '2026-04-03 16:47:50'),
(33, '2026-04-03 18:48:27', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 16:48:27', '2026-04-03 16:48:29'),
(34, '2026-04-03 19:22:05', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 17:22:05', '2026-04-03 17:22:10'),
(35, '2026-04-03 19:57:57', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 17:57:57', '2026-04-03 17:58:00'),
(36, '2026-04-03 21:01:40', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 19:01:40', '2026-04-03 19:01:44'),
(37, '2026-04-03 22:12:51', '25.00', 'ANNULEE', NULL, 2, '2026-04-03 20:12:51', '2026-04-03 20:12:51'),
(38, '2026-04-06 22:47:21', '25.00', 'VALIDEE', '0974ec89-f006-4184-89bb-fb97edb01ee0', 8, '2026-04-06 20:47:21', '2026-04-06 20:47:54'),
(39, '2026-04-06 23:12:39', '25.00', 'VALIDEE', 'd9852afb-32cd-416e-bd99-c9c42086cb19', 8, '2026-04-06 21:12:39', '2026-04-06 21:13:53');

-- --------------------------------------------------------

--
-- Structure de la table `transfert`
--

DROP TABLE IF EXISTS `transfert`;
CREATE TABLE IF NOT EXISTS `transfert` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('LOCAL','INTERNATIONAL') NOT NULL,
  `paysSource` varchar(100) DEFAULT NULL,
  `paysDestination` varchar(100) DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `transfert`
--

INSERT INTO `transfert` (`id`, `type`, `paysSource`, `paysDestination`, `transaction_id`, `created_at`, `updated_at`) VALUES
(1, 'INTERNATIONAL', 'Cameroun', 'Cameroun', 1, '2026-03-16 18:07:02', '2026-03-16 18:07:02'),
(2, 'INTERNATIONAL', 'Cameroun', 'Cameroun', 2, '2026-03-16 20:35:15', '2026-03-16 20:35:15'),
(3, 'INTERNATIONAL', 'Cameroun', 'Cameroun', 3, '2026-03-16 20:46:42', '2026-03-16 20:46:42'),
(4, 'INTERNATIONAL', 'Cameroun', 'Cameroun', 4, '2026-03-16 21:04:04', '2026-03-16 21:04:04'),
(5, 'INTERNATIONAL', 'Cameroun', 'Cameroun', 5, '2026-03-16 21:36:16', '2026-03-16 21:36:16'),
(6, 'LOCAL', 'Cameroun', 'Cameroun', 7, '2026-03-24 21:17:23', '2026-03-24 21:17:23'),
(7, 'LOCAL', 'Cameroun', 'Cameroun', 9, '2026-03-24 21:18:35', '2026-03-24 21:18:35'),
(8, 'LOCAL', 'Cameroun', 'Cameroun', 11, '2026-03-27 13:00:12', '2026-03-27 13:00:12'),
(9, 'LOCAL', 'Cameroun', 'Cameroun', 26, '2026-04-03 00:09:36', '2026-04-03 00:09:36');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `motDePasse` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `statut` enum('ACTIF','INACTIF','SUSPENDU') DEFAULT 'ACTIF',
  `type` enum('ADMIN','USER') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom`, `email`, `motDePasse`, `telephone`, `statut`, `type`, `created_at`, `updated_at`) VALUES
(5, 'moussa', 'moussa@gmail.com', '$2b$10$v.CXUPp5wOUEXcr.AcgbKuMke/UQNEVtGqA6/aU9vPgEAdEDhQIs.', '+237655024817', 'ACTIF', 'USER', '2026-03-27 23:39:08', '2026-03-27 23:39:08'),
(2, 'leyla', 'leyla@gmail.com', '$2b$10$34/Ds7MLoS6sQs8U1o8HOeZ.TD1VSt2KWZF3DLoJVJvdAO.2QM1v.', '+237697833505', 'ACTIF', 'USER', '2026-03-14 10:42:41', '2026-03-27 18:02:21'),
(3, 'nafi', 'nafi@gmail.com', '$2b$10$UNoYZ1uEX/PEssiDrMvZ2Ob0bSg7TgN2aYPppncZ7tq9Em0zGqILm', '+237655595360', 'ACTIF', 'USER', '2026-03-14 11:14:13', '2026-03-27 18:03:16'),
(4, 'NjoyaLeyla', 'njoya@gmail.com', '$2b$10$Yh5QCXqDDGmzPc/.VkzsWuwgoSHtC6JpqAlrz850JnYz/ZbUvTFVK', '+237697833505', 'ACTIF', 'ADMIN', '2026-03-14 11:42:39', '2026-03-14 11:44:45'),
(6, 'kalicha', 'kalicha@gmail.com', '$2b$10$c9S..i3eRhjkrbPYVUBzQeJvzjk9YxRWaHKcMxOmHZJ0kLKAqRGsS', '+237697833505', 'ACTIF', 'USER', '2026-04-02 19:58:06', '2026-04-02 19:58:06'),
(7, 'Mous', 'mous@gmail.com', '$2b$10$yZafzLG78kmz/ig1ZpdkPehKJckjnBJHVblC9lHySHZZ2nLzfpZ6a', '+237655 02 48 17', 'ACTIF', 'USER', '2026-04-03 15:16:14', '2026-04-03 15:16:14'),
(8, 'zoulika', 'zouli@gmail.com', '$2b$10$MG6AZNGsQSJEZUqC4luqjul7coA5uSjhZIxkRdEjcOrbXXwHsSenu', '+237697833505', 'ACTIF', 'USER', '2026-04-03 18:35:39', '2026-04-03 18:35:39');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
