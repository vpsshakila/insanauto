/**
 * Puppeteer utility functions
 * Compatible with all Puppeteer versions
 */

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wait for page load with timeout
 * @param {Page} page - Puppeteer page
 * @param {number} timeout - Timeout in ms
 */
async function waitForPageLoad(page, timeout = 30000) {
  try {
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout,
    });
  } catch (e) {
    // Timeout is ok, page might be loaded
  }
}

/**
 * Safe click with retry
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @param {number} retries - Number of retries
 */
async function safeClick(page, selector, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await wait(1000);
    }
  }
  return false;
}

/**
 * Safe type with retry
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @param {string} text - Text to type
 * @param {number} retries - Number of retries
 */
async function safeType(page, selector, text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector, { clickCount: 3 }); // Select all
      await page.type(selector, text);
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await wait(1000);
    }
  }
  return false;
}

/**
 * Check if logged in to Google
 * @param {Page} page - Puppeteer page
 */
async function isLoggedInToGoogle(page) {
  try {
    await page.goto("https://myaccount.google.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(2000);

    const url = page.url();
    return !url.includes("accounts.google.com");
  } catch (e) {
    return false;
  }
}

/**
 * Take screenshot with timestamp
 * @param {Page} page - Puppeteer page
 * @param {string} name - Screenshot name
 * @param {string} dir - Directory path
 */
async function takeScreenshot(page, name, dir = "./debug-screenshots") {
  const fs = require("fs");
  const path = require("path");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);

  return filepath;
}

/**
 * Get Puppeteer version info
 */
function getPuppeteerVersion() {
  try {
    const packageJson = require("puppeteer/package.json");
    return packageJson.version;
  } catch (e) {
    return "unknown";
  }
}

/**
 * Check if selector exists
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 */
async function selectorExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  wait,
  waitForPageLoad,
  safeClick,
  safeType,
  isLoggedInToGoogle,
  takeScreenshot,
  getPuppeteerVersion,
  selectorExists,
};
