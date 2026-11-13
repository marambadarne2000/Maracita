# Isolated regression checks

Run `npm run test:regression` after `npm ci`, with Node.js 24 or newer.

The suites contain 62 assertions: inbox/recovery (9), atomic inbound processing (12), trial messaging and access controls (30), Gmail settings access and encryption (11).

SQLite databases are in-memory and records are synthetic. The schema fixture contains table definitions only. Provider responses are mocked. No real messages are sent and no live database is changed. These checks do not prove provider delivery, OAuth consent, trial eligibility or physical-device usability. An intentionally logged CRM mirror failure verifies that the original inbound message is retained.

Manual QA and the separate Java/Selenium example are preserved in the neighboring directories.
