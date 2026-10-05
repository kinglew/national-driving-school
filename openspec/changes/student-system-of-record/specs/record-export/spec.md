# Spec Delta

## Purpose

Gives the office a recorded JSON export of training records for backup and Law 25 access requests, and requires that export log to exist before student identity is stored.

## ADDED Requirements

### Requirement: Export infrastructure exists before identity columns
The migration that adds student identity columns MUST create `record_exports` and the access-control tables in earlier statements in the same file. Identity columns MUST NOT appear before those tables.

#### Scenario: Migration order
- **WHEN** the student system migration file is read from top to bottom
- **THEN** `principals`, `sessions`, and `record_exports` are created before any column for a student name, email, phone, birth date, or licence number
- **AND** the file does not mention card numbers, PAN, or CVC

#### Scenario: Migration is recorded
- **WHEN** the migration has been applied to the database
- **THEN** `schema_migrations` contains the id `002_student_system_of_record` exactly once

### Requirement: Office can export training records
An authenticated office principal MUST be able to request a JSON export for purpose `backup` or `access_request`. The server MUST insert a `record_exports` row for that principal before it returns the body. The body MUST include the export id and student training records. The body MUST NOT include session token hashes, login-challenge hashes, or card data.

#### Scenario: Office backup
- **WHEN** an office session requests an export with purpose `backup`
- **THEN** the response status is 200
- **AND** a `record_exports` row exists for that request
- **AND** the JSON does not contain a session token hash or a card number

#### Scenario: Student cannot export
- **WHEN** a student session requests the export
- **THEN** the response status is 403
- **AND** no `record_exports` row is inserted

#### Scenario: Missing session
- **WHEN** a client requests the export without a session
- **THEN** the response status is 401
- **AND** the body does not contain student rows

### Requirement: Retention durations are not invented
The database MUST contain retention-policy rows for the training record, financial records, and marketing leads. `retain_days` MUST stay null until the school confirms a period. Export and student responses MUST NOT state a numeric retention period.

#### Scenario: Policies exist without a number of days
- **WHEN** the student system migration has been applied
- **THEN** retention policies exist for `student_training_record`, `financial_record`, and `marketing_lead`
- **AND** each `retain_days` value is null
