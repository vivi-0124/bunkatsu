CREATE TABLE `installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`total_payments` integer NOT NULL,
	`current_payment` integer NOT NULL,
	`amount_per_payment` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
