# Spec Delta

## Purpose

Makes staff and student access explicit on the server so a student cannot read another student's rows and so a browser never holds the database connection.

## ADDED Requirements

### Requirement: Roles are explicit
Every principal MUST have exactly one role of `office`, `instructor`, or `student`. Staff members MUST be `office` or `instructor` only. The server MUST reject a request that has no valid session with status 401, and MUST reject a session whose role is not allowed for that action with status 403.

#### Scenario: No session
- **WHEN** a client calls a student, lesson, or export route without a bearer session
- **THEN** the response status is 401
- **AND** the server does not run a query that returns student identity

#### Scenario: Student is not office
- **WHEN** a student session calls an office-only action
- **THEN** the response status is 403

#### Scenario: Instructor is not a student list
- **WHEN** an instructor session lists students
- **THEN** the response status is 403

### Requirement: Students see only their own rows
For a student session, every query that reads or updates a student, enrolment, lesson, phase, milestone, or attendance row MUST be parameterized and MUST constrain the row to that session's principal. A student MUST NOT widen the query by passing another student's id. Students MUST NOT update another person's lessons. A student MAY set only their own lesson signature.

#### Scenario: Own file
- **WHEN** a student session lists students
- **THEN** the query binds that principal id as a parameter
- **AND** the SQL text does not concatenate the caller's email or id
- **AND** the response contains only that student's rows

#### Scenario: Forged student id
- **WHEN** a student session sends another student's id in the query or body
- **THEN** the other student's identity is not returned

### Requirement: Instructors see only assigned lessons
An instructor MUST list and update only lessons whose instructor principal is that session. Updates MUST be limited to status, notes, vehicle label, location, the instructor signature, and attendance. An instructor MUST NOT change student identity, enrol a student, or export records.

#### Scenario: Assigned lesson
- **WHEN** an instructor marks an assigned lesson completed
- **THEN** the lesson status is stored as completed
- **AND** an audit row records the instructor and the lesson

#### Scenario: Someone else's lesson
- **WHEN** an instructor updates a lesson assigned to a different instructor
- **THEN** the response status is 404
- **AND** the lesson row is unchanged

### Requirement: Magic-link delivery is not sent
The server MUST accept a magic-link request and MUST answer `{ ok: true, delivery: "not_sent" }` whether or not the email matches a principal. The response MUST NOT contain a token or a token hash. The server MUST NOT send email. The server MUST store only a hash when it creates a challenge. Redeeming a valid unused unexpired token MUST create a session and consume the challenge. The raw session token MUST be stored only as a hash.

#### Scenario: Request does not reveal the token
- **WHEN** a client requests a magic link for any email
- **THEN** the JSON `delivery` value is `not_sent`
- **AND** the body has no token or token hash
- **AND** no email is sent

#### Scenario: Redeem
- **WHEN** a client redeems a token whose hash matches an unconsumed, unexpired challenge for an active principal
- **THEN** the challenge is consumed
- **AND** a session is created
- **AND** the stored session secret is a hash, not the raw token

### Requirement: Database access stays on the server
Student and access routes MUST read `DATABASE_URL` only on the server and MUST use parameterized queries. When `DATABASE_URL` is unset, those routes MUST return 503 and MUST NOT open a connection. Error bodies MUST NOT include a driver message, a connection string, or a host. The client bundle MUST NOT contain `DATABASE_URL` or a Neon host.

#### Scenario: Unconfigured
- **WHEN** a client calls `GET /api/students` and `DATABASE_URL` is blank
- **THEN** the response status is 503
- **AND** the body does not contain a connection string

#### Scenario: Driver failure
- **WHEN** the database throws while a session is being resolved
- **THEN** the response status is 503
- **AND** the body does not include the driver message
