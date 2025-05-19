const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');

const Notification = database.define('notification', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    tradeAccepted:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

// Associação entre Notificação e Usuário (usuário que vai receber a notificação)
Notification.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Associação entre Notificação e Usuário (usuário que gerou a notificação, ex: quem solicitou a troca)
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// database.sync({alter:true})

module.exports = Notification;
