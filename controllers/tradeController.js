const { Op } = require('sequelize');
const Book = require('../models/book')
const User = require('../models/user')
const Trade = require('../models/trade')
const Notification = require('../models/notification')
const Usertrade = require('../models/usertrade')

exports.requestTrade = async (req, res) => {
    try {
        const sender_id = req.session.userId;
        const { receiver_id, booksender_id, bookreceiver_id } = req.body;

        // Verifica se os IDs dos usuários e dos livros foram enviados
        if (!sender_id || !receiver_id || !booksender_id || !bookreceiver_id) {
            return res.status(400).json({ error: 'Dados incompletos para solicitar a troca.' });
        }

        // Verifica se os IDs dos usuários são diferentes
        if (sender_id === receiver_id) {
            return res.status(400).json({ error: 'Não é possível trocar livros consigo mesmo.' });
        }

        // Verifica se os livros pertencem aos usuários
        const senderHasBook = await Book.findOne({ where: { id: booksender_id, userId: sender_id } });
        const receiverHasBook = await Book.findOne({ where: { id: bookreceiver_id, userId: receiver_id } });

        if (!senderHasBook || !receiverHasBook) {
            return res.status(400).json({ error: 'Os livros selecionados não pertencem aos usuários informados.' });
        }

        // Verifica se o usuário já fez uma solicitação para esse livro anteriormente
        const existingTrade = await Usertrade.findOne({
            where: {
                sender_id,
                booksender_id
            },
            include: [
                {
                    model: Trade,
                    as: 'trade', // Usando o alias definido na associação
                    where: { status: 'pending' }
                }
            ]
        });

        if (existingTrade) {
            return res.status(400).json({ error: 'Você já possui uma solicitação pendente para este livro.' });
        }

        // Cria a solicitação de troca
        const newTrade = await Trade.create({ status: 'pending' });
        
        // Associa a troca aos usuários e livros envolvidos
        await Usertrade.create({
            sender_id,
            receiver_id,
            booksender_id,
            bookreceiver_id,
            trade_id: newTrade.id,
            status: 'pending',
        });

        // Buscar os nomes dos usuários para exibir na notificação
        const sender = await User.findByPk(sender_id); // Encontrar o usuário que enviou a solicitação

        // Cria uma notificação para o usuário que vai receber a solicitação de troca
        await Notification.create({
            type: 'trade_request',
            message: `Você recebeu uma solicitação de troca de ${sender.name}.`, // Exibe o nome do sender
            isRead: false,
            receiver_id: receiver_id, // Usuário que vai receber a notificação
            sender_id: sender_id // Usuário que enviou a solicitação
        });

        return res.redirect('/mybooks');
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao solicitar a troca de livros.', details: err.message });
    }
};

exports.myTrades = async (req, res) => {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    try {
        let trades;
        trades = await Usertrade.findAll({
            where: {
                [Op.or]: [
                    { receiver_id: userId },
                    { sender_id: userId }
                ]
            },
            include: [
                {
                    model: Trade,
                    as: 'trade',
                    where: { status: { [Op.not]: 'pending' } }, // Condição para buscar trocas com status diferente de 'pending'
                },
                {
                    model: Book,
                    as: 'bookreceiver',
                    attributes: ['id', 'name','image']
                },
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name','image']
                },
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name']
                }
                , {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name']
                }
            ],
            limit: perPage,
            offset: offset,
        });

        const totalCount = await Usertrade.count({
            where: {
                [Op.or]: [
                    { receiver_id: userId },
                    { sender_id: userId }
                ]
            }
        });
        const totalPages = Math.ceil(totalCount / perPage);

        res.render('mytrades', {
            validationErrors: req.flash('validationErrors'),
            trades: trades,
            req: req,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Erro ao buscar trocas:', error);
        res.status(500).send('Erro ao buscar trocas');
    }
};

