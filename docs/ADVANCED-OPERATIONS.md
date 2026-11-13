# Scheduling and communication upgrade

This update adds a day/week/month calendar, slot creation with inline customer registration,
staff columns and drag-to-reschedule, business and staff hours, date closures,
public self-booking with private management links, ranged comparative reports,
time-limited waitlist offers, and a provider-connected unified inbox with AI reply drafts.

## Local setup

Build the project, then run `npm run db:upgrade`, then `npm start`.
Local data lives in `.wrangler/state`, outside disposable build files.
Existing source and data are not reset by this upgrade.
The local runner invokes offer processing every minute when JOB_SECRET is configured.
Set MARACITA_DISABLE_JOBS=1 for test runs that must not process automatic messages.

## Availability

Set business hours under Hours & booking before creating appointments. Staff inherit
business hours until an individual schedule is saved. Individual hours are intersected
with the business schedule. Closures apply to one staff member or the whole business.
Every booking entry point, including old rescheduling links, validates these rules.
Database triggers reject conflicting appointments even when requests arrive concurrently.
Public bookings also enforce lead time, booking horizon and the configured slot interval.

## Connections

The application starts with no external connections. Store keys only in the Connections
form or server secret settings, never in source control or browser-local settings.
INTEGRATIONS_ENCRYPTION_KEY is a random 32-byte encryption key, encoded as 64 hex digits.
Changing it without re-encrypting connections makes saved provider keys unreadable.
JOB_SECRET authenticates the internal background processor. These local server secrets
are generated in the ignored `.dev.vars` file by the local upgrade installer.

For email, configure Resend with a verified sender/receiving address, API key and webhook
signing secret. Incoming bodies are fetched from the receiving API only after validating
the signed webhook. For WhatsApp, configure a Meta Business phone number ID, token,
app secret, webhook verification token and supported Graph API version. Automatic offers
require an approved template with customer-name and offer-link body parameters.
For Instagram, configure the professional account ID, app token/secret, webhook verification
token and supported Graph API version. Provider permissions and public HTTPS callbacks
must be completed in the provider dashboards; localhost cannot receive these events.

For AI, configure an OpenAI API key and a model available to the account. Responses API
requests use `store:false`. Reply drafts are displayed for human review and never sent
automatically. Ranking requests contain candidate IDs and wait times, not customer contacts.
Without an AI connection, the slot filler uses explicitly labelled rules, not fake AI output.
The application is free; provider usage may incur separate charges.

## Automatic offers

Customers must opt into the selected email or WhatsApp channel on their waitlist entry.
Automatic sending is off by default. Expired offers advance on a later processor run.
An offer does not reserve the slot; final acceptance checks availability and books atomically.
Delivery failures remain visible and are never labelled as sent. A provider timeout can
mean uncertain delivery, so review provider logs before manually retrying a message.

Production scheduling uses `worker-entry.mjs` as the Worker entry, a five-minute cron,
JOB_SECRET, and PUBLIC_BASE_URL set to the public HTTPS application origin. The migration
must also be applied to the deployment database before deployment. This local task does
not deploy, connect third-party accounts, or send customer messages.

## Official implementation references

- OpenAI Responses API: https://developers.openai.com/api/docs/guides/migrate-to-responses
- Resend webhook verification: https://resend.com/docs/webhooks/verify-webhooks-requests
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Instagram messaging: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
