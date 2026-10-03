# National Driving School

## Privacy and security

Privacy and security are the top priority.

Student and staff data is sensitive. It includes identity, lessons, and payments. Use least privilege. No secrets in git. No service-role keys in the browser. `DATABASE_URL` is server-only.

Every database access goes through server code with parameterized queries. Students see only their own rows. Staff roles are explicit.

Law 25: consent, purpose limitation, retention, and access or deletion. Student-facing legal copy is bilingual (English and French).

Every feature, including bugfixes that change behaviour, MUST go through the OpenSpec workflow (proposal, spec deltas with scenarios, tasks, implementation, verification) before code lands. PRDs in `docs/plans` are inputs to that workflow, not permission to skip it.

Do not store card numbers. Payments go through Stripe. Audit important record changes.

OpenSpec CLI 1.14 does not write a managed marker block in this file (`openspec init` / `openspec update` refresh `.cursor/` and `.agents/` skills only). Keep these rules outside any future OpenSpec markers so an update cannot wipe them.
