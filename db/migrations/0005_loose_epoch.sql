CREATE TABLE `student_term_selections` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`term_id` text NOT NULL,
	`course_id` text NOT NULL,
	`course_type` text NOT NULL,
	`status` text DEFAULT 'active',
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_term_selections_student_idx` ON `student_term_selections` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_term_selections_term_idx` ON `student_term_selections` (`term_id`);--> statement-breakpoint
ALTER TABLE `lesson_slots` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `lesson_slots_term_idx` ON `lesson_slots` (`term_id`);--> statement-breakpoint
CREATE INDEX `lesson_slots_area_idx` ON `lesson_slots` (`area_id`);--> statement-breakpoint
ALTER TABLE `lessons` ADD `student_term_selection_ids` text;--> statement-breakpoint
ALTER TABLE `lessons` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `lessons_term_idx` ON `lessons` (`term_id`);--> statement-breakpoint
CREATE INDEX `lessons_status_idx` ON `lessons` (`status`);--> statement-breakpoint
CREATE INDEX `lessons_course_type_idx` ON `lessons` (`course_type`);--> statement-breakpoint
CREATE INDEX `lessons_start_time_idx` ON `lessons` (`start_time`);--> statement-breakpoint
CREATE INDEX `status_history_lesson_idx` ON `status_history` (`lesson_id`);