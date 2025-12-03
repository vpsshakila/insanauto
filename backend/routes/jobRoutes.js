// routes/jobRoutes.js
const express = require("express");
const router = express.Router();
const jobService = require("../services/jobService");
const { submitToGoogleForm } = require("../services/playwrightService");

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs();
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

// Get single job by ID
router.get("/:jobId", async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.jobId);

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

// Cancel job
router.post("/:jobId/cancel", async (req, res) => {
  try {
    const cancelled = await jobService.cancelJob(req.params.jobId);

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

// Delete job
router.delete("/:jobId", async (req, res) => {
  try {
    const deleted = await jobService.deleteJob(req.params.jobId);

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

module.exports = router;
