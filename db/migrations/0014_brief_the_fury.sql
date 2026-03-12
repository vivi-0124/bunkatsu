CREATE TABLE `fixed_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`total_payments` integer,
	`start_date` text NOT NULL,
	`amount_per_payment` integer NOT NULL,
	`total_amount` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `installments`;--> statement-breakpoint
DROP TABLE `income_item_templates`;--> statement-breakpoint
DROP TABLE `payment_item_templates`;