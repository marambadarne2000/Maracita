CREATE TABLE `business_hours` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_business_hours_business_weekday` ON `business_hours` (`business_id`,`weekday`);--> statement-breakpoint
CREATE TABLE `schedule_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`signal_date` text NOT NULL,
	`signal_type` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`summary` text NOT NULL,
	`context_json` text DEFAULT '{}' NOT NULL,
	`resolved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_schedule_signals_business_date` ON `schedule_signals` (`business_id`,`signal_date`);--> statement-breakpoint
CREATE INDEX `idx_schedule_signals_open` ON `schedule_signals` (`business_id`,`resolved_at`);--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`staff_id` text,
	`service_id` text,
	`requested_date` text,
	`earliest_time` text,
	`latest_time` text,
	`contact_preference` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`offered_appointment_id` text,
	`offer_expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`offered_appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_waitlist_business_status_date` ON `waitlist_entries` (`business_id`,`status`,`requested_date`);--> statement-breakpoint
CREATE INDEX `idx_waitlist_customer_status` ON `waitlist_entries` (`business_id`,`customer_id`,`status`);