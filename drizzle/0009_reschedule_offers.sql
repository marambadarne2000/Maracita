CREATE TABLE `reschedule_offers` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `appointment_id` text NOT NULL REFERENCES `appointments`(`id`),
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `token` text NOT NULL UNIQUE,
  `options_json` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `selected_starts_at` text,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX `idx_reschedule_offers_business_status` ON `reschedule_offers` (`business_id`, `status`);
CREATE INDEX `idx_reschedule_offers_appointment` ON `reschedule_offers` (`appointment_id`);
