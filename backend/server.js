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
    console.log(`🕐 Server time: ${new Date().toISOString()}`);
    console.log(`🕐 Local time: ${new Date().toString()}\n`);

    // 1. Connect to database dengan retry mechanism
    console.log("📊 Connecting to database...");

    let connected = false;
    let retries = 0;
    const maxRetries = 3;

    while (!connected && retries < maxRetries) {
      try {
        await database.connect();
        connected = true;
        console.log("✅ Database ready\n");
      } catch (error) {
        retries++;
        console.error(
          `❌ Connection attempt ${retries}/${maxRetries} failed:`,
          error.message
        );

        if (retries < maxRetries) {
          console.log(`   ⏳ Retrying in 5 seconds...\n`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          console.error("💡 Tips:");
          console.error("   1. Pastikan MongoDB service berjalan");
          console.error("   2. Untuk Windows: net start MongoDB");
          console.error("   3. Untuk Linux: sudo systemctl start mongod");
          console.error(
            "   4. Cek MongoDB Compass bisa connect ke localhost:27017\n"
          );
          throw new Error(
            "Failed to connect to database after multiple attempts"
          );
        }
      }
    }

    // 2. Start scheduler
    console.log("⏰ Starting scheduler...");
    scheduler.start();
    console.log("✅ Scheduler ready\n");

    // 3. Initial health check
    setTimeout(async () => {
      try {
        const stats = await jobService.getStats();
        console.log("📊 Initial system status:");
        console.log(
          `   - Database: ${
            stats.database_connected ? "✅ Connected" : "❌ Disconnected"
          }`
        );
        console.log(`   - Total jobs: ${stats.total_count}`);
        console.log(`   - Pending jobs: ${stats.pending_count}`);

        if (stats.pending_count > 0) {
          console.log(
            "   - ⚠️  There are pending jobs, scheduler will process them soon"
          );
        }
      } catch (error) {
        console.error("❌ Initial health check failed:", error.message);
      }
    }, 2000);

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⏰ Scheduler: Active (checking every 30 seconds)`);
      console.log(`📁 Database: ${connected ? "Connected" : "Disconnected"}`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error.message);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if MongoDB is running");
    console.error("   2. Verify .env file configuration");
    console.error("   3. Test connection: mongo --version");
    console.error("   4. Start MongoDB service\n");
    process.exit(1);
  }
}

// ========== ROUTES ==========

// Health check dengan detail
app.get("/api/health", async (req, res) => {
  try {
    const stats = await jobService.getStats();
    const schedulerStatus = scheduler.getStatus();
    const dbStatus = database.getStatus();

    res.json({
      status: "OK",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
      },
      scheduler: schedulerStatus,
      database: dbStatus,
      jobs: stats,
      endpoints: {
        jobs: "/api/jobs",
        schedule: "/api/schedule",
        templates: "/api/templates",
        scheduler_trigger: "/api/scheduler/trigger (POST)",
      },
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

// Scheduler control endpoints
app.get("/api/scheduler/status", (req, res) => {
  res.json({
    success: true,
    ...scheduler.getStatus(),
  });
});

app.post("/api/scheduler/trigger", async (req, res) => {
  try {
    await scheduler.triggerProcessing();
    res.json({
      success: true,
      message: "Scheduler triggered manually",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/scheduler/restart", (req, res) => {
  try {
    scheduler.stop();
    setTimeout(() => {
      scheduler.start();
    }, 1000);

    res.json({
      success: true,
      message: "Scheduler restarted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Database status
app.get("/api/database/status", (req, res) => {
  res.json({
    success: true,
    ...database.getStatus(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await database.close();
  console.log("✅ Clean shutdown completed");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await database.close();
  console.log("✅ Clean shutdown completed");
  process.exit(0);
});

// Start the server
startServer();
