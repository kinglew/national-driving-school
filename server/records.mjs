import { createHash, randomBytes } from "node:crypto";
import { createNeonProbe } from "./db.mjs";

const PROGRAMS = new Set(["pesr", "eval", "pass", "hours12", "rental", "hourly"]);
const LICENCES = new Set(["none", "learner", "full", "international"]);
const LESSON_KINDS = new Set(["theory", "in_car"]);
const LESSON_STATUS = new Set(["scheduled", "completed", "cancelled"]);
const EXPORT_PURPOSES = new Set(["backup", "access_request"]);
const CARD_KEY = /^(card|cardnumber|card_number|pan|cvc|cvv|last4)$/i;
const TARGETS = { theoryMinutes: 1440, roadMinutes: 900 };

const SESSION_SQL = `SELECT p.id AS principal_id, p.role
FROM sessions s
JOIN principals p ON p.id = s.principal_id
WHERE s.token_hash = $1
  AND s.revoked_at IS NULL
  AND s.expires_at > now()
  AND p.disabled_at IS NULL`;

const LOOKUP_SQL = `SELECT p.id AS principal_id, p.role
FROM students s
JOIN principals p ON p.id = s.principal_id
WHERE lower(s.email) = lower($1)
  AND p.disabled_at IS NULL
UNION ALL
SELECT p.id AS principal_id, p.role
FROM staff_members m
JOIN principals p ON p.id = m.principal_id
WHERE lower(m.email) = lower($1)
  AND p.disabled_at IS NULL
LIMIT 1`;

const REDEEM_SQL = `WITH used AS (
  UPDATE login_challenges
  SET consumed_at = now()
  WHERE token_hash = $1
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING principal_id
),
ins AS (
  INSERT INTO sessions (principal_id, token_hash, expires_at)
  SELECT u.principal_id, $2, now() + interval '12 hours'
  FROM used u
  JOIN principals p ON p.id = u.principal_id AND p.disabled_at IS NULL
  RETURNING id, principal_id, expires_at
)
SELECT ins.principal_id, ins.expires_at, p.role
FROM ins
JOIN principals p ON p.id = ins.principal_id`;

const ENROL_SQL = `WITH new_principal AS (
  INSERT INTO principals (role) VALUES ('student') RETURNING id
),
new_student AS (
  INSERT INTO students (
    principal_id, given_name, family_name, email, phone, birth_date,
    preferred_language, guardian_name, licence_status, learner_licence_number,
    address_line, consent_recorded_at, consent_purpose, updated_at
  )
  SELECT id, $1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, now(), 'training_record', now()
  FROM new_principal
  RETURNING id, principal_id
),
new_enrolment AS (
  INSERT INTO enrolments (student_id, program_code, started_on)
  SELECT id, $11, $12::date FROM new_student
  RETURNING id
),
new_phases AS (
  INSERT INTO phases (enrolment_id, sequence, planned_days)
  SELECT e.id, plan.sequence, plan.planned_days
  FROM new_enrolment e
  CROSS JOIN (VALUES (1, 28), (2, 28), (3, 56), (4, 56)) AS plan(sequence, planned_days)
  RETURNING id
),
new_milestone AS (
  INSERT INTO milestones (enrolment_id)
  SELECT id FROM new_enrolment
  RETURNING enrolment_id
),
new_lesson AS (
  INSERT INTO lessons (
    enrolment_id, kind, instructor_principal_id, vehicle_label,
    duration_minutes, location, status, starts_at
  )
  SELECT e.id, $15, $19::uuid, $20, $17::int, $18, 'scheduled', $16::timestamptz
  FROM new_enrolment e
  WHERE $14::boolean IS TRUE
  RETURNING id
),
audit_enrol AS (
  INSERT INTO audit_log (actor_id, action, entity_table, entity_id, change_summary)
  SELECT $13::uuid, 'enrol', 'enrolments', id, 'enrolment_created'
  FROM new_enrolment
  RETURNING id
),
audit_lesson AS (
  INSERT INTO audit_log (actor_id, action, entity_table, entity_id, change_summary)
  SELECT $13::uuid, 'assign_lesson', 'lessons', id, 'lesson_assigned'
  FROM new_lesson
  RETURNING id
)
SELECT s.id AS student_id, s.principal_id, e.id AS enrolment_id,
       (SELECT count(*) FROM new_phases) AS phase_count,
       (SELECT count(*) FROM new_lesson) AS lesson_count
FROM new_student s
CROSS JOIN new_enrolment e`;

