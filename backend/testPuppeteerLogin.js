require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const {
  wait,
  isLoggedInToGoogle,
  takeScreenshot,
} = require("./puppeteerUtils");

async function testLogin() {
  const userDataDir = path.join(__dirname, "browser-data");
  const screenshotsDir = path.join(__dirname, "debug-screenshots");

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log("🧪 Testing Puppeteer Login Status\n");
  console.log("=".repeat(60));

  if (!fs.existsSync(userDataDir)) {
    console.log("❌ browser-data not found!");
    console.log("Please run: node loginPuppeteer.js first");
    return;
  }

  try {
    console.log("\n1️⃣  Launching browser...");

    const browser = await puppeteer.launch({
      headless: "new", // Headless mode
      userDataDir: userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // Test 1: Check Google account
    console.log("\n2️⃣  Checking Google account...");
    const isLoggedInGoogle = await isLoggedInToGoogle(page);

    if (isLoggedInGoogle) {
      console.log("   ✅ Logged in to Google!");
      await takeScreenshot(page, "google-account", screenshotsDir);
    } else {
      console.log("   ❌ NOT logged in to Google");
      await takeScreenshot(page, "google-login-page", screenshotsDir);
    }

    // Test 2: Check Google Form access
    if (isLoggedInGoogle) {
      console.log("\n3️⃣  Testing Google Form access...");

      const formUrl =
        process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8";
      await page.goto(formUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await wait(3000);

      const formPageUrl = page.url();
      const isOnForm = !formPageUrl.includes("accounts.google.com");

      if (isOnForm) {
        console.log("   ✅ Form accessible!");

        // Check for form elements
        const textInputs = await page.$$('input[type="text"]');
        const radioButtons = await page.$$('div[role="radio"]');

        console.log(`   📋 Found ${textInputs.length} text inputs`);
        console.log(`   📋 Found ${radioButtons.length} radio buttons`);

        if (textInputs.length > 0) {
          console.log("   ✅ Form fields detected!");
        } else {
          console.log("   ⚠️  Form fields not detected (may need more wait)");
        }

        await takeScreenshot(page, "form-loaded", screenshotsDir);
      } else {
        console.log("   ❌ Redirected to login when accessing form");
        console.log("   This might be due to form permissions");

        await takeScreenshot(page, "form-login-required", screenshotsDir);
      }
    }

    await browser.close();

    console.log("\n" + "=".repeat(60));
    console.log("TEST RESULTS:");
    console.log("=".repeat(60));

    if (isLoggedInGoogle) {
      console.log("\n✅ LOGIN SUCCESSFUL!");
      console.log("\nYour Puppeteer setup is ready!");
      console.log("You can now start the server: npm start");
    } else {
      console.log("\n❌ LOGIN FAILED!");
      console.log("\nPlease run: node loginPuppeteer.js");
      console.log("And make sure to:");
      console.log("1. Login to Google in the browser");
      console.log("2. Submit the form once");
      console.log("3. Close the browser");
    }

    console.log("\n📁 Check debug-screenshots/ folder for visual confirmation");
    console.log("");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nPlease try running: node loginPuppeteer.js");
  }
}

testLogin().catch(console.error);
