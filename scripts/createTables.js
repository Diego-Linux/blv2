require('dotenv').config();
const database = require('../models/connection');
const User = require('../models/user');
const Book = require('../models/book');
const Trade = require('../models/trade');
const UserTrade = require('../models/usertrade');
const Notification = require('../models/notification');

async function syncModels() {
    try {
        // Testa a conexão
        await database.authenticate();
        console.log('Conexão com o banco de dados estabelecida.');
        // Sincroniza os models na ordem correta
        await User.sync({ force: true });
        console.log('Tabela User criada.');

        await Book.sync({ force: true });
        console.log('Tabela Book criada.');

        await Trade.sync({ force: true });
        console.log('Tabela Trade criada.');

        await UserTrade.sync({ force: true });
        console.log('Tabela UserTrade criada.');

        await Notification.sync({ force: true });
        console.log('Tabela Notification criada.');

        console.log('Todos os models foram sincronizados com sucesso.');
    } catch (error) {
        console.error('Erro ao sincronizar os models:', error);
    } finally {
        // Encerra a conexão com o banco de dados após a sincronização
        await database.close();
        console.log('Conexão com o banco de dados encerrada.');
    }
}
// Executa a função de sincronização
syncModels();
