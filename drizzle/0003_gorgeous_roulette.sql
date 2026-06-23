CREATE TABLE `directory_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`senderName` varchar(150) NOT NULL,
	`senderEmail` varchar(320) NOT NULL,
	`senderPhone` varchar(30),
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directory_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `directory_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`category` enum('restaurantes','hoteles','tours','inmobiliarias','abogados','medicos','escuelas','talleres') NOT NULL,
	`description` text,
	`shortDescription` varchar(300),
	`phone` varchar(30),
	`whatsapp` varchar(30),
	`email` varchar(320),
	`website` text,
	`address` text,
	`neighborhood` varchar(150),
	`city` varchar(100) NOT NULL DEFAULT 'Cancún',
	`state` varchar(100) NOT NULL DEFAULT 'Quintana Roo',
	`lat` varchar(30),
	`lng` varchar(30),
	`logoUrl` text,
	`coverUrl` text,
	`photos` text,
	`plan` enum('basico','profesional','premium') NOT NULL DEFAULT 'basico',
	`planExpiresAt` timestamp,
	`featured` boolean NOT NULL DEFAULT false,
	`status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
	`verified` boolean NOT NULL DEFAULT false,
	`facebook` text,
	`instagram` text,
	`viewCount` int NOT NULL DEFAULT 0,
	`contactCount` int NOT NULL DEFAULT 0,
	`schedule` text,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `directory_listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `directory_listings_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `directory_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`authorName` varchar(150) NOT NULL,
	`authorEmail` varchar(320),
	`userId` int,
	`rating` int NOT NULL,
	`title` varchar(200),
	`body` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directory_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `directory_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`plan` enum('basico','profesional','premium') NOT NULL,
	`priceMonthly` int NOT NULL,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp NOT NULL,
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`paymentMethod` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directory_subscriptions_id` PRIMARY KEY(`id`)
);
