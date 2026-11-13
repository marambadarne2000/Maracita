# Maracita

Appointment and customer management by **Maram Abbas**. English is the default language, with Hebrew and Arabic interfaces and right-to-left layouts.

## Implemented features

- Free business registration, local password sign-in, business-scoped workspaces, HttpOnly sessions and password-change/recovery routes.
- Day/week/month calendar, staff columns, drag-to-reschedule, inline customer creation and overlapping-booking prevention.
- Business/staff hours, closures, buffers, room/equipment availability and public booking/management links.
- Customer records, services, local payment/receipt records, comparative reports, waitlists and cancellation offers.
- Unified inbox, private notes/attachments, signed incoming webhooks, delivery events and duplicate-event protection.
- Encrypted provider settings, system Gmail OAuth, separate business Resend connections and optional AI drafting.
- Privacy/terms pages, operator Launch Center, health endpoint, operational events and encrypted local backup tools.
- WhatsApp sandbox and Twilio Trial configuration: manual tests, recipient allowlists, expiry, rate limits and replay protection.

These are implemented code paths, not a claim that all external services are connected or that the product is ready for public launch.

## Integration limits

Gmail recovery needs valid OAuth credentials, account-owner consent and real delivery verification. Resend test senders cannot support public recovery or unrestricted customer email. Business messages use a separate business connection.

WhatsApp requires a Meta test number positively identified as SANDBOX. SMS requires an active parent Twilio Trial account. Both phone channels permit only manual tests to configured, provider-verified recipients. Automated phone reminders/offers and paid accounts are blocked. Trial eligibility, regions, templates, quotas and expiry remain controlled by the providers. This code does not create or upgrade provider accounts or activate billing. AI and Instagram require their own optional configuration. Local payment records do not charge cards or transfer money.

## Stack

React 19, TypeScript, Vinext/Vite, Cloudflare Workers/D1, Drizzle SQL migrations, Tailwind CSS and shadcn-style components. Sign-in uses local application accounts; Supabase is optional legacy configuration.

## Local setup

Use **Node.js 24 or newer**:

```bash
npm ci
npm run setup:local
npm run check:types
node scripts/check-migrations.mjs
npm run test:regression
npm run build
npm run db:migrate:local
npm start
```

Open `http://localhost:3000`. Setup creates an ignored `.dev.vars` with independent random encryption, background-job and backup keys; it does not print values or overwrite an existing file. `.env.example` lists safe configuration names only. Never upload actual credentials, backups or database files.

For a new database, run all migrations once. Preserve existing data before upgrades: `db:upgrade` covers only the advanced-operation migration range, not all historical migrations. State lives under `.wrangler/state`. Registration does not require Gmail, Resend, Supabase, a payment card or a paid provider. Email delivery still requires a configured sender.

`/demo` uses fictional data; it does not prove real delivery. To manage operator-only tools locally, register an account and set its ID as `LAUNCH_ADMIN_ACCOUNT_ID` in `.dev.vars`, then restart.

## Verification and QA

GitHub Actions runs lockfile installation, TypeScript checks, in-memory migration validation, 62 isolated communication/security assertions and a production build. Provider calls are mocked; fixtures contain no customer data.

- [Regression checks](qa/regression/README.md)
- [Manual QA plan and artifacts](qa/manual/TEST_PLAN.md)
- [Separate Java/Selenium example](qa/selenium-java/README.md)
- [Calendar and communication architecture](docs/ADVANCED-OPERATIONS.md)
- [Launch operations](docs/LAUNCH-RUNBOOK.md)
- [Source synchronization notes](docs/SOURCE-SYNC-2026-11-13.md)
- [Security](SECURITY.md)

Historical audit documents refer to their stated dates and environments; they are not current production certifications. The Java/Selenium example is separate from the Node build/regression pipeline.

## Hosting

`.openai/hosting.json` contains only local DB/R2 binding declarations. Production Site identity, secrets, customer state and local build output are excluded. `wrangler.production.jsonc` has a placeholder D1 ID: replace it with your own deployment database before deploying. Updating this repository does not automatically change the hosted Site.

## License

Copyright 2026 Maram Abbas. All rights reserved. Shared for portfolio review; reuse, redistribution and commercial use require written permission.