export function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

function bad(status, error, allow) {
  return { status, allow, body: { ok: false, error } };
}

function bearer(headers) {
  const raw = headers?.authorization || headers?.Authorization || "";
  const value = Array.isArray(raw) ? raw[0] : String(raw);
  const match = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(value.trim());
  return match ? match[1] : "";
}

function hasCard(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value)) {
    if (CARD_KEY.test(key)) return true;
    if (child && typeof child === "object" && hasCard(child)) return true;
  }
  return false;
}

function isUuid(value) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function torontoToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function ageOn(birth, today) {
  let age = Number(today.slice(0, 4)) - Number(birth.slice(0, 4));
  if (today.slice(5) < birth.slice(5)) age -= 1;
  return age;
}

function textOrNull(value, max) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return undefined;
  return trimmed;
}

function requireText(value, min, max) {
  const text = textOrNull(value, max);
  if (text == null || text.length < min) return null;
  return text;
}

function dateOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

async function audit(db, actorId, action, entityTable, entityId, summary) {
  await db.query(
    `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, change_summary)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityTable, entityId, summary],
  );
}

async function requireActor(db, headers) {
  const token = bearer(headers);
  if (!token) return { error: bad(401, "unauthorized") };
  const rows = await db.query(SESSION_SQL, [hashToken(token)]);
  if (!rows[0]) return { error: bad(401, "unauthorized") };
  return { actor: { id: rows[0].principal_id, role: rows[0].role } };
}

function studentOut(row) {
  return {
    id: row.id,
    principalId: row.principal_id,
    givenName: row.given_name,
    familyName: row.family_name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    preferredLanguage: row.preferred_language,
    guardianName: row.guardian_name,
    licenceStatus: row.licence_status,
    learnerLicenceNumber: row.learner_licence_number,
    addressLine: row.address_line,
    consentRecordedAt: row.consent_recorded_at,
    consentPurpose: row.consent_purpose,
    deletionRequestedAt: row.deletion_requested_at,
  };
}

function lessonOut(row) {
  return {
    id: row.id,
    enrolmentId: row.enrolment_id,
    kind: row.kind,
    instructorPrincipalId: row.instructor_principal_id,
    vehicleLabel: row.vehicle_label,
    durationMinutes: row.duration_minutes,
    location: row.location,
    notes: row.notes,
    status: row.status,
    startsAt: row.starts_at,
    studentSignedAt: row.student_signed_at,
    instructorSignedAt: row.instructor_signed_at,
    attendance: row.present == null ? null : {
      present: row.present === true || row.present === "t" || row.present === "true",
      theoryMinutes: Number(row.theory_minutes ?? 0),
      roadMinutes: Number(row.road_minutes ?? 0),
    },
  };
}

async function magicLink(db, body) {
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (email.length < 3 || email.length > 200 || !email.includes("@") || /\s/.test(email)) {
    return { status: 200, body: { ok: true, delivery: "not_sent" } };
  }
  const rows = await db.query(LOOKUP_SQL, [email]);
  if (rows[0]) {
    const raw = newToken();
    const purpose = rows[0].role === "student" ? "student_magic_link" : "staff_magic_link";
    await db.query(
      `INSERT INTO login_challenges (principal_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, $3, now() + interval '30 minutes')`,
      [rows[0].principal_id, hashToken(raw), purpose],
    );
  }
  return { status: 200, body: { ok: true, delivery: "not_sent" } };
}

async function redeem(db, body) {
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) return bad(401, "unauthorized");
  const sessionRaw = newToken();
  const rows = await db.query(REDEEM_SQL, [hashToken(token), hashToken(sessionRaw)]);
  if (!rows[0]) return bad(401, "unauthorized");
  return {
    status: 200,
    body: {
      ok: true,
      token: sessionRaw,
      role: rows[0].role,
      principalId: rows[0].principal_id,
      expiresAt: rows[0].expires_at,
    },
  };
}

async function logout(db, headers) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  const token = bearer(headers);
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(token)],
  );
  return { status: 200, body: { ok: true } };
}

async function me(db, headers) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  return { status: 200, body: { ok: true, role: gate.actor.role, principalId: gate.actor.id } };
}

async function loadJourney(db, actor) {
  const own = actor.role === "student";
  const studentRows = await db.query(
    `SELECT id, principal_id, given_name, family_name, email, phone, birth_date, preferred_language,
            guardian_name, licence_status, learner_licence_number, address_line,
            consent_recorded_at, consent_purpose, deletion_requested_at
     FROM students
     ${own ? "WHERE principal_id = $1" : "ORDER BY created_at"}`,
    own ? [actor.id] : [],
  );
  if (studentRows.length === 0) return [];
  const scope = own
    ? `JOIN students s ON s.id = e.student_id WHERE s.principal_id = $1`
    : "";
  const params = own ? [actor.id] : [];
  const enrolments = await db.query(
    `SELECT e.id, e.student_id, e.program_code, e.status, e.started_on
     FROM enrolments e
     ${scope}
     ORDER BY e.started_on, e.id`,
    params,
  );
  const phaseScope = own
    ? `JOIN enrolments e ON e.id = ph.enrolment_id
       JOIN students s ON s.id = e.student_id
       WHERE s.principal_id = $1`
    : "";
  const phases = await db.query(
    `SELECT ph.id, ph.enrolment_id, ph.sequence, ph.planned_days, ph.started_on, ph.completed_on
     FROM phases ph
     ${phaseScope}
     ORDER BY ph.sequence`,
    params,
  );
  const milestones = await db.query(
    `SELECT m.enrolment_id, m.learner_licence_on, m.attestation_on
     FROM milestones m
     JOIN enrolments e ON e.id = m.enrolment_id
     ${own ? "JOIN students s ON s.id = e.student_id WHERE s.principal_id = $1" : ""}`,
    params,
  );
  const lessons = await db.query(
    `SELECT l.id, l.enrolment_id, l.kind, l.instructor_principal_id, l.vehicle_label,
            l.duration_minutes, l.location, l.notes, l.status, l.starts_at,
            l.student_signed_at, l.instructor_signed_at,
            a.present, a.theory_minutes, a.road_minutes
     FROM lessons l
     LEFT JOIN attendance a ON a.lesson_id = l.id
     ${own ? `JOIN enrolments e ON e.id = l.enrolment_id
              JOIN students s ON s.id = e.student_id
              WHERE s.principal_id = $1` : ""}
     ORDER BY l.starts_at`,
    params,
  );
  return studentRows.map((student) => {
    const ownEnrolments = enrolments.filter((row) => row.student_id === student.id);
    return {
      ...studentOut(student),
      enrolments: ownEnrolments.map((enrolment) => {
        const ownLessons = lessons.filter((row) => row.enrolment_id === enrolment.id).map(lessonOut);
        const milestone = milestones.find((row) => row.enrolment_id === enrolment.id);
        return {
          id: enrolment.id,
          programCode: enrolment.program_code,
          status: enrolment.status,
          startedOn: enrolment.started_on,
          phases: phases.filter((row) => row.enrolment_id === enrolment.id).map((row) => ({
            id: row.id,
            sequence: Number(row.sequence),
            plannedDays: Number(row.planned_days),
            startedOn: row.started_on,
            completedOn: row.completed_on,
          })),
          milestone: milestone ? {
            learnerLicenceOn: milestone.learner_licence_on,
            attestationOn: milestone.attestation_on,
          } : null,
          lessons: ownLessons,
          progress: {
            theoryMinutes: ownLessons.reduce((sum, lesson) => sum + (lesson.attendance?.theoryMinutes ?? 0), 0),
            roadMinutes: ownLessons.reduce((sum, lesson) => sum + (lesson.attendance?.roadMinutes ?? 0), 0),
          },
        };
      }),
    };
  });
}

async function listStudents(db, headers, _query) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office" && gate.actor.role !== "student") return bad(403, "forbidden");
  const students = await loadJourney(db, gate.actor);
  return { status: 200, body: { ok: true, role: gate.actor.role, targets: TARGETS, students } };
}

function lessonInput(lesson) {
  if (!lesson || typeof lesson !== "object") return { include: false };
  const kind = lesson.kind;
  const startsAt = typeof lesson.startsAt === "string" ? lesson.startsAt : "";
  const duration = Number(lesson.durationMinutes);
  const location = textOrNull(lesson.location, 200);
  const vehicle = textOrNull(lesson.vehicleLabel, 80);
  const instructor = lesson.instructorPrincipalId == null || lesson.instructorPrincipalId === ""
    ? null
    : lesson.instructorPrincipalId;
  if (!LESSON_KINDS.has(kind) || !startsAt || Number.isNaN(Date.parse(startsAt))) return { error: "invalid" };
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) return { error: "invalid" };
  if (location == null || location === undefined) return { error: "invalid" };
  if (vehicle === undefined) return { error: "invalid" };
  if (instructor !== null && !isUuid(instructor)) return { error: "invalid" };
  return { include: true, kind, startsAt, duration, location, vehicle, instructor };
}

async function createStudent(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  if (body?.consent !== true) return bad(400, "consent_required");
  const givenName = requireText(body.givenName, 1, 80);
  const familyName = requireText(body.familyName, 1, 80);
  const email = requireText(body.email, 5, 200);
  const phone = requireText(body.phone, 7, 40);
  const birthDate = dateOrNull(body.birthDate);
  const startedOn = dateOrNull(body.startedOn);
  const language = body.preferredLanguage == null || body.preferredLanguage === "" ? "fr" : body.preferredLanguage;
  const licenceStatus = body.licenceStatus == null || body.licenceStatus === "" ? "none" : body.licenceStatus;
  const guardian = textOrNull(body.guardianName, 80);
  const learner = textOrNull(body.learnerLicenceNumber, 40);
  const address = textOrNull(body.addressLine, 200);
  if (!givenName || !familyName || !email || !email.includes("@") || /\s/.test(email) || !phone) {
    return bad(400, "invalid");
  }
  if (phone.replace(/\D/g, "").length < 10) return bad(400, "invalid");
  if (!birthDate || !startedOn || !PROGRAMS.has(body.programCode) || !LICENCES.has(licenceStatus)) {
    return bad(400, "invalid");
  }
  if (language !== "en" && language !== "fr") return bad(400, "invalid");
  if (guardian === undefined || learner === undefined || address === undefined) return bad(400, "invalid");
  const age = ageOn(birthDate, torontoToday());
  if (age < 14 || age > 100) return bad(400, "invalid");
  if (age < 18 && (!guardian || guardian.length < 2)) return bad(400, "guardian_required");
  const lesson = lessonInput(body.lesson);
  if (lesson.error) return bad(400, "invalid");
  if (lesson.include && lesson.instructor) {
    const found = await db.query(
      `SELECT id FROM principals WHERE id = $1 AND role = 'instructor' AND disabled_at IS NULL`,
      [lesson.instructor],
    );
    if (!found[0]) return bad(400, "invalid");
  }
  const rows = await db.query(ENROL_SQL, [
    givenName,
    familyName,
    email,
    phone,
    birthDate,
    language,
    guardian,
    licenceStatus,
    learner,
    address,
    body.programCode,
    startedOn,
    gate.actor.id,
    lesson.include === true,
    lesson.kind ?? null,
    lesson.startsAt ?? null,
    lesson.duration ?? null,
    lesson.location ?? null,
    lesson.instructor ?? null,
    lesson.vehicle ?? null,
  ]);
  const created = rows[0];
  if (!created) return bad(400, "invalid");
  return {
    status: 201,
    body: { ok: true, studentId: created.student_id, enrolmentId: created.enrolment_id },
  };
}

async function deletionRequest(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  if (!isUuid(body?.studentId)) return bad(400, "invalid");
  const rows = await db.query(
    `UPDATE students SET deletion_requested_at = now(), updated_at = now() WHERE id = $1 RETURNING id`,
    [body.studentId],
  );
  if (!rows[0]) return bad(404, "not_found");
  await audit(db, gate.actor.id, "deletion_request", "students", rows[0].id, "deletion_requested");
  return { status: 200, body: { ok: true, deletionRequested: true } };
}

const LESSON_LIST = `SELECT l.id, l.enrolment_id, l.kind, l.instructor_principal_id, l.vehicle_label,
            l.duration_minutes, l.location, l.notes, l.status, l.starts_at,
            l.student_signed_at, l.instructor_signed_at,
            a.present, a.theory_minutes, a.road_minutes
     FROM lessons l
     LEFT JOIN attendance a ON a.lesson_id = l.id`;

async function listLessons(db, headers) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  let rows;
  if (gate.actor.role === "office") {
    rows = await db.query(`${LESSON_LIST} ORDER BY l.starts_at`, []);
  } else if (gate.actor.role === "instructor") {
    rows = await db.query(
      `${LESSON_LIST} WHERE l.instructor_principal_id = $1 ORDER BY l.starts_at`,
      [gate.actor.id],
    );
  } else if (gate.actor.role === "student") {
    rows = await db.query(
      `${LESSON_LIST}
       WHERE l.enrolment_id IN (
         SELECT e.id FROM enrolments e
         JOIN students s ON s.id = e.student_id
         WHERE s.principal_id = $1
       )
       ORDER BY l.starts_at`,
      [gate.actor.id],
    );
  } else {
    return bad(403, "forbidden");
  }
  return { status: 200, body: { ok: true, role: gate.actor.role, lessons: rows.map(lessonOut) } };
}

async function createLesson(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  if (!isUuid(body?.enrolmentId)) return bad(400, "invalid");
  const lesson = lessonInput(body);
  if (!lesson.include) return bad(400, "invalid");
  if (lesson.instructor) {
    const found = await db.query(
      `SELECT id FROM principals WHERE id = $1 AND role = 'instructor' AND disabled_at IS NULL`,
      [lesson.instructor],
    );
    if (!found[0]) return bad(400, "invalid");
  }
  const rows = await db.query(
    `INSERT INTO lessons (
       enrolment_id, kind, instructor_principal_id, vehicle_label,
       duration_minutes, location, status, starts_at
     )
     SELECT $1, $2, $3, $4, $5, $6, 'scheduled', $7::timestamptz
     WHERE EXISTS (SELECT 1 FROM enrolments WHERE id = $1)
     RETURNING id`,
    [body.enrolmentId, lesson.kind, lesson.instructor, lesson.vehicle, lesson.duration, lesson.location, lesson.startsAt],
  );
  if (!rows[0]) return bad(404, "not_found");
  await audit(db, gate.actor.id, "assign_lesson", "lessons", rows[0].id, "lesson_assigned");
  return { status: 201, body: { ok: true, lessonId: rows[0].id } };
}

async function updateLesson(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (!isUuid(body?.id)) return bad(400, "invalid");
  if (gate.actor.role === "student") {
    if (body.studentSigned !== true) return bad(403, "forbidden");
    const extra = ["status", "notes", "vehicleLabel", "location", "instructorSigned", "kind", "startsAt"];
    if (extra.some((key) => key in body)) return bad(403, "forbidden");
    const rows = await db.query(
      `UPDATE lessons SET student_signed_at = COALESCE(student_signed_at, now()), updated_at = now()
       WHERE id = $1
         AND enrolment_id IN (
           SELECT e.id FROM enrolments e
           JOIN students s ON s.id = e.student_id
           WHERE s.principal_id = $2
         )
       RETURNING id`,
      [body.id, gate.actor.id],
    );
    if (!rows[0]) return bad(404, "not_found");
    await audit(db, gate.actor.id, "sign_lesson", "lessons", rows[0].id, "student_signed");
    return { status: 200, body: { ok: true, lessonId: rows[0].id } };
  }
  if (gate.actor.role !== "office" && gate.actor.role !== "instructor") return bad(403, "forbidden");
  if ("studentSigned" in body) return bad(403, "forbidden");
  const rows = await db.query(
    `SELECT id, status, notes, vehicle_label, location, instructor_signed_at
     FROM lessons
     WHERE id = $1
       AND ($2 = 'office' OR instructor_principal_id = $3)`,
    [body.id, gate.actor.role, gate.actor.id],
  );
  if (!rows[0]) return bad(404, "not_found");
  const current = rows[0];
  const status = body.status == null ? current.status : body.status;
  if (!LESSON_STATUS.has(status)) return bad(400, "invalid");
  const notes = "notes" in body ? textOrNull(body.notes, 4000) : current.notes;
  const vehicle = "vehicleLabel" in body ? textOrNull(body.vehicleLabel, 80) : current.vehicle_label;
  const location = "location" in body ? textOrNull(body.location, 200) : current.location;
  if (notes === undefined || vehicle === undefined || location === undefined) return bad(400, "invalid");
  const sign = body.instructorSigned === true;
  const updated = await db.query(
    `UPDATE lessons
     SET status = $2, notes = $3, vehicle_label = $4, location = $5,
         instructor_signed_at = CASE WHEN $6::boolean IS TRUE THEN COALESCE(instructor_signed_at, now()) ELSE instructor_signed_at END,
         updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [body.id, status, notes, vehicle, location, sign],
  );
  await audit(db, gate.actor.id, "update_lesson", "lessons", updated[0].id, "lesson_updated");
  return { status: 200, body: { ok: true, lessonId: updated[0].id } };
}

