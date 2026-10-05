import { handleRecords } from "./records.mjs";

export function applyResult(res, result) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (result.allow) res.setHeader("Allow", result.allow);
  if (typeof res.status === "function") {
    res.status(result.status).json(result.body ?? {});
    return;
  }
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body ?? {}));
}

export function requestPath(req, apiPath) {
  const raw = typeof req.url === "string" ? req.url : apiPath;
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return apiPath + query;
}

export async function readRequestJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += buf.length;
    if (size > 100_000) {
      throw new Error("too_large");
    }
    chunks.push(buf);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}


export function createApiHandler(apiPath) {
  return async function handler(req, res) {
    try {
      const body = req.method === "GET" || req.method === "HEAD" ? {} : await readRequestJson(req);
      const result = await handleRecords({
        method: req.method,
        path: requestPath(req, apiPath),
        headers: req.headers,
        body,
        env: process.env,
      });
      applyResult(res, result);
    } catch {
      applyResult(res, { status: 400, body: { ok: false, error: "invalid" } });
    }
  };
}

export function recordsPath(req) {
  const slug = req?.query?.slug;
  const parts = Array.isArray(slug) ? slug : typeof slug === "string" ? [slug] : [];
  const raw = typeof req?.url === "string" ? req.url : "";
  const qIndex = raw.indexOf("?");
  const search = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
  if (parts.length === 1 && parts[0] === "nested") {
    const a = search.get("a") || "";
    const b = search.get("b") || "";
    if (!/^[a-z0-9-]+$/.test(a) || !/^[a-z0-9-]+$/.test(b)) return "/api/invalid";
    search.delete("a");
    search.delete("b");
    const qs = search.toString();
    return `/api/${a}/${b}${qs ? `?${qs}` : ""}`;
  }
  if (parts.length > 0) {
    const qs = qIndex === -1 ? "" : raw.slice(qIndex);
    return `/api/${parts.join("/")}${qs}`;
  }
  if (raw.startsWith("/api/")) return raw;
  return raw || "/api";
}
