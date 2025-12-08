// test-submit.js
const { submitToGoogleForm } = require("./services/puppeteerService");

async function testSubmit() {
  const testData = {
    tid: "190410",
    kondisiCamera: "Baik",
    kondisiNVR: "Merekam",
    nama: "John Doe",
    perusahaan: "PT Test Company",
    noPegawai: "EMP001",
  };

  console.log("🧪 Testing form submission...");
  const result = await submitToGoogleForm(testData);
  console.log("📊 Result:", JSON.stringify(result, null, 2));
}

testSubmit().catch(console.error);
