# Spec Delta

## Purpose

Provides a committed, repeatable schema for an empty Neon database before any student identity is stored.

## ADDED Requirements

### Requirement: Migrations are committed SQL
The repository MUST contain SQL that creates `schema_migrations` and a `students` stub. Applying that SQL MUST be an explicit command. The health check MUST NOT run it.

#### Scenario: First apply
- **WHEN** an operator runs the migration command with `DATABASE_URL` set against an empty database
- **THEN** `public.schema_migrations` and `public.students` exist
- **AND** the migration id is recorded in `schema_migrations`

#### Scenario: Second apply
- **WHEN** the operator runs the migration command again
- **THEN** the command succeeds without changing existing rows
- **AND** the migration id is not duplicated

#### Scenario: Missing URL
- **WHEN** the operator runs the migration command without `DATABASE_URL`
- **THEN** the command exits with an error
- **AND** it does not print a connection string

### Requirement: Students stub holds no identity
The `students` table created by this change MUST NOT include name, email, phone, date of birth, licence, address, or payment columns. It MUST NOT be readable through a public API in this change.

#### Scenario: Columns
- **WHEN** the foundation migration has been applied
- **THEN** `students` has an id, timestamps, and a preferred language constrained to `en` or `fr`
- **AND** it has no identity or payment columns

#### Scenario: No student HTTP API
- **WHEN** a client requests student records
- **THEN** this change provides no route that returns rows from `students`
