const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');
const Title = require('./title'); // Importa o model Title

const Book = database.define('book', {
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
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    author: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    approvalStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
    titleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'titles',
            key: 'id'
        }
    }
});

// Relacionamentos
User.hasMany(Book, { foreignKey: 'userId' });
Book.belongsTo(User, { foreignKey: 'userId' });

Title.hasMany(Book, { foreignKey: 'titleId' }); // Um título pode estar associado a vários books
Book.belongsTo(Title, { foreignKey: 'titleId' }); // Um book pode referenciar um título

// database.sync({ alter: true });

module.exports = Book;
