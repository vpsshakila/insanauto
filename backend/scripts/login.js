const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

async function loginGoogle() {
  console.log("🔐 Google Login - Docker VNC Mode");
  console.log("==================================\n");

  // Ensure browser-data directory exists
  if (!fs.existsSync(BROWSER_DATA_DIR)) {
    fs.mkdirSync(BROWSER_DATA_DIR, { recursive: true });
    console.log("📁 Created browser-data directory");
  }

  let browser = null;

  try {
    console.log("🔧 Launching browser...");

    browser = await puppeteer.launch({
      headless: false, // MUST be false for VNC
      executablePath: CHROMIUM_PATH,
      userDataDir: BROWSER_DATA_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--excludeSwitches=enable-automation",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--start-maximized",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      defaultViewport: null,
    });

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    // Anti-detection scripts
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en", "id"],
      });

      // Add chrome object
      window.chrome = {
        runtime: {},
      };
    });

    // Set realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("✅ Browser launched in VNC display :99");
    console.log("\n📋 Instructions:");
    console.log("1. Connect VNC Viewer to: 192.168.1.20:5900");
    console.log("2. Password: vncpassword");
    console.log("3. You will see Chromium browser");
    console.log("4. Login to Google manually");
    console.log("5. Verify by opening Google Drive");
    console.log("6. ⌨️  PRESS Ctrl+C in THIS terminal when done\n");

    // Navigate to Google login
    await page.goto("https://accounts.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("🌐 Google login page opened in VNC");
    console.log("⏳ Waiting for you to complete login...\n");

    // Show reminder every 30 seconds
    await new Promise((resolve) => {
      const reminderInterval = setInterval(() => {
        console.log("⏰ REMINDER: Press Ctrl+C after you finish login in VNC!");
      }, 30000);

      // Wait for Ctrl+C signal
      process.on("SIGINT", () => {
        clearInterval(reminderInterval);
        console.log("\n\n🔍 Ctrl+C received! Verifying login status...");
        resolve();
      });
    });

    // Verify login by checking Drive access
    console.log("📍 Navigating to Google Drive to verify...");
    await page.goto("https://drive.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const currentUrl = page.url();

    if (currentUrl.includes("accounts.google.com")) {
      console.log("\n❌ Login failed - still on login page");
      console.log("Please complete the login process and try again\n");
      await browser.close();
      return false;
    }

    console.log("\n✅ Login successful!");
    console.log("📁 Session saved to:", BROWSER_DATA_DIR);

    // Save cookies as backup
    const cookies = await page.cookies();
    const cookiesFile = path.join(__dirname, "../google-cookies.json");
    fs.writeFileSync(cookiesFile, JSON.stringify(cookies, null, 2));
    console.log("🍪 Cookies backup saved to:", cookiesFile);

    console.log("\n✨ Next steps:");
    console.log("   1. docker-compose up -d session-keeper");
    console.log("   2. docker-compose exec backend npm run test-session\n");

    await browser.close();
    return true;
  } catch (error) {
    console.error("\n❌ Error during login:", error.message);
    if (browser) {
      await browser.close();
    }
    return false;
  }
}

// Run login
loginGoogle()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
