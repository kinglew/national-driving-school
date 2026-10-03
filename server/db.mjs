import { neon } from "@neondatabase/serverless";

export function createNeonProbe(databaseUrl) {
  const sql = neon(databaseUrl);
  return {
    async ping() {
      await sql.query("SELECT 1 AS ok", []);
    },
    async schemaReady() {
      const rows = await sql.query(
        `SELECT
           EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'students'
           ) AS students,
           EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'schema_migrations'
           ) AS schema_migrations`,
        [],
      );
      const row = rows[0] ?? {};
      return isTrue(row.students) && isTrue(row.schema_migrations);
    },
    query(text, params) {
      return sql.query(text, params);
    },
  };
}

function isTrue(value) {
  return value === true || value === "t" || value === "true";
}
