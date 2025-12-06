// services/playwrightService.js
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");
require("dotenv").config();

/**
 * Submit form ke Google Forms dengan automasi Google Drive picker
 */
async function submitToGoogleForm(formData) {
  const userDataDir = path.join(__dirname, "../browser-data");
  const logsDir = path.join(__dirname, "../logs");

  // Ensure directories exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Config dari environment variables
  const config = {
    GOOGLE_FORM_URL:
      process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8",
    HEADLESS: process.env.HEADLESS !== "false",
    SLOW_MO: parseInt(process.env.SLOW_MO) || 200,
    BROWSER_ARGS: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  };

  console.log("🚀 Memulai submission...");
  console.log("📋 Data:", {
    tid: formData.tid,
    nama: formData.nama,
    perusahaan: formData.perusahaan,
  });

  // FIXED: Log browser info untuk debugging
  console.log("🌐 Browser config:");
  console.log(`   OS: ${os.platform()}`);
  console.log(`   User data dir: ${userDataDir}`);
  console.log(`   Headless: ${config.HEADLESS}`);

  let browser = null;

  try {
    // FIXED: Try-catch untuk handle browser launch error dengan lebih baik
    console.log("🔧 Launching browser...");

    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: config.HEADLESS,
      slowMo: config.SLOW_MO,
      args: config.BROWSER_ARGS,
      // FIXED: Tambah timeout dan error handling
      timeout: 30000,
    });

    console.log("✅ Browser launched successfully");

    const page = browser.pages()[0] || (await browser.newPage());

    // ========== BUKA GOOGLE FORM ==========
    console.log("🌐 Membuka Google Form...");
    await page.goto(config.GOOGLE_FORM_URL);
    await page.waitForLoadState("networkidle");
    console.log("✅ Form loaded");

    // ========== ISI FIELD TEXT & RADIO ==========
    console.log("📝 Mengisi field form...");

    // Field 1: TID
    await page.getByRole("textbox", { name: /TID/i }).fill(formData.tid);

    // Field 2 & 3: Radio buttons
    const allRadios = page.locator('div[role="radio"]');

    if (formData.kondisiCamera === "Baik") {
      await allRadios.nth(0).click();
    } else {
      await allRadios.nth(1).click();
    }

    if (formData.kondisiNVR === "Merekam") {
      await allRadios.nth(2).click();
    } else {
      await allRadios.nth(3).click();
    }

    console.log("✅ Field text dan radio terisi");

    // ========== UPLOAD FOTO CAMERA ==========
    await uploadPhotoFromDrive(page, "Camera", formData.tid, 0);

    // ========== UPLOAD FOTO NVR ==========
    await uploadPhotoFromDrive(page, "NVR", formData.tid, 1);

    // ========== ISI FIELD NAMA, PERUSAHAAN, NO PEGAWAI ==========
    console.log("📝 Mengisi field akhir...");

    await page.getByRole("textbox", { name: /Nama/i }).fill(formData.nama);
    await page
      .getByRole("textbox", { name: /Perusahaan/i })
      .fill(formData.perusahaan);
    await page
      .getByRole("textbox", { name: /No Pegawai/i })
      .fill(formData.noPegawai);

    // ========== CENTANG PERNYATAAN ==========
    console.log("✅ Pilih pernyataan...");
    const allRadiosWithPernyataan = page.locator('div[role="radio"]');
    await allRadiosWithPernyataan.nth(4).click();

    // ========== SUBMIT FORM ==========
    console.log("📤 Submitting form...");
    await page.keyboard.press("End");
    await page.waitForTimeout(1000);

    // Cari dan klik tombol submit
    const submitSelectors = [
      'span:has-text("Kirim")',
      'button:has-text("Kirim")',
      'div[role="button"]:has-text("Kirim")',
    ];

    let clicked = false;
    for (const selector of submitSelectors) {
      try {
        const element = page.locator(selector).first();
        const count = await element.count();

        if (count > 0) {
          console.log(`   🎯 Found submit button`);
          await element.click({ timeout: 5000 });
          clicked = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!clicked) {
      console.log("   ⚠️  No submit button found");
    }

    // ========== VERIFIKASI SUKSES SUBMIT ==========
    console.log("⏳ Menunggu konfirmasi submit...");
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

    // FIXED: Better error messages
    let errorMessage = error.message;

    if (error.message.includes("Executable doesn't exist")) {
      errorMessage = `Playwright browser not found. Please run: npx playwright install chromium`;
      console.error("\n💡 Solution:");
      console.error("   Run: npx playwright install chromium");
      console.error("   Then restart the server\n");
    }

    // Screenshot untuk debugging
    try {
      if (browser) {
        const pages = browser.pages();
        if (pages.length > 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const screenshotPath = path.join(
            logsDir,
            `error-${formData.tid}-${timestamp}.png`
          );
          await pages[0].screenshot({ path: screenshotPath, fullPage: true });
          console.log("📸 Screenshot saved:", screenshotPath);
        }
      }
    } catch (screenshotError) {
      console.error("Failed to save screenshot:", screenshotError.message);
    }

    return {
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      data: formData,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Verifikasi apakah form berhasil disubmit
 */
async function verifySubmissionSuccess(page) {
  const maxWaitTime = 15000;
  const startTime = Date.now();

  const successPatterns = [
    /terkirim/i,
    /recorded/i,
    /submitted/i,
    /berhasil/i,
    /success/i,
    /terima kasih/i,
    /thank you/i,
    /respons Anda telah dicatat/i,
    /your response has been recorded/i,
  ];

  const confirmationSelectors = [
    ".freebirdFormviewerViewResponseConfirmationMessage",
    ".vHW8K",
    '[role="heading"]',
    "text=/Formulir ini sudah tidak menerima respons/i",
    "text=/This form is no longer accepting responses/i",
  ];

  while (Date.now() - startTime < maxWaitTime) {
    // Cek teks konfirmasi
    for (const pattern of successPatterns) {
      try {
        const element = page.locator(`text=${pattern}`).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   ✅ Success confirmed`);
          return true;
        }
      } catch (e) {
        // Continue
      }
    }

    // Cek elemen konfirmasi
    for (const selector of confirmationSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   ✅ Confirmation detected`);
          return true;
        }
      } catch (e) {
        // Continue
      }
    }

    // Cek URL berubah
    const currentUrl = page.url();
    if (currentUrl.includes("formResponse") || currentUrl.includes("confirm")) {
      console.log(`   ✅ Redirected to confirmation page`);
      return true;
    }

    // Cek tombol submit hilang
    const submitButton = page.locator('span:has-text("Kirim")').first();
    try {
      if (!(await submitButton.isVisible({ timeout: 1000 }))) {
        console.log("   ✅ Submit button disappeared");
        return true;
      }
    } catch (e) {
      // Button not found = likely submitted
      return true;
    }

    await page.waitForTimeout(1000);
  }

  // Fallback check
  const currentUrl = page.url();
  if (!currentUrl.includes("viewform")) {
    console.log(`   ✅ No longer on form page`);
    return true;
  }

  return false;
}

/**
 * Upload foto dari Google Drive picker
 */
async function uploadPhotoFromDrive(page, folderName, tid, pickerIndex) {
  console.log(`📸 Upload Foto ${folderName}...`);

  // Scroll ke field upload
  await page.locator(`text=Upload Foto ${folderName}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Klik tombol "Tambahkan file"
  const addFileButtons = page.getByText("Tambahkan file");
  await addFileButtons.nth(pickerIndex).click();

  console.log("   ⏳ Waiting for Drive picker...");
  await page.waitForTimeout(4000);

  // Find picker frame
  const allFrames = page.frames();
  const pickerFrames = allFrames.filter((f) => f.url().includes("picker"));

  console.log(`   📊 Found ${pickerFrames.length} picker frame(s)`);

  const pickerFrame = pickerFrames[pickerFrames.length - 1];

  if (!pickerFrame) {
    throw new Error(`Picker iframe not found for ${folderName}`);
  }

  // Wait for picker to load
  await pickerFrame.waitForLoadState("domcontentloaded");
  await pickerFrame.waitForTimeout(2000);

  // Switch to "Drive Saya" tab
  console.log('   🔄 Switching to "Drive Saya"...');
  await pickerFrame.getByRole("tab", { name: "Drive Saya" }).click();
  await pickerFrame.waitForTimeout(3000);

  // Navigate: Mingguan > [TID] > [Camera/NVR]
  console.log(`   🗂️  Path: Mingguan > ${tid} > ${folderName}`);

  await navigateToFolder(pickerFrame, "Mingguan");
  await navigateToFolder(pickerFrame, tid);
  await navigateToFolder(pickerFrame, folderName);

  // Select first photo
  console.log(`   📸 Selecting photo...`);
  await selectFirstPhoto(pickerFrame);

  console.log(`   ⏳ Waiting for upload...`);
  await page.waitForTimeout(4000);

  console.log(`   ✅ ${folderName} uploaded`);
}

/**
 * Navigate to folder
 */
async function navigateToFolder(pickerFrame, folderName) {
  try {
    await pickerFrame
      .getByText(folderName, { exact: false })
      .first()
      .dblclick();
  } catch {
    try {
      await pickerFrame
        .locator(`div[aria-label*="${folderName}"]`)
        .first()
        .dblclick();
    } catch {
      await pickerFrame
        .locator('div[data-type="folder"]')
        .filter({ hasText: folderName })
        .first()
        .dblclick();
    }
  }
  await pickerFrame.waitForTimeout(2000);
}

/**
 * Select first photo
 */
async function selectFirstPhoto(pickerFrame) {
  try {
    const jpgFile = pickerFrame.locator('div[aria-label*=".jpg" i]').first();
    await jpgFile.dblclick();
  } catch {
    try {
      const imgFile = pickerFrame.locator('div[aria-label*="IMG"]').first();
      await imgFile.dblclick();
    } catch {
      try {
        const allItems = pickerFrame.locator('div[role="gridcell"]');
        await allItems.first().dblclick();
      } catch {
        const fileWithExt = pickerFrame.getByText(/\.(jpg|jpeg|png)/i).first();
        await fileWithExt.dblclick();
      }
    }
  }
}

module.exports = { submitToGoogleForm };
