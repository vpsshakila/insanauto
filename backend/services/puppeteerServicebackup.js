// services/puppeteerService.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Helper function untuk wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Direktori logs (didefinisikan di global scope)
const LOGS_DIR = path.join(__dirname, "../logs");
const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");

/**
 * Close unwanted new tabs that might have been opened
 */
async function closeUnwantedTabs(browser, mainPageUrl) {
  try {
    const pages = await browser.pages();
    console.log(`   📋 Total pages open: ${pages.length}`);

    let closedCount = 0;

    for (const page of pages) {
      const url = page.url();

      // Close tabs that are NOT the main form page
      // Keep: Google Forms page
      // Close: Google Drive file viewer, about:blank, etc
      if (
        !url.includes("forms.gle") &&
        !url.includes("docs.google.com/forms") &&
        url !== mainPageUrl
      ) {
        const shortUrl = url.substring(0, 80);
        console.log(`   🗑️  Closing unwanted tab: ${shortUrl}...`);

        try {
          await page.close();
          closedCount++;
        } catch (e) {
          console.log(`   ⚠️  Failed to close tab: ${e.message}`);
        }
      }
    }

    if (closedCount > 0) {
      console.log(`   ✅ Closed ${closedCount} unwanted tab(s)`);
    }

    return closedCount;
  } catch (error) {
    console.log("   Error in closeUnwantedTabs:", error.message);
    return 0;
  }
}

/**
 * Submit form ke Google Forms dengan Puppeteer
 */
async function submitToGoogleForm(formData) {
  // Ensure directories exist
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  if (!fs.existsSync(BROWSER_DATA_DIR)) {
    fs.mkdirSync(BROWSER_DATA_DIR, { recursive: true });
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
      userDataDir: BROWSER_DATA_DIR,
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

    await wait(3000);

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes("accounts.google.com")) {
      throw new Error("Not logged in - session expired. Please re-login.");
    }

    console.log("✅ Form loaded");

    // Store main page URL for later verification
    const mainFormUrl = page.url();

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

    await wait(1000);

    // ========== UPLOAD FOTO CAMERA ==========
    await uploadPhotoFromDrive(
      page,
      browser,
      mainFormUrl,
      "Camera",
      formData.tid,
      "Upload Foto Camera"
    );

    // PENTING: Tunggu dan pastikan picker benar-benar tertutup
    console.log("\n⏸️  Waiting for picker to close completely...");
    await wait(3000);

    // Close any unwanted tabs that might have opened
    await closeUnwantedTabs(browser, mainFormUrl);

    // Force close any remaining picker frames
    const remainingFrames = await forceClosePickerFrames(page);
    if (remainingFrames > 0) {
      console.log(
        `   ⚠️  Force closed ${remainingFrames} remaining picker frame(s)`
      );
    }

    // Pastikan kembali ke halaman form utama
    const currentPages = await browser.pages();
    let formPage = currentPages.find((p) => p.url() === mainFormUrl);
    if (formPage) {
      await formPage.bringToFront();

      // IMPORTANT: Remove focus from uploaded file to prevent accidental Enter
      await formPage.evaluate(() => {
        // Click on a safe area
        const form = document.querySelector("form");
        if (form) {
          form.click();
        }
        // Blur any focused element
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      });

      console.log(
        `   ✅ Returned to form and removed focus from uploaded file`
      );
    } else {
      await page.bringToFront();
    }
    await wait(2000);

    // Verify no picker frames remain
    const finalFrameCount = page.frames().length;
    console.log(`   📊 Final frame count: ${finalFrameCount}`);

    const hasPickerFrame = await page.evaluate(() => {
      const frames = Array.from(document.querySelectorAll("iframe"));
      return frames.some((f) => f.src && f.src.includes("picker"));
    });

    if (hasPickerFrame) {
      console.log(
        `   ⚠️  WARNING: Picker frame still detected! Forcing cleanup...`
      );
      await forceClosePickerFrames(page);
      await wait(2000);
    } else {
      console.log(`   ✅ All picker frames closed successfully`);
    }

    // ========== UPLOAD FOTO NVR ==========
    await uploadPhotoFromDrive(
      page,
      browser,
      mainFormUrl,
      "NVR",
      formData.tid,
      "Upload Foto NVR"
    );

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

    await wait(1000);

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
            LOGS_DIR,
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
 * Force close any remaining picker frames
 */
async function forceClosePickerFrames(page) {
  try {
    let closedCount = 0;

    // Method 1: Close via JavaScript
    const removed = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll("iframe"));
      const pickerIframes = iframes.filter(
        (f) =>
          f.src &&
          (f.src.includes("picker") || f.src.includes("docs.google.com/picker"))
      );

      pickerIframes.forEach((iframe) => {
        try {
          iframe.remove();
        } catch (e) {
          console.log("Failed to remove iframe:", e.message);
        }
      });

      return pickerIframes.length;
    });

    closedCount += removed;

    // Method 2: Press Escape key multiple times
    for (let i = 0; i < 3; i++) {
      try {
        await page.keyboard.press("Escape");
        await wait(500);
      } catch (e) {
        // Ignore
      }
    }

    // Method 3: Click close button if exists
    try {
      await page.evaluate(() => {
        const closeButtons = Array.from(
          document.querySelectorAll('button, div[role="button"]')
        );
        const closeBtn = closeButtons.find((btn) => {
          const text = btn.textContent?.toLowerCase() || "";
          const label = btn.getAttribute("aria-label")?.toLowerCase() || "";
          return (
            text.includes("tutup") ||
            text.includes("close") ||
            label.includes("tutup") ||
            label.includes("close")
          );
        });

        if (closeBtn) {
          closeBtn.click();
        }
      });
    } catch (e) {
      // Ignore
    }

    return closedCount;
  } catch (error) {
    console.log("   Error in forceClosePickerFrames:", error.message);
    return 0;
  }
}

