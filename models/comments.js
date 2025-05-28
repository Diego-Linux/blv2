const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');
const Title = require('./title');

const Comment = database.define('comment', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    text: {
        type: Sequelize.TEXT,
        allowNull: false
    }
});

Title.hasMany(Comment, {
    foreignKey: 'titleId',
    onDelete: 'CASCADE'
});
Comment.belongsTo(Title, {
    foreignKey: 'titleId'
});

User.hasMany(Comment, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});
Comment.belongsTo(User, {
    foreignKey: 'userId'
});


// database.sync({alter:true})

module.exports = Comment;
