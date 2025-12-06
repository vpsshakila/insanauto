// services/puppeteerService.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Helper function untuk wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Submit form ke Google Forms dengan Puppeteer
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

  // Config
  const config = {
    GOOGLE_FORM_URL:
      process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8",
    HEADLESS: process.env.HEADLESS !== "false",
  };

  console.log("🚀 Memulai submission dengan Puppeteer...");
  console.log("📋 Data:", {
    tid: formData.tid,
    nama: formData.nama,
    perusahaan: formData.perusahaan,
  });

  let browser = null;

  try {
    console.log("🔧 Launching browser...");

    // Launch browser with user data
    browser = await puppeteer.launch({
      headless: config.HEADLESS ? "new" : false,
      userDataDir: userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: null,
    });

    console.log("✅ Browser launched successfully");

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    // ========== BUKA GOOGLE FORM ==========
    console.log("🌐 Membuka Google Form...");
    await page.goto(config.GOOGLE_FORM_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes("accounts.google.com")) {
      throw new Error("Not logged in - session expired. Please re-login.");
    }

    console.log("✅ Form loaded");

    // ========== ISI FIELD TEXT & RADIO ==========
    console.log("📝 Mengisi field form...");

    // Field 1: TID
    await page.waitForSelector('input[type="text"]', { timeout: 30000 });

    // Get all text inputs
    const textInputs = await page.$$('input[type="text"]');

    // Fill TID (biasanya field pertama)
    if (textInputs.length > 0) {
      await textInputs[0].type(formData.tid);
      console.log("   ✅ TID filled");
    }

    // Field 2 & 3: Radio buttons
    const radioButtons = await page.$$('div[role="radio"]');
    console.log(`   Found ${radioButtons.length} radio buttons`);

    if (radioButtons.length >= 4) {
      // Kondisi Camera
      if (formData.kondisiCamera === "Baik") {
        await radioButtons[0].click();
      } else {
        await radioButtons[1].click();
      }
      console.log("   ✅ Kondisi Camera selected");

      // Kondisi NVR
      if (formData.kondisiNVR === "Merekam") {
        await radioButtons[2].click();
      } else {
        await radioButtons[3].click();
      }
      console.log("   ✅ Kondisi NVR selected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ========== UPLOAD FOTO CAMERA ==========
    await uploadPhotoFromDrive(page, "Camera", formData.tid, 0);

    // ========== UPLOAD FOTO NVR ==========
    await uploadPhotoFromDrive(page, "NVR", formData.tid, 1);

    // ========== ISI FIELD NAMA, PERUSAHAAN, NO PEGAWAI ==========
    console.log("📝 Mengisi field akhir...");

    // Get remaining text inputs (skip TID which is first)
    const allTextInputs = await page.$$('input[type="text"]');

    if (allTextInputs.length >= 4) {
      // Nama (field ke-2)
      await allTextInputs[1].click({ clickCount: 3 }); // Select all
      await allTextInputs[1].type(formData.nama);

      // Perusahaan (field ke-3)
      await allTextInputs[2].click({ clickCount: 3 });
      await allTextInputs[2].type(formData.perusahaan);

      // No Pegawai (field ke-4)
      await allTextInputs[3].click({ clickCount: 3 });
      await allTextInputs[3].type(formData.noPegawai);

      console.log("   ✅ All text fields filled");
    }

    // ========== CENTANG PERNYATAAN ==========
    console.log("✅ Pilih pernyataan...");
    const allRadios = await page.$$('div[role="radio"]');
    if (allRadios.length >= 5) {
      await allRadios[4].click();
      console.log("   ✅ Pernyataan checked");
    }

    await page.waitForTimeout(1000);

    // ========== SUBMIT FORM ==========
    console.log("📤 Submitting form...");

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(1000);

    // Find and click submit button
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("span"));
      return buttons.find(
        (span) =>
          span.textContent.includes("Kirim") ||
          span.textContent.includes("Submit")
      );
    });

    if (submitButton) {
      console.log("   🎯 Found submit button");
      await submitButton.click();
    } else {
      // Fallback: try to find by role
      await page.click('[role="button"]:has-text("Kirim")').catch(() => {
        console.log("   ⚠️  Using keyboard submit");
        return page.keyboard.press("Enter");
      });
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

    let errorMessage = error.message;

    if (error.message.includes("Not logged in")) {
      errorMessage =
        "Session expired. Please re-login using: node loginPuppeteer.js";
      console.error("\n💡 Solution:");
      console.error("   Run: node loginPuppeteer.js");
      console.error("   Then restart the server\n");
    }

    // Screenshot untuk debugging
    try {
      if (browser) {
        const pages = await browser.pages();
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
 * Verifikasi submission success
 */
async function verifySubmissionSuccess(page) {
  const maxWaitTime = 15000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check URL change
      const currentUrl = page.url();
      if (
        currentUrl.includes("formResponse") ||
        currentUrl.includes("confirm")
      ) {
        console.log("   ✅ Redirected to confirmation page");
        return true;
      }

      // Check for success text
      const content = await page.content();
      const successPatterns = [
        /terkirim/i,
        /recorded/i,
        /submitted/i,
        /berhasil/i,
        /respons Anda telah dicatat/i,
        /your response has been recorded/i,
      ];

      for (const pattern of successPatterns) {
        if (pattern.test(content)) {
          console.log("   ✅ Success message found");
          return true;
        }
      }

      await wait(1000);
    } catch (e) {
      // Continue checking
    }
  }

  return false;
}

/**
 * Upload foto dari Google Drive picker
 */
async function uploadPhotoFromDrive(page, folderName, tid, pickerIndex) {
  console.log(`📸 Upload Foto ${folderName}...`);

  // Find "Tambahkan file" buttons
  const addFileButtons = await page.$x(
    `//span[contains(text(), 'Tambahkan file')]`
  );

  if (addFileButtons.length > pickerIndex) {
    await addFileButtons[pickerIndex].click();
    console.log("   ⏳ Waiting for Drive picker...");
    await wait(4000);

    // Switch to Drive picker iframe
    const frames = page.frames();
    const pickerFrame = frames.find((f) => f.url().includes("picker"));

    if (!pickerFrame) {
      throw new Error(`Picker iframe not found for ${folderName}`);
    }

    console.log("   📊 Found picker frame");
    await wait(2000);

    // Switch to "Drive Saya" tab
    console.log('   🔄 Switching to "Drive Saya"...');
    await pickerFrame.click('[role="tab"][aria-label*="Drive"]').catch(() => {
      return pickerFrame.click("text=/Drive Saya/i");
    });
    await wait(3000);

    // Navigate: Mingguan > [TID] > [Camera/NVR]
    console.log(`   🗂️  Navigating: Mingguan > ${tid} > ${folderName}`);

    await navigateToFolder(pickerFrame, "Mingguan");
    await navigateToFolder(pickerFrame, tid);
    await navigateToFolder(pickerFrame, folderName);

    // Select first photo
    console.log(`   📸 Selecting photo...`);
    await selectFirstPhoto(pickerFrame);

    console.log(`   ⏳ Waiting for upload...`);
    await wait(4000);

    console.log(`   ✅ ${folderName} uploaded`);
  }
}

/**
 * Navigate to folder in Drive picker
 */
async function navigateToFolder(frame, folderName) {
  try {
    // Try different selectors
    const selectors = [
      `text="${folderName}"`,
      `[aria-label*="${folderName}"]`,
      `div:has-text("${folderName}")`,
    ];

    for (const selector of selectors) {
      try {
        await frame.dblclick(selector, { timeout: 5000 });
        await wait(2000);
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error(`Folder ${folderName} not found`);
  } catch (error) {
    console.log(`   ⚠️  Error navigating to ${folderName}: ${error.message}`);
    throw error;
  }
}

/**
 * Select first photo in folder
 */
async function selectFirstPhoto(frame) {
  try {
    // Try to find .jpg files first
    const selectors = [
      '[aria-label*=".jpg"]',
      '[aria-label*=".JPG"]',
      '[aria-label*="IMG"]',
      '[role="gridcell"]',
    ];

    for (const selector of selectors) {
      try {
        await frame.dblclick(selector, { timeout: 5000 });
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error("No photo found");
  } catch (error) {
    console.log(`   ⚠️  Error selecting photo: ${error.message}`);
    throw error;
  }
}

module.exports = { submitToGoogleForm };
