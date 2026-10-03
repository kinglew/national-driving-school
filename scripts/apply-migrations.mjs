import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createNeonProbe } from "../server/db.mjs";

export function splitSql(source) {
  const withoutLineComments = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutLineComments
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

async function alreadyApplied(probe, id) {
  const tables = await probe.query(
    `SELECT 1 AS ok
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'schema_migrations'`,
    [],
  );
  if (tables.length === 0) return false;
  const rows = await probe.query(
    "SELECT id FROM schema_migrations WHERE id = $1",
    [id],
  );
  return rows.length > 0;
}

export async function applyMigrations(databaseUrl, migrationsDir) {
  const probe = createNeonProbe(databaseUrl);
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    if (await alreadyApplied(probe, id)) {
      console.log(`skip ${id}`);
      continue;
    }
    const statements = splitSql(readFileSync(join(migrationsDir, file), "utf8"));
    for (const statement of statements) {
      await probe.query(statement, []);
    }
    await probe.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
    console.log(`applied ${id}`);
  }
}

const isDirectRun = Boolean(
  process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href,
);

if (isDirectRun) {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Refusing to connect.");
    process.exit(1);
  }
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
  applyMigrations(databaseUrl, migrationsDir).catch((error) => {
    const name = error instanceof Error ? error.name : "Error";
    console.error(`migration failed: ${name}`);
    process.exit(1);
  });
}
