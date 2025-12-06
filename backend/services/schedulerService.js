const cron = require("node-cron");
const jobService = require("./jobService");
const queueService = require("./queueService");

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.isProcessing = false;
    this.lastCheckTime = null;
    this.checkInterval = "* * * * *"; // FIXED: Setiap 1 menit (production ready)
  }

  /**
   * Start scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Scheduler already running");
      return;
    }

    console.log(`⏰ Starting scheduler with interval: ${this.checkInterval}`);
    console.log("   Checking every 1 minute for pending jobs");

    // FIXED: Cron expression setiap 1 menit
    this.cronJob = cron.schedule(this.checkInterval, async () => {
      // Prevent concurrent processing
      if (this.isProcessing) {
        console.log("⏭️  Skipping - previous job still processing");
        return;
      }

      this.isProcessing = true;
      this.lastCheckTime = new Date();

      try {
        console.log(
          `\n[${this.lastCheckTime.toISOString()}] 🕐 Scheduler triggered`
        );
        await this.processPendingJobs();
      } catch (error) {
        console.error("❌ Scheduler error:", error.message);
      } finally {
        this.isProcessing = false;
      }
    });

    this.isRunning = true;
    console.log("✅ Scheduler started");

    // FIXED: Tidak langsung process on startup, tunggu scheduled_time
    console.log("💡 Scheduler will check for pending jobs every minute");
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
   * Process pending jobs - FIXED: Validasi time lebih ketat
   */
  async processPendingJobs() {
    try {
      console.log("📊 Checking system status...");

      const database = require("../config/database");
      if (!database.isConnected()) {
        console.log("❌ Database not connected, attempting to reconnect...");
        try {
          await database.reconnect();
          await new Promise((resolve) => setTimeout(resolve, 2000));

          if (!database.isConnected()) {
            console.log("❌ Still not connected, skipping job processing");
            return;
          }
        } catch (reconnectError) {
          console.log("❌ Reconnect failed:", reconnectError.message);
          return;
        }
      }

      // Get pending jobs yang sudah waktunya
      const pendingJobs = await jobService.getPendingJobs();

      if (pendingJobs.length === 0) {
        console.log("⏭️  No pending jobs ready to execute");
        return;
      }

      console.log(
        `🔄 Found ${pendingJobs.length} pending job(s) ready to execute`
      );

      // FIXED: Validasi sekali lagi sebelum process
      const now = new Date();
      const jobsToProcess = pendingJobs.filter((job) => {
        const scheduledTime = new Date(job.scheduled_time);
        return scheduledTime <= now;
      });

      if (jobsToProcess.length === 0) {
        console.log("⏭️  No jobs have reached their scheduled time yet");
        return;
      }

      console.log(`✅ Processing ${jobsToProcess.length} job(s)...`);

      // Process jobs using queue service
      await queueService.processJobBatch(jobsToProcess);

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
      lastCheckTime: this.lastCheckTime
        ? this.lastCheckTime.toISOString()
        : null,
      checkInterval: this.checkInterval,
      nextCheck: this.isRunning
        ? new Date(Date.now() + 60000).toISOString()
        : null,
      queue: queueService.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Manually trigger job processing
   */
  async triggerProcessing() {
    console.log("🔧 Manually triggering job processing...");
    if (this.isProcessing) {
      console.log("⏭️  Skipping - scheduler is already processing");
      return;
    }

    this.isProcessing = true;
    try {
      await this.processPendingJobs();
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new SchedulerService();
