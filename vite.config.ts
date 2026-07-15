import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// #region agent log
/** Fallback when Cursor ingest (127.0.0.1:7756) is unreachable. */
const debugLogPlugin = (): Plugin => ({
  name: "debug-log-fallback",
  configureServer(server) {
    server.middlewares.use("/__debug_log", (req, res, next) => {
      if (req.method !== "POST") return next();
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        try {
          const line = Buffer.concat(chunks).toString("utf8").trim();
          if (line) {
            const logDir = path.resolve(__dirname, ".cursor");
            fs.mkdirSync(logDir, { recursive: true });
            fs.appendFileSync(path.join(logDir, "debug-115e48.log"), line + "\n");
          }
          res.statusCode = 204;
          res.end();
        } catch {
          res.statusCode = 500;
          res.end();
        }
      });
    });
  },
});
// #endregion

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "development" && debugLogPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
