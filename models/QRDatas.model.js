const { Model, DataTypes }= require("sequelize");
const { sequelize } = require('../db');
class QRData extends Model {}

QRData.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  generatedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
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
  modelName: "QRData",
  tableName: "QRDatas",
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports= {QRData};