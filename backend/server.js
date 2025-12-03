// server.js
const express = require("express");
const cors = require("cors");
const database = require("./config/database");
const scheduler = require("./services/schedulerService");
const jobService = require("./services/jobService");

// Routes
const jobRoutes = require("./routes/jobRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const templateRoutes = require("./routes/templateRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ========== STARTUP FUNCTION ==========
async function startServer() {
  try {
    console.log("🚀 Starting server...\n");

    // 1. Connect to database
    console.log("📊 Connecting to database...");
    await database.connect();
    console.log("✅ Database ready\n");

    // 2. Start scheduler
    console.log("⏰ Starting scheduler...");
    scheduler.start();
    console.log("✅ Scheduler ready\n");

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⏰ Scheduler: Active`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if MongoDB is running");
    console.error("   2. Verify .env file configuration");
    console.error("   3. Test connection: node scripts/db-utils.js test");
    process.exit(1);
  }
}

// ========== ROUTES ==========

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const stats = await jobService.getStats();
    res.json({
      status: "OK",
      message: "Server is running",
      scheduler: scheduler.getStatus(),
      database: {
        connected: database.isConnected(),
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount routes
app.use("/api/jobs", jobRoutes);
app.use("/api", scheduleRoutes);
app.use("/api/templates", templateRoutes);

// Manually trigger scheduler (for testing)
app.post("/api/scheduler/trigger", async (req, res) => {
  try {
    await scheduler.triggerProcessing();
    res.json({
      success: true,
      message: "Scheduler triggered manually",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await database.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await database.close();
  process.exit(0);
});

// Start the server
startServer();
