const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const app = express();

/* ===============================
   ENV & CONSTANTS
================================ */
const CLIENT_URL = process.env.CLIENT_URL || "*";

/* ===============================
   APP CONFIG
================================ */
app.set("trust proxy", 1);

/* ===============================
   GLOBAL MIDDLEWARES
================================ */

// CORS (needs to be before helmet for static files)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Security (configure helmet to allow images and cross-origin resources)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http://localhost:5050", "https://api.bennettrading.in", "*"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// Logging
app.use(morgan("dev"));

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static Files (serve uploads directory with fallback search)
const uploadsPath = path.join(__dirname, "../uploads");
const fs = require("fs").promises;

app.use("/uploads", async (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  // Decode URL-encoded path (handles %20 for spaces, etc.)
  const decodedPath = decodeURIComponent(req.path);

  // Remove /uploads prefix
  const relativePath = decodedPath.replace(/^\/uploads\//, "");
  const requestedPath = path.join(uploadsPath, relativePath);

  // Security check - ensure path is within uploads directory
  const normalizedRequested = path.normalize(requestedPath);
  const normalizedUploads = path.normalize(uploadsPath);
  if (!normalizedRequested.startsWith(normalizedUploads)) {
    return res.status(403).send("Forbidden");
  }

  try {
    // Try to serve the file directly first
    await fs.access(normalizedRequested);
    // File exists - serve it directly with proper headers
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", CLIENT_URL === "*" ? "*" : CLIENT_URL);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.sendFile(normalizedRequested);
  } catch (err) {
    // File not found at requested path - let's search recursively
    const fileName = path.basename(relativePath);

    try {
      // Find files recursively in uploads dir
      const { exec } = require("child_process");
      const findCommand = process.platform === "win32"
        ? `where /r "${uploadsPath}" "${fileName}"`
        : `find "${uploadsPath}" -name "${fileName}" -print -quit`;

      exec(findCommand, (findErr, stdout) => {
        if (findErr || !stdout) {
          console.log(`[Static Files] File ${fileName} not found anywhere in ${uploadsPath}`);
          return res.status(404).type("text/plain").send("File not found");
        }

        const foundPath = stdout.split('\n')[0].trim();
        if (foundPath) {
          console.log(`[Static Files] Found file via search: ${foundPath}`);
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Access-Control-Allow-Origin", CLIENT_URL === "*" ? "*" : CLIENT_URL);
          res.sendFile(foundPath);
        } else {
          res.status(404).type("text/plain").send("File not found");
        }
      });
    } catch (searchErr) {
      console.error(`[Static Files] Search error:`, searchErr.message);
      res.status(404).type("text/plain").send("File not found");
    }
  }
});

/* ===============================
   ROUTES
================================ */
// Health / status API – no auth, for "backend is up" and logic screen
const pkg = require("../package.json");
const serverStartedAt = new Date().toISOString();

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "up",
    message: "Backend is running",
    service: pkg.name || "Impexina Backend",
    version: pkg.version || "1.0.0",
    lastUpdated: serverStartedAt,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
  });
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

// Module Routes
const moduleRoutes = require("./modules");
app.use("/api", moduleRoutes);

/* ===============================
   404 HANDLER
================================ */
app.use((req, res) => {
  // express.static with fallthrough: false handles its own 404s for /uploads/*
  // So if we reach here for /uploads/*, something went wrong
  // For all other routes, return JSON 404
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ===============================
   CENTRAL ERROR HANDLER
================================ */
app.use((error, req, res, next) => {
  console.error("Error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

module.exports = app;
