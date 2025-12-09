const puppeteer = require("puppeteer");
const path = require("path");

const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

async function keepSessionAlive() {
  console.log("🔄 Google Session Keep-Alive Service");
  console.log("=====================================");
  console.log(`📅 Started at: ${new Date().toLocaleString()}\n`);

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true, // Run in background
      executablePath: CHROMIUM_PATH,
      userDataDir: BROWSER_DATA_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--excludeSwitches=enable-automation",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    });

    const page = await browser.newPage();

    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
      window.chrome = {
        runtime: {},
      };
    });

    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Open Google homepage to keep session active
    await page.goto("https://www.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Keep-alive browser is running");
    console.log("🔄 Will refresh every 5 minutes to keep session active\n");

    // Refresh every 5 minutes to keep session alive
    setInterval(async () => {
      try {
        await page.reload({ waitUntil: "networkidle2" });
        console.log(
          `🔄 Session refreshed at: ${new Date().toLocaleTimeString()}`
        );
      } catch (error) {
        console.error(
          `⚠️  Refresh error at ${new Date().toLocaleTimeString()}:`,
          error.message
        );
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      if (browser) {
        await browser.close();
      }
      console.log("✅ Browser closed. Exiting.");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Keep process alive
    console.log("💡 Press Ctrl+C to stop the service\n");
  } catch (error) {
    console.error("❌ Fatal error in keep-alive service:", error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Start keep-alive service
keepSessionAlive().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
