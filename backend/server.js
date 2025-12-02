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

// Start scheduler saat server start
scheduler.start();

// ========== ENDPOINTS ==========

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    scheduler: scheduler.getStatus(),
    timestamp: new Date().toISOString(),
  });
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

// SCHEDULE form submission (BARU!)
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
    const job = db.addScheduledJob(formData, scheduledTime);

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
app.get("/api/jobs", (req, res) => {
  try {
    const jobs = db.getAllJobs();
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
app.get("/api/jobs/:jobId", (req, res) => {
  try {
    const job = db.getJobById(req.params.jobId);

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
app.post("/api/jobs/:jobId/cancel", (req, res) => {
  try {
    const cancelled = db.cancelJob(req.params.jobId);

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
app.delete("/api/jobs/:jobId", (req, res) => {
  try {
    const deleted = db.deleteJob(req.params.jobId);

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

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️  Shutting down gracefully...");
  scheduler.stop();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⏰ Scheduler is active`);
});
