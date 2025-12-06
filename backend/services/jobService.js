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
            // Aggregate tidak support maxTimeMS(), gunakan timeout di level connection
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

        // Jika timeout, throw error untuk handling di level atas
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
   * Get statistics - fixed version
   */
  async getStats() {
    try {
      // Cek koneksi dulu
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

      // Method 1: Aggregate (tanpa maxTimeMS)
      const stats = await this.safeQuery("aggregate", [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Method 2: Fallback menggunakan countDocuments jika aggregate error
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

      // Fallback ke method yang lebih sederhana
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
   * Get pending jobs
   */
  async getPendingJobs() {
    try {
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 120000); // 2 menit ke depan

      console.log(`\n[${now.toISOString()}] 🔍 Querying pending jobs...`);
      console.log(`   Query range: <= ${bufferTime.toISOString()}`);

      // Cek dulu apakah database connected
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
          const diffSeconds = (scheduled - now) / 1000;
          const timeText =
            diffSeconds < 0
              ? `${Math.abs(diffSeconds).toFixed(0)}s ago`
              : `${diffSeconds.toFixed(0)}s from now`;
          console.log(
            `   ${index + 1}. ${job.job_id} (${
              job.tid
            }) - ${scheduled.toISOString()} (${timeText})`
          );
        });
      } else {
        console.log("   ℹ️  No pending jobs found");
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
   * Batch update jobs to processing status
   */
  async batchUpdateToProcessing(jobIds) {
    try {
      const result = await this.safeQuery(
        "updateMany",
        {
          job_id: { $in: jobIds },
          status: "pending",
        },
        {
          update: {
            status: "processing",
            updated_at: new Date(),
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
   * Get statistics
   */
  async getStats() {
    try {
      // Cek koneksi dulu
      if (!database.isConnected()) {
        return {
          pending_count: 0,
          processing_count: 0,
          completed_count: 0,
          failed_count: 0,
          cancelled_count: 0,
          total_count: 0,
          database_connected: false,
          error: "Database not connected",
        };
      }

      const stats = await this.safeQuery("aggregate", [
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
        database_connected: true,
        timestamp: new Date().toISOString(),
      };

      if (stats && Array.isArray(stats)) {
        stats.forEach((stat) => {
          const key = `${stat._id}_count`;
          if (result.hasOwnProperty(key)) {
            result[key] = stat.count;
          }
          result.total_count += stat.count;
        });
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to get stats:", error.message);
      return {
        pending_count: 0,
        processing_count: 0,
        completed_count: 0,
        failed_count: 0,
        cancelled_count: 0,
        total_count: 0,
        database_connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
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
}

module.exports = new JobService();
