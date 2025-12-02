// services/database.js
const mongoose = require("mongoose");
require("dotenv").config();

// Job Schema
const jobSchema = new mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tid: {
      type: String,
      required: true,
    },
    kondisi_camera: {
      type: String,
      required: true,
      enum: ["Baik", "Problem"],
    },
    kondisi_nvr: {
      type: String,
      required: true,
      enum: ["Merekam", "Problem"],
    },
    nama: {
      type: String,
      required: true,
    },
    perusahaan: {
      type: String,
      required: true,
    },
    no_pegawai: {
      type: String,
      required: true,
    },
    scheduled_time: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    executed_at: {
      type: Date,
      default: null,
    },
    error_message: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Model
const Job = mongoose.model("Job", jobSchema);

class DatabaseService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;

    // Build MongoDB URI
    const DB_USER = process.env.DB_USER || "admin";
    const DB_PASSWORD = process.env.DB_PASSWORD || "secret";
    const DB_HOST = process.env.DB_HOST || "localhost";
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_NAME = process.env.DB_NAME || "form_scheduler";

    // MongoDB URI dengan authentication
    this.mongoURI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
  }

  /**
   * Initialize MongoDB connection
   */
  async initializeDatabase() {
    if (this.isInitialized) {
      console.log("⚠️  Database already initialized");
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    await this.initPromise;
    this.isInitialized = true;
  }

  async _initialize() {
    try {
      console.log("🔌 Connecting to MongoDB...");
      console.log(
        `   Host: ${process.env.DB_HOST || "localhost"}:${
          process.env.DB_PORT || 27017
        }`
      );
      console.log(`   Database: ${process.env.DB_NAME || "form_scheduler"}`);
      console.log(`   User: ${process.env.DB_USER || "admin"}`);

      // Connect dengan Mongoose
      await mongoose.connect(this.mongoURI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      console.log("✅ Connected to MongoDB");

      // Setup event listeners
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });

      console.log("✅ MongoDB database initialized");
    } catch (error) {
      console.error("❌ MongoDB initialization failed:");
      console.error("   Error:", error.message);

      if (error.name === "MongoServerSelectionError") {
        console.error("   → MongoDB server is not reachable");
        console.error("   → Check if MongoDB is running on Proxmox LXC");
        console.error("   → Check DB_HOST and DB_PORT in .env");
      } else if (error.name === "MongoAuthenticationError") {
        console.error("   → Authentication failed");
        console.error("   → Check DB_USER and DB_PASSWORD in .env");
      }

      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeDatabase();
    }
  }

  /**
   * Tambah job baru ke database
   */
  async addScheduledJob(formData, scheduledTime) {
    await this.ensureInitialized();

    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const scheduleDate = new Date(scheduledTime);

    // Validasi waktu
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

      console.log(`✅ Job added to database: ${jobId}`);
      console.log(`   ⏰ Scheduled for: ${scheduleDate.toISOString()}`);

      return job.toObject();
    } catch (error) {
      console.error("❌ Failed to add job:", error.message);
      throw error;
    }
  }

  /**
   * Ambil job berdasarkan ID
   */
  async getJobById(jobId) {
    await this.ensureInitialized();

    try {
      const job = await Job.findOne({ job_id: jobId });
      return job ? job.toObject() : null;
    } catch (error) {
      console.error("❌ Failed to get job:", error.message);
      throw error;
    }
  }

  /**
   * Ambil semua pending jobs yang waktunya sudah tiba
   */
  async getPendingJobs() {
    await this.ensureInitialized();

    try {
      const jobs = await Job.find({
        status: "pending",
        scheduled_time: { $lte: new Date() },
      })
        .sort({ scheduled_time: 1 })
        .lean(); // lean() untuk performa lebih baik

      return jobs;
    } catch (error) {
      console.error("❌ Failed to get pending jobs:", error.message);
      return [];
    }
  }

  /**
   * Update status job setelah execution
   */
  async updateJobStatus(jobId, status, errorMessage = null) {
    await this.ensureInitialized();

    try {
      const job = await Job.findOneAndUpdate(
        { job_id: jobId },
        {
          status: status,
          executed_at: new Date(),
          error_message: errorMessage,
        },
        { new: true } // Return updated document
      );

      if (job) {
        console.log(`   📝 Job ${jobId} status updated: ${status}`);
      }

      return job ? job.toObject() : null;
    } catch (error) {
      console.error("❌ Failed to update job status:", error.message);
      throw error;
    }
  }

  /**
   * Ambil semua jobs (untuk list di frontend)
   */
  async getAllJobs(limit = 50) {
    await this.ensureInitialized();

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
   * Hapus job berdasarkan ID
   */
  async deleteJob(jobId) {
    await this.ensureInitialized();

    try {
      const result = await Job.deleteOne({ job_id: jobId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("❌ Failed to delete job:", error.message);
      throw error;
    }
  }

  /**
   * Cancel job yang masih pending
   */
  async cancelJob(jobId) {
    await this.ensureInitialized();

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
    await this.ensureInitialized();

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
   * Cleanup old jobs (older than X days)
   */
  async cleanupOldJobs(daysOld = 30) {
    await this.ensureInitialized();

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

  /**
   * Close database connection
   */
  async close() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed");
    }
  }
}

module.exports = new DatabaseService();
