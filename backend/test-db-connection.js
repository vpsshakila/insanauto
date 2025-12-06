// test-db-connection.js
require("dotenv").config();
const database = require("./config/database");
const jobService = require("./services/jobService");

async function test() {
  console.log("🧪 Testing database connection and queries...\n");

  try {
    // 1. Test connection
    console.log("1. Connecting to database...");
    await database.connect();
    console.log("   ✅ Connected\n");

    // 2. Check status
    console.log("2. Database status:");
    const status = database.getStatus();
    console.log(`   - Ready state: ${status.readyState}`);
    console.log(`   - Is connected: ${status.isConnected}`);
    console.log(`   - Host: ${status.host}`);
    console.log(`   - Database: ${status.name}\n`);

    // 3. Test query
    console.log("3. Testing job service queries...");
    const stats = await jobService.getStats();
    console.log(`   ✅ Stats query successful`);
    console.log(`   - Database connected: ${stats.database_connected}`);
    console.log(`   - Total jobs: ${stats.total_count}`);
    console.log(`   - Pending jobs: ${stats.pending_count}\n`);

    // 4. Test pending jobs query
    console.log("4. Testing pending jobs query...");
    const pendingJobs = await jobService.getPendingJobs();
    console.log(`   ✅ Found ${pendingJobs.length} pending jobs\n`);

    if (pendingJobs.length > 0) {
      console.log("   List of pending jobs:");
      pendingJobs.forEach((job, i) => {
        console.log(
          `   ${i + 1}. ${job.job_id} - ${job.tid} - ${new Date(
            job.scheduled_time
          ).toISOString()}`
        );
      });
    }

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Check if MongoDB is running");
    console.error("   2. Check DB credentials in .env file");
    console.error("   3. Try connecting with MongoDB Compass");
  } finally {
    await database.close();
  }
}

test().catch(console.error);
