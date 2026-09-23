CREATE TABLE `general_feedback_surveys` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `token` text NOT NULL UNIQUE,
  `status` text NOT NULL DEFAULT 'pending',
  `responses_json` text NOT NULL DEFAULT '{}',
  `completed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX `idx_general_feedback_business_status` ON `general_feedback_surveys` (`business_id`, `status`);
