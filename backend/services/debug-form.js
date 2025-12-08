// debug-form.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const LOGS_DIR = path.join(__dirname, "../logs");
const BROWSER_DATA_DIR = path.join(__dirname, "../browser-data");

async function debugForm() {
  // Ensure directories exist
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: BROWSER_DATA_DIR,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Ganti dengan URL form Anda
  const formUrl =
    process.env.GOOGLE_FORM_URL || "https://forms.gle/nP6ZWewJZcg6pBwp8";
  console.log(`🌐 Opening form: ${formUrl}`);

  await page.goto(formUrl, { waitUntil: "networkidle2" });
  await wait(5000);

  console.log("\n=== DEBUG FORM STRUCTURE ===\n");

  // 1. Debug URL dan status
  console.log("1. PAGE INFO:");
  console.log(`   URL: ${page.url()}`);
  console.log(`   Title: ${await page.title()}`);

  // 2. Cari semua element yang berisi "Upload Foto"
  console.log('\n2. ELEMENTS CONTAINING "UPLOAD FOTO":');
  const uploadElements = await page.evaluate(() => {
    const elements = [];
    const allElements = document.querySelectorAll("*");

    allElements.forEach((el) => {
      const text = el.textContent || "";
      if (text.includes("Upload Foto")) {
        elements.push({
          tagName: el.tagName,
          text: text.trim().substring(0, 100),
          id: el.id,
          className: el.className,
          role: el.getAttribute("role"),
          "aria-label": el.getAttribute("aria-label"),
          parentHTML: el.parentElement
            ? el.parentElement.outerHTML.substring(0, 200)
            : "",
          outerHTML: el.outerHTML.substring(0, 300),
        });
      }
    });

    return elements;
  });

  console.log(`Found ${uploadElements.length} elements with "Upload Foto":`);
  uploadElements.forEach((el, i) => {
    console.log(`\n[${i}] ${el.tagName}: "${el.text}"`);
    console.log(`   ID: ${el.id}`);
    console.log(`   Class: ${el.className}`);
    console.log(`   Role: ${el.role}`);
    console.log(`   Aria-label: ${el["aria-label"]}`);
    console.log(`   Parent snippet: ${el.parentHTML}`);
  });

  // 3. Cari tombol "Tambahkan file"
  console.log('\n3. BUTTONS WITH "TAMBAHKAN FILE":');
  const tambahkanButtons = await page.evaluate(() => {
    const buttons = [];
    const allElements = document.querySelectorAll("button, div, span, a");

    allElements.forEach((el) => {
      const text = el.textContent || "";
      if (text.includes("Tambahkan file")) {
        const rect = el.getBoundingClientRect();
        buttons.push({
          tagName: el.tagName,
          text: text.trim(),
          id: el.id,
          className: el.className,
          role: el.getAttribute("role"),
          "aria-label": el.getAttribute("aria-label"),
          isVisible: rect.width > 0 && rect.height > 0,
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          outerHTML: el.outerHTML.substring(0, 500),
        });
      }
    });

    return buttons;
  });

  console.log(
    `Found ${tambahkanButtons.length} buttons with "Tambahkan file":`
  );
  tambahkanButtons.forEach((btn, i) => {
    console.log(`\n[${i}] ${btn.tagName}: "${btn.text}"`);
    console.log(`   ID: ${btn.id}`);
    console.log(`   Class: ${btn.className}`);
    console.log(`   Role: ${btn.role}`);
    console.log(`   Aria-label: ${btn["aria-label"]}`);
    console.log(`   Visible: ${btn.isVisible}`);
    console.log(
      `   Position: x=${btn.position.x}, y=${btn.position.y}, w=${btn.position.width}, h=${btn.position.height}`
    );
  });

  // 4. Cari semua form fields
  console.log("\n4. ALL FORM FIELDS:");
  const formFields = await page.evaluate(() => {
    const fields = [];

    // Cari dengan berbagai selector yang umum di Google Forms
    const selectors = [
      'div[role="listitem"]',
      "div[data-params]",
      "div[jscontroller]",
      "div[jsname]",
      "div.form-field",
      "div.Qr7Oae",
      "div.eN1Rbf",
    ];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        const text = el.textContent || "";
        if (text.trim()) {
          fields.push({
            selector,
            index,
            text: text.trim().substring(0, 150).replace(/\n/g, " | "),
            className: el.className,
            id: el.id,
            "data-params": el.getAttribute("data-params"),
            jscontroller: el.getAttribute("jscontroller"),
            jsname: el.getAttribute("jsname"),
            children: Array.from(el.children).map((child) => ({
              tag: child.tagName,
              class: child.className,
              text: child.textContent?.substring(0, 50) || "",
            })),
          });
        }
      });
    });

    return fields;
  });

  console.log(`Found ${formFields.length} form fields:`);
  formFields.forEach((field, i) => {
    console.log(`\n[${i}] ${field.selector}:`);
    console.log(`   Text: ${field.text}`);
    console.log(`   Class: ${field.className}`);
    console.log(`   ID: ${field.id}`);
    console.log(`   jscontroller: ${field.jscontroller}`);
    console.log(`   jsname: ${field.jsname}`);
    console.log(`   Children: ${field.children.length}`);
  });

  // 5. Screenshot dan highlight tombol
  console.log("\n5. TAKING SCREENSHOTS...");

  // Screenshot full page
  const fullScreenshot = path.join(LOGS_DIR, "debug-form-full.png");
  await page.screenshot({ path: fullScreenshot, fullPage: true });
  console.log(`   Full screenshot: ${fullScreenshot}`);

  // Highlight tombol "Tambahkan file" dan screenshot
  if (tambahkanButtons.length > 0) {
    await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      elements.forEach((el) => {
        const text = el.textContent || "";
        if (text.includes("Tambahkan file")) {
          el.style.border = "3px solid red";
          el.style.backgroundColor = "yellow";
        }
      });
    });

    await wait(1000);
    const highlightScreenshot = path.join(LOGS_DIR, "debug-form-highlight.png");
    await page.screenshot({ path: highlightScreenshot, fullPage: true });
    console.log(`   Highlight screenshot: ${highlightScreenshot}`);
  }

  // 6. Coba klik tombol pertama dan debug picker
  if (tambahkanButtons.length > 0) {
    console.log("\n6. TESTING BUTTON CLICK...");

    // Simpan HTML sebelum click
    const htmlBefore = await page.content();
    fs.writeFileSync(
      path.join(LOGS_DIR, "debug-before-click.html"),
      htmlBefore
    );
    console.log(
      `   HTML saved: ${path.join(LOGS_DIR, "debug-before-click.html")}`
    );

    // Coba klik tombol pertama
    try {
      await page.evaluate(() => {
        const elements = document.querySelectorAll("*");
        for (const el of elements) {
          const text = el.textContent || "";
          if (text.includes("Tambahkan file")) {
            console.log("Clicking element:", el.outerHTML.substring(0, 200));
            el.click();
            return true;
          }
        }
        return false;
      });

      console.log("   Button clicked, waiting for picker...");
      await wait(5000);

      // Debug frames setelah click
      const frames = page.frames();
      console.log(`   Total frames after click: ${frames.length}`);

      frames.forEach((frame, i) => {
        console.log(`   Frame ${i}: ${frame.url().substring(0, 100)}`);
      });

      // Screenshot setelah click
      const afterClickScreenshot = path.join(LOGS_DIR, "debug-after-click.png");
      await page.screenshot({ path: afterClickScreenshot, fullPage: true });
      console.log(`   After click screenshot: ${afterClickScreenshot}`);

      // Save HTML setelah click
      const htmlAfter = await page.content();
      fs.writeFileSync(
        path.join(LOGS_DIR, "debug-after-click.html"),
        htmlAfter
      );
      console.log(`   HTML after click saved`);
    } catch (error) {
      console.log(`   Error clicking button: ${error.message}`);
    }
  }

  // 7. Manual testing mode
  console.log("\n=== MANUAL TESTING MODE ===");
  console.log("Browser will stay open for 2 minutes for manual inspection.");
  console.log("You can:");
  console.log("1. Click on buttons manually");
  console.log("2. Inspect elements with DevTools");
  console.log("3. Take notes of selectors");
  console.log("\nPress Ctrl+C in terminal to close.");

  // Wait for manual inspection
  await wait(120000);

  await browser.close();
  console.log("\n✅ Debug completed.");
}

// Run debug
debugForm().catch((error) => {
  console.error("❌ Debug error:", error);
  process.exit(1);
});
