// services/queueService.js
const jobService = require("./jobService");
const { submitToGoogleForm } = require("./playwrightService");

class QueueService {
  constructor() {
    this.isProcessing = false;
    this.currentJob = null;
  }

  /**
   * Execute jobs with same scheduled_time sequentially
   * Prevents concurrent Playwright instances
   * FIXED: Update semua jobs ke "processing" SEBELUM execution dimulai
   */
  async processJobBatch(jobs) {
    if (jobs.length === 0) return;

    console.log(`\n🔄 Processing batch of ${jobs.length} job(s)...`);

    // ✅ UPDATE SEMUA JOBS KE "PROCESSING" TERLEBIH DAHULU
    const jobIds = jobs.map((j) => j.job_id);
    await jobService.batchUpdateToProcessing(jobIds);
    console.log(`✅ All ${jobs.length} jobs marked as processing\n`);

    // Kemudian execute satu per satu
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`[${i + 1}/${jobs.length}] Processing: ${job.job_id}`);

      await this.executeJob(job);

      // Small delay between jobs to prevent resource issues
      if (i < jobs.length - 1) {
        console.log("   ⏳ Waiting 3 seconds before next job...");
        await this.sleep(3000);
      }
    }

    console.log(`\n✅ Batch processing completed!\n`);
  }

  /**
   * Execute single job
   * FIXED: Tidak perlu update ke "processing" lagi karena sudah di-batch update
   */
  async executeJob(job) {
    this.currentJob = job;

    console.log(`   ▶️  Executing: ${job.job_id}`);
    console.log(`   📋 TID: ${job.tid}`);
    console.log(`   👤 Nama: ${job.nama}`);

    try {
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
        await jobService.updateJobStatus(job.job_id, "completed");
        console.log(`   ✅ Job ${job.job_id} completed`);
      } else {
        await jobService.updateJobStatus(job.job_id, "failed", result.message);
        console.error(`   ❌ Job ${job.job_id} failed: ${result.message}`);
      }
    } catch (error) {
      await jobService.updateJobStatus(job.job_id, "failed", error.message);
      console.error(`   ❌ Job ${job.job_id} error: ${error.message}`);
    } finally {
      this.currentJob = null;
    }
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentJob: this.currentJob
        ? {
            job_id: this.currentJob.job_id,
            tid: this.currentJob.tid,
            nama: this.currentJob.nama,
          }
        : null,
    };
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new QueueService();
