// routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const jobService = require("../services/jobService");
const { submitToGoogleForm } = require("../services/puppeteerService");

// Submit form IMMEDIATELY (no schedule)
router.post("/submit-now", async (req, res) => {
  try {
    console.log("📥 Immediate form submission:", req.body);

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
    console.error("❌ Submit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// SCHEDULE single form
router.post("/schedule", async (req, res) => {
  try {
    const { formData, scheduledTime } = req.body;

    console.log("📅 Schedule request:");
    console.log("   Form data:", formData);
    console.log("   Scheduled time:", scheduledTime);

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

    const job = await jobService.addScheduledJob(formData, scheduledTime);

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

// BATCH SCHEDULE - Schedule multiple forms
router.post("/schedule-batch", async (req, res) => {
  try {
    const { formDataList, scheduledTime } = req.body;

    console.log("📅 Batch schedule request:");
    console.log(`   Number of forms: ${formDataList?.length || 0}`);
    console.log(`   Scheduled time: ${scheduledTime}`);

    if (
      !formDataList ||
      !Array.isArray(formDataList) ||
      formDataList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "formDataList must be a non-empty array",
      });
    }

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "scheduledTime is required",
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

    // Validate each form
    const validationErrors = [];
    formDataList.forEach((formData, index) => {
      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        validationErrors.push(
          `Form ${index + 1}: Missing ${missingFields.join(", ")}`
        );
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors,
      });
    }

    // Add all jobs to database
    const jobs = [];
    for (const formData of formDataList) {
      const job = await jobService.addScheduledJob(formData, scheduledTime);
      jobs.push(job);
    }

    res.json({
      success: true,
      message: `${jobs.length} forms scheduled successfully`,
      jobs: jobs.map((job) => ({
        id: job.job_id,
        tid: job.tid,
        scheduledTime: job.scheduled_time,
        status: job.status,
      })),
    });
  } catch (error) {
    console.error("❌ Batch schedule error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
