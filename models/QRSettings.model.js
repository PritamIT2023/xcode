const { Model, DataTypes }= require("sequelize");
const { sequelize } = require('../db');
class QRSettings extends Model {}

QRSettings.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
    expiryDays:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pdfWidth:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pdfHeight:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titleFontSize:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    normalFontSize:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Name of the referenced table
        key: 'id',     // Key in the referenced table
      },
    },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: "QRSettings",
  tableName: "QRSettings",
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports= {QRSettings};