# Spec Delta

## Purpose

Lets operators see whether the server can reach Neon without ever handing the connection string or student rows to the browser.

## ADDED Requirements

### Requirement: Database URL stays on the server
The application MUST read `DATABASE_URL` only in server code. The browser bundle MUST NOT contain the connection string. Client code MUST NOT open a Postgres connection.

#### Scenario: Health check without a URL
- **WHEN** a client calls `GET /api/health` and `DATABASE_URL` is unset or blank
- **THEN** the response status is 503
- **AND** the JSON body is exactly `ok: false` and `database: "unconfigured"`
- **AND** the body does not contain a connection string, password, host, or student row

#### Scenario: Client bundle
- **WHEN** the production frontend bundle is built
- **THEN** the bundle does not contain `DATABASE_URL` or a Neon connection string

### Requirement: Health check pings the database
When `DATABASE_URL` is set, `GET /api/health` MUST run a parameterized server-side ping. It MUST NOT apply migrations. It MUST NOT return driver errors or student data.

#### Scenario: Database accepts the ping
- **WHEN** `DATABASE_URL` is set and the ping succeeds
- **THEN** the response status is 200
- **AND** `ok` is true and `database` is `"up"`
- **AND** `schemaReady` is true only if both `students` and `schema_migrations` exist in `public`

#### Scenario: Database rejects the ping
- **WHEN** `DATABASE_URL` is set and the ping throws
- **THEN** the response status is 503
- **AND** `ok` is false and `database` is `"down"`
- **AND** the body does not include the driver message or the connection string

#### Scenario: Wrong method
- **WHEN** a client calls `/api/health` with a method other than GET or HEAD
- **THEN** the response status is 405
- **AND** the body does not include a connection string

### Requirement: Queries are parameterized
Server database calls that include a value from outside the committed SQL MUST pass that value as a bound parameter, not by string concatenation.

#### Scenario: Migration id lookup
- **WHEN** the migration runner checks whether a migration id was applied
- **THEN** the id is sent as a bound parameter
