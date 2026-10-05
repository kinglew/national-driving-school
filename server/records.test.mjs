import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { recordsPath } from "./http.mjs";
import { hashToken, handleRecords } from "./records.mjs";

const STUDENT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const OFFICE = "33333333-3333-4333-8333-333333333333";
const INST = "44444444-4444-4444-8444-444444444444";
const LESSON = "66666666-6666-4666-8666-666666666666";

function dbWith(respond) {
  const calls = [];
  return {
    calls,
    async query(text, params = []) {
      calls.push({ text, params });
      const result = await respond(text, params);
      return result ?? [];
    },
  };
}

function sessionDb(principalId, role, respond = () => []) {
  return dbWith((text) => {
    if (text.includes("FROM sessions")) return [{ principal_id: principalId, role }];
    return respond(text);
  });
}

describe("migration order", () => {
  const sql = readFileSync(new URL("../db/migrations/002_student_system_of_record.sql", import.meta.url), "utf8");

  it("creates export and access tables before identity columns", () => {
    const given = sql.indexOf("given_name");
    for (const table of ["principals", "sessions", "record_exports", "retention_policies"]) {
      const at = sql.indexOf(`CREATE TABLE IF NOT EXISTS ${table}`);
      assert.ok(at !== -1 && at < given, table);
    }
    assert.doesNotMatch(sql, /card|pan|cvc/i);
    assert.match(sql, /student_training_record', NULL/);
    assert.match(sql, /planned_days = 28/);
    assert.match(sql, /planned_days = 56/);
  });
});

describe("handleRecords access", () => {
  it("returns unconfigured without a URL and does not query", async () => {
    const result = await handleRecords({
      method: "GET",
      path: "/api/students",
      env: { DATABASE_URL: "  " },
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "unconfigured");
    assert.equal(JSON.stringify(result.body).includes("postgres://"), false);
  });

  it("rejects a missing session before reading students", async () => {
    const db = dbWith(() => {
      throw new Error("should not query");
    });
    const result = await handleRecords({ method: "GET", path: "/api/students", db });
    assert.equal(result.status, 401);
    assert.equal(db.calls.length, 0);
  });

  it("hides driver messages", async () => {
    const secret = "postgres://user:super-secret@ep.example/db";
    const db = dbWith(() => {
      throw new Error(`connect failed ${secret}`);
    });
    const result = await handleRecords({
      method: "GET",
      path: "/api/students",
      headers: { authorization: "Bearer " + "b".repeat(24) },
      db,
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "database_down");
    assert.equal(JSON.stringify(result.body).includes("super-secret"), false);
  });

  it("binds a student list to that principal and ignores a forged id", async () => {
    const db = sessionDb(STUDENT, "student");
    const result = await handleRecords({
      method: "GET",
      path: `/api/students?studentId=${OTHER}`,
      headers: { authorization: "Bearer " + "c".repeat(24) },
      db,
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.students, []);
    const own = db.calls.find((call) => call.text.includes("WHERE principal_id = $1"));
    assert.ok(own);
    assert.deepEqual(own.params, [STUDENT]);
    assert.equal(JSON.stringify(db.calls).includes(OTHER), false);
    assert.equal(own.text.includes(STUDENT), false);
  });

  it("forbids instructors from listing students", async () => {
    const db = sessionDb(INST, "instructor");
    const result = await handleRecords({
      method: "GET",
      path: "/api/students",
      headers: { authorization: "Bearer " + "d".repeat(24) },
      db,
    });
    assert.equal(result.status, 403);
    assert.equal(db.calls.some((call) => call.text.includes("FROM students")), false);
  });

  it("does not insert an export for a student", async () => {
    const db = sessionDb(STUDENT, "student");
    const result = await handleRecords({
      method: "GET",
      path: "/api/exports/students?purpose=backup",
      headers: { authorization: "Bearer " + "e".repeat(24) },
      db,
    });
    assert.equal(result.status, 403);
    assert.equal(db.calls.some((call) => call.text.includes("record_exports")), false);
  });

  it("records an office backup without session secrets", async () => {
    const db = sessionDb(OFFICE, "office", (text) => {
      if (text.includes("INSERT INTO record_exports")) {
        return [{ id: "exp-1", created_at: "2026-10-04T16:00:00.000Z" }];
      }
      return [];
    });
    const result = await handleRecords({
      method: "GET",
      path: "/api/exports/students?purpose=backup",
      headers: { authorization: "Bearer " + "f".repeat(24) },
      db,
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.export.id, "exp-1");
    const insert = db.calls.find((call) => call.text.includes("INSERT INTO record_exports"));
    assert.deepEqual(insert.params, [OFFICE, "backup"]);
    assert.equal(JSON.stringify(result.body).includes("token_hash"), false);
  });
});

describe("enrolment and lessons", () => {
  const adult = {
    consent: true,
    givenName: "Ada",
    familyName: "Lovelace",
    email: "ada@example.com",
    phone: "514-555-0142",
    birthDate: "2000-01-15",
    startedOn: "2026-10-04",
    programCode: "pesr",
    preferredLanguage: "en",
  };

  it("refuses identity without consent", async () => {
    const db = sessionDb(OFFICE, "office");
    const result = await handleRecords({
      method: "POST",
      path: "/api/students",
      headers: { authorization: "Bearer " + "g".repeat(24) },
      body: { ...adult, consent: false },
      db,
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "consent_required");
    assert.equal(db.calls.some((call) => call.text.includes("new_principal")), false);
  });

  it("refuses a minor without a guardian", async () => {
    const db = sessionDb(OFFICE, "office");
    const result = await handleRecords({
      method: "POST",
      path: "/api/students",
      headers: { authorization: "Bearer " + "h".repeat(24) },
      body: { ...adult, birthDate: "2010-01-01", guardianName: "" },
      db,
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "guardian_required");
    assert.equal(db.calls.some((call) => call.text.includes("INSERT INTO students")), false);
  });

  it("does not write a card number", async () => {
    const db = sessionDb(OFFICE, "office");
    const result = await handleRecords({
      method: "POST",
      path: "/api/students",
      headers: { authorization: "Bearer " + "i".repeat(24) },
      body: { ...adult, cardNumber: "4242424242424242" },
      db,
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "card_not_accepted");
    assert.equal(db.calls.length, 0);
    assert.equal(JSON.stringify(result.body).includes("4242"), false);
  });

  it("enrols with consent using parameters and the phase plan", async () => {
    const db = sessionDb(OFFICE, "office", (text) => {
      if (text.includes("new_principal")) {
        return [{ student_id: STUDENT, principal_id: STUDENT, enrolment_id: OTHER, phase_count: 4, lesson_count: 0 }];
      }
      return [];
    });
    const result = await handleRecords({
      method: "POST",
      path: "/api/students",
      headers: { authorization: "Bearer " + "j".repeat(24) },
      body: adult,
      db,
    });
    assert.equal(result.status, 201);
    const enrol = db.calls.find((call) => call.text.includes("new_principal"));
    assert.ok(enrol);
    assert.equal(enrol.text.includes("ada@example.com"), false);
    assert.equal(enrol.params[2], "ada@example.com");
    assert.equal(enrol.params[12], OFFICE);
    assert.match(enrol.text, /\(1, 28\), \(2, 28\), \(3, 56\), \(4, 56\)/);
    assert.match(enrol.text, /training_record/);
  });

  it("returns 404 when an instructor updates someone else's lesson", async () => {
    const db = sessionDb(INST, "instructor", () => []);
    const result = await handleRecords({
      method: "PATCH",
      path: "/api/lessons",
      headers: { authorization: "Bearer " + "k".repeat(24) },
      body: { id: LESSON, status: "completed" },
      db,
    });
    assert.equal(result.status, 404);
    assert.equal(db.calls.some((call) => call.text.startsWith("UPDATE lessons")), false);
  });

  it("lets an instructor record attendance on an assigned lesson", async () => {
    const db = sessionDb(INST, "instructor", (text) => {
      if (text.includes("INSERT INTO attendance")) return [{ lesson_id: LESSON }];
      return [];
    });
    const result = await handleRecords({
      method: "POST",
      path: "/api/attendance",
      headers: { authorization: "Bearer " + "l".repeat(24) },
      body: { lessonId: LESSON, present: true, theoryMinutes: 0, roadMinutes: 55 },
      db,
    });
    assert.equal(result.status, 200);
    const insert = db.calls.find((call) => call.text.includes("INSERT INTO attendance"));
    assert.deepEqual(insert.params, [LESSON, true, 0, 55, INST, "instructor"]);
    assert.equal(db.calls.some((call) => call.text.includes("INSERT INTO audit_log")), true);
  });
});

describe("magic link stub", () => {
  it("does not return a token or put the email in SQL text", async () => {
    const email = "ada';drop@example.com";
    const db = dbWith((text) => {
      if (text.includes("UNION ALL")) return [{ principal_id: STUDENT, role: "student" }];
      return [];
    });
    const result = await handleRecords({
      method: "POST",
      path: "/api/auth/magic-link",
      body: { email },
      db,
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, delivery: "not_sent" });
    assert.equal(JSON.stringify(result.body).includes("token"), false);
    const lookup = db.calls[0];
    assert.equal(lookup.text.includes(email), false);
    assert.equal(lookup.params[0], email);
    const insert = db.calls.find((call) => call.text.includes("INSERT INTO login_challenges"));
    assert.ok(insert);
    assert.equal(JSON.stringify(result.body).includes(insert.params[1]), false);
  });

  it("stores only a hash when a challenge is redeemed", async () => {
    const magic = "m".repeat(32);
    let sessionHash = "";
    const db = dbWith((text, params) => {
      if (text.includes("WITH used")) {
        sessionHash = params[1];
        return [{ principal_id: STUDENT, role: "student", expires_at: "2026-10-05T00:00:00.000Z" }];
      }
      return [];
    });
    const result = await handleRecords({
      method: "POST",
      path: "/api/auth/redeem",
      body: { token: magic },
      db,
    });
    assert.equal(result.status, 200);
    assert.equal(db.calls[0].params[0], hashToken(magic));
    assert.equal(sessionHash, hashToken(result.body.token));
    assert.notEqual(result.body.token, magic);
    assert.notEqual(sessionHash, result.body.token);
  });
});

describe("client boundary", () => {
  it("keeps the database URL out of client source and the SPA rewrite", () => {
    const files = [
      "src/lib/store.ts",
      "src/lib/recordsApi.ts",
      "src/pages/Desk.tsx",
      "src/pages/Office.tsx",
      "src/pages/Enroll.tsx",
      "src/pages/Invoice.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      assert.equal(source.includes("DATABASE_URL"), false, file);
      assert.equal(source.includes("neon.tech"), false, file);
    }
    const desk = readFileSync(new URL("../src/pages/Desk.tsx", import.meta.url), "utf8");
    assert.equal(desk.includes("useDesk"), false);
    assert.equal(desk.includes("localStorage"), false);
    const enroll = readFileSync(new URL("../src/pages/Enroll.tsx", import.meta.url), "utf8");
    assert.equal(enroll.includes("luhnOk"), false);
    assert.equal(enroll.includes("localStorage"), false);
    const store = readFileSync(new URL("../src/lib/store.ts", import.meta.url), "utf8");
    assert.equal(store.includes("firstName"), false);
    const vercel = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
    assert.match(vercel, /\/\(\(\?!api\/\)\.\*\)/);
  });
});

describe("recordsPath", () => {
  it("builds the student route from the Vercel slug", () => {
    assert.equal(
      recordsPath({ query: { slug: ["exports", "students"] }, url: "/api/exports/students?purpose=backup" }),
      "/api/exports/students?purpose=backup",
    );
  });
});
