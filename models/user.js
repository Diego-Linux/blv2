const Sequelize = require('sequelize');
const database = require('./connection');
const path = require('path');

const User = database.define('user', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
     estrela: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tradeCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

// database.sync({alter:true})

module.exports = User;
