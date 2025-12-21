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

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

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
