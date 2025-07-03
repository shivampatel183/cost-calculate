const express = require("express");
const cors = require("cors");
const XlsxPopulate = require("xlsx-populate");
const fs = require("fs-extra");
const path = require("path");
const libre = require("libreoffice-convert");

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const MASTER_PATH = path.join(__dirname, "master", "template.xlsx");
const OUTPUT_DIR = path.join(__dirname, "outputs");
fs.ensureDirSync(OUTPUT_DIR);

// ✅ GLOBALS
const columnMap = [
  "date",
  "greenBox300x1200",
  "greenBox200x1000",
  "greenBox150x900",
  "greenBox200x1200",
  "greenBox400x400",
  "pressBox600x600",
  "pressBox200x1000",
  "pressBox150x900",
  "pressBox200x1200",
  "pressBox400x400",
  "colorBox200x1000",
  "wpBox600x600",
  "semiBox600x600",
  "beforeFlow600x600",
  "beforeFlow200x1000",
  "beforeFlow150x900",
  "beforeFlow200x1200",
  "beforeFlow400x400",
  "kilnEntry600x600",
  "kilnEntry200x1000",
  "kilnEntry150x900",
  "kilnEntry200x1200",
  "kilnEntry400x400",
  "packingBox600x600",
  "packingBox200x1000",
  "packingBox150x900",
  "packingBox200x1200",
  "packingBox400x400",
  "firedLoss600x600",
  "fireLoss200x1000",
  "fireLoss200x1200",
  "kilnFireLoss400x400",
  "sizingFireLoss400x400",
  "sprayDryerProduction",
  "coalConsumption",
  "electricityUnits",
  "gasConsumption",
  "preBox600x600",
  "stdBox600x600",
  "ecoBox600x600",
  "preBox200x1000",
  "stdBox200x1000",
  "ecoBox200x1000",
  "preBox150x900",
  "stdBox150x900",
  "ecoBox150x900",
  "preBox200x1200",
  "stdBox200x1200",
  "ecoBox200x1200",
  "preBox400x400",
  "stdBox400x400",
  "ecoBox400x400",
  "baseKg6",
  "brownKg6",
  "blackKg6",
  "blueKg6",
  "greenKg6",
  "baseKg2",
  "brownKg2",
  "blackKg2",
  "blueKg2",
  "greenKg2",
  "baseKg15",
  "brownKg15",
  "blackKg15",
  "blueKg15",
  "greenKg15",
  "beigeKg12",
  "brownKg12",
  "blackKg12",
  "blueKg12",
  "redKg12",
  "yellowKg12",
  "greenInk12",
  "carving12",
  "baseKg4",
  "brownKg4",
  "blackKg4",
  "blueKg4",
  "redKg4",
  "yellowKg4",
  "greenKg4",
  "maintenance",
  "legalUnlegal",
  "office",
  "diesel",
  "freight",
  "kilnGap",
  "cumulativeKilnGap",
];

const colLetter = (n) => {
  let result = "";
  while (n > 0) {
    let mod = (n - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    n = Math.floor((n - mod) / 26);
  }
  return result;
};

// ✅ POST route: Only save data to XLSX
app.post("/submit", async (req, res) => {
  try {
    const input = req.body;
    const userId = input.userId || "default";

    const userXlsxPath = path.join(OUTPUT_DIR, `${userId}.xlsx`);

    let workbook;
    if (await fs.pathExists(userXlsxPath)) {
      workbook = await XlsxPopulate.fromFileAsync(userXlsxPath);
    } else {
      if (!(await fs.pathExists(MASTER_PATH))) {
        throw new Error("Template file not found: " + MASTER_PATH);
      }
      await fs.copyFile(MASTER_PATH, userXlsxPath);
      workbook = await XlsxPopulate.fromFileAsync(userXlsxPath);
    }

    const sheet = workbook.sheet("Data Entry");
    let row = 6;
    while (sheet.cell(`A${row}`).value()) row++;

    columnMap.forEach((key, index) => {
      const col = colLetter(index + 1);
      const val = input[key];
      const finalVal =
        val == null || val === "" || isNaN(Number(val)) ? 0 : Number(val);
      sheet.cell(`${col}${row}`).value(finalVal);
    });

    await workbook.toFileAsync(userXlsxPath);

    res.json({ success: true, message: "Data saved successfully." });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ✅ GET route: Read rows
app.get("/data/:userId", async (req, res) => {
  const userId = req.params.userId;
  const userXlsxPath = path.join(OUTPUT_DIR, `${userId}.xlsx`);

  try {
    if (!(await fs.pathExists(userXlsxPath))) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const workbook = await XlsxPopulate.fromFileAsync(userXlsxPath);
    const sheet = workbook.sheet("Data Entry");

    const data = [];
    let row = 6;

    while (sheet.cell(`A${row}`).value()) {
      const rowObj = {};
      columnMap.forEach((key, index) => {
        const col = colLetter(index + 1);
        let val = sheet.cell(`${col}${row}`).value();
        if (val && typeof val === "object" && val.richText) {
          val = val
            .richText()
            .map((frag) => frag.text())
            .join("");
        }
        rowObj[key] = val;
      });
      data.push(rowObj);
      row++;
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error reading Excel:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/cost-pdf/:userId", async (req, res) => {
  const userId = req.params.userId;
  const userXlsxPath = path.join(OUTPUT_DIR, `${userId}.xlsx`);
  const tempXlsxPath = path.join(OUTPUT_DIR, `${userId}-cost-only.xlsx`);
  const pdfOutputPath = path.join(OUTPUT_DIR, `${userId}-cost.pdf`);

  try {
    if (!(await fs.pathExists(userXlsxPath))) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // Load workbook and extract Cost sheet
    const workbook = await XlsxPopulate.fromFileAsync(userXlsxPath);

    // ✅ Make Cost sheet active
    workbook.activeSheet("Cost");

    // ✅ (Optional) Hide other sheets for extra safety
    workbook.sheets().forEach((sheet) => {
      if (sheet.name() !== "Cost") {
        sheet.hidden(true);
      }
    });

    // Save to temp XLSX
    await workbook.toFileAsync(tempXlsxPath);

    // Convert to PDF with LibreOffice
    const docBuf = await fs.readFile(tempXlsxPath);
    const pdfBuf = await new Promise((resolve, reject) => {
      libre.convert(docBuf, ".pdf", undefined, (err, done) => {
        if (err) return reject(err);
        resolve(done);
      });
    });

    await fs.writeFile(pdfOutputPath, pdfBuf);
    await fs.remove(tempXlsxPath);

    // ✅ Serve and cleanup after download
    res.download(pdfOutputPath, `${userId}-cost.pdf`, async (err) => {
      if (err) {
        console.error("❌ Download error:", err);
      }
      try {
        await fs.remove(pdfOutputPath);
        console.log(`✅ Deleted temp file: ${pdfOutputPath}`);
      } catch (cleanupErr) {
        console.error("❌ Cleanup error:", cleanupErr);
      }
    });
  } catch (err) {
    console.error("❌ Error generating Cost PDF:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ✅ Serve files if needed
app.use("/outputs", express.static(OUTPUT_DIR));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
