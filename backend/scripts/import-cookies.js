const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");
const COOKIES_FILE = path.join(__dirname, "../google-cookies.json");
const CHROMIUM_PATH = "/usr/bin/chromium";

async function importCookies() {
  if (!fs.existsSync(COOKIES_FILE)) {
    console.error("❌ google-cookies.json not found!");
    process.exit(1);
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf8"));
  console.log(`🍪 Importing ${cookies.length} cookies...`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    userDataDir: BROWSER_DATA_DIR,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.goto("https://google.com");

  await page.setCookie(...cookies);
  console.log("✅ Cookies imported");

  // Verify
  await page.goto("https://drive.google.com", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const url = page.url();
  if (url.includes("accounts.google.com")) {
    console.log("❌ Import failed - still need login");
  } else {
    console.log("✅ Login successful!");
  }

  await browser.close();
}

importCookies().catch(console.error);
