CREATE TABLE `dashboard_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`header` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`target` integer NOT NULL,
	`limit` integer NOT NULL,
	`reviewer` text NOT NULL
);
