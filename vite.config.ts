import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleHealth } from "./server/health.mjs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      {
        name: "local-api-health",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const path = req.url?.split("?")[0];
            if (path !== "/api/health") {
              next();
              return;
            }
            const result = await handleHealth(req.method, {
              DATABASE_URL: env.DATABASE_URL,
            });
            res.statusCode = result.status;
            res.setHeader("Cache-Control", "no-store");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            if (result.allow) res.setHeader("Allow", result.allow);
            if (req.method === "HEAD") {
              res.end();
              return;
            }
            res.end(JSON.stringify(result.body));
          });
        },
      },
      react(),
      tailwindcss(),
    ],
  };
});
