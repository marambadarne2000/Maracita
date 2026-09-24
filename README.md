# Maracita

**Maracita** is an appointment operations platform for service businesses. It brings customer relationships, booking flow, payments, team schedules and follow-up signals into one private workspace.

Built by **Maram Abbas**.

> This repository is a portfolio-ready product build. It intentionally contains no customer data, API keys, payment credentials or provider secrets.

## What it does

- Creates a private workspace for each business.
- Manages customers, staff members, services and availability.
- Creates appointments and prevents staff scheduling conflicts.
- Tracks appointment states: scheduled, confirmed, arrived, completed, cancelled and no-show.
- Keeps customer history in a Customer 360 profile: appointments, payments, receipts, messages and feedback.
- Records local payment plans and generates receipt records.
- Uses a waitlist and **Smart Rescue** queue to turn cancellations and incomplete tasks into follow-up actions.
- Shows a Journey Timeline from booking to feedback.
- Provides analytics, a searchable communication workspace, file attachments and customer feedback surveys.

## Product direction

Maracita is designed as a multi-tenant SaaS for clinics, beauty and wellness studios, consultants, fitness businesses, auto services and other appointment-led teams. The project focuses on calm operational UX: the most important next action should be visible without turning the day into a noisy dashboard.

## Tech stack

- React 19 + Vinext / Vite
- TypeScript
- Cloudflare Workers + D1 (local development)
- Drizzle ORM and SQL migrations
- Supabase Auth integration
- Tailwind CSS and shadcn-style UI primitives

## Local setup

### Requirements

- Node.js 22 or newer
- A Supabase project only if you want to test the real email-and-password flow

### Run locally

```bash
npm install
npm run build
npm run db:migrate:local
npm run start
```

Open `http://localhost:3000`.

For real authentication, copy `.env.example` to `.dev.vars` (on Windows: `Copy-Item .env.example .dev.vars`) and add `SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY`.

### Portfolio demo

Open `http://localhost:3000/demo` after the local migration, or choose **Explore the portfolio demo** from the landing page. It creates fictional records in a local demo workspace, so reviewers can explore the full product without Supabase credentials, an account, or any personal data.

## Database

The D1 schema lives in [`drizzle/`](./drizzle). Run the ordered SQL migrations against your own local or deployed D1 database before using the application with data.

## Current scope and production roadmap

The product workflow and data model are implemented. These integrations are deliberately not represented as live until real accounts and credentials are configured:

- Card processing and subscription billing
- Transactional email, SMS and WhatsApp delivery
- A production domain and SMTP sender identity
- Production-level rate limiting, MFA, backups, monitoring and formal privacy documents

See [`docs/PORTFOLIO.md`](./docs/PORTFOLIO.md) for a portfolio walkthrough and [`SECURITY.md`](./SECURITY.md) for safe contribution rules.

## Verification

```bash
npm run build
```

GitHub Actions runs this build on every push and pull request.

## Browser automation

The repository includes a real Selenium + Java WebDriver suite in [`qa/selenium-java`](./qa/selenium-java). It opens the deployed product in headless Chrome and verifies the public landing page plus the portfolio-demo workspace flow. GitHub Actions runs it automatically on every push and pull request.

## License

Copyright © 2026 Maram Abbas. All rights reserved. This repository is shared for portfolio review only; reuse, redistribution and commercial use require written permission.