/**
 * Verifikasi bahwa file berhasil terupload ke form
 */
async function verifyUploadSuccess(page, folderName, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Cari elemen yang menunjukkan file terupload
      const hasUploadedFile = await page.evaluate((folderName) => {
        // Cari text yang menunjukkan file terupload
        const elements = Array.from(document.querySelectorAll("span, div"));
        const uploadIndicators = elements.filter((el) => {
          const text = el.textContent.toLowerCase();
          return (
            text.includes("upload") ||
            text.includes("terupload") ||
            text.includes("file") ||
            text.includes("foto") ||
            text.includes("jpg") ||
            text.includes("png") ||
            text.includes("image")
          );
        });

        // Cari juga preview gambar
        const images = Array.from(document.querySelectorAll("img"));
        const hasImagePreview = images.some(
          (img) =>
            img.src &&
            (img.src.includes("googleusercontent") ||
              img.src.includes("drive.google"))
        );

        return uploadIndicators.length > 0 || hasImagePreview;
      }, folderName);

      if (hasUploadedFile) {
        console.log(`   ✓ Upload verification passed for ${folderName}`);
        return true;
      }

      await wait(1000);
    } catch (error) {
      // Continue checking
    }
  }

  console.log(`   ✗ Upload verification timeout for ${folderName}`);
  return false;
}

/**
 * Upload foto dari Google Drive picker
 * @param {Object} page - Puppeteer page object
 * @param {Object} browser - Puppeteer browser object
 * @param {string} mainFormUrl - Main form URL to return to
 * @param {string} folderName - Nama folder tujuan (Camera/NVR)
 * @param {string} tid - TID number
 * @param {string} fieldLabel - Label field upload untuk identifikasi ("Upload Foto Camera" atau "Upload Foto NVR")
 */
