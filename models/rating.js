const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');    // Ajuste o caminho conforme sua estrutura
const Title = require('./title');  // Ajuste o caminho conforme sua estrutura

const Rating = database.define('rating', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    }
});

// Definindo os relacionamentos
Rating.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Rating.belongsTo(Title, { foreignKey: 'titleId', onDelete: 'CASCADE' });

User.hasMany(Rating, { foreignKey: 'userId' });
Title.hasMany(Rating, { foreignKey: 'titleId' });

module.exports = Rating;
