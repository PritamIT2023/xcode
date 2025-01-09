const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));


// Default settings
let settings = {
    expiryDays: 30,
    pdfWidth: 210, // A4 width in mm
    pdfHeight: 297, // A4 height in mm
    titleFontSize: 24,
    normalFontSize: 12
};



// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Mock user database (replace with actual database in production)
const users = [
    { username: 'a', password: 'p' }
];

// Mock vouchers database (replace with actual database in production)
let vouchers = [
    { 
        id: '1', 
        code: 'WELCOME10', 
        qrCode: null, 
        createdAt: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
];

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
app.get('/', isAuthenticated, async (req, res) => {
    res.render('dashboard', { 
        username: req.session.username,
        vouchers: vouchers 
    });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        req.session.isAuthenticated = true;
        req.session.username = username;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

// Update voucher generation to use settings
app.post('/generate-qr', isAuthenticated, async (req, res) => {
    try {
        const voucherId = uuidv4();
        const voucherCode = `VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const qrCodeData = await qr.toDataURL(voucherCode);
        
        const newVoucher = {
            id: voucherId,
            code: voucherCode,
            qrCode: qrCodeData,
            createdAt: new Date(),
            expiryDate: new Date(Date.now() + settings.expiryDays * 24 * 60 * 60 * 1000)
        };
        vouchers.unshift(newVoucher);
        
        res.json({ success: true, voucher: newVoucher });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update PDF generation to use settings
app.get('/export-pdf/:voucherId', isAuthenticated, async (req, res) => {
    try {
        const voucher = vouchers.find(v => v.id === req.params.voucherId);
        if (!voucher) {
            return res.status(404).send('Voucher not found');
        }

        const doc = new PDFDocument({
            size: [settings.pdfWidth * 2.83465, settings.pdfHeight * 2.83465], // Convert mm to points
            margin: 50
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=voucher-${voucher.code}.pdf`);
        doc.pipe(res);

        // Title
        doc.font('Helvetica-Bold')
           .fontSize(settings.titleFontSize)
           .text('VOUCHER', { align: 'center' });

        // Voucher Code
        doc.moveDown()
           .fontSize(settings.titleFontSize * 0.75)
           .text(voucher.code, { align: 'center' });

        // Dates
        doc.moveDown()
           .fontSize(settings.normalFontSize)
           .font('Helvetica')
           .text(`Generated: ${voucher.createdAt.toLocaleDateString()}`, { align: 'center' })
           .text(`Expires: ${voucher.expiryDate.toLocaleDateString()}`, { align: 'center' });

        // QR Code
        const qrImageData = voucher.qrCode.split(',')[1];
        const qrImageBuffer = Buffer.from(qrImageData, 'base64');
        const qrSize = Math.min(settings.pdfWidth, settings.pdfHeight) * 0.5 * 2.83465;
        const xPosition = (doc.page.width - qrSize) / 2;

        doc.moveDown(2)
           .image(qrImageBuffer, xPosition, doc.y, {
               width: qrSize,
               height: qrSize
           });

        doc.moveDown(2)
           .fontSize(settings.normalFontSize)
           .text('Scan QR code to redeem your voucher', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
});


// Add new print endpoint
app.get('/print-pdf/:voucherId', isAuthenticated, async (req, res) => {
    try {
        const voucher = vouchers.find(v => v.id === req.params.voucherId);
        if (!voucher) {
            return res.status(404).send('Voucher not found');
        }

        const doc = new PDFDocument({
            size: [settings.pdfWidth * 2.83465, settings.pdfHeight * 2.83465], // Convert mm to points
            margin: 50
        });

        // Set response headers for inline display (for printing)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=voucher-' + voucher.code + '.pdf');

        doc.pipe(res);

        // Title
        doc.font('Helvetica-Bold')
           .fontSize(settings.titleFontSize)
           .text('VOUCHER', { align: 'center' });

        // Voucher Code
        doc.moveDown()
           .fontSize(settings.titleFontSize * 0.75)
           .text(voucher.code, { align: 'center' });

        // Dates
        doc.moveDown()
           .fontSize(settings.normalFontSize)
           .font('Helvetica')
           .text(`Generated: ${voucher.createdAt.toLocaleDateString()}`, { align: 'center' })
           .text(`Expires: ${voucher.expiryDate.toLocaleDateString()}`, { align: 'center' });

        // QR Code
        const qrImageData = voucher.qrCode.split(',')[1];
        const qrImageBuffer = Buffer.from(qrImageData, 'base64');
        const qrSize = Math.min(settings.pdfWidth, settings.pdfHeight) * 0.5 * 2.83465;
        const xPosition = (doc.page.width - qrSize) / 2;

        doc.moveDown(2)
           .image(qrImageBuffer, xPosition, doc.y, {
               width: qrSize,
               height: qrSize
           });

        doc.moveDown(2)
           .fontSize(settings.normalFontSize)
           .text('Scan QR code to redeem your voucher', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF for printing');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});