async function uploadPhotoFromDrive(
  page,
  browser,
  mainFormUrl,
  folderName,
  tid,
  fieldLabel
) {
  console.log(`\n📸 ========== UPLOAD ${folderName.toUpperCase()} ==========`);
  console.log(`   🎯 Target field: "${fieldLabel}"`);

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // METHODE BARU: Temukan tombol berdasarkan heading ID yang sesuai
    console.log(`   🔍 Finding button using heading ID...`);

    // Tentukan heading ID berdasarkan folderName
    const headingId = folderName === "Camera" ? "i28" : "i35";
    console.log(`   📍 Expected heading ID: ${headingId} for "${fieldLabel}"`);

    // Cari heading dengan ID yang sesuai dan text yang sesuai
    const headingFound = await page.evaluate(
      ({ headingId, folderName }) => {
        const heading = document.getElementById(headingId);
        if (heading) {
          const text = heading.textContent || "";
          console.log(`Found heading ${headingId}: "${text}"`);

          // Verifikasi bahwa heading sesuai dengan folderName
          const expectedText =
            folderName === "Camera" ? "Upload Foto Camera" : "Upload Foto NVR";
          if (text.includes(expectedText)) {
            console.log(`Heading matches expected text: ${expectedText}`);

            // Cari tombol "Tambahkan file" yang terkait dengan heading ini
            // Navigasi ke parent container yang mengandung heading dan tombol
            let container = heading;
            for (let i = 0; i < 5; i++) {
              container = container.parentElement;
              if (!container) break;

              // Cari tombol di dalam container ini
              const button = container.querySelector('div[jsname="mWZCyf"]');
              if (button) {
                console.log(
                  `Found button in same container as heading ${headingId}`
                );
                // Tandai button ini
                button.setAttribute("data-upload-type", folderName);
                return true;
              }
            }
          }
        }
        return false;
      },
      { headingId, folderName }
    );

    if (!headingFound) {
      // Fallback: cari dengan metode sebelumnya
      console.log(`   ⚠️  Heading method failed, trying fallback...`);

      const sectionFound = await page.evaluate((label) => {
        const allElements = Array.from(
          document.querySelectorAll("div, section")
        );

        for (const el of allElements) {
          const text = el.textContent || "";

          // Cari secara lebih spesifik berdasarkan label lengkap
          if (text.includes(label) && text.includes("Upload 1 file")) {
            console.log(`Found section containing exact label: "${label}"`);

            // Cari tombol "Tambahkan file" di dalam section ini
            const button = el.querySelector('div[jsname="mWZCyf"]');
            if (button) {
              button.setAttribute("data-upload-type", label);
              return true;
            }
          }
        }
        return false;
      }, fieldLabel);

      if (!sectionFound) {
        throw new Error(`Upload section "${fieldLabel}" not found`);
      }
    }

    console.log(`   ✅ Found upload section for ${fieldLabel}`);
    await wait(1500);

    // Screenshot sebelum klik
    const beforeClickPath = path.join(
      LOGS_DIR,
      `before-click-${folderName}-${timestamp}.png`
    );
    await page.screenshot({ path: beforeClickPath, fullPage: true });
    console.log(`   📸 Before click: ${beforeClickPath}`);

    // Klik button yang sudah ditandai dengan cara yang lebih spesifik
    console.log(`   🖱️  Clicking "Tambahkan file" for ${fieldLabel}...`);

    const clicked = await page.evaluate((folderName) => {
      // Prioritas 1: Button dengan atribut data-upload-type
      let button = document.querySelector(`[data-upload-type="${folderName}"]`);

      // Prioritas 2: Button berdasarkan heading ID
      if (!button) {
        const headingId = folderName === "Camera" ? "i28" : "i35";
        const heading = document.getElementById(headingId);
        if (heading) {
          // Cari tombol terdekat dalam struktur DOM
          let container = heading.closest('div.Qr7Oae[role="listitem"]');
          if (container) {
            button = container.querySelector('div[jsname="mWZCyf"]');
          }
        }
      }

      // Prioritas 3: Button berdasarkan text dalam container
      if (!button) {
        const buttons = Array.from(
          document.querySelectorAll('div[jsname="mWZCyf"]')
        );
        for (const btn of buttons) {
          // Cari parent container yang berisi text fieldLabel
          let parent = btn;
          for (let i = 0; i < 6; i++) {
            parent = parent.parentElement;
            if (!parent) break;

            const text = parent.textContent || "";
            if (
              text.includes(
                folderName === "Camera"
                  ? "Upload Foto Camera"
                  : "Upload Foto NVR"
              )
            ) {
              button = btn;
              break;
            }
          }
          if (button) break;
        }
      }

      if (button) {
        console.log(
          `Clicking button for ${folderName}:`,
          button.outerHTML.substring(0, 200)
        );

        // Simulasikan click dengan lebih lengkap
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Dispatch semua event mouse
        ["mousedown", "mouseup", "click"].forEach((eventType) => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            button: 0,
          });
          button.dispatchEvent(event);
        });

        // Juga coba click langsung
        if (button.click) {
          button.click();
        }

        return true;
      }

      console.log(`Button for ${folderName} not found`);
      return false;
    }, folderName);

    if (!clicked) {
      throw new Error(`Failed to click upload button for ${fieldLabel}`);
    }

    console.log(`   ✅ Button clicked for ${fieldLabel}`);

    console.log("   ⏳ Waiting for Drive picker to appear...");
    await wait(6000);

    // Screenshot right after button click, before frame detection
    const afterClickPath = path.join(
      LOGS_DIR,
      `after-button-click-${folderName}-${timestamp}.png`
    );
    await page.screenshot({ path: afterClickPath, fullPage: true });
    console.log(`   📸 After button click: ${afterClickPath}`);

    // Find picker frame - AMBIL YANG TERBARU (PALING AKHIR)
    let pickerFrame = null;
    let retries = 5;

    while (!pickerFrame && retries > 0) {
      const frames = page.frames();
      console.log(`   🔍 Total frames: ${frames.length}`);

      // Cari semua picker frames, ambil yang paling akhir (terbaru)
      const pickerFrames = frames.filter((f) => {
        const url = f.url();
        return url.includes("picker") || url.includes("docs.google.com/picker");
      });

      if (pickerFrames.length > 0) {
        // PENTING: Ambil frame TERAKHIR (yang paling baru dibuka)
        pickerFrame = pickerFrames[pickerFrames.length - 1];
        console.log(
          `   ✅ Found ${pickerFrames.length} picker frame(s), using the latest one (frame #${pickerFrames.length})`
        );

        // TAMBAHAN: Log URL frame untuk debugging
        console.log(
          `   🔗 Using frame URL: ${pickerFrame.url().substring(0, 80)}...`
        );
      } else {
        console.log(
          `   ⏳ Picker frame not found, retrying... (${retries} left)`
        );
        await wait(2000);
        retries--;
      }
    }

    if (!pickerFrame) {
      throw new Error(`❌ Picker iframe not found for ${folderName}`);
    }

    console.log(`   ✅ Found picker frame`);
    await wait(3000);

    // Switch to "Drive Saya" tab
    console.log('\n   🔄 Switching to "Drive Saya" tab...');

    const tabSwitched = await pickerFrame.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

      const driveTab = tabs.find((tab) => {
        const text = tab.textContent || "";
        const label = tab.getAttribute("aria-label") || "";
        const combined = (text + " " + label).toLowerCase();

        return combined.includes("drive saya") || combined.includes("my drive");
      });

      if (driveTab) {
        driveTab.click();
        return true;
      }

      return false;
    });

    if (!tabSwitched) {
      console.log("   ⚠️  Drive Saya tab not found, trying to continue...");
    }

    await wait(4000);

    // Navigate: Mingguan > [TID] > [Camera/NVR]
    console.log(`\n   🗂️  NAVIGATION: Mingguan > ${tid} > ${folderName}`);

    await navigateToFolder(pickerFrame, "Mingguan");
    await navigateToFolder(pickerFrame, tid);
    await navigateToFolder(pickerFrame, folderName);

    // Select first photo dengan DOUBLE CLICK
    console.log(`\n   📸 Selecting first photo in ${folderName}...`);
    await wait(3000); // Tunggu lebih lama untuk memastikan items loaded

    // Debug: Screenshot sebelum select photo
    const beforeSelectPath = path.join(
      LOGS_DIR,
      `before-select-photo-${folderName}-${timestamp}.png`
    );
    await page.screenshot({ path: beforeSelectPath, fullPage: true });
    console.log(`   📸 Before select: ${beforeSelectPath}`);

    // Debug: List all available items
    const availableFiles = await pickerFrame.evaluate(() => {
      // Cari dengan berbagai selector
      const gridCells = Array.from(
        document.querySelectorAll('div[role="gridcell"]')
      );
      const listItems = Array.from(
        document.querySelectorAll('div[role="listitem"]')
      );
      const dataIdItems = Array.from(document.querySelectorAll("[data-id]"));
      const ariaLabelItems = Array.from(
        document.querySelectorAll("[aria-label]")
      );

      // Cari yang mengandung nama file (biasanya punya aria-label dengan ekstensi file)
      const fileItems = ariaLabelItems.filter((item) => {
        const label = item.getAttribute("aria-label") || "";
        // Filter: harus ada ekstensi file atau nama file
        return (
          label.match(/\.(jpg|jpeg|png|gif|bmp|webp|mp4|pdf)/i) ||
          label.match(/^IMG/i) || // File dengan nama IMG
          (label.length > 5 &&
            !label.includes("diklik") &&
            !label.includes("dibuka"))
        );
      });

      return {
        gridCells: gridCells.length,
        listItems: listItems.length,
        dataIdItems: dataIdItems.length,
        ariaLabelItems: ariaLabelItems.length,
        fileItems: fileItems.slice(0, 10).map((item, index) => ({
          index,
          label: item.getAttribute("aria-label") || "",
          tagName: item.tagName,
          className: item.className,
          hasImage: item.querySelector("img") !== null,
        })),
      };
    });

    console.log(`\n   📊 DOM Debug Info:`);
    console.log(`      Grid cells: ${availableFiles.gridCells}`);
    console.log(`      List items: ${availableFiles.listItems}`);
    console.log(`      Data-id items: ${availableFiles.dataIdItems}`);
    console.log(`      Aria-label items: ${availableFiles.ariaLabelItems}`);

    console.log(`\n   📋 Available files in ${folderName}:`);
    availableFiles.fileItems.forEach((file, i) => {
      console.log(
        `      ${i + 1}. "${file.label}" | Tag: ${file.tagName} | HasImage: ${
          file.hasImage
        }`
      );
    });

    // Try to select photo with improved method
    const photoSelected = await pickerFrame.evaluate(() => {
      console.log("=== Attempting to select photo ===");

      // Strategi 1: Cari semua elemen dengan aria-label yang mengandung nama file
      const allAriaLabels = Array.from(
        document.querySelectorAll("[aria-label]")
      );

      console.log(`Total aria-label elements: ${allAriaLabels.length}`);

      let photoItem = null;

      // Filter untuk file (bukan folder, bukan navigation)
      const possibleFiles = allAriaLabels.filter((item) => {
        const label = item.getAttribute("aria-label") || "";

        // Skip navigation items
        if (
          label.includes("diklik") ||
          label.includes("dibuka") ||
          label.includes("My Drive") ||
          label.includes("Sisipkan file") ||
          label.includes("Filter") ||
          label.includes("Tutup") ||
          label.includes("Tampilan")
        ) {
          return false;
        }

        // Include items with file extensions or IMG prefix
        return (
          label.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ||
          label.match(/^IMG/i) ||
          (label.length > 5 && !label.includes("folder"))
        );
      });

      console.log(`Possible file items: ${possibleFiles.length}`);
      possibleFiles.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.getAttribute("aria-label")}`);
      });

      // Prioritas 1: File dengan ekstensi image
      for (const item of possibleFiles) {
        const label = item.getAttribute("aria-label") || "";
        if (label.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          console.log(`✓ Selected image file: ${label}`);
          photoItem = item;
          break;
        }
      }

      // Prioritas 2: File yang dimulai dengan IMG
      if (!photoItem) {
        for (const item of possibleFiles) {
          const label = item.getAttribute("aria-label") || "";
          if (label.match(/^IMG/i)) {
            console.log(`✓ Selected IMG file: ${label}`);
            photoItem = item;
            break;
          }
        }
      }

      // Prioritas 3: File pertama yang bukan navigation
      if (!photoItem && possibleFiles.length > 0) {
        photoItem = possibleFiles[0];
        console.log(
          `✓ Selected first available file: ${photoItem.getAttribute(
            "aria-label"
          )}`
        );
      }

      if (photoItem) {
        const label = photoItem.getAttribute("aria-label") || "unknown";
        console.log(`\n>>> SELECTING: ${label}`);

        // Scroll item into view first
        photoItem.scrollIntoView({ block: "center", behavior: "instant" });

        return new Promise((resolve) => {
          setTimeout(() => {
            // METODE BARU: Focus + Click untuk Google Drive Picker
            try {
              // 1. Focus pada element
              if (photoItem.focus) {
                photoItem.focus();
                console.log("✓ Element focused");
              }

              // 2. Set aria-selected (untuk accessibility)
              photoItem.setAttribute("aria-selected", "true");

              // 3. Add selected class if possible
              photoItem.classList.add("picker-selected", "selected");

              // 4. Single click dengan koordinat yang tepat
              const rect = photoItem.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;

              console.log(`Clicking at: (${Math.round(x)}, ${Math.round(y)})`);

              // Method A: mousedown + mouseup + click (simulasi click real)
              ["mousedown", "mouseup", "click"].forEach((eventType) => {
                const event = new MouseEvent(eventType, {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  clientX: x,
                  clientY: y,
                  button: 0,
                });
                photoItem.dispatchEvent(event);
              });

              console.log("✓ Mouse events dispatched");

              // Method B: Try direct click
              if (photoItem.click) {
                photoItem.click();
                console.log("✓ Direct click executed");
              }

              // Method C: Try clicking on inner div/span
              const innerElements =
                photoItem.querySelectorAll("div, span, img");
              if (innerElements.length > 0) {
                innerElements[0].click();
                console.log("✓ Inner element clicked");
              }

              resolve(true);
            } catch (e) {
              console.log("✗ Error selecting:", e.message);
              resolve(false);
            }
          }, 800);
        });
      }

      console.log("!!! No suitable photo found");
      return false;
    });

    if (!photoSelected) {
      throw new Error(`❌ No photo found in ${folderName} folder`);
    }

    console.log(`   ✅ Photo selection attempted`);
    console.log(`   ⏳ Waiting for file selection to register...`);
    await wait(2000); // Wait untuk file highlight/selected

    // Verify file is selected by checking aria-selected or selected class
    const fileSelected = await pickerFrame.evaluate(() => {
      const selectedItems = Array.from(
        document.querySelectorAll(
          '[aria-selected="true"], .picker-selected, .selected'
        )
      );
      return selectedItems.length > 0;
    });

    if (fileSelected) {
      console.log(`   ✅ File is now selected (highlighted)`);
    } else {
      console.log(`   ⚠️  File selection status unclear`);
    }

    console.log(`   ⏳ Waiting for picker to process...`);
    await wait(2000);

    // Check if picker closed
    const framesBefore = page.frames().length;
    const pickerStillOpen = await page.evaluate(() => {
      const frames = Array.from(document.querySelectorAll("iframe"));
      return frames.some((f) => f.src && f.src.includes("picker"));
    });

    // If picker still open, try clicking "Pilih" / "Select" button
    if (pickerStillOpen) {
      console.log(
        `   ⚠️  Picker still open (${framesBefore} frames), trying to click "Pilih" button...`
      );

      try {
        // PENTING: Pastikan kita menggunakan frame yang benar (yang terakhir/terbaru)
        const allFrames = page.frames();
        const allPickerFrames = allFrames.filter((f) =>
          f.url().includes("picker")
        );
        const currentPickerFrame = allPickerFrames[allPickerFrames.length - 1];

        console.log(
          `   🎯 Using picker frame ${allPickerFrames.length} of ${allPickerFrames.length}`
        );

        // Debug: Check what's in the current frame
        const frameInfo = await currentPickerFrame.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('button, div[role="button"]')
          );
          return {
            totalButtons: buttons.length,
            buttonTexts: buttons
              .map((b) => b.textContent?.trim())
              .filter((t) => t)
              .slice(0, 10),
          };
        });

        console.log(
          `   📊 Frame has ${frameInfo.totalButtons} buttons:`,
          frameInfo.buttonTexts.slice(0, 5)
        );

        const selectClicked = await currentPickerFrame.evaluate(() => {
          // Cari button "Sisipkan" di Google Drive Picker
          const buttons = Array.from(
            document.querySelectorAll('button, div[role="button"]')
          );

          // Log semua button untuk debugging
          console.log("=== All buttons in frame ===");
          buttons.slice(0, 15).forEach((btn, i) => {
            const text = btn.textContent?.trim() || "";
            if (text) console.log(`${i + 1}. "${text}"`);
          });

          // Cari button yang tepat
          let selectButton = null;

          // Priority 1: Button dengan text "Sisipkan" (untuk Google Drive Picker)
          selectButton = buttons.find((btn) => {
            const text = btn.textContent?.trim().toLowerCase() || "";
            const visible = btn.offsetParent !== null;
            return visible && text === "sisipkan" && !btn.disabled;
          });

          // Priority 2: Button dengan text "Insert" (English version)
          if (!selectButton) {
            selectButton = buttons.find((btn) => {
              const text = btn.textContent?.trim().toLowerCase() || "";
              const visible = btn.offsetParent !== null;
              return visible && text === "insert" && !btn.disabled;
            });
          }

          // Priority 3: Button dengan aria-label yang mengandung "sisipkan" atau "insert"
          if (!selectButton) {
            selectButton = buttons.find((btn) => {
              const label = btn.getAttribute("aria-label")?.toLowerCase() || "";
              const visible = btn.offsetParent !== null;
              return (
                visible &&
                (label.includes("sisipkan") || label.includes("insert")) &&
                !btn.disabled
              );
            });
          }

          if (selectButton) {
            const buttonText = selectButton.textContent?.trim() || "";
            const buttonLabel = selectButton.getAttribute("aria-label") || "";
            console.log(
              `>>> Found button: "${buttonText}" (label: "${buttonLabel}")`
            );

            // Make sure button is visible and enabled
            if (selectButton.disabled) {
              console.log("!!! Button is disabled");
              return false;
            }

            // Scroll button into view
            selectButton.scrollIntoView({ block: "center" });

            // Try multiple click methods with delay
            setTimeout(() => {
              // Method 1: Direct click
              try {
                selectButton.click();
                console.log("✓ Direct click executed");
              } catch (e) {
                console.log("✗ Direct click failed:", e.message);
              }

              // Method 2: Dispatch mouse events
              const rect = selectButton.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;

              ["mousedown", "mouseup", "click"].forEach((type) => {
                selectButton.dispatchEvent(
                  new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: x,
                    clientY: y,
                  })
                );
              });
              console.log("✓ Mouse events dispatched");
            }, 100);

            return true;
          }

          console.log(
            '!!! No "Sisipkan" button found - only found buttons above'
          );
          return false;
        });

        if (selectClicked) {
          console.log(
            `   ✅ Clicked "Sisipkan" button in frame ${allPickerFrames.length}`
          );
          await wait(4000);

          // Verify frame closed
          const framesAfterClick = page.frames().length;
          console.log(
            `   📊 Frames after click: ${framesBefore} → ${framesAfterClick}`
          );

          if (framesAfterClick < framesBefore) {
            console.log(`   ✅ Picker frame closed successfully`);
          } else {
            console.log(`   ⚠️  Picker frame still open after button click`);

            // Additional verification: check if THIS specific frame is detached
            const isFrameDetached = await page.evaluate(() => {
              const iframes = Array.from(document.querySelectorAll("iframe"));
              const pickerIframes = iframes.filter(
                (f) => f.src && f.src.includes("picker")
              );
              return pickerIframes.length;
            });

            console.log(
              `   📊 Remaining picker iframes in DOM: ${isFrameDetached}`
            );

            // DON'T use Enter key - it will open file in new tab after picker closes!
            // Just force close the picker
            console.log(`   🔄 Force closing picker...`);
            await forceClosePickerFrames(page);
            await wait(2000);
          }
        } else {
          console.log(`   ⚠️  "Sisipkan" button not found in current frame`);
          console.log(
            `   💡 Note: Make sure the file is selected (highlighted) first`
          );

          // DON'T use Enter key here - it will open the file in a new tab!
          // Just force close the picker instead
          console.log(`   🔄 Force closing picker without Enter key...`);
          await forceClosePickerFrames(page);
          await wait(2000);
        }
      } catch (e) {
        console.log(`   ⚠️  Error clicking "Pilih": ${e.message}`);
      }
    }

    // Check for unwanted new tabs
    console.log(`\n   🔍 Checking for unwanted tabs...`);
    await closeUnwantedTabs(browser, mainFormUrl);

    // Return focus to main form page
    const pagesAfterUpload = await browser.pages();
    const formPageAfterUpload = pagesAfterUpload.find(
      (p) => p.url() === mainFormUrl
    );
    if (formPageAfterUpload) {
      await formPageAfterUpload.bringToFront();
      console.log(`   ✅ Returned to main form page`);

      // Click somewhere safe to remove focus from file preview
      await formPageAfterUpload.evaluate(() => {
        const safeElement = document.querySelector("form") || document.body;
        if (safeElement) {
          safeElement.click();
        }
      });
    }

    // Verify picker closed (should have fewer frames)
    const framesAfter = page.frames().length;
    console.log(`   📊 Frames after selection: ${framesAfter}`);

    // Verifikasi upload berhasil
    const uploadSuccess = await verifyUploadSuccess(page, folderName, 8000);

    if (uploadSuccess) {
      console.log(`   ✅ ${folderName} uploaded and verified`);
    } else {
      console.log(
        `   ⚠️  ${folderName} uploaded but verification inconclusive`
      );
    }

    // Screenshot final
    const afterUploadPath = path.join(
      LOGS_DIR,
      `after-upload-${folderName}-${timestamp}.png`
    );
    await page.screenshot({ path: afterUploadPath, fullPage: true });
    console.log(`   📸 After upload: ${afterUploadPath}`);

    // FINAL CLEANUP: Pastikan picker benar-benar tertutup sebelum return
    console.log(`\n   🧹 Final cleanup for ${folderName}...`);

    // Close unwanted tabs
    await closeUnwantedTabs(browser, mainFormUrl);

    // Force close picker frames
    await forceClosePickerFrames(page);
    await wait(1000);

    // Verify we're back on form page
    const pagesAfterCleanup = await browser.pages();
    const formPageAfterCleanup = pagesAfterCleanup.find(
      (p) => p.url() === mainFormUrl
    );
    if (formPageAfterCleanup) {
      await formPageAfterCleanup.bringToFront();

      // Remove focus from any uploaded file to prevent Enter from opening it
      await formPageAfterCleanup.evaluate(() => {
        // Click on form background
        const form = document.querySelector("form");
        if (form) {
          form.click();
        }
        // Also blur any focused element
        if (document.activeElement) {
          document.activeElement.blur();
        }
      });
    }

    const finalFrames = page.frames().length;
    const finalPageCount = pagesAfterCleanup.length;
    console.log(
      `   📊 Final state: ${finalPageCount} page(s), ${finalFrames} frame(s)`
    );

    console.log(
      `\n✅ ========== ${folderName.toUpperCase()} COMPLETE ==========\n`
    );
  } catch (error) {
    console.error(`\n❌ Error uploading ${folderName}:`, error.message);
    throw error;
  }
}

/**
 * Navigate to folder in Drive picker
 */
async function navigateToFolder(frame, folderName) {
  try {
    console.log(`   📂 Opening folder: "${folderName}"...`);
    await wait(1500);

    const clicked = await frame.evaluate((name) => {
      // Method 1: Exact match in gridcell
      let elements = Array.from(
        document.querySelectorAll('div[role="gridcell"]')
      );
      let folder = elements.find((el) => {
        const text = el.textContent?.trim() || "";
        return text === name;
      });

      // Method 2: Partial match
      if (!folder) {
        folder = elements.find((el) => {
          const text = el.textContent || "";
          return text.includes(name);
        });
      }

      // Method 3: By aria-label
      if (!folder) {
        elements = Array.from(document.querySelectorAll("[aria-label]"));
        folder = elements.find((el) => {
          const label = el.getAttribute("aria-label") || "";
          return label.includes(name);
        });
      }

      if (folder) {
        console.log(`Found and clicking folder: "${name}"`);

        const rect = folder.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Double click to open folder
        folder.dispatchEvent(
          new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            detail: 2,
          })
        );
        return true;
      }

      console.log(`Folder "${name}" not found`);
      return false;
    }, folderName);

    if (!clicked) {
      throw new Error(`Folder "${folderName}" not found`);
    }

    await wait(3000);
    console.log(`      ✅ Opened: ${folderName}`);
  } catch (error) {
    console.log(`      ❌ Error: ${error.message}`);
    throw error;
  }
}

module.exports = { submitToGoogleForm };