async function recordAttendance(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role === "student") return bad(403, "forbidden");
  if (gate.actor.role !== "office" && gate.actor.role !== "instructor") return bad(403, "forbidden");
  if (!isUuid(body?.lessonId) || typeof body.present !== "boolean") return bad(400, "invalid");
  const theory = Number(body.theoryMinutes);
  const road = Number(body.roadMinutes);
  if (!Number.isInteger(theory) || !Number.isInteger(road) || theory < 0 || road < 0 || theory > 1440 || road > 1440) {
    return bad(400, "invalid");
  }
  const rows = await db.query(
    `INSERT INTO attendance (lesson_id, present, theory_minutes, road_minutes, recorded_by)
     SELECT l.id, $2, $3, $4, $5
     FROM lessons l
     WHERE l.id = $1
       AND ($6 = 'office' OR l.instructor_principal_id = $5)
     ON CONFLICT (lesson_id) DO UPDATE
     SET present = EXCLUDED.present,
         theory_minutes = EXCLUDED.theory_minutes,
         road_minutes = EXCLUDED.road_minutes,
         recorded_by = EXCLUDED.recorded_by,
         recorded_at = now()
     RETURNING lesson_id`,
    [body.lessonId, body.present, theory, road, gate.actor.id, gate.actor.role],
  );
  if (!rows[0]) return bad(404, "not_found");
  await audit(db, gate.actor.id, "attendance", "attendance", rows[0].lesson_id, "attendance_recorded");
  return { status: 200, body: { ok: true, lessonId: rows[0].lesson_id } };
}

async function updatePhase(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  if (!isUuid(body?.id)) return bad(400, "invalid");
  const started = dateOrNull(body.startedOn);
  const completed = dateOrNull(body.completedOn);
  if (started === undefined || completed === undefined) return bad(400, "invalid");
  const rows = await db.query(
    `UPDATE phases SET started_on = $2::date, completed_on = $3::date WHERE id = $1 RETURNING id`,
    [body.id, started, completed],
  );
  if (!rows[0]) return bad(404, "not_found");
  await audit(db, gate.actor.id, "update_phase", "phases", rows[0].id, "phase_updated");
  return { status: 200, body: { ok: true, phaseId: rows[0].id } };
}

async function updateMilestone(db, headers, body) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  if (!isUuid(body?.enrolmentId)) return bad(400, "invalid");
  const learner = dateOrNull(body.learnerLicenceOn);
  const attestation = dateOrNull(body.attestationOn);
  if (learner === undefined || attestation === undefined) return bad(400, "invalid");
  const rows = await db.query(
    `UPDATE milestones
     SET learner_licence_on = $2::date, attestation_on = $3::date
     WHERE enrolment_id = $1
     RETURNING enrolment_id`,
    [body.enrolmentId, learner, attestation],
  );
  if (!rows[0]) return bad(404, "not_found");
  await audit(db, gate.actor.id, "update_milestone", "milestones", rows[0].enrolment_id, "milestone_updated");
  return { status: 200, body: { ok: true, enrolmentId: rows[0].enrolment_id } };
}

