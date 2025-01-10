const { Router } = require("express");
const { User } = require("../models/Users.model");
const router = Router();
const bcrypt = require("bcrypt");
const { QRData } = require("../models/QRDatas.model");
const qr = require("qrcode");
const { QRSettings } = require("../models/QRSettings.model");
const isAuthenticated = require("../middleware/auth.middleware");

// Route to handle fetching the user's vouchers and rendering the dashboard
router.get("/", isAuthenticated, async (req, res) => {
  const vouchers = await QRData.findAll({
    where: { userId: req.session.userId },
  });
  let vouchersWithQR = [];
  // Generate QR code URLs for each voucher
  if (vouchers) {
    vouchersWithQR = await Promise.all(
      vouchers.map(async (voucher) => {
        const qrCode = await qr.toDataURL(voucher.code); // Convert voucher code to a QR code image URL
        return { ...voucher.toJSON(), qrCode }; // Combine voucher data with its corresponding QR code
      })
    );
  }

  // Render the 'dashboard' view, passing the username and QR-code-augmented vouchers
  res.render("dashboard", {
    username: req.session.username,
    vouchers: vouchersWithQR ? vouchersWithQR : [],
  });
});

// Render login page
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

//
router.post("/login", async (req, res) => {
  let { username, password } = req.body;
  // Get user data from database
  const dbUser = await User.findOne({ where: { username: username } });
  if (!dbUser) {
    return res.status(400).json({ message: "User does not exist" }); // User does not exist into database
  }
  const isPasswordMatch = bcrypt.compareSync(password, dbUser.password);
  if (isPasswordMatch) {
    /**
     * @todo
     * Moved to registraion route
     * Whenever user register default QRsetting data to be create
     */
    let settings = await QRSettings.findOne({ where: { userId: dbUser.id } });
    if (!settings) {
      const settings = {
        expiryDays: 30,
        pdfWidth: 210, // A4 width in mm
        pdfHeight: 297, // A4 height in mm
        titleFontSize: 24,
        normalFontSize: 12,
      };

      await QRSettings.create({
        userId: dbUser.id,
        expiryDays: settings.expiryDays,
        pdfWidth: settings.pdfWidth,
        pdfHeight: settings.pdfHeight,
        titleFontSize: settings.titleFontSize,
        normalFontSize: settings.normalFontSize,
        status: "active"
      });
    }

    // Stroring information into sesseion data
    req.session.isAuthenticated = true;
    req.session.username = username;
    req.session.userId = dbUser.id;
    res.redirect("/");
  } else {
    res.render("login", { error: "Invalid username or password" });
  }
});

// Destroy session data and render login page
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
