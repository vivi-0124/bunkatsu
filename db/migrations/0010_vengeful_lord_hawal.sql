DROP INDEX "accounts_userId_idx";--> statement-breakpoint
DROP INDEX "sessions_token_unique";--> statement-breakpoint
DROP INDEX "sessions_userId_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "verifications_identifier_idx";--> statement-breakpoint
DROP INDEX "day_notes_target_date_unique";--> statement-breakpoint
DROP INDEX "lesson_slots_term_idx";--> statement-breakpoint
DROP INDEX "lesson_slots_area_idx";--> statement-breakpoint
DROP INDEX "lessons_term_idx";--> statement-breakpoint
DROP INDEX "lessons_status_idx";--> statement-breakpoint
DROP INDEX "lessons_course_type_idx";--> statement-breakpoint
DROP INDEX "lessons_start_time_idx";--> statement-breakpoint
DROP INDEX "status_history_lesson_idx";--> statement-breakpoint
DROP INDEX "student_term_selections_student_idx";--> statement-breakpoint
DROP INDEX "student_term_selections_term_idx";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "role" TO "role" text DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `day_notes_target_date_unique` ON `day_notes` (`target_date`);--> statement-breakpoint
CREATE INDEX `lesson_slots_term_idx` ON `lesson_slots` (`term_id`);--> statement-breakpoint
CREATE INDEX `lesson_slots_area_idx` ON `lesson_slots` (`area_id`);--> statement-breakpoint
CREATE INDEX `lessons_term_idx` ON `lessons` (`term_id`);--> statement-breakpoint
CREATE INDEX `lessons_status_idx` ON `lessons` (`status`);--> statement-breakpoint
CREATE INDEX `lessons_course_type_idx` ON `lessons` (`course_type`);--> statement-breakpoint
CREATE INDEX `lessons_start_time_idx` ON `lessons` (`start_time`);--> statement-breakpoint
CREATE INDEX `status_history_lesson_idx` ON `status_history` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `student_term_selections_student_idx` ON `student_term_selections` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_term_selections_term_idx` ON `student_term_selections` (`term_id`);