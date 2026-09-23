CREATE TABLE `feedback_surveys` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `appointment_id` text NOT NULL UNIQUE REFERENCES `appointments`(`id`),
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `token` text NOT NULL UNIQUE,
  `status` text NOT NULL DEFAULT 'pending',
  `responses_json` text NOT NULL DEFAULT '{}',
  `completed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX `idx_feedback_surveys_business_status` ON `feedback_surveys` (`business_id`,`status`);
CREATE INDEX `idx_feedback_surveys_customer` ON `feedback_surveys` (`business_id`,`customer_id`);