exports.requestsList = async (req, res) => {
    const userId = req.session.userId; // ID do usuário recebido como parâmetro da rota
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 10; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset
    try {
        let trades;
        // Realiza a busca das trocas do usuário considerando paginação e inclui os dados dos livros associados
        trades = await Usertrade.findAll({
            where: { receiver_id: userId },
            include: [
                {
                    model: Trade,
                    as: 'trade',
                    where: { status: 'pending' }, // Condição para buscar trocas com status 'pending'
                },
                {
                    model: Book,
                    as: 'bookreceiver',
                    attributes: ['id', 'name']
                }, // Use o alias 'bookreceiver' para o livro receptor
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name']
                }, // Use o alias 'booksender' para o livro enviado
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name']
                } // Use o alias 'sender' para o usuário que enviou a troca
            ],
            limit: perPage,
            offset: offset,
        });
        // Conta o número total de trocas do usuário para calcular o total de páginas
        const totalCount = await Usertrade.count({ where: { receiver_id: userId } });
        const totalPages = Math.ceil(totalCount / perPage);
        // Envie as trocas encontradas como resposta
        // Se desejar renderizar uma página com os dados, descomente esta seção
        // res.json(trades)
        res.render('reqlist', {
            validationErrors: req.flash('validationErrors'),
            trades: trades,
            req: req,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log(error)
        console.error('Erro ao buscar solicitações:', error);
        res.status(500).send('Erro ao buscar solicitações');
    }
};

exports.acceptTrade = async (req, res) => {
    const tradeId = req.params.id;
    try {
        const checkTrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: Book, as: 'bookreceiver' },
                { model: Book, as: 'booksender' },
                { model: User, as: 'receiver' }, // Incluindo receiver
                { model: User, as: 'sender' } // Incluindo sender
            ]
        });

        if (!checkTrade || !checkTrade.trade) {
            return res.status(404).send('Troca não encontrada ou já foi aceita');
        }

        // Altera o status da troca para "progress"
        checkTrade.trade.status = 'progress';
        await checkTrade.trade.save();

        // Atualiza o status dos livros
        const bookReceiver = checkTrade.bookreceiver;
        bookReceiver.status = 'unavailable';
        await bookReceiver.save();

        const bookSender = checkTrade.booksender;
        bookSender.status = 'unavailable';
        await bookSender.save();

        // Obtém os IDs do sender e receiver
        const senderId = checkTrade.sender_id;
        const receiverId = checkTrade.receiver_id;

        // Busca os nomes dos usuários
        const sender = await User.findByPk(senderId);
        const receiver = await User.findByPk(receiverId);

        if (!sender || !receiver) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Notificação para o sender que a troca foi aceita
        await Notification.create({
            type: 'trade_update', // tipo de notificação diferente
            message: `${receiver.name} aceitou sua solicitação de trade.`,
            isRead: false,
            receiver_id: senderId, // Usuário que enviou a solicitação
            sender_id: receiverId // Usuário que aceitou a solicitação
        });

        res.redirect('/trade/reqlist');
    } catch (error) {
        console.log(error);
        console.error('Erro ao aceitar troca:', error);
        res.status(500).send('Erro ao aceitar troca');
    }
};
exports.rejectTrade = async (req, res) => {
    const tradeId = req.params.id;
    try {
        const checkTrade = await Usertrade.findByPk(tradeId, {
            include: [{ model: Book, as: 'bookreceiver' },
            { model: Trade, as: 'trade', where: { status: 'pending' } },
            { model: Book, as: 'booksender' }]
        })
        if (!checkTrade) {
            return res.status(404).send('Troca não encontrada')
        }
        checkTrade.trade.status = 'rejected';
        await checkTrade.trade.save();

        res.redirect('/trade/reqlist')
    } catch (error) {
        console.error('Erro ao rejeitar troca:', error)
        res.status(500).send('Erro ao rejeitar troca')
    }
};
