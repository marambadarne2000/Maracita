# Maracita launch operations

Public support/privacy address: maram.software.tech@gmail.com. Launch languages: English (default), Hebrew and Arabic.

## Operator workflow

Open /workspace/launch as the configured operator. Regular businesses cannot access this screen. Configure the platform sender separately from business Connections: recovery mail requires a verified sender and valid Resend key. Save the key through the password field, check it, then send a test only to a mailbox you own or have permission to contact. Provider acceptance does not establish inbox receipt.

Each business configures its own email, SMS, WhatsApp, Instagram and AI credentials through Connections. Missing or invalid providers remain disconnected. No outbound test was authorized or sent during the launch audit.

## Backup and restore

The local launcher creates encrypted snapshots on startup and every six hours while running. Seven snapshots are retained. BACKUP_ENCRYPTION_KEY is separate from integration encryption; store it securely outside the computer. Losing this key prevents restoring encrypted snapshots. Do not put keys in source control or chat.

Run `npm run backup:local` to snapshot and verify restoration into a temporary copy. A successful test checks AES-GCM authentication, SHA-256, SQLite integrity, foreign keys and core-table row counts. Restore deliberately to a new path using `node scripts/backup-local.mjs --restore <encrypted-file> --target <new-copy.sqlite>`. The script refuses to overwrite any existing target. Stop the application and verify the copy before a controlled recovery. Automatic replacement of the live database is intentionally not provided.

Local backup success is not cloud restore evidence. Verify the deployed D1 backup/Time Travel configuration and test recovery into an isolated cloud database before recording cloud_backup_restore as passed.

## Scheduling and monitoring

Builds include a Worker scheduled handler and five-minute cron configuration. Confirm that the hosting platform actually installed the trigger; code/configuration alone is not evidence of scheduled execution. The local launcher separately calls the protected jobs endpoint each minute. JOB_SECRET is required; unauthenticated calls are rejected.

/api/health exposes service status without customer information. Launch Center lists sanitized operational events, privacy requests and pilot results. Error categories and routes are retained without message bodies or credentials. An external uptime monitor and proven notification delivery must be verified separately. Do not mark monitoring complete merely because the health URL responds locally.

## Release checks requiring people or providers

Verify real mail arrival and password recovery on the HTTPS origin. Review the Privacy Notice and Terms against actual operation and suppliers. Test Android and iPhone physical devices, including signup, booking, moving/cancelling appointments, messages, reminders and privacy requests. Run a pilot with actual participating businesses and resolve their findings. Browser viewport simulation and synthetic accounts do not establish these checks.

Launch Center labels operator attestations separately from automated evidence and leaves release requirements open until the corresponding verification is recorded. It is not an independent penetration-test certificate or legal certification.
