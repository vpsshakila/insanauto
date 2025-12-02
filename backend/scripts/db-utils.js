// scripts/db-utils.js
const mongoose = require("mongoose");
require("dotenv").config();

// Build MongoDB URI
const DB_USER = process.env.DB_USER || "admin";
const DB_PASSWORD = process.env.DB_PASSWORD || "secret";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || "form_scheduler";

const mongoURI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

// Job Schema (copy dari database.js)
const jobSchema = new mongoose.Schema(
  {
    job_id: { type: String, required: true, unique: true, index: true },
    tid: { type: String, required: true },
    kondisi_camera: { type: String, required: true, enum: ["Baik", "Problem"] },
    kondisi_nvr: { type: String, required: true, enum: ["Merekam", "Problem"] },
    nama: { type: String, required: true },
    perusahaan: { type: String, required: true },
    no_pegawai: { type: String, required: true },
    scheduled_time: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    executed_at: { type: Date, default: null },
    error_message: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Job = mongoose.model("Job", jobSchema);

/**
 * Connect to MongoDB
 */
async function connect() {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect:", error.message);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await connect();

    // Test query
    const count = await Job.countDocuments();

    console.log("✅ MongoDB connection successful!");
    console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Total jobs: ${count}`);

    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Check if MongoDB is running on Proxmox");
    console.error("   2. Verify credentials in .env");
    console.error("   3. Test network connectivity to MongoDB server");
    return false;
  }
}

/**
 * Reset database (DROP collection)
 */
async function resetDatabase() {
  try {
    await connect();

    await Job.collection.drop().catch(() => {
      console.log("   Collection doesn't exist yet");
    });

    console.log("🗑️  Collection dropped");

    // Recreate indexes
    await Job.createIndexes();
    console.log("✅ Indexes recreated");
    console.log("✅ Database reset successful!");
  } catch (error) {
    console.error("❌ Database reset failed:", error.message);
  }
}

/**
 * Show all jobs
 */
async function showAllJobs() {
  try {
    await connect();

    const jobs = await Job.find({}).sort({ created_at: -1 }).lean();

    console.log("\n📊 All Jobs:");

    if (jobs.length === 0) {
      console.log("   No jobs found");
      return;
    }

    jobs.forEach((job) => {
      console.log("\n" + "=".repeat(60));
      console.log(`Job ID:     ${job.job_id}`);
      console.log(`TID:        ${job.tid}`);
      console.log(`Nama:       ${job.nama}`);
      console.log(`Perusahaan: ${job.perusahaan}`);
      console.log(`Status:     ${job.status}`);
      console.log(`Scheduled:  ${job.scheduled_time.toLocaleString("id-ID")}`);
      console.log(`Created:    ${job.created_at.toLocaleString("id-ID")}`);
      if (job.executed_at) {
        console.log(`Executed:   ${job.executed_at.toLocaleString("id-ID")}`);
      }
      if (job.error_message) {
        console.log(`Error:      ${job.error_message}`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log(`Total: ${jobs.length} job(s)`);
  } catch (error) {
    console.error("❌ Failed to fetch jobs:", error.message);
  }
}

/**
 * Show statistics
 */
async function showStats() {
  try {
    await connect();

    const stats = await Job.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    console.log("\n📈 Statistics:");
    console.log("=".repeat(60));
    console.log(`Pending:    ${result.pending}`);
    console.log(`Processing: ${result.processing}`);
    console.log(`Completed:  ${result.completed}`);
    console.log(`Failed:     ${result.failed}`);
    console.log(`Cancelled:  ${result.cancelled}`);
    console.log("=".repeat(60));
    console.log(`Total:      ${result.total}`);
  } catch (error) {
    console.error("❌ Failed to fetch stats:", error.message);
  }
}

/**
 * Cleanup old jobs (older than 30 days)
 */
async function cleanupOldJobs() {
  try {
    await connect();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Job.deleteMany({
      created_at: { $lt: cutoffDate },
      status: { $in: ["completed", "failed", "cancelled"] },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} old job(s)`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  }
}

/**
 * Show indexes
 */
async function showIndexes() {
  try {
    await connect();

    const indexes = await Job.collection.indexes();

    console.log("\n📑 Collection Indexes:");
    console.log("=".repeat(60));
    indexes.forEach((index) => {
      console.log(`\nName: ${index.name}`);
      console.log(`Keys: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log("Unique: true");
    });
  } catch (error) {
    console.error("❌ Failed to fetch indexes:", error.message);
  }
}

/**
 * Add sample job (for testing)
 */
async function addSampleJob() {
  try {
    await connect();

    const job = new Job({
      job_id: `job_sample_${Date.now()}`,
      tid: "190410",
      kondisi_camera: "Baik",
      kondisi_nvr: "Merekam",
      nama: "Test User",
      perusahaan: "Test Company",
      no_pegawai: "12345",
      scheduled_time: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    });

    await job.save();

    console.log("✅ Sample job added successfully!");
    console.log(`   Job ID:    ${job.job_id}`);
    console.log(`   TID:       ${job.tid}`);
    console.log(`   Scheduled: ${job.scheduled_time.toLocaleString("id-ID")}`);
  } catch (error) {
    console.error("❌ Failed to add sample job:", error.message);
  }
}

/**
 * Show pending jobs
 */
async function showPendingJobs() {
  try {
    await connect();

    const jobs = await Job.find({
      status: "pending",
      scheduled_time: { $lte: new Date() },
    })
      .sort({ scheduled_time: 1 })
      .lean();

    console.log("\n⏰ Pending Jobs (Ready to Execute):");

    if (jobs.length === 0) {
      console.log("   No pending jobs ready to execute");
      return;
    }

    jobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.job_id}`);
      console.log(`   TID:       ${job.tid}`);
      console.log(`   Nama:      ${job.nama}`);
      console.log(
        `   Scheduled: ${job.scheduled_time.toLocaleString("id-ID")}`
      );
    });

    console.log(`\nTotal: ${jobs.length} job(s) ready to execute`);
  } catch (error) {
    console.error("❌ Failed to fetch pending jobs:", error.message);
  }
}

// CLI Menu
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🗄️  MongoDB Utility Tool (Mongoose)\n");

  try {
    switch (command) {
      case "test":
        await testConnection();
        break;
      case "reset":
        console.log("⚠️  WARNING: This will delete all data!");
        await resetDatabase();
        break;
      case "show":
        await showAllJobs();
        break;
      case "stats":
        await showStats();
        break;
      case "cleanup":
        await cleanupOldJobs();
        break;
      case "indexes":
        await showIndexes();
        break;
      case "sample":
        await addSampleJob();
        break;
      case "pending":
        await showPendingJobs();
        break;
      default:
        console.log("Available commands:");
        console.log(
          "  node scripts/db-utils.js test     - Test MongoDB connection"
        );
        console.log(
          "  node scripts/db-utils.js reset    - Reset database (delete all data)"
        );
        console.log("  node scripts/db-utils.js show     - Show all jobs");
        console.log(
          "  node scripts/db-utils.js pending  - Show pending jobs ready to execute"
        );
        console.log("  node scripts/db-utils.js stats    - Show statistics");
        console.log(
          "  node scripts/db-utils.js cleanup  - Cleanup old jobs (30+ days)"
        );
        console.log(
          "  node scripts/db-utils.js indexes  - Show collection indexes"
        );
        console.log(
          "  node scripts/db-utils.js sample   - Add sample job for testing"
        );
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();
