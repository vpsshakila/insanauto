// services/puppeteerService.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LOGS_DIR = path.join(__dirname, "../logs");
const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");

// Docker/Linux specific Chromium path
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "/usr/bin/chromium" ||
  "/usr/bin/chromium-browser";

async function submitToGoogleForm(formData) {
  // Ensure directories exist
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  if (!fs.existsSync(BROWSER_DATA_DIR)) {
    fs.mkdirSync(BROWSER_DATA_DIR, { recursive: true });
  }

  const config = {
    GOOGLE_FORM_URL:
      process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8",
    HEADLESS: process.env.HEADLESS !== "false",
  };

  console.log("🚀 Memulai submission...");
  console.log(`📋 TID: ${formData.tid} | ${formData.nama}`);

  let browser = null;

  try {
    // Launch browser with Docker-compatible settings
    browser = await puppeteer.launch({
      headless: config.HEADLESS ? "new" : false,
      executablePath: CHROMIUM_PATH,
      userDataDir: BROWSER_DATA_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      defaultViewport: null,
    });

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    // Buka Google Form
    await page.goto(config.GOOGLE_FORM_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await wait(2000);

    // Check login
    const currentUrl = page.url();
    if (currentUrl.includes("accounts.google.com")) {
      throw new Error(
        "Not logged in - Run: docker-compose exec backend node scripts/login.js"
      );
    }

    console.log("✅ Form loaded");
    const mainFormUrl = page.url();

    // Fill form fields
    await fillFormFields(page, formData);

    // Upload Camera
    await uploadPhotoFromDrive(
      page,
      browser,
      mainFormUrl,
      "Camera",
      formData.tid
    );
    await cleanupAfterUpload(page, browser, mainFormUrl);

    // Upload NVR
    await uploadPhotoFromDrive(page, browser, mainFormUrl, "NVR", formData.tid);
    await cleanupAfterUpload(page, browser, mainFormUrl);

    // Fill remaining fields
    await fillRemainingFields(page, formData);

    // Submit
    await submitForm(page);

    // Verify success
    const success = await verifySubmissionSuccess(page);

    if (success) {
      console.log("🎉 Form berhasil disubmit!");
      return {
        success: true,
        message: "Form submitted successfully",
        timestamp: new Date().toISOString(),
        data: formData,
      };
    } else {
      throw new Error("Form submission failed - no confirmation detected");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    // Screenshot on error
    try {
      if (browser) {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const screenshotPath = path.join(
            LOGS_DIR,
            `error-${formData.tid}-${timestamp}.png`
          );
          await pages[0].screenshot({ path: screenshotPath, fullPage: true });
          console.log("📸 Error screenshot:", screenshotPath);
        }
      }
    } catch (e) {
      // Ignore screenshot errors
    }

    return {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      data: formData,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ... (keep all other functions from clean_puppeteer artifact unchanged)
// fillFormFields, fillRemainingFields, submitForm, verifySubmissionSuccess,
// uploadPhotoFromDrive, navigateToFolder, cleanupAfterUpload

module.exports = { submitToGoogleForm };
