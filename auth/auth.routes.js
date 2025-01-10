const { Router } = require("express");
const { User } = require("../models/Users.model");
const router = Router();
const bcrypt = require('bcrypt');
const { QRData } = require("../models/QRDatas.model");
const qr = require('qrcode');
const { QRSettings } = require("../models/QRSettings.model");

const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
      next();
  } else {
      res.redirect('/login');
  }
};

// 
router.get('/api', (req, res) => {
    res.send('Hello World!')
})

router.get('/', isAuthenticated, async (req, res) => {
    const vouchers = await QRData.findAll({where: {userId: req.session.userId}});
   let vouchersWithQR = [];
    if (vouchers) {
        vouchersWithQR = await Promise.all(vouchers.map(async (voucher) => {
            const qrCode = await qr.toDataURL(voucher.code);
            return { ...voucher.toJSON(), qrCode };
        }));
    }

    res.render('dashboard', { 
        username: req.session.username,
        vouchers: vouchersWithQR ? vouchersWithQR : []
    });
});


//
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

//
router.post('/login', async(req, res) => {
    let { username, password } = req.body;
    const dbUser = await User.findOne({where: {username: username}});
    if (!dbUser) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const isPasswordMatch = bcrypt.compareSync(password, dbUser.password);
    if (isPasswordMatch) {
        //
        let settings = await QRSettings.findOne({where: {userId: dbUser.id}});
        if(!settings){
        const settings = {
            expiryDays: 30,
            pdfWidth: 210, // A4 width in mm
            pdfHeight: 297, // A4 height in mm
            titleFontSize: 24,
            normalFontSize: 12
            };

            await QRSettings.create({
                userId: dbUser.id,
                expiryDays: settings.expiryDays,
                pdfWidth: settings.pdfWidth,
                pdfHeight: settings.pdfHeight,
                titleFontSize: settings.titleFontSize,
                normalFontSize: settings.normalFontSize
            })
        }
        req.session.isAuthenticated = true;
        req.session.username = username;
        req.session.userId = dbUser.id;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});


module.exports = router;