require("dotenv").config();
const { submitToGoogleForm } = require("./services/playwrightService");
const jobService = require("./services/jobService");
const database = require("./config/database");

async function testComplete() {
  console.log("🧪 Running complete system test...\n");

  // 1. Test database connection
  console.log("1. Testing database connection...");
  try {
    await database.connect();
    console.log("   ✅ Database connected\n");
  } catch (error) {
    console.log("   ❌ Database connection failed:", error.message);
    return;
  }

  // 2. Test job service
  console.log("2. Testing job service...");
  try {
    const stats = await jobService.getStats();
    console.log(`   ✅ Job service working`);
    console.log(`   📊 Total jobs: ${stats.total_count}`);
    console.log(`   📋 Pending jobs: ${stats.pending_count}\n`);
  } catch (error) {
    console.log("   ❌ Job service failed:", error.message);
  }

  // 3. Test direct submit
  console.log("3. Testing direct form submission...");
  try {
    const testData = {
      tid: "190410",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "Test User",
      perusahaan: "Test Company",
      noPegawai: "TEST001",
    };

    const result = await submitToGoogleForm(testData);
    console.log(
      `   ✅ Direct submit: ${result.success ? "SUCCESS" : "FAILED"}`
    );
    console.log(`   📝 Message: ${result.message}\n`);
  } catch (error) {
    console.log("   ❌ Direct submit failed:", error.message);
  }

  // 4. Test adding scheduled job
  console.log("4. Testing scheduled job addition...");
  try {
    const formData = {
      tid: "190410",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "Scheduled Test",
      perusahaan: "Test Company",
      noPegawai: "SCHED001",
    };

    // Schedule for 5 minutes from now
    const scheduledTime = new Date(Date.now() + 5 * 60000);

    const job = await jobService.addScheduledJob(formData, scheduledTime);
    console.log(`   ✅ Job added: ${job.job_id}`);
    console.log(
      `   ⏰ Scheduled for: ${new Date(job.scheduled_time).toISOString()}\n`
    );
  } catch (error) {
    console.log("   ❌ Add scheduled job failed:", error.message);
  }

  // 5. Test pending jobs query
  console.log("5. Testing pending jobs query...");
  try {
    const pendingJobs = await jobService.getPendingJobs();
    console.log(`   ✅ Found ${pendingJobs.length} pending jobs\n`);

    if (pendingJobs.length > 0) {
      console.log("   📋 Pending jobs list:");
      pendingJobs.forEach((job, index) => {
        console.log(
          `     ${index + 1}. ${job.job_id} - ${job.tid} - ${new Date(
            job.scheduled_time
          ).toISOString()}`
        );
      });
    }
  } catch (error) {
    console.log("   ❌ Pending jobs query failed:", error.message);
  }

  console.log("\n🎉 Complete system test finished!");
  console.log("💡 Next steps:");
  console.log("   - Start server: npm start");
  console.log("   - Check health: http://localhost:3000/api/health");
  console.log(
    "   - Trigger scheduler: POST http://localhost:3000/api/scheduler/trigger"
  );

  await database.close();
}

testComplete().catch(console.error);
