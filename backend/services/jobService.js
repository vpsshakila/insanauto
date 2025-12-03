// services/jobService.js
const Job = require("../models/Job");

class JobService {
  /**
   * Add scheduled job
   */
  async addScheduledJob(formData, scheduledTime) {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const scheduleDate = new Date(scheduledTime);

    if (scheduleDate <= new Date()) {
      throw new Error("Scheduled time must be in the future");
    }

    try {
      const job = new Job({
        job_id: jobId,
        tid: formData.tid,
        kondisi_camera: formData.kondisiCamera,
        kondisi_nvr: formData.kondisiNVR,
        nama: formData.nama,
        perusahaan: formData.perusahaan,
        no_pegawai: formData.noPegawai,
        scheduled_time: scheduleDate,
      });

      await job.save();

      console.log(`✅ Job added: ${jobId}`);
      console.log(`   ⏰ Scheduled for: ${scheduleDate.toISOString()}`);

      return job.toObject();
    } catch (error) {
      console.error("❌ Failed to add job:", error.message);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    try {
      const job = await Job.findOne({ job_id: jobId });
      return job ? job.toObject() : null;
    } catch (error) {
      console.error("❌ Failed to get job:", error.message);
      throw error;
    }
  }

  /**
   * Get pending jobs ready to execute
   */
  async getPendingJobs() {
    try {
      const jobs = await Job.find({
        status: "pending",
        scheduled_time: { $lte: new Date() },
      })
        .sort({ scheduled_time: 1 })
        .lean();

      return jobs;
    } catch (error) {
      console.error("❌ Failed to get pending jobs:", error.message);
      return [];
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, errorMessage = null) {
    try {
      const job = await Job.findOneAndUpdate(
        { job_id: jobId },
        {
          status: status,
          executed_at: new Date(),
          error_message: errorMessage,
        },
        { new: true }
      );

      if (job) {
        console.log(`   📝 Job ${jobId} status: ${status}`);
      }

      return job ? job.toObject() : null;
    } catch (error) {
      console.error("❌ Failed to update job status:", error.message);
      throw error;
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs(limit = 50) {
    try {
      const jobs = await Job.find({})
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      return jobs;
    } catch (error) {
      console.error("❌ Failed to get all jobs:", error.message);
      return [];
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobId) {
    try {
      const result = await Job.deleteOne({ job_id: jobId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("❌ Failed to delete job:", error.message);
      throw error;
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    try {
      const result = await Job.updateOne(
        { job_id: jobId, status: "pending" },
        { status: "cancelled" }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("❌ Failed to cancel job:", error.message);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const stats = await Job.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const result = {
        pending_count: 0,
        processing_count: 0,
        completed_count: 0,
        failed_count: 0,
        cancelled_count: 0,
        total_count: 0,
      };

      stats.forEach((stat) => {
        const key = `${stat._id}_count`;
        result[key] = stat.count;
        result.total_count += stat.count;
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to get stats:", error.message);
      throw error;
    }
  }

  /**
   * Cleanup old jobs
   */
  async cleanupOldJobs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Job.deleteMany({
        created_at: { $lt: cutoffDate },
        status: { $in: ["completed", "failed", "cancelled"] },
      });

      console.log(`✅ Cleaned up ${result.deletedCount} old job(s)`);
      return result.deletedCount;
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
      throw error;
    }
  }
}

module.exports = new JobService();
