ALTER TABLE `monthly_incomes` ADD `is_excluded` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `monthly_payments` ADD `is_excluded` integer DEFAULT false NOT NULL;