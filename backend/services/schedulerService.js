// services/schedulerService.js
const cron = require("node-cron");
const db = require("./database");
const queueService = require("./queueService");

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

      if (!Array.isArray(pendingJobs)) {
        console.error("❌ getPendingJobs did not return an array");
        return;
      }

      if (pendingJobs.length === 0) {
        return;
      }

      console.log(
        `\n🔄 Found ${pendingJobs.length} pending job(s) ready to execute`
      );

      // Process jobs sequentially using queue service
      await queueService.processJobBatch(pendingJobs);

      console.log("✅ All pending jobs processed\n");
    } catch (error) {
      console.error("❌ Error processing pending jobs:", error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      queue: queueService.getStatus(),
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
