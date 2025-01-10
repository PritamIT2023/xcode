const { Router } = require("express");
const { QRSettings } = require("../models/QRSettings.model");
const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
      next();
  } else {
      res.redirect('/login');
  }
};


// Settings routes
router.get('/settings', isAuthenticated, async(req, res) => {
  const settings = await QRSettings.findOne({ where: { userId: req.session.userId } });
  res.render('settings', { settings });
});


router.post('/settings', isAuthenticated, async(req, res) => {
  try {
    const userSetting = await QRSettings.findOne({ where: { userId: req.session.userId } });

      const updatedSettings = {
          expiryDays: parseInt(req.body.expiryDays) || userSetting.expiryDays,
          pdfWidth: parseFloat(req.body.pdfWidth) || userSetting.pdfWidth,
          pdfHeight: parseFloat(req.body.pdfHeight) || userSetting.pdfHeight,
          titleFontSize: parseInt(req.body.titleFontSize) || userSetting.titleFontSize,
          normalFontSize: parseInt(req.body.normalFontSize) || userSetting.normalFontSize
      };

      // Validate settings
      if (updatedSettings.expiryDays < 1 || updatedSettings.expiryDays > 365) {
          throw new Error('Expiry days must be between 1 and 365');
      }
      if (updatedSettings.pdfWidth < 50 || updatedSettings.pdfHeight < 50) {
          throw new Error('PDF dimensions must be at least 50mm');
      }
      if (updatedSettings.titleFontSize < 8 || updatedSettings.normalFontSize < 6) {
          throw new Error('Font sizes must be at least 6pt');
      }

      const data = await QRSettings.update(updatedSettings, { where: { userId: req.session.userId } })
      res.json({ success: true, settings: data });
  } catch (error) {
      res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
