import { applyResult, readRequestJson, recordsPath } from "../server/http.mjs";
import { handleRecords } from "../server/records.mjs";

export default async function handler(req, res) {
  try {
    const body = req.method === "GET" || req.method === "HEAD" ? {} : await readRequestJson(req);
    const result = await handleRecords({
      method: req.method,
      path: recordsPath(req),
      headers: req.headers,
      body,
      env: process.env,
    });
    applyResult(res, result);
  } catch {
    applyResult(res, { status: 400, body: { ok: false, error: "invalid" } });
  }
}
