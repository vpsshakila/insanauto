require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function loginPuppeteer() {
  const userDataDir = path.join(__dirname, "browser-data");

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  console.log("🔐 Puppeteer One-Time Login\n");
  console.log("=".repeat(60));
  console.log("\n📁 Profile location:", userDataDir);
  console.log("\n");
  console.log("INSTRUCTIONS:");
  console.log("=".repeat(60));
  console.log("1. Browser will open (visible)");
  console.log("2. Login to your Google account");
  console.log("3. Navigate to the Google Form");
  console.log("4. Fill and submit the form ONCE (to test)");
  console.log("5. After successful submit, close the browser");
  console.log("6. Session will be saved automatically");
  console.log("=".repeat(60));
  console.log("\n");

  try {
    console.log("🚀 Launching browser...");

    const browser = await puppeteer.launch({
      headless: false, // Show browser
      userDataDir: userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: null,
    });

    console.log("✅ Browser opened!");

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    const formUrl =
      process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8";

    console.log(`🌐 Navigating to: ${formUrl}`);
    await page.goto(formUrl);

    console.log("\n");
    console.log("👉 Now login to Google in the browser window");
    console.log("👉 Fill and submit the form once");
    console.log("👉 Then close the browser");
    console.log("\n");
    console.log("⏳ Waiting for you to close the browser...");
    console.log("   (This script will exit when you close the browser)");
    console.log("\n");

    // Wait for browser to be closed by user
    await new Promise((resolve) => {
      browser.on("disconnected", () => {
        resolve();
      });
    });

    console.log("\n✅ Browser closed!");
    console.log("✅ Login session saved!");
    console.log("\n");
    console.log("=".repeat(60));
    console.log("NEXT STEPS:");
    console.log("=".repeat(60));
    console.log("1. Test if login persisted:");
    console.log("   node testPuppeteerLogin.js");
    console.log("\n2. If test successful, start your server:");
    console.log("   npm start");
    console.log("\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nPlease try again.");
  }
}

loginPuppeteer().catch(console.error);
