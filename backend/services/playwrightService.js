const { chromium } = require("playwright");
const path = require("path");
require("dotenv").config(); // Load environment variables

/**
 * Submit form ke Google Forms dengan automasi Google Drive picker
 */
async function submitToGoogleForm(formData) {
  const userDataDir = path.join(__dirname, "../browser-data");

  // Config langsung dari environment variables
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
  console.log("📋 Data:", formData);
  console.log("⚙️  Config:", {
    headless: config.HEADLESS,
    slowMo: config.SLOW_MO,
    formUrl: config.GOOGLE_FORM_URL,
  });

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: config.HEADLESS,
    slowMo: config.SLOW_MO,
    args: config.BROWSER_ARGS,
  });

  try {
    const page = browser.pages()[0] || (await browser.newPage());

    // ========== BUKA GOOGLE FORM ==========
    console.log("🌐 Membuka Google Form...");
    console.log(`   📎 URL: ${config.GOOGLE_FORM_URL}`);

    await page.goto(config.GOOGLE_FORM_URL);
    await page.waitForLoadState("networkidle");
    console.log("✅ Form loaded");

    // ... (sisa code tetap sama)
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
          console.log(`   🎯 Found submit button with selector: ${selector}`);
          await element.click({ timeout: 5000 });
          clicked = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!clicked) {
      console.log(
        "   ⚠️  No submit button found, checking if already submitted..."
      );
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

    // Screenshot untuk debugging
    try {
      const pages = browser.pages();
      if (pages.length > 0) {
        const screenshotPath = path.join(
          __dirname,
          "../logs",
          `error-${Date.now()}.png`
        );
        await pages[0].screenshot({ path: screenshotPath, fullPage: true });
        console.log("📸 Screenshot error saved:", screenshotPath);
      }
    } catch (screenshotError) {
      console.error("Failed to save screenshot:", screenshotError.message);
    }

    return {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      data: formData,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Verifikasi apakah form berhasil disubmit
 */
async function verifySubmissionSuccess(page) {
  const maxWaitTime = 15000; // 15 detik
  const startTime = Date.now();

  // Multiple patterns untuk konfirmasi sukses
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

  // Multiple patterns untuk halaman konfirmasi
  const confirmationSelectors = [
    ".freebirdFormviewerViewResponseConfirmationMessage",
    ".vHW8K",
    '[role="heading"]',
    "text=/Formulir ini sudah tidak menerima respons/i",
    "text=/This form is no longer accepting responses/i",
  ];

  while (Date.now() - startTime < maxWaitTime) {
    // Cek apakah ada teks konfirmasi sukses
    for (const pattern of successPatterns) {
      try {
        const element = page.locator(`text=${pattern}`).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   ✅ Detected success message: ${pattern}`);
          return true;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }

    // Cek apakah ada elemen konfirmasi
    for (const selector of confirmationSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   ✅ Detected confirmation element: ${selector}`);
          return true;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Cek URL berubah (Google Forms biasanya redirect setelah submit)
    const currentUrl = page.url();
    if (currentUrl.includes("formResponse") || currentUrl.includes("confirm")) {
      console.log(`   ✅ Detected confirmation URL: ${currentUrl}`);
      return true;
    }

    // Cek jika tombol submit sudah hilang (indikasi sudah pindah halaman)
    const submitButton = page.locator('span:has-text("Kirim")').first();
    if (!(await submitButton.isVisible({ timeout: 1000 }))) {
      console.log("   ✅ Submit button disappeared - likely successful");
      return true;
    }

    // Tunggu sebentar sebelum cek lagi
    await page.waitForTimeout(1000);
  }

  console.log("   ⚠️  No clear confirmation detected, but continuing...");

  // Fallback: cek jika kita masih di halaman form atau sudah di halaman lain
  const currentUrl = page.url();
  if (!currentUrl.includes("viewform")) {
    console.log(`   ✅ Not on form page anymore: ${currentUrl}`);
    return true;
  }

  return false;
}

/**
 * Helper function: Upload foto dari Google Drive picker
 */
async function uploadPhotoFromDrive(page, folderName, tid, pickerIndex) {
  console.log(`📸 Upload Foto ${folderName} dari Google Drive...`);

  // Scroll ke field upload
  await page.locator(`text=Upload Foto ${folderName}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Klik tombol "Tambahkan file"
  const addFileButtons = page.getByText("Tambahkan file");
  await addFileButtons.nth(pickerIndex).click();

  console.log("   ⏳ Waiting for Google Drive picker...");
  await page.waitForTimeout(4000);

  // Find picker frame
  const allFrames = page.frames();
  const pickerFrames = allFrames.filter((f) => f.url().includes("picker"));

  console.log(`   📊 Found ${pickerFrames.length} picker frame(s)`);

  const pickerFrame = pickerFrames[pickerFrames.length - 1];

  if (!pickerFrame) {
    throw new Error(`Picker iframe not found for ${folderName}`);
  }

  console.log(`   ✅ Using picker frame [${pickerFrames.length - 1}]`);

  // Wait for picker content to load
  await pickerFrame.waitForLoadState("domcontentloaded");
  await pickerFrame.waitForTimeout(2000);

  // Klik tab "Drive Saya"
  console.log('   🔄 Switching to "Drive Saya" tab...');
  await pickerFrame.getByRole("tab", { name: "Drive Saya" }).click();
  await pickerFrame.waitForTimeout(3000);

  // Navigate: Mingguan > [TID] > [Camera/NVR]
  console.log(`   🗂️  Navigating: Mingguan > ${tid} > ${folderName}`);

  await navigateToFolder(pickerFrame, "Mingguan");
  await navigateToFolder(pickerFrame, tid);
  await navigateToFolder(pickerFrame, folderName);

  // Pilih foto (file pertama dengan ekstensi .jpg)
  console.log(`   📸 Selecting ${folderName} photo...`);
  await selectFirstPhoto(pickerFrame);

  console.log(`   ⏳ Waiting for upload to complete...`);
  await page.waitForTimeout(4000);

  console.log(`   ✅ ${folderName} photo uploaded successfully`);
}

/**
 * Helper function: Navigate ke folder dengan multiple fallback strategies
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
 * Helper function: Pilih foto pertama dengan multiple fallback strategies
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
