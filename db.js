const { Sequelize } = require("sequelize");
require('dotenv').config();

// Create a new Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.USER_NAME, process.env.DB_PASSWORD, {
  host: process.env.HOST,  
  dialect: process.env.DIALECT,   
  dialectOptions: {
    options: {
      encrypt: true,  // Use true for Azure SQL Database
      trustServerCertificate: true,  // For self-signed certs, use with caution
    },
  },
  logging: false,     // Disable logging (optional)
  port: 1433          // Default port for MSSQL
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports= {sequelize};
