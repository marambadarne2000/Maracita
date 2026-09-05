PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_account_id` text NOT NULL,
	`name` text NOT NULL,
	`business_type` text NOT NULL,
	`phone` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'trial' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_businesses`("id", "owner_account_id", "name", "business_type", "phone", "timezone", "currency", "status", "created_at", "updated_at") SELECT "id", "owner_account_id", "name", "business_type", "phone", "timezone", "currency", "status", "created_at", "updated_at" FROM `businesses`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
ALTER TABLE `__new_businesses` RENAME TO `businesses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_businesses_owner_account` ON `businesses` (`owner_account_id`);