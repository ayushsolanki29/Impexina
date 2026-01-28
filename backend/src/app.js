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
    // File not found at requested path - try to find it in other shipping mark folders
    // Path format: /uploads/containerCode/shippingMark/filename
    const pathParts = relativePath.split(/[/\\]/);
    if (pathParts.length >= 3) {
      const containerCode = pathParts[0];
      const fileName = pathParts[pathParts.length - 1];
      const containerDir = path.join(uploadsPath, containerCode);

      try {
        const entries = await fs.readdir(containerDir, { withFileTypes: true });
        const directories = entries.filter(e => e.isDirectory());

        console.log(`[Static Files] File not found at ${normalizedRequested}, searching in ${directories.length} directories for ${fileName}`);

        // Search each directory for the file
        for (const entry of directories) {
          const potentialPath = path.join(containerDir, entry.name, fileName);
          try {
            await fs.access(potentialPath);
            // Found the file - serve it directly with proper headers
            console.log(`[Static Files] Found file at ${potentialPath}, serving...`);
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            res.setHeader("Access-Control-Allow-Origin", CLIENT_URL === "*" ? "*" : CLIENT_URL);
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            res.setHeader("Cache-Control", "public, max-age=31536000");
            res.sendFile(potentialPath);
            return;
          } catch (searchErr) {
            // File not in this directory, continue searching
            continue;
          }
        }
        // File not found in any directory
        console.log(`[Static Files] File ${fileName} not found in any directory under ${containerDir}`);
        res.status(404).type("text/plain").send("File not found");
      } catch (dirErr) {
        console.error(`[Static Files] Error reading directory ${containerDir}:`, dirErr.message);
        res.status(404).type("text/plain").send("File not found");
      }
    } else {
      // Invalid path format
      console.log(`[Static Files] Invalid path format: ${relativePath}`);
      res.status(404).type("text/plain").send("File not found");
    }
  }
});

/* ===============================
   ROUTES
================================ */
// Health Check (ALWAYS FIRST)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Impexina Software Backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

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
