const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');

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

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock user database (replace with actual database in production)
const users = [
    { username: 'a', password: 'p' }
];

// Mock vouchers database (replace with actual database in production)
let vouchers = [
    { id: '1', code: 'WELCOME10', qrCode: null, createdAt: new Date() },
    { id: '2', code: 'SPECIAL20', qrCode: null, createdAt: new Date() }
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

app.post('/generate-qr', isAuthenticated, async (req, res) => {
    try {
        const voucherId = uuidv4();
        const voucherCode = `VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Generate QR code
        const qrCodeData = await qr.toDataURL(voucherCode);
        
        // Save voucher
        const newVoucher = {
            id: voucherId,
            code: voucherCode,
            qrCode: qrCodeData,
            createdAt: new Date()
        };
        vouchers.unshift(newVoucher);
        
        res.json({ success: true, voucher: newVoucher });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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