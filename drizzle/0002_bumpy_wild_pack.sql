ALTER TABLE `articles` ADD `status` enum('pending','published','rejected') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `tags` text;