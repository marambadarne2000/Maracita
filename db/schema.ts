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
  status: text('status').notNull().default('active'),
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
  status: text('status').notNull().default('active'),
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

export const businessCredentials = sqliteTable('business_credentials', {
  businessId: text('business_id').primaryKey().references(() => businesses.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  businessNumber: text('business_number').notNull().unique(),
  ownerIdHash: text('owner_id_hash').notNull(),
  city: text('city').notNull().default(''),
  address: text('address').notNull().default(''),
  createdAt: createdAt(),
});
export const businessTasks = sqliteTable('business_tasks', {
  id: id('id'), businessId: text('business_id').notNull().references(() => businesses.id),
  title: text('title').notNull(), dueDate: text('due_date'), completed: integer('completed').notNull().default(0), createdAt: createdAt(),
});


export const bookingSettings = sqliteTable('booking_settings', {
 businessId: text('business_id').primaryKey().references(() => businesses.id), slug: text('slug').notNull().unique(),
 publicEnabled: integer('public_enabled').notNull().default(0), leadMinutes: integer('lead_minutes').notNull().default(60),
 horizonDays: integer('horizon_days').notNull().default(90), slotInterval: integer('slot_interval').notNull().default(15),
 autoFill: integer('auto_fill').notNull().default(0), offerMinutes: integer('offer_minutes').notNull().default(15),
 offerChannel: text('offer_channel').notNull().default('email'), updatedAt: updatedAt(),
});
export const staffHours = sqliteTable('staff_hours', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),staffId:text('staff_id').notNull().references(()=>staff.id),
 weekday:integer('weekday').notNull(),startMinute:integer('start_minute').notNull(),endMinute:integer('end_minute').notNull(),closed:integer('closed').notNull().default(0),
},table=>[uniqueIndex('uq_staff_hours_business_staff_weekday').on(table.businessId,table.staffId,table.weekday)]);
export const timeOff = sqliteTable('time_off', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),staffId:text('staff_id').references(()=>staff.id),
 startsAt:text('starts_at').notNull(),endsAt:text('ends_at').notNull(),reason:text('reason').notNull().default(''),createdAt:createdAt(),
},table=>[index('idx_time_off_range').on(table.businessId,table.startsAt,table.endsAt)]);
export const publicBookingTokens = sqliteTable('public_booking_tokens', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),appointmentId:text('appointment_id').notNull().unique().references(()=>appointments.id),tokenHash:text('token_hash').notNull().unique(),createdAt:createdAt(),
});
export const waitlistOffers = sqliteTable('waitlist_offers', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),sourceAppointmentId:text('source_appointment_id').notNull().references(()=>appointments.id),
 waitlistId:text('waitlist_id').notNull().references(()=>waitlistEntries.id),customerId:text('customer_id').notNull().references(()=>customers.id),staffId:text('staff_id').notNull().references(()=>staff.id),serviceId:text('service_id').notNull().references(()=>services.id),
 startsAt:text('starts_at').notNull(),endsAt:text('ends_at').notNull(),tokenHash:text('token_hash').notNull().unique(),status:text('status').notNull().default('pending'),expiresAt:text('expires_at').notNull(),
 deliveryStatus:text('delivery_status').notNull().default('pending'),channel:text('channel').notNull(),appointmentId:text('appointment_id').references(()=>appointments.id),createdAt:createdAt(),
},table=>[uniqueIndex('uq_waitlist_source_entry').on(table.sourceAppointmentId,table.waitlistId),index('idx_waitlist_offers_status').on(table.businessId,table.status,table.expiresAt)]);
export const integrations = sqliteTable('integrations', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),channel:text('channel').notNull(),externalAccountId:text('external_account_id').notNull().default(''),displayName:text('display_name').notNull().default(''),encryptedConfig:text('encrypted_config').notNull(),enabled:integer('enabled').notNull().default(1),createdAt:createdAt(),updatedAt:updatedAt(),
},table=>[uniqueIndex('uq_integration_business_channel').on(table.businessId,table.channel)]);
export const inboxConversations = sqliteTable('inbox_conversations', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),connectionId:text('connection_id').references(()=>integrations.id),customerId:text('customer_id').references(()=>customers.id),channel:text('channel').notNull(),externalContactId:text('external_contact_id').notNull(),contactName:text('contact_name').notNull(),unreadCount:integer('unread_count').notNull().default(0),lastMessageAt:text('last_message_at').notNull(),
},table=>[uniqueIndex('uq_inbox_business_channel_contact').on(table.businessId,table.channel,table.externalContactId)]);
export const inboxMessages = sqliteTable('inbox_messages', {
 id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),conversationId:text('conversation_id').notNull().references(()=>inboxConversations.id),direction:text('direction').notNull(),body:text('body').notNull(),deliveryStatus:text('delivery_status').notNull(),providerMessageId:text('provider_message_id'),error:text('error'),createdAt:createdAt(),
},table=>[index('idx_inbox_messages_conversation').on(table.businessId,table.conversationId,table.createdAt)]);
export const integrationEvents = sqliteTable('integration_events', {
 connectionId:text('connection_id').notNull().references(()=>integrations.id),eventId:text('event_id').notNull(),createdAt:createdAt(),
},table=>[primaryKey({columns:[table.connectionId,table.eventId]})]);

export const inboxAttachments=sqliteTable('inbox_attachments',{
 messageId:text('message_id').primaryKey().references(()=>inboxMessages.id),businessId:text('business_id').notNull().references(()=>businesses.id),name:text('name').notNull(),mimeType:text('mime_type').notNull(),data:text('data').notNull(),
},table=>[index('idx_inbox_attachments_business').on(table.businessId)]);

export const reminderSettings=sqliteTable('reminder_settings',{businessId:text('business_id').primaryKey().references(()=>businesses.id),enabled:integer('enabled').notNull().default(0),channel:text('channel').notNull().default('email'),leadMinutes:integer('lead_minutes').notNull().default(1440),updatedAt:updatedAt()});
export const reminderPreferences=sqliteTable('reminder_preferences',{businessId:text('business_id').notNull().references(()=>businesses.id),customerId:text('customer_id').notNull().references(()=>customers.id),channel:text('channel').notNull(),consentedAt:text('consented_at').notNull()},t=>[primaryKey({columns:[t.businessId,t.customerId,t.channel]})]);
export const appointmentReminders=sqliteTable('appointment_reminders',{id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),appointmentId:text('appointment_id').notNull().references(()=>appointments.id),startsAt:text('starts_at').notNull(),channel:text('channel').notNull(),status:text('status').notNull(),providerId:text('provider_id'),error:text('error'),createdAt:createdAt(),updatedAt:updatedAt()},t=>[uniqueIndex('uq_reminder_appointment_time_channel').on(t.appointmentId,t.startsAt,t.channel)]);
export const resources=sqliteTable('resources',{id:id('id'),businessId:text('business_id').notNull().references(()=>businesses.id),name:text('name').notNull(),kind:text('kind').notNull(),active:integer('active').notNull().default(1),createdAt:createdAt()});
export const serviceResources=sqliteTable('service_resources',{businessId:text('business_id').notNull().references(()=>businesses.id),serviceId:text('service_id').notNull().references(()=>services.id),resourceId:text('resource_id').notNull().references(()=>resources.id)},t=>[primaryKey({columns:[t.serviceId,t.resourceId]})]);

export const providerDeliveryEvents=sqliteTable('provider_delivery_events',{connectionId:text('connection_id').notNull().references(()=>integrations.id),businessId:text('business_id').notNull().references(()=>businesses.id),eventId:text('event_id').notNull(),providerMessageId:text('provider_message_id').notNull(),status:text('status').notNull(),occurredAt:text('occurred_at').notNull(),createdAt:createdAt()},t=>[primaryKey({columns:[t.connectionId,t.eventId]}),index('provider_delivery_lookup').on(t.connectionId,t.providerMessageId,t.occurredAt)]);
