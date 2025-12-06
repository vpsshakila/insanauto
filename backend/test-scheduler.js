const { chromium } = require("playwright");

async function testDirectSubmit() {
  console.log("🧪 Testing direct submit without scheduler...");

  // Data contoh dari jobs yang ada
  const testJobs = [
    {
      job_id: "job_1765008792668_prwch1hq5",
      tid: "190410",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "John Doe",
      perusahaan: "PT Test Company",
      noPegawai: "EMP001",
    },
  ];

  for (const job of testJobs) {
    console.log(`\n🔄 Processing: ${job.job_id}`);

    try {
      const { submitToGoogleForm } = require("./services/playwrightService");
      const result = await submitToGoogleForm(job);
      console.log(`📊 Result: ${result.success ? "✅ Success" : "❌ Failed"}`);
      console.log(`Message: ${result.message}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }

    // Delay antara jobs
    if (testJobs.indexOf(job) < testJobs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

// Test koneksi database dulu
async function main() {
  try {
    const database = require("./config/database");
    await database.connect();
    console.log("✅ Database connected");

    await testDirectSubmit();
  } catch (error) {
    console.error("❌ Main error:", error.message);
  }
}

main();
