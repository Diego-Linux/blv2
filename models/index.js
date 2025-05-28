// const database = require('./connection');
// const User = require('./user');
// const Book = require('./book');
// const Notification = require('./notification');
// const Usertrade = require('./usertrade');
// const Trade = require('./trade');

// // Função para configurar associações
// function setupAssociations() {
//   // Associação entre Book e User
//   Book.belongsTo(User, { foreignKey: 'userId' });
//   User.hasMany(Book, { foreignKey: 'userId' });

//   // Associação entre Notificação e Usuário (usuário que vai receber a notificação)
//   Notification.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

//   // Associação entre Notificação e Usuário (usuário que gerou a notificação)
//   Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

//   // Associação entre Usertrade e User (sender e receiver)
//   Usertrade.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
//   Usertrade.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

//   // Associação entre Usertrade e Book (booksender e receiverbook)
//   Usertrade.belongsTo(Book, { foreignKey: 'booksender_id', as: 'booksender' });
//   Usertrade.belongsTo(Book, { foreignKey: 'bookreceiver_id', as: 'bookreceiver' });

//   // Associação entre Usertrade e Trade
//   Usertrade.belongsTo(Trade, { foreignKey: 'trade_id', as: 'trade' });
// }

// // Chame a função para configurar as associações
// setupAssociations();

// module.exports = { database, User, Book, Notification, Usertrade, Trade,setupAssociations };