async function staff(db, headers) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  const rows = await db.query(
    `SELECT m.principal_id, m.role, m.display_name
     FROM staff_members m
     JOIN principals p ON p.id = m.principal_id
     WHERE p.disabled_at IS NULL
     ORDER BY m.display_name`,
    [],
  );
  return {
    status: 200,
    body: {
      ok: true,
      staff: rows.map((row) => ({
        principalId: row.principal_id,
        role: row.role,
        displayName: row.display_name,
      })),
    },
  };
}

async function exportStudents(db, headers, query) {
  const gate = await requireActor(db, headers);
  if (gate.error) return gate.error;
  if (gate.actor.role !== "office") return bad(403, "forbidden");
  const purpose = query.get("purpose") || "";
  if (!EXPORT_PURPOSES.has(purpose)) return bad(400, "invalid");
  const inserted = await db.query(
    `INSERT INTO record_exports (requested_by, purpose, format)
     VALUES ($1, $2, 'json')
     RETURNING id, created_at`,
    [gate.actor.id, purpose],
  );
  const [students, enrolments, phases, milestones, lessons, attendance] = await Promise.all([
    db.query(
      `SELECT id, principal_id, given_name, family_name, email, phone, birth_date, preferred_language,
              guardian_name, licence_status, learner_licence_number, address_line,
              consent_recorded_at, consent_purpose, deletion_requested_at, created_at
       FROM students ORDER BY created_at`,
      [],
    ),
    db.query(
      `SELECT id, student_id, program_code, status, started_on, created_at FROM enrolments ORDER BY created_at`,
      [],
    ),
    db.query(
      `SELECT id, enrolment_id, sequence, planned_days, started_on, completed_on FROM phases ORDER BY enrolment_id, sequence`,
      [],
    ),
    db.query(
      `SELECT enrolment_id, learner_licence_on, attestation_on FROM milestones`,
      [],
    ),
    db.query(
      `SELECT id, enrolment_id, kind, instructor_principal_id, vehicle_label, duration_minutes,
              location, notes, status, starts_at, student_signed_at, instructor_signed_at
       FROM lessons ORDER BY starts_at`,
      [],
    ),
    db.query(
      `SELECT lesson_id, present, theory_minutes, road_minutes, recorded_at, recorded_by FROM attendance`,
      [],
    ),
  ]);
  await audit(db, gate.actor.id, "export", "record_exports", inserted[0].id, "export_created");
  return {
    status: 200,
    body: {
      ok: true,
      export: { id: inserted[0].id, purpose, createdAt: inserted[0].created_at },
      students,
      enrolments,
      phases,
      milestones,
      lessons,
      attendance,
    },
  };
}

