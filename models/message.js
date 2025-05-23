const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');
const Trade = require('./trade');

const Message = database.define('message', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  trade_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Trade,
      key: 'id'
    }
  },
  sender_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  updatedAt: false // Se quiser só createdAt mesmo
});

// Associações para facilitar joins
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(Trade, { foreignKey: 'trade_id', as: 'trade' });

// database.sync({alter:true}) // Execute para criar a tabela

module.exports = Message;
