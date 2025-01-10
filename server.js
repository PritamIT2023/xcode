const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { sequelize } = require('./db');
const authRouters = require('./auth/auth.routes');
const qrRouters = require('./QR/qr.routes');
const settingsRouters = require('./settings/settings.router');
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
app.use("/", authRouters);
app.use("", qrRouters);
app.use("", settingsRouters);




// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};


// Start server
const startServer = async () => {
    try {
    //    await sequelize.sync({ alter: true }); // Set to true in development to auto-update tables
      console.log("Database synced successfully");
      
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error("Unable to start server:", error);
    }
  };
  
  startServer();

  module.exports ={isAuthenticated}