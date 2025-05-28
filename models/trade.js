const Sequelize = require('sequelize');
const database = require('./connection');

const Trade = database.define('trade', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    confirmed_by_sender: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    confirmed_by_receiver: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

// database.sync({alter:true})

module.exports = Trade;