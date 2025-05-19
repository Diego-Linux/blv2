require('dotenv').config();
const database = require('../models/connection');

// Importação dos models
const User = require('../models/user');
const Title = require('../models/title');
const Book = require('../models/book');
const Trade = require('../models/trade');
const UserTrade = require('../models/usertrade');
const Notification = require('../models/notification');

async function syncModels() {
    try {
        await database.authenticate();
        console.log('Conexão com o banco de dados estabelecida.');

        // Ordem correta para sincronização, respeitando dependências
        await User.sync({ force: true });
        console.log('Tabela User criada.');

        await Title.sync({ force: true });
        console.log('Tabela Title criada.');

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
        await database.close();
        console.log('Conexão com o banco de dados encerrada.');
    }
}

syncModels();
