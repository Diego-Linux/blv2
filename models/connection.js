const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: "mysql",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        logging: false // <- desativa os logs SQL
    });

module.exports = sequelize;