# PRD 04 — Scheduling

Input to OpenSpec. Do not implement from this file. Depends on students, staff, and lessons from PRD 01.

This is the phone-and-diary pain for a driving school:

- Availability calendars per instructor and per dual-control car
- Booking rules (learner licence required before phase-2 outings; buffer between lessons)
- Cancel and waitlist
- Optional Google Calendar sync for instructors (free API)

Start simple: the office books; students request; staff confirms. Full self-serve booking only after the school trusts the rules. Whether v1 is office-booked only is still an owner decision (see `docs/plans/README.md`).

Do not buy a scheduling suite.

## Exit

Staff can see a day, book a car and an instructor, and students can see what is confirmed. Conflicts and licence gates are enforced on the server, not only in the UI.
