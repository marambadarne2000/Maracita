import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const id = (name: string) => text(name).primaryKey();
const createdAt = () => text('created_at').notNull();
const updatedAt = () => text('updated_at').notNull();

/**
 * Maracita's multi-tenant data model.
 * Every operational record belongs to a business. Queries must always include
 * the authenticated member's business_id; that rule is enforced in server
 * route handlers rather than in the browser.
 */
export const accounts = sqliteTable('accounts', {
  id: id('id'),
  authSubject: text('auth_subject').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  preferredLocale: text('preferred_locale').notNull().default('en'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const businesses = sqliteTable('businesses', {
  id: id('id'),
  ownerAccountId: text('owner_account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  businessType: text('business_type').notNull(),
  phone: text('phone').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('trial'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_businesses_owner_account').on(table.ownerAccountId),
]);

export const memberships = sqliteTable('memberships', {
  businessId: text('business_id').notNull().references(() => businesses.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  role: text('role').notNull().default('owner'),
  createdAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.businessId, table.accountId] }),
  index('idx_memberships_account_business').on(table.accountId, table.businessId),
]);

export const subscriptions = sqliteTable('subscriptions', {
  id: id('id'),
  businessId: text('business_id').notNull().unique().references(() => businesses.id),
  planCode: text('plan_code').notNull(),
  status: text('status').notNull().default('trialing'),
  trialEndsAt: text('trial_ends_at'),
  currentPeriodEndsAt: text('current_period_ends_at'),
  paymentProviderCustomerId: text('payment_provider_customer_id'),
  paymentProviderSubscriptionId: text('payment_provider_subscription_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const customers = sqliteTable('customers', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  nationalId: text('national_id'),
  email: text('email'),
  tags: text('tags').notNull().default(''),
  notes: text('notes').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_customers_business_name').on(table.businessId, table.lastName, table.firstName),
  index('idx_customers_business_phone').on(table.businessId, table.phone),
]);

export const staff = sqliteTable('staff', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  calendarColor: text('calendar_color').notNull().default('#4c8df6'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_staff_business_active').on(table.businessId, table.active),
]);

export const services = sqliteTable('services', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  name: text('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  bufferMinutes: integer('buffer_minutes').notNull().default(0),
  priceAgorot: integer('price_agorot').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_services_business_active').on(table.businessId, table.active),
]);

/**
 * Flow Intelligence starts with explicit availability rules and an opt-in
 * waitlist. This lets Maracita fill a cancelled slot without guessing about a
 * customer's availability or sending messages without their permission.
 */
export const businessHours = sqliteTable('business_hours', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  weekday: integer('weekday').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
  closed: integer('closed', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_business_hours_business_weekday').on(table.businessId, table.weekday),
]);

export const waitlistEntries = sqliteTable('waitlist_entries', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  staffId: text('staff_id').references(() => staff.id),
  serviceId: text('service_id').references(() => services.id),
  requestedDate: text('requested_date'),
  earliestTime: text('earliest_time'),
  latestTime: text('latest_time'),
  contactPreference: text('contact_preference').notNull().default('manual'),
  status: text('status').notNull().default('waiting'),
  offeredAppointmentId: text('offered_appointment_id').references(() => appointments.id),
  offerExpiresAt: text('offer_expires_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_waitlist_business_status_date').on(table.businessId, table.status, table.requestedDate),
  index('idx_waitlist_customer_status').on(table.businessId, table.customerId, table.status),
]);

export const scheduleSignals = sqliteTable('schedule_signals', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  signalDate: text('signal_date').notNull(),
  signalType: text('signal_type').notNull(),
  priority: text('priority').notNull().default('normal'),
  summary: text('summary').notNull(),
  contextJson: text('context_json').notNull().default('{}'),
  resolvedAt: text('resolved_at'),
  createdAt: createdAt(),
}, (table) => [
  index('idx_schedule_signals_business_date').on(table.businessId, table.signalDate),
  index('idx_schedule_signals_open').on(table.businessId, table.resolvedAt),
]);

export const appointments = sqliteTable('appointments', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  staffId: text('staff_id').notNull().references(() => staff.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  status: text('status').notNull().default('scheduled'),
  arrivedAt: text('arrived_at'),
  notes: text('notes').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_appointments_business_start').on(table.businessId, table.startsAt),
  index('idx_appointments_staff_start').on(table.businessId, table.staffId, table.startsAt),
  index('idx_appointments_customer_start').on(table.businessId, table.customerId, table.startsAt),
]);

export const payments = sqliteTable('payments', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  appointmentId: text('appointment_id').references(() => appointments.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  amountAgorot: integer('amount_agorot').notNull(),
  currency: text('currency').notNull().default('ILS'),
  installments: integer('installments').notNull().default(1),
  status: text('status').notNull().default('pending'),
  provider: text('provider'),
  providerPaymentId: text('provider_payment_id'),
  paidAt: text('paid_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_payments_business_status').on(table.businessId, table.status),
  index('idx_payments_appointment').on(table.businessId, table.appointmentId),
]);

export const receipts = sqliteTable('receipts', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  paymentId: text('payment_id').notNull().unique().references(() => payments.id),
  receiptNumber: text('receipt_number').notNull(),
  issuedAt: text('issued_at').notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex('uq_receipts_business_number').on(table.businessId, table.receiptNumber),
]);

/** A one-time survey link created only after a completed and paid appointment. */
export const feedbackSurveys = sqliteTable('feedback_surveys', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  appointmentId: text('appointment_id').notNull().unique().references(() => appointments.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'),
  responsesJson: text('responses_json').notNull().default('{}'),
  completedAt: text('completed_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('idx_feedback_surveys_business_status').on(table.businessId, table.status),
  index('idx_feedback_surveys_customer').on(table.businessId, table.customerId),
]);

/** Private conversation history between a business and one customer. */
export const customerMessages = sqliteTable('customer_messages', {
  id: id('id'),
  businessId: text('business_id').notNull().references(() => businesses.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  authorType: text('author_type').notNull(),
  body: text('body').notNull().default(''),
  attachmentName: text('attachment_name'),
  attachmentType: text('attachment_type'),
  attachmentData: text('attachment_data'),
  createdAt: createdAt(),
}, (table) => [
  index('idx_customer_messages_business_customer_date').on(table.businessId, table.customerId, table.createdAt),
]);
