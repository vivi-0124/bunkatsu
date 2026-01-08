ALTER TABLE `installments` ADD `start_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `installments` DROP COLUMN `current_payment`;