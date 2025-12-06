const mongoose = require("mongoose");
const Job = require("../models/Job");
const database = require("../config/database");

class JobService {
  constructor() {
    this.queryTimeout = 10000; // 10 detik
  }

  /**
   * Safe query execution dengan connection check
   */
  async safeQuery(operation, query, options = {}) {
    return await database.executeWithConnection(async () => {
      const startTime = Date.now();

      try {
        let result;

        switch (operation) {
          case "find":
            const findQuery = Job.find(query);
            if (options.sort) findQuery.sort(options.sort);
            if (options.limit) findQuery.limit(options.limit);
            findQuery.maxTimeMS(this.queryTimeout);
            result = await findQuery.lean().exec();
            break;

          case "findOne":
            result = await Job.findOne(query)
              .maxTimeMS(this.queryTimeout)
              .lean()
              .exec();
            break;

          case "findOneAndUpdate":
            result = await Job.findOneAndUpdate(query, options.update, {
              new: true,
              maxTimeMS: this.queryTimeout,
            })
              .lean()
              .exec();
            break;

          case "updateMany":
            result = await Job.updateMany(query, options.update, {
              maxTimeMS: this.queryTimeout,
            }).exec();
            break;

          case "deleteOne":
            result = await Job.deleteOne(query)
              .maxTimeMS(this.queryTimeout)
              .exec();
            break;

          case "count":
            result = await Job.countDocuments(query)
              .maxTimeMS(this.queryTimeout)
              .exec();
            break;

          case "aggregate":
            result = await Job.aggregate(query).exec();
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        const duration = Date.now() - startTime;
        if (duration > 1000) {
          console.log(`   ⏱️ Query ${operation} took ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
          `❌ Query ${operation} failed after ${duration}ms:`,
          error.message
        );

        if (
          error.name === "MongoServerSelectionError" ||
          error.name === "MongoNetworkError" ||
          error.message.includes("timeout")
        ) {
          throw new Error(`Database query timeout: ${error.message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      if (!database.isConnected()) {
        console.log("📊 Database not connected, returning default stats");
        return {
          pending_count: 0,
          processing_count: 0,
          completed_count: 0,
          failed_count: 0,
          cancelled_count: 0,
          total_count: 0,
          database_connected: false,
          error: "Database not connected",
          timestamp: new Date().toISOString(),
        };
      }

      console.log("📊 Getting statistics from database...");

      const stats = await this.safeQuery("aggregate", [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      if (!stats || !Array.isArray(stats)) {
        console.log("⚠️  Aggregate failed, using countDocuments instead");
        return await this.getStatsFallback();
      }

      const result = {
        pending_count: 0,
        processing_count: 0,
        completed_count: 0,
        failed_count: 0,
        cancelled_count: 0,
        total_count: 0,
        database_connected: true,
        timestamp: new Date().toISOString(),
      };

      stats.forEach((stat) => {
        const key = `${stat._id}_count`;
        if (result.hasOwnProperty(key)) {
          result[key] = stat.count;
        }
        result.total_count += stat.count;
      });

      console.log(`📊 Stats: ${JSON.stringify(result, null, 2)}`);
      return result;
    } catch (error) {
      console.error("❌ Failed to get stats via aggregate:", error.message);

      try {
        return await this.getStatsFallback();
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError.message);
        return {
          pending_count: 0,
          processing_count: 0,
          completed_count: 0,
          failed_count: 0,
          cancelled_count: 0,
          total_count: 0,
          database_connected: false,
          error: `${error.message} | ${fallbackError.message}`,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  /**
   * Fallback method untuk get stats
   */
  async getStatsFallback() {
    console.log("📊 Using fallback method for statistics");

    try {
      const statuses = [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ];
      const promises = statuses.map((status) =>
        this.safeQuery("count", { status: status })
      );

      const counts = await Promise.all(promises);

      const result = {
        pending_count: counts[0] || 0,
        processing_count: counts[1] || 0,
        completed_count: counts[2] || 0,
        failed_count: counts[3] || 0,
        cancelled_count: counts[4] || 0,
        total_count: counts.reduce((sum, count) => sum + (count || 0), 0),
        database_connected: true,
        timestamp: new Date().toISOString(),
        method: "fallback_count",
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add scheduled job - FIXED: Better timezone handling
   */
  async addScheduledJob(formData, scheduledTime) {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Parse scheduled time - handle both ISO string and Date object
    let scheduleDate;
    if (typeof scheduledTime === "string") {
      scheduleDate = new Date(scheduledTime);
    } else {
      scheduleDate = new Date(scheduledTime);
    }

    const now = new Date();

    console.log(`📅 Adding scheduled job:`);
    console.log(`   Current time (UTC): ${now.toISOString()}`);
    console.log(`   Current time (Local): ${now.toString()}`);
    console.log(`   Scheduled time (UTC): ${scheduleDate.toISOString()}`);
    console.log(`   Scheduled time (Local): ${scheduleDate.toString()}`);
    console.log(
      `   Difference: ${((scheduleDate - now) / 1000 / 60).toFixed(1)} minutes`
    );

    // FIXED: Tambah buffer minimal 1 menit untuk memastikan scheduler punya waktu
    const minTime = new Date(now.getTime() + 60000); // 1 menit dari sekarang
    if (scheduleDate < minTime) {
      throw new Error(
        `Scheduled time must be at least 1 minute in the future. Current: ${now.toISOString()}, Scheduled: ${scheduleDate.toISOString()}`
      );
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
      console.log(`   ⏰ Will execute at: ${scheduleDate.toISOString()} (UTC)`);
      console.log(`   ⏰ Will execute at: ${scheduleDate.toString()} (Local)`);

      return job.toObject();
    } catch (error) {
      console.error("❌ Failed to add job:", error.message);
      throw error;
    }
  }

  /**
   * Get pending jobs - FIXED: Query dengan buffer time dan logging detail
   */
  async getPendingJobs() {
    try {
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 60000); // 1 menit buffer

      console.log(`\n[${now.toISOString()}] 🔍 Querying pending jobs...`);
      console.log(`   Current time (UTC): ${now.toISOString()}`);
      console.log(`   Current time (Local): ${now.toString()}`);
      console.log(`   Buffer time: ${bufferTime.toISOString()}`);

      if (!database.isConnected()) {
        console.log(
          "   ⚠️  Database not connected, attempting to reconnect..."
        );
        try {
          await database.reconnect();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (reconnectError) {
          console.log("   ❌ Reconnect failed:", reconnectError.message);
          return [];
        }
      }

      // Query: scheduled_time sudah lewat + buffer 1 menit
      const jobs = await this.safeQuery(
        "find",
        {
          status: "pending",
          scheduled_time: { $lte: bufferTime },
        },
        {
          sort: { scheduled_time: 1 },
        }
      );

      console.log(`📊 Found ${jobs.length} pending job(s)`);

      if (jobs.length > 0) {
        jobs.forEach((job, index) => {
          const scheduled = new Date(job.scheduled_time);
          const diffSeconds = (now - scheduled) / 1000;
          const timeStatus =
            diffSeconds > 0
              ? `${Math.abs(diffSeconds).toFixed(0)}s overdue`
              : `${Math.abs(diffSeconds).toFixed(0)}s early`;

          console.log(`   ${index + 1}. ${job.job_id} (${job.tid})`);
          console.log(`      Scheduled: ${scheduled.toISOString()} (UTC)`);
          console.log(`      Scheduled: ${scheduled.toString()} (Local)`);
          console.log(`      Status: ${timeStatus}`);
        });
      } else {
        console.log("   ℹ️  No pending jobs ready to execute");

        // Debug: Cek apakah ada pending jobs di masa depan
        const futureJobs = await this.safeQuery(
          "find",
          {
            status: "pending",
            scheduled_time: { $gt: bufferTime },
          },
          {
            sort: { scheduled_time: 1 },
            limit: 3,
          }
        );

        if (futureJobs.length > 0) {
          console.log(`\n   🔮 Future pending jobs (${futureJobs.length}):`);
          futureJobs.forEach((job, index) => {
            const scheduled = new Date(job.scheduled_time);
            const diffSeconds = (scheduled - now) / 1000;
            console.log(
              `      ${index + 1}. ${job.job_id} - in ${Math.ceil(
                diffSeconds
              )}s`
            );
          });
        }
      }

      return jobs;
    } catch (error) {
      console.error("❌ Failed to get pending jobs:", error.message);
      return [];
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    try {
      const jobs = await this.safeQuery(
        "find",
        { job_id: jobId },
        { limit: 1 }
      );
      return jobs.length > 0 ? jobs[0] : null;
    } catch (error) {
      console.error("❌ Failed to get job:", error.message);
      return null;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, errorMessage = null) {
    try {
      const updateData = {
        status: status,
        error_message: errorMessage,
        updated_at: new Date(),
      };

      // Only set executed_at for final statuses
      if (status === "completed" || status === "failed") {
        updateData.executed_at = new Date();
      }

      const job = await this.safeQuery(
        "findOneAndUpdate",
        { job_id: jobId },
        {
          update: updateData,
        }
      );

      if (job) {
        console.log(`   📝 Job ${jobId} status: ${status}`);
      } else {
        console.log(`   ⚠️  Job ${jobId} not found for update`);
      }

      return job;
    } catch (error) {
      console.error("❌ Failed to update job status:", error.message);
      return null;
    }
  }

  /**
   * Batch update jobs to processing status - FIXED: Tambah validasi
   */
  async batchUpdateToProcessing(jobIds) {
    try {
      const now = new Date();

      const result = await this.safeQuery(
        "updateMany",
        {
          job_id: { $in: jobIds },
          status: "pending",
          scheduled_time: { $lte: now }, // Pastikan hanya update yang sudah waktunya
        },
        {
          update: {
            status: "processing",
            updated_at: now,
          },
        }
      );

      console.log(`   📝 Updated ${result.modifiedCount} job(s) to processing`);
      return result.modifiedCount;
    } catch (error) {
      console.error("❌ Failed to batch update jobs:", error.message);
      return 0;
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs(limit = 50) {
    try {
      return await this.safeQuery(
        "find",
        {},
        {
          sort: { created_at: -1 },
          limit: limit,
        }
      );
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
      const result = await this.safeQuery("deleteOne", { job_id: jobId });
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
      const result = await this.safeQuery(
        "updateMany",
        {
          job_id: jobId,
          status: "pending",
        },
        {
          update: {
            status: "cancelled",
            updated_at: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("❌ Failed to cancel job:", error.message);
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

      const result = await this.safeQuery("deleteOne", {
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

  /**
   * Reset failed jobs back to pending - NEW METHOD
   */
  async resetFailedJobs() {
    try {
      const result = await this.safeQuery(
        "updateMany",
        {
          status: "failed",
          scheduled_time: { $gte: new Date() }, // Hanya yang scheduled_time masih di masa depan
        },
        {
          update: {
            status: "pending",
            error_message: null,
            executed_at: null,
            updated_at: new Date(),
          },
        }
      );

      console.log(`✅ Reset ${result.modifiedCount} failed job(s) to pending`);
      return result.modifiedCount;
    } catch (error) {
      console.error("❌ Failed to reset jobs:", error.message);
      throw error;
    }
  }
}

module.exports = new JobService();
