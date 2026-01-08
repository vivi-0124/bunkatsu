PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_installments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`total_payments` integer NOT NULL,
	`start_date` text NOT NULL,
	`amount_per_payment` integer NOT NULL,
	`total_amount` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_installments`("id", "user_id", "name", "total_payments", "start_date", "amount_per_payment", "total_amount", "created_at", "updated_at") SELECT "id", "user_id", "name", "total_payments", "start_date", "amount_per_payment", "total_amount", "created_at", "updated_at" FROM `installments`;--> statement-breakpoint
DROP TABLE `installments`;--> statement-breakpoint
ALTER TABLE `__new_installments` RENAME TO `installments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;