const { Router } = require("express");
const router = Router();
const qr = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");
const { QRSettings } = require("../models/QRSettings.model");
const { QRData } = require("../models/QRDatas.model");
const isAuthenticated = require("../middleware/auth.middleware");

// Generate random number
function generateRandom5DigitNumber() {
  const min = 10000; // Minimum 5-digit number
  const max = 99999; // Maximum 5-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Update voucher generation to use settings
router.post("/generate-qr", isAuthenticated, async (req, res) => {
  try {
    let settings = await QRSettings.findOne({
      where: { userId: req.session.userId },
    });
    // If setting does not exist make a default settings
    if (!settings) {
      // Default settings
      settings = {
        expiryDays: 30,
        pdfWidth: 210, // A4 width in mm
        pdfHeight: 297, // A4 height in mm
        titleFontSize: 24,
        normalFontSize: 12,
      };
    }
    const voucherName = `VOUCHER-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    const voucherCode = `${generateRandom5DigitNumber()}-${generateRandom5DigitNumber()}`;
    const qrCodeData = await qr.toDataURL(voucherCode); //Outputs a base64 encoded QR code image

    const newVoucher = {
      name: voucherName,
      code: voucherCode,
      generatedDate: new Date(),
      expiryDate: new Date(
        Date.now() + settings.expiryDays * 24 * 60 * 60 * 1000
      ),
    };
    let createData = await QRData.create({ userId: req.session.userId,status: "active", ...newVoucher });
    // Add base64 encoded QR code image
    let data = { qrCode: qrCodeData, id:createData.id,  ...newVoucher };

    res.json({ success: true, voucher: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update PDF generation to use settings
router.get("/export-pdf/:voucherId", isAuthenticated, async (req, res) => {
  try {
    let settings = await QRSettings.findOne({
      where: { userId: req.session.userId },
    });
    // If setting does not exist make a default settings
    if (!settings) {
      // Default settings
      settings = {
        expiryDays: 30,
        pdfWidth: 210, // A4 width in mm
        pdfHeight: 297, // A4 height in mm
        titleFontSize: 24,
        normalFontSize: 12,
      };
    }
    const vouchers = await QRData.findAll({
      where: { userId: req.session.userId },
    });
    const voucher = vouchers.find((v) => v.id == req.params.voucherId);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }

    const doc = new PDFDocument({
      size: [settings.pdfWidth * 2.83465, settings.pdfHeight * 2.83465], // Convert mm to points
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=voucher-${voucher.code}.pdf`
    );
    doc.pipe(res);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(settings.titleFontSize)
      .text(voucher.name, { align: "center" });

    // Voucher Code
    doc
      .moveDown()
      .fontSize(settings.titleFontSize * 0.75)
      .text(voucher.code, { align: "center" });

    // Dates
    doc
      .moveDown()
      .fontSize(settings.normalFontSize)
      .font("Helvetica")
      .text(`Generated: ${voucher.createdAt.toLocaleDateString()}`, {
        align: "center",
      })
      .text(`Expires: ${voucher.expiryDate.toLocaleDateString()}`, {
        align: "center",
      });

    // QR Code
    const qrCode = await qr.toDataURL(voucher.code);
    const qrImageData = qrCode.split(",")[1];
    const qrImageBuffer = Buffer.from(qrImageData, "base64");
    const qrSize =
      Math.min(settings.pdfWidth, settings.pdfHeight) * 0.5 * 2.83465;
    const xPosition = (doc.page.width - qrSize) / 2;

    doc.moveDown(2).image(qrImageBuffer, xPosition, doc.y, {
      width: qrSize,
      height: qrSize,
    });

    doc
      .moveDown(22)
      .fontSize(settings.normalFontSize)
      .text("Scan QR code to redeem your voucher", { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating PDF");
  }
});

// Add new print endpoint
router.get("/print-pdf/:voucherId", isAuthenticated, async (req, res) => {
  try {
    let settings = await QRSettings.findOne({
      where: { userId: req.session.userId },
    });

    if (!settings) {
      // Default settings
      settings = {
        expiryDays: 30,
        pdfWidth: 210, // A4 width in mm
        pdfHeight: 297, // A4 height in mm
        titleFontSize: 24,
        normalFontSize: 12,
      };
    }
    const vouchers = await QRData.findAll({
      where: { userId: req.session.userId },
    });
    const voucher = vouchers.find((v) => v.id == req.params.voucherId);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }

    const doc = new PDFDocument({
      size: [settings.pdfWidth * 2.83465, settings.pdfHeight * 2.83465], // Convert mm to points
      margin: 50,
    });

    // Set response headers for inline display (for printing)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=voucher-" + voucher.code + ".pdf"
    );

    doc.pipe(res);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(settings.titleFontSize)
      .text(voucher.name, { align: "center" });

    // Voucher Code
    doc
      .moveDown()
      .fontSize(settings.titleFontSize * 0.75)
      .text(voucher.code, { align: "center" });

    // Dates
    doc
      .moveDown()
      .fontSize(settings.normalFontSize)
      .font("Helvetica")
      .text(`Generated: ${voucher.createdAt.toLocaleDateString()}`, {
        align: "center",
      })
      .text(`Expires: ${voucher.expiryDate.toLocaleDateString()}`, {
        align: "center",
      });

    // QR Code
    const qrCode = await qr.toDataURL(voucher.code);
    const qrImageData = qrCode.split(",")[1];
    const qrImageBuffer = Buffer.from(qrImageData, "base64");
    const qrSize =
      Math.min(settings.pdfWidth, settings.pdfHeight) * 0.5 * 2.83465;
    const xPosition = (doc.page.width - qrSize) / 2;

    doc.moveDown(2).image(qrImageBuffer, xPosition, doc.y, {
      width: qrSize,
      height: qrSize,
    });

    doc
      .moveDown(22)
      .fontSize(settings.normalFontSize)
      .text("Scan QR code to redeem your voucher", { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating PDF for printing");
  }
});

module.exports = router;