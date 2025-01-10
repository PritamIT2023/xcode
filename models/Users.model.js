const { Model, DataTypes }= require("sequelize");
const { sequelize } = require('../db');
class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: "User",
  tableName: "Users",
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports={User};