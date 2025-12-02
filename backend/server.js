const express = require("express");
const cors = require("cors");
const { submitToGoogleForm } = require("./services/playwrightService");
const db = require("./services/database");
const scheduler = require("./services/schedulerService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ========== STARTUP FUNCTION ==========
async function startServer() {
  try {
    console.log("🚀 Starting server...\n");

    // 1. Initialize database first
    console.log("📊 Initializing database...");
    await db.initializeDatabase();
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
    console.error("   1. Check if PostgreSQL is running");
    console.error("   2. Verify .env file configuration");
    console.error("   3. Test connection: node scripts/db-utils.js test");
    process.exit(1);
  }
}

// ========== ENDPOINTS ==========

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      status: "OK",
      message: "Server is running",
      scheduler: scheduler.getStatus(),
      database: {
        connected: db.isInitialized,
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

// Submit form LANGSUNG (tanpa schedule)
app.post("/api/submit-form", async (req, res) => {
  try {
    console.log("📥 Received immediate form submission:", req.body);

    const requiredFields = [
      "tid",
      "kondisiCamera",
      "kondisiNVR",
      "nama",
      "perusahaan",
      "noPegawai",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const result = await submitToGoogleForm(req.body);

    if (result.success) {
      res.json({
        success: true,
        message: "Form submitted successfully",
        data: result.data,
        timestamp: result.timestamp,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// SCHEDULE form submission
app.post("/api/schedule-form", async (req, res) => {
  try {
    const { formData, scheduledTime } = req.body;

    console.log("📅 Received schedule request:");
    console.log("   Form data:", formData);
    console.log("   Scheduled time:", scheduledTime);

    // Validasi
    if (!formData || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "Missing formData or scheduledTime",
      });
    }

    const requiredFields = [
      "tid",
      "kondisiCamera",
      "kondisiNVR",
      "nama",
      "perusahaan",
      "noPegawai",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Tambahkan ke database
    const job = await db.addScheduledJob(formData, scheduledTime);

    res.json({
      success: true,
      message: "Form scheduled successfully",
      job: {
        id: job.job_id,
        tid: job.tid,
        scheduledTime: job.scheduled_time,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("❌ Schedule error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET semua scheduled jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await db.getAllJobs();
    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single job by ID
app.get("/api/jobs/:jobId", async (req, res) => {
  try {
    const job = await db.getJobById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CANCEL scheduled job
app.post("/api/jobs/:jobId/cancel", async (req, res) => {
  try {
    const cancelled = await db.cancelJob(req.params.jobId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: "Job not found or already executed",
      });
    }

    res.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE job
app.delete("/api/jobs/:jobId", async (req, res) => {
  try {
    const deleted = await db.deleteJob(req.params.jobId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

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

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  await db.close();
  process.exit(0);
});

// Start the server
startServer();