const routes = {
  "/api/auth/magic-link": { POST: (db, ctx) => magicLink(db, ctx.body) },
  "/api/auth/redeem": { POST: (db, ctx) => redeem(db, ctx.body) },
  "/api/auth/logout": { POST: (db, ctx) => logout(db, ctx.headers) },
  "/api/me": { GET: (db, ctx) => me(db, ctx.headers) },
  "/api/students": {
    GET: (db, ctx) => listStudents(db, ctx.headers, ctx.query),
    POST: (db, ctx) => createStudent(db, ctx.headers, ctx.body),
  },
  "/api/students/deletion-request": { POST: (db, ctx) => deletionRequest(db, ctx.headers, ctx.body) },
  "/api/lessons": {
    GET: (db, ctx) => listLessons(db, ctx.headers),
    POST: (db, ctx) => createLesson(db, ctx.headers, ctx.body),
    PATCH: (db, ctx) => updateLesson(db, ctx.headers, ctx.body),
  },
  "/api/attendance": { POST: (db, ctx) => recordAttendance(db, ctx.headers, ctx.body) },
  "/api/phases": { PATCH: (db, ctx) => updatePhase(db, ctx.headers, ctx.body) },
  "/api/milestones": { PATCH: (db, ctx) => updateMilestone(db, ctx.headers, ctx.body) },
  "/api/staff": { GET: (db, ctx) => staff(db, ctx.headers) },
  "/api/exports/students": { GET: (db, ctx) => exportStudents(db, ctx.headers, ctx.query) },
};

