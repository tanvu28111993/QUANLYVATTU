import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Enable Gzip/Brotli compression
  app.use(compression());

  // 2. API Routes (if any)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 3. Serve Static Files (Production) or Vite Middleware (Dev)
  if (process.env.NODE_ENV === "production") {
    // Serve static files from 'dist' directory
    app.use(express.static(path.resolve(__dirname, "dist")));

    // Handle SPA routing: serve index.html for all non-API routes
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    // Development: Use Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
