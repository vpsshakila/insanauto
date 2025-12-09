const puppeteer = require("puppeteer");
const path = require("path");

const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

async function testSession() {
  console.log("🧪 Testing Google Session Validity");
  console.log("===================================\n");

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROMIUM_PATH,
      userDataDir: BROWSER_DATA_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    });

    const page = await browser.newPage();

    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    // Test 1: Google Drive
    console.log("📍 Testing Google Drive access...");
    await page.goto("https://drive.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (page.url().includes("accounts.google.com")) {
      console.log("❌ NOT logged in to Drive\n");
      await browser.close();
      return false;
    }
    console.log("✅ Google Drive: Logged in");

    // Test 2: Google Forms
    console.log("📍 Testing Google Forms access...");
    await page.goto("https://docs.google.com/forms", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (page.url().includes("accounts.google.com")) {
      console.log("❌ NOT logged in to Forms\n");
      await browser.close();
      return false;
    }
    console.log("✅ Google Forms: Logged in");

    // Success
    console.log("\n✅ Session is VALID and working!");
    console.log("🎉 You can now use the automation\n");

    await browser.close();
    return true;
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (browser) {
      await browser.close();
    }
    return false;
  }
}

// Run test
testSession()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
