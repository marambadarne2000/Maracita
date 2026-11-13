# Source synchronization - 13 November 2026

The GitHub checkout was compared with hosted-release source commit `a21ac98e91b7523f702938175860da3ffda5413f` (release 14). The GitHub base was `6f18d4c682d6dc705b84127752704e416d228d76`.

## Included

- Current application routes/components, calendar/availability, public booking, reporting, resources and reminders.
- Business registration, local authentication, cookie sessions, password-management routes and operator tooling.
- Inbox, signed webhooks, atomic incoming-message persistence, replay/delivery handling and encrypted provider settings.
- Gmail setup and callback code; free-trial-only SMS/WhatsApp configuration and manual testing controls.
- All ordered schema migrations through `0018_launch_readiness.sql` and the migration journal.
- Existing manual QA/Java Selenium materials, plus 62 portable isolated Node regression assertions.
- npm lockfile, build/worker scripts, CI checks, safe environment template and local-key initializer.

## Deliberate public-repository differences

Production Site identity and the real D1 ID are replaced with portable binding configuration and a placeholder database ID. Private environment variables, credentials, user databases, backup files, generated builds, caches and TypeScript incremental state are excluded. The outdated pnpm lockfile is removed because setup and CI use the current npm lockfile.

These adaptations do not modify the hosted application, its active database or its users. GitHub and Sites keep separate source histories/remotes. Historical operational reports refer to their original dates, not today's deployment status.

## Verification scope

The regression suites use synthetic data, in-memory SQLite and mocked provider calls. A passing build or test suite does not establish live email delivery, Google OAuth approval, Meta/Twilio trial eligibility, penetration-test results or physical-device usability. Provider secrets and owner consent are still required for live integrations.

The release keeps phone messaging in manual sandbox/trial mode; it must not be presented as unrestricted free messaging for public users.
