# Spec Delta

## Purpose

Stores the student training file on the server: identity with consent, enrolment, the Class 5 phase plan, lessons, and attendance, with an audit trail and no payment data.

## ADDED Requirements

### Requirement: Identity requires consent
The server MUST reject an enrolment that does not record consent. A student row that stores a name, email, phone, birth date, or licence number MUST have `consent_recorded_at` set and a non-empty consent purpose. The purpose of this phase is the training record. The office role MUST be the only role that creates a student. The browser MUST NOT persist that identity in `localStorage`.

#### Scenario: Missing consent
- **WHEN** an office session submits an enrolment with consent not true
- **THEN** the response status is 400
- **AND** no student identity row is inserted

#### Scenario: Consented enrolment
- **WHEN** an office session submits a valid student, consent, a program code, and a start date
- **THEN** the server creates a student principal, a student row, an enrolment, four phase rows, a milestone row, and an audit row
- **AND** the phase planned days are 28, 28, 56, and 56 in that order

#### Scenario: Under 18
- **WHEN** the birth date is under 18 years and no guardian name is provided
- **THEN** the response status is 400
- **AND** no student identity row is inserted

### Requirement: Lessons and attendance are training records
Office staff MUST assign theory or in-car lessons with a start time, duration, and location. Instructors and office staff MUST record attendance as theory minutes and road minutes. The student file MUST report totals against 24 hours of theory and 15 hours on the road. Lesson status MUST be `scheduled`, `completed`, or `cancelled`. The server MUST NOT accept or store a card number.

#### Scenario: Assign a lesson
- **WHEN** an office session assigns an in-car lesson on an enrolment
- **THEN** the lesson is stored with that enrolment
- **AND** an audit row records the assignment

#### Scenario: Attendance
- **WHEN** the assigned instructor records attendance on that lesson
- **THEN** the minutes are stored on that lesson only
- **AND** the student file totals include those minutes

#### Scenario: Card data is refused
- **WHEN** a client sends a card number, PAN, or CVC on an enrolment or lesson request
- **THEN** the server does not write that value to the database

### Requirement: Milestones and phases stay with the enrolment
Each enrolment MUST have one milestone row for the learner-licence date and the attestation date, both nullable. Only office staff MUST set those dates or a phase start or completion date. Dates MUST be audited.

#### Scenario: Attestation date
- **WHEN** an office session sets the attestation date on an enrolment
- **THEN** the milestone stores that date
- **AND** a student session for that enrolment can read it
- **AND** a different student session cannot

### Requirement: Deletion is a request, not a silent erase
Office staff MUST be able to record a deletion request on a student. The server MUST set `deletion_requested_at`, write an audit row, and MUST NOT delete the student row in this phase. Retention is unconfirmed, so erasure MUST wait.

#### Scenario: Request deletion
- **WHEN** an office session records a deletion request for a student
- **THEN** `deletion_requested_at` is set
- **AND** the student row still exists
- **AND** an audit row records the request

### Requirement: Desk and office read the server
The student desk MUST load the signed-in student's journey from the server, including phases, lessons, milestone dates, and theory and road totals. The front office MUST load student files and MUST update lesson status through the server. Registration MUST NOT store a student file or a payment in the browser. Invoices and balances MUST NOT be written to the database in this phase.

#### Scenario: Student desk
- **WHEN** a student session opens the desk
- **THEN** the page shows that student's name, phases, and lessons from the server
- **AND** it does not show another student's name

#### Scenario: Unsigned desk
- **WHEN** a visitor opens the desk without a session
- **THEN** the page does not show a stored student file

#### Scenario: Registration does not keep a card
- **WHEN** a visitor completes registration in the browser
- **THEN** no card number is collected
- **AND** no student file is written to `localStorage`
