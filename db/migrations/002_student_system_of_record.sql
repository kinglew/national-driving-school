-- Access control and export tables come before student identity columns.

CREATE TABLE IF NOT EXISTS principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT principals_role_check CHECK (role IN ('office', 'instructor', 'student'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES principals (id),
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash)
);

CREATE TABLE IF NOT EXISTS login_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES principals (id),
  token_hash text NOT NULL,
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CONSTRAINT login_challenges_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT login_challenges_purpose_check CHECK (purpose IN ('student_magic_link', 'staff_magic_link'))
);

CREATE TABLE IF NOT EXISTS staff_members (
  principal_id uuid PRIMARY KEY REFERENCES principals (id),
  role text NOT NULL,
  display_name text NOT NULL,
  email text,
  CONSTRAINT staff_members_role_check CHECK (role IN ('office', 'instructor')),
  CONSTRAINT staff_members_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS record_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid NOT NULL REFERENCES principals (id),
  purpose text NOT NULL,
  format text NOT NULL DEFAULT 'json',
  CONSTRAINT record_exports_purpose_check CHECK (purpose IN ('backup', 'access_request')),
  CONSTRAINT record_exports_format_check CHECK (format IN ('json'))
);

CREATE TABLE IF NOT EXISTS retention_policies (
  purpose text PRIMARY KEY,
  retain_days integer,
  notes text NOT NULL,
  CONSTRAINT retention_policies_days_check CHECK (retain_days IS NULL OR retain_days > 0)
);

INSERT INTO retention_policies (purpose, retain_days, notes) VALUES
  ('student_training_record', NULL, 'Not confirmed. The school must set a retention period before go-live. This change does not invent one.'),
  ('financial_record', NULL, 'Tax period is not confirmed. No payment account numbers are stored.'),
  ('marketing_lead', NULL, 'Intended to be shorter than the training record. Duration is not set in this change.')
ON CONFLICT (purpose) DO NOTHING;

ALTER TABLE students ADD COLUMN IF NOT EXISTS principal_id uuid;
ALTER TABLE students ADD COLUMN IF NOT EXISTS given_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS family_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS licence_status text NOT NULL DEFAULT 'none';
ALTER TABLE students ADD COLUMN IF NOT EXISTS learner_licence_number text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address_line text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz;
ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_purpose text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

ALTER TABLE students ADD CONSTRAINT students_principal_id_fkey FOREIGN KEY (principal_id) REFERENCES principals (id);
ALTER TABLE students ADD CONSTRAINT students_principal_id_unique UNIQUE (principal_id);
ALTER TABLE students ADD CONSTRAINT students_licence_status_check CHECK (licence_status IN ('none', 'learner', 'full', 'international'));
ALTER TABLE students ADD CONSTRAINT students_identity_requires_consent CHECK (
  (
    given_name IS NULL
    AND family_name IS NULL
    AND email IS NULL
    AND phone IS NULL
    AND birth_date IS NULL
    AND learner_licence_number IS NULL
  )
  OR consent_recorded_at IS NOT NULL
);
ALTER TABLE students ADD CONSTRAINT students_consent_purpose_check CHECK (
  consent_recorded_at IS NULL
  OR (consent_purpose IS NOT NULL AND length(btrim(consent_purpose)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS students_email_lower_unique ON students (lower(email));

CREATE TABLE IF NOT EXISTS enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id),
  program_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrolments_program_check CHECK (program_code IN ('pesr', 'eval', 'pass', 'hours12', 'rental', 'hourly')),
  CONSTRAINT enrolments_status_check CHECK (status IN ('active', 'completed', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS enrolments_student_id_idx ON enrolments (student_id);

CREATE TABLE IF NOT EXISTS phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES enrolments (id),
  sequence smallint NOT NULL,
  planned_days smallint NOT NULL,
  started_on date,
  completed_on date,
  CONSTRAINT phases_sequence_unique UNIQUE (enrolment_id, sequence),
  CONSTRAINT phases_plan_check CHECK (
    (sequence = 1 AND planned_days = 28)
    OR (sequence = 2 AND planned_days = 28)
    OR (sequence = 3 AND planned_days = 56)
    OR (sequence = 4 AND planned_days = 56)
  )
);

CREATE TABLE IF NOT EXISTS milestones (
  enrolment_id uuid PRIMARY KEY REFERENCES enrolments (id),
  learner_licence_on date,
  attestation_on date
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES enrolments (id),
  kind text NOT NULL,
  instructor_principal_id uuid REFERENCES principals (id),
  vehicle_label text,
  duration_minutes integer NOT NULL,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  starts_at timestamptz NOT NULL,
  student_signed_at timestamptz,
  instructor_signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lessons_kind_check CHECK (kind IN ('theory', 'in_car')),
  CONSTRAINT lessons_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  CONSTRAINT lessons_duration_check CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

CREATE INDEX IF NOT EXISTS lessons_enrolment_id_idx ON lessons (enrolment_id);
CREATE INDEX IF NOT EXISTS lessons_instructor_idx ON lessons (instructor_principal_id);

CREATE TABLE IF NOT EXISTS attendance (
  lesson_id uuid PRIMARY KEY REFERENCES lessons (id),
  present boolean NOT NULL,
  theory_minutes integer NOT NULL DEFAULT 0,
  road_minutes integer NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL REFERENCES principals (id),
  CONSTRAINT attendance_theory_check CHECK (theory_minutes >= 0 AND theory_minutes <= 1440),
  CONSTRAINT attendance_road_check CHECK (road_minutes >= 0 AND road_minutes <= 1440)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES principals (id),
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  change_summary text NOT NULL,
  CONSTRAINT audit_log_entity_check CHECK (entity_table IN (
    'students', 'enrolments', 'phases', 'milestones', 'lessons', 'attendance', 'record_exports'
  ))
);
