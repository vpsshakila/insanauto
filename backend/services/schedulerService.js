// services/schedulerService.js
const cron = require("node-cron");
const db = require("./database");
const { submitToGoogleForm } = require("./playwrightService");

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.isProcessing = false;
  }

  /**
   * Start scheduler - cek setiap menit untuk pending jobs
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Scheduler already running");
      return;
    }

    // Cron expression: setiap menit
    this.cronJob = cron.schedule("* * * * *", async () => {
      // Prevent concurrent processing
      if (this.isProcessing) {
        console.log("⏭️  Skipping - previous job still processing");
        return;
      }

      this.isProcessing = true;
      try {
        await this.processPendingJobs();
      } catch (error) {
        console.error("❌ Scheduler error:", error.message);
      } finally {
        this.isProcessing = false;
      }
    });

    this.isRunning = true;
    console.log("✅ Scheduler started - checking every minute");
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log("⏹️  Scheduler stopped");
    }
  }

  /**
   * Process semua pending jobs yang waktunya sudah tiba
   */
  async processPendingJobs() {
    try {
      const pendingJobs = await db.getPendingJobs();

      // Check if pendingJobs is valid array
      if (!Array.isArray(pendingJobs)) {
        console.error("❌ getPendingJobs did not return an array");
        return;
      }

      if (pendingJobs.length === 0) {
        return; // Tidak ada job yang perlu diproses
      }

      console.log(`\n🔄 Processing ${pendingJobs.length} pending job(s)...`);

      for (const job of pendingJobs) {
        await this.executeJob(job);
      }

      console.log("✅ All pending jobs processed\n");
    } catch (error) {
      console.error("❌ Error processing pending jobs:", error.message);
    }
  }

  /**
   * Execute single job
   */
  async executeJob(job) {
    console.log(`\n▶️  Executing job: ${job.job_id}`);
    console.log(`   TID: ${job.tid}`);
    console.log(`   Scheduled: ${job.scheduled_time}`);

    try {
      // Update status ke "processing"
      await db.updateJobStatus(job.job_id, "processing");

      // Siapkan form data
      const formData = {
        tid: job.tid,
        kondisiCamera: job.kondisi_camera,
        kondisiNVR: job.kondisi_nvr,
        nama: job.nama,
        perusahaan: job.perusahaan,
        noPegawai: job.no_pegawai,
      };

      // Submit form menggunakan Playwright
      const result = await submitToGoogleForm(formData);

      if (result.success) {
        // Update status ke "completed"
        await db.updateJobStatus(job.job_id, "completed");
        console.log(`✅ Job ${job.job_id} completed successfully`);
      } else {
        // Update status ke "failed"
        await db.updateJobStatus(job.job_id, "failed", result.message);
        console.error(`❌ Job ${job.job_id} failed: ${result.message}`);
      }
    } catch (error) {
      // Handle unexpected errors
      await db.updateJobStatus(job.job_id, "failed", error.message);
      console.error(`❌ Job ${job.job_id} error:`, error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Manually trigger job processing (for testing)
   */
  async triggerProcessing() {
    console.log("🔧 Manually triggering job processing...");
    await this.processPendingJobs();
  }
}

module.exports = new SchedulerService();
