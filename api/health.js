import { handleHealth } from "../server/health.mjs";

export default async function handler(req, res) {
  const result = await handleHealth(req.method, process.env);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (result.allow) res.setHeader("Allow", result.allow);
  if (req.method === "HEAD") {
    res.status(result.status).end();
    return;
  }
  res.status(result.status).json(result.body);
}
