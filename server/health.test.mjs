import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { databaseHealth, handleHealth } from "./health.mjs";
import { splitSql } from "../scripts/apply-migrations.mjs";

describe("databaseHealth", () => {
  it("reports unconfigured without calling the database", async () => {
    let called = false;
    const result = await databaseHealth({ DATABASE_URL: "  " }, () => {
      called = true;
      throw new Error("should not connect");
    });
    assert.equal(called, false);
    assert.deepEqual(result, {
      status: 503,
      body: { ok: false, database: "unconfigured" },
    });
  });

  it("reports up and schemaReady when the ping succeeds", async () => {
    const result = await databaseHealth(
      { DATABASE_URL: "postgres://example" },
      () => ({
        async ping() {},
        async schemaReady() {
          return true;
        },
      }),
    );
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      ok: true,
      database: "up",
      schemaReady: true,
    });
    assert.equal(JSON.stringify(result.body).includes("postgres://"), false);
  });

  it("reports down without the driver message", async () => {
    const secret = "postgres://user:super-secret@ep.example/db";
    const result = await databaseHealth({ DATABASE_URL: secret }, () => ({
      async ping() {
        throw new Error(`connect failed ${secret}`);
      },
      async schemaReady() {
        return false;
      },
    }));
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { ok: false, database: "down" });
    assert.equal(JSON.stringify(result.body).includes("super-secret"), false);
  });
});

describe("handleHealth", () => {
  it("rejects other methods", async () => {
    const result = await handleHealth("POST", { DATABASE_URL: "postgres://example" }, () => {
      throw new Error("should not connect");
    });
    assert.equal(result.status, 405);
    assert.equal(result.body.error, "method_not_allowed");
  });
});

describe("splitSql", () => {
  it("drops comments and blank pieces", () => {
    const parts = splitSql(`-- header\nSELECT 1;\n\n-- tail\nSELECT 2;\n`);
    assert.deepEqual(parts, ["SELECT 1", "SELECT 2"]);
  });
});

describe("apply-migrations", () => {
  it("exits when DATABASE_URL is missing and does not print a URL", () => {
    const child = spawnSync(process.execPath, ["scripts/apply-migrations.mjs"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: { ...process.env, DATABASE_URL: "" },
      encoding: "utf8",
    });
    assert.notEqual(child.status, 0);
    const output = `${child.stdout}${child.stderr}`;
    assert.match(output, /DATABASE_URL is not set/);
    assert.equal(output.includes("postgres://"), false);
  });
});
