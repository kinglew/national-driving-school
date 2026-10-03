import { createNeonProbe } from "./db.mjs";

export async function databaseHealth(env, probeFactory = createNeonProbe) {
  const url = typeof env?.DATABASE_URL === "string" ? env.DATABASE_URL.trim() : "";
  if (!url) {
    return { status: 503, body: { ok: false, database: "unconfigured" } };
  }
  try {
    const probe = probeFactory(url);
    await probe.ping();
    const schemaReady = await probe.schemaReady();
    return {
      status: 200,
      body: { ok: true, database: "up", schemaReady: schemaReady === true },
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    console.error(`database health check failed: ${name}`);
    return { status: 503, body: { ok: false, database: "down" } };
  }
}

export async function handleHealth(method, env, probeFactory) {
  if (method !== "GET" && method !== "HEAD") {
    return {
      status: 405,
      allow: "GET, HEAD",
      body: { ok: false, error: "method_not_allowed" },
    };
  }
  return databaseHealth(env, probeFactory);
}
