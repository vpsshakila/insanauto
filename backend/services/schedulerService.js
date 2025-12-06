const cron = require("node-cron");
const jobService = require("./jobService");
const queueService = require("./queueService");

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.isProcessing = false;
    this.lastCheckTime = null;
    this.checkInterval = "*/30 * * * * *"; // Setiap 30 detik untuk testing
    // Untuk production: '* * * * *' // Setiap menit
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

    // Cron expression: setiap 30 detik untuk testing
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

    // Process immediately on startup
    setTimeout(() => {
      console.log("🔧 Running initial job check...");
      this.triggerProcessing();
    }, 3000);
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
   * Process pending jobs
   */
  async processPendingJobs() {
    try {
      console.log("📊 Checking system status...");

      // Cek koneksi database langsung
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

      // Skip stats check jika mau lebih cepat
      // Langsung query pending jobs
      const pendingJobs = await jobService.getPendingJobs();

      if (pendingJobs.length === 0) {
        console.log("⏭️  No pending jobs to execute");
        return;
      }

      console.log(
        `🔄 Found ${pendingJobs.length} pending job(s) ready to execute`
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
      lastCheckTime: this.lastCheckTime
        ? this.lastCheckTime.toISOString()
        : null,
      checkInterval: this.checkInterval,
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