function databaseError(error) {
  if (error && error.code === "23505") return bad(409, "email_in_use");
  if (error && (error.code === "22P02" || error.code === "23514" || error.code === "23503")) {
    return bad(400, "invalid");
  }
  const name = error instanceof Error ? error.name : "Error";
  console.error(`records request failed: ${name}`);
  return { status: 503, body: { ok: false, error: "database_down" } };
}

export async function handleRecords(input) {
  const method = input.method || "GET";
  const env = input.env ?? {};
  const databaseUrl = typeof env.DATABASE_URL === "string" ? env.DATABASE_URL.trim() : "";
  if (!input.db && !databaseUrl) return bad(503, "unconfigured");
  const db = input.db ?? createNeonProbe(databaseUrl);
  try {
    if (hasCard(input.body)) return bad(400, "card_not_accepted");
    const rawPath = input.path || "/";
    const cut = rawPath.indexOf("?");
    const pathname = (cut === -1 ? rawPath : rawPath.slice(0, cut)).replace(/\/$/, "") || "/";
    const query = new URLSearchParams(cut === -1 ? "" : rawPath.slice(cut + 1));
    const allowed = routes[pathname];
    if (!allowed) return bad(404, "not_found");
    const handler = allowed[method];
    if (!handler) {
      return bad(405, "method_not_allowed", Object.keys(allowed).join(", "));
    }
    return await handler(db, { body: input.body ?? {}, headers: input.headers ?? {}, query });
  } catch (error) {
    return databaseError(error);
  }
}
