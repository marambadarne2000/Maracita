CREATE TABLE `customer_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `customer_id` text NOT NULL,
  `author_type` text NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `attachment_name` text,
  `attachment_type` text,
  `attachment_data` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `idx_customer_messages_business_customer_date` ON `customer_messages` (`business_id`,`customer_id`,`created_at`);
