CREATE TABLE `password_reset_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `used_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `idx_password_reset_tokens_account_expiry` ON `password_reset_tokens` (`account_id`, `expires_at`);
