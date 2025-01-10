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
require('dotenv').config();
const port = process.env.PORT || 3000;

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

/**
 * Register all routes
 */
app.use("", authRouters);
app.use("", qrRouters);
app.use("", settingsRouters);


// Start server
const startServer = async () => {
    try {
      // It automatically creates the table in database if it doesn't exist
      //await sequelize.sync({ alter: true }); // Set to true in development to auto-update tables
      console.log("Database synced successfully");
      
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error("Unable to start server:", error);
    }
  };
  
  startServer();