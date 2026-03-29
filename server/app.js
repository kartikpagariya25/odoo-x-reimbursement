const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 DB readiness check
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not ready" });
  }
  next();
});

// 🔹 Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "API is running" });
});

// 🔹 Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/expenses", require("./routes/expense.routes"));

// 🔹 Serve frontend if exists
const clientDistPath = path.resolve(__dirname, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

// 🔹 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 🔹 Global error handler
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error"
  });
});

module.exports = app;