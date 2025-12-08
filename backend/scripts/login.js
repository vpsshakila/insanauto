// scripts/login.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

async function loginGoogle() {
  console.log("🔐 Google Login - Docker VNC Mode");
  console.log("===================================\n");

  // Ensure browser-data directory exists
  if (!fs.existsSync(BROWSER_DATA_DIR)) {
    fs.mkdirSync(BROWSER_DATA_DIR, { recursive: true });
  }

  let browser = null;

  try {
    console.log("🔧 Launching browser...");
    console.log("📺 Browser will open in VNC display :99");
    console.log("🌐 Connect VNC to: <server-ip>:5900\n");

    browser = await puppeteer.launch({
      headless: false, // Must be false to see in VNC
      executablePath: CHROMIUM_PATH,
      userDataDir: BROWSER_DATA_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: null,
    });

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    console.log("✅ Browser launched in VNC display");
    console.log("\n📋 Instructions:");
    console.log("1. Connect to VNC: <server-ip>:5900");
    console.log("2. You'll see Chromium browser in VNC");
    console.log("3. Login to Google manually in the browser");
    console.log("4. After login success, return here and press Ctrl+C");
    console.log("5. Session will be saved automatically\n");

    // Go to Google
    await page.goto("https://accounts.google.com", {
      waitUntil: "networkidle2",
    });

    console.log("🌐 Google login page opened in VNC");
    console.log("⏳ Waiting for you to login...");
    console.log("   (Browser is running in VNC display :99)\n");

    // Keep browser open - user will press Ctrl+C when done
    await new Promise((resolve) => {
      process.on("SIGINT", () => {
        console.log("\n\n🔍 Verifying login...");
        resolve();
      });
    });

    // Verify login
    await page.goto("https://drive.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const currentUrl = page.url();

    if (currentUrl.includes("accounts.google.com")) {
      console.log("❌ Login failed - still on login page");
      console.log("Please try again and make sure you complete the login");
      return false;
    }

    console.log("✅ Login successful!");
    console.log("📁 Session saved to:", BROWSER_DATA_DIR);
    console.log("\n✨ You can now use the automation");
    console.log("   Session will persist across container restarts\n");

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run
loginGoogle()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
