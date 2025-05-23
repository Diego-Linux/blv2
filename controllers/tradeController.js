const { Op, Sequelize } = require('sequelize');
const Book = require('../models/book')
const User = require('../models/user')
const Trade = require('../models/trade')
const Notification = require('../models/notification')
const Usertrade = require('../models/usertrade')
const Message = require('../models/message')

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
            req.flash('validationErrors', 'Você já fez uma solicitação usando este livro.');
            return res.redirect(`/books/${bookreceiver_id}`);
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

        return res.redirect('/trade/myrequests');
    } catch (err) {
        res.render('error')
    }
};

exports.cancelRequest = async (req, res) => {
    const tradeId = req.params.id;
    const userId = req.session.userId;

    try {
        const userTrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } }
            ]
        });

        if (!userTrade || !userTrade.trade) {
            req.flash('validationErrors', 'Solicitação já foi cancelada ou processada.');
            return res.redirect('/trade/mytrades');
        }

        if (userTrade.sender_id !== userId) {
            return res.status(403).send('Você não tem permissão para cancelar esta solicitação.');
        }

        userTrade.trade.status = 'rejected';
        await userTrade.trade.save();

        await Notification.create({
            type: 'trade_update',
            message: `O usuário cancelou a solicitação de troca.`,
            isRead: false,
            receiver_id: userTrade.receiver_id,
            sender_id: userId
        });

        req.flash('validationErrors', 'Solicitação cancelada com sucesso.');
        res.redirect('/trade/myrequests');
    } catch (error) {
        console.error('Erro ao cancelar solicitação:', error);
        res.status(500).send('Erro ao cancelar solicitação');
    }
};

exports.myRequests = async (req, res) => {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    try {
        const trades = await Usertrade.findAll({
            where: { sender_id: userId },
            include: [
                {
                    model: Trade,
                    as: 'trade',
                    where: { status: 'pending' },
                },
                {
                    model: Book,
                    as: 'bookreceiver',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name', 'image']
                }
            ],
            limit: perPage,
            offset: offset,
        });

        const totalCount = await Usertrade.count({ where: { sender_id: userId } });
        const totalPages = Math.ceil(totalCount / perPage);

        res.render('myrequests', {
            validationErrors: req.flash('validationErrors'),
            trades: trades,
            req: req,
            currentPage: page,
            totalPages: totalPages,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Erro ao buscar suas solicitações');
    }
};

exports.myTrades = async (req, res) => {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    try {
        const trades = await Usertrade.findAll({
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
                    where: {
                        status: { [Op.not]: 'rejected' }  // Excluir só as rejeitadas
                    },
                    required: true
                },
                {
                    model: Book,
                    as: 'bookreceiver',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset: offset,
        });

        const totalCount = await Usertrade.count({
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
                    where: {
                        status: { [Op.not]: 'rejected' }
                    },
                    required: true
                }
            ]
        });

        const totalPages = Math.ceil(totalCount / perPage);

        res.render('mytrades', {
            validationErrors: req.flash('validationErrors'),
            trades,
            req,
            currentPage: page,
            totalPages,
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
                    attributes: ['id', 'name', 'image']
                }, // Use o alias 'bookreceiver' para o livro receptor
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name', 'image']
                }, // Use o alias 'booksender' para o livro enviado
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'image']
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
    const userId = req.session.userId;

    try {
        const usertrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: Book, as: 'bookreceiver' },
                { model: Book, as: 'booksender' },
                { model: User, as: 'receiver' },
                { model: User, as: 'sender' }
            ]
        });

        if (!usertrade || !usertrade.trade) {
            return res.status(404).send('Troca não encontrada ou já foi aceita.');
        }

        if (usertrade.sender_id !== userId && usertrade.receiver_id !== userId) {
            return res.status(403).send('Você não tem permissão para aceitar essa troca.');
        }

        usertrade.trade.status = 'progress';
        await usertrade.trade.save();

        usertrade.bookreceiver.status = 'unavailable';
        usertrade.booksender.status = 'unavailable';
        await usertrade.bookreceiver.save();
        await usertrade.booksender.save();

        const acceptedBookReceiverId = usertrade.bookreceiver_id;

        // 1. Cancela outras trocas feitas por qualquer usuário para esse livro (bookreceiver_id)
        const conflictingTrades = await Usertrade.findAll({
            where: {
                bookreceiver_id: acceptedBookReceiverId,
                id: { [Op.ne]: usertrade.id }
            },
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: User, as: 'sender' }
            ]
        });

        for (const otherTrade of conflictingTrades) {
            otherTrade.trade.status = 'rejected';
            await otherTrade.trade.save();

            await Notification.create({
                type: 'trade_update',
                message: `Sua solicitação de troca pelo livro "${usertrade.bookreceiver.name}" foi automaticamente rejeitada porque o livro já está envolvido em outra troca com ${usertrade.sender.name === otherTrade.sender.name ? usertrade.receiver.name : usertrade.sender.name}.`,
                isRead: false,
                receiver_id: otherTrade.sender_id,
                sender_id: userId
            });
        }

        // 2. Cancela todas as outras trocas que o usuário atual FEZ para outros livros
        const myOtherTrades = await Usertrade.findAll({
            where: {
                sender_id: usertrade.sender_id,
                id: { [Op.ne]: usertrade.id }
            },
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: User, as: 'receiver' },
                { model: Book, as: 'bookreceiver' }
            ]
        });

        for (const myTrade of myOtherTrades) {
            myTrade.trade.status = 'rejected';
            await myTrade.trade.save();

            await Notification.create({
                type: 'trade_update',
                message: `Sua solicitação para trocar seu livro "${usertrade.booksender.name}" pelo livro "${myTrade.bookreceiver.name}" foi automaticamente cancelada porque você entrou em outra troca.`,
                isRead: false,
                receiver_id: myTrade.receiver_id,
                sender_id: usertrade.sender_id
            });
        }

        // 3. Cancela todas as trocas que foram feitas PARA o livro que eu ofereci (booksender_id)
        const offersToMyBook = await Usertrade.findAll({
            where: {
                bookreceiver_id: usertrade.booksender_id,
                id: { [Op.ne]: usertrade.id }
            },
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: User, as: 'sender' }
            ]
        });

        for (const offer of offersToMyBook) {
            offer.trade.status = 'rejected';
            await offer.trade.save();

            await Notification.create({
                type: 'trade_update',
                message: `Sua solicitação de troca pelo livro "${usertrade.booksender.name}" foi automaticamente recusada porque o usuário está em outra trade.`,
                isRead: false,
                receiver_id: offer.sender_id,
                sender_id: userId
            });
        }

        // 4. Notifica o outro usuário da troca aceita
        const notifiedUserId = (usertrade.sender_id === userId)
            ? usertrade.receiver_id
            : usertrade.sender_id;

        const acceptedMessage = `${usertrade.sender.name} e ${usertrade.receiver.name} iniciaram uma troca entre "${usertrade.booksender.name}" e "${usertrade.bookreceiver.name}".`;

        await Notification.create({
            type: 'trade_update',
            message: acceptedMessage,
            isRead: false,
            receiver_id: notifiedUserId,
            sender_id: userId
        });

        return res.redirect('/trade/reqlist');

    } catch (error) {
        console.error('Erro ao aceitar troca:', error);
        return res.status(500).send('Erro ao aceitar troca');
    }
};

exports.rejectTrade = async (req, res) => {
    const tradeId = req.params.id;
    try {
        const checkTrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Book, as: 'bookreceiver' },
                { model: Trade, as: 'trade', where: { status: 'pending' } },
                { model: Book, as: 'booksender' },
                { model: User, as: 'receiver' }, // Incluindo receiver
                { model: User, as: 'sender' } // Incluindo sender
            ]
        });

        if (!checkTrade || !checkTrade.trade) {
            return res.status(404).send('Troca não encontrada ou já foi rejeitada');
        }

        // Altera o status da troca para "rejected"
        checkTrade.trade.status = 'rejected';
        await checkTrade.trade.save();

        // Notificação para o sender que a troca foi rejeitada
        await Notification.create({
            type: 'trade_update',
            message: `${checkTrade.receiver.name} recusou sua solicitação de trade.`,
            isRead: false,
            receiver_id: checkTrade.sender_id,
            sender_id: checkTrade.receiver_id
        });

        res.redirect('/trade/reqlist');
    } catch (error) {
        console.error('Erro ao rejeitar troca:', error);
        res.status(500).send('Erro ao rejeitar troca');
    }
};

exports.tradeDetails = async (req, res) => {
    const userId = req.session.userId;
    const tradeId = req.params.id; // tradeId vindo da rota

    try {
        // Verificar se o usuário faz parte da trade
        const tradeData = await Usertrade.findOne({
            where: {
                trade_id: tradeId,
                [Op.or]: [
                    { receiver_id: userId },
                    { sender_id: userId }
                ]
            },
            include: [
                {
                    model: Trade,
                    as: 'trade'
                },
                {
                    model: Book,
                    as: 'bookreceiver',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: Book,
                    as: 'booksender',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'name', 'image']
                }
            ]
        });

        if (!tradeData) {
            return res.status(403).send('Você não tem acesso a esta troca.');
        }

        // Buscar mensagens da trade
        const messages = await Message.findAll({
            where: { trade_id: tradeId },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'image']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.render('trade-details', {
            validationErrors: req.flash('validationErrors'),
            tradeData,
            messages,
            req
        });

    } catch (error) {
        console.error('Erro ao carregar detalhes da trade:', error);
        res.status(500).send('Erro ao carregar detalhes da trade');
    }
};

exports.sendMessage = async (req, res) => {
    const { tradeId, content } = req.body;
    const senderId = req.session.userId;

    try {
        // Verificar se trade existe na tabela user_trade e se user é participante
        const userTrade = await Usertrade.findOne({
            where: { trade_id: tradeId },
            // só para checar se o usuário faz parte
            // aqui você pode buscar o registro que tem sender_id ou receiver_id igual ao user
            // Para facilitar:
            // você pode fazer uma consulta onde trade_id = tradeId
            // e (sender_id = senderId OR receiver_id = senderId)
            // Sequelize permite operadores OR
            where: {
                trade_id: tradeId,
                [Sequelize.Op.or]: [
                    { sender_id: senderId },
                    { receiver_id: senderId }
                ]
            }
        });

        if (!userTrade) {
            return res.status(403).send('Você não tem permissão para enviar mensagens nesta trade.');
        }

        if (!content || content.trim() === '') {
            req.flash('validationErrors', 'Mensagem não pode estar vazia.');
            return res.redirect(`/trade/${tradeId}`); // ajustar para sua rota real
        }

        await Message.create({
            trade_id: tradeId,
            sender_id: senderId,
            content: content.trim()
        });

        res.redirect(`/trade/details/${tradeId}`); // voltar para a tela da trade com chat

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem');
    }
};

exports.editMessage = async (req, res) => {
    const userId = req.session.userId;
    const messageId = req.params.id;
    const { content } = req.body;

    try {
        const message = await Message.findByPk(messageId);

        if (!message) {
            req.flash('validationErrors', 'Mensagem não encontrada.');
            return res.redirect('back');
        }

        // Verificar se o usuário é participante da trade
        const isParticipant = await Usertrade.findOne({
            where: {
                trade_id: message.trade_id,
                [Op.or]: [
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            }
        });

        if (!isParticipant) {
            req.flash('validationErrors', 'Você não tem permissão para editar mensagens nesta trade.');
            return res.redirect('back');
        }

        // Verificar se é o dono da mensagem
        if (message.sender_id !== userId) {
            req.flash('validationErrors', 'Só é possível editar suas próprias mensagens.');
            return res.redirect('back');
        }

        // Verificar limite de tempo (5 minutos)
        const cincoMinutos = 5 * 60 * 1000;
        if (new Date() - new Date(message.createdAt) > cincoMinutos) {
            req.flash('validationErrors', 'O prazo para editar a mensagem expirou (5 minutos).');
            return res.redirect('back');
        }

        // Validar conteúdo
        if (!content || content.trim() === '') {
            req.flash('validationErrors', 'Mensagem não pode estar vazia.');
            return res.redirect('back');
        }

        // Atualizar
        await message.update({ content: content.trim() });

        res.redirect(`/trade/details/${message.trade_id}`);
    } catch (error) {
        console.error('Erro ao editar mensagem:', error);
        res.status(500).send('Erro ao editar mensagem');
    }
};


exports.deleteMessage = async (req, res) => {
    const userId = req.session.userId;
    const messageId = req.params.id;

    try {
        const message = await Message.findByPk(messageId);

        if (!message) {
            req.flash('validationErrors', 'Mensagem não encontrada.');
            return res.redirect('back');
        }

        // Verificar se o usuário é participante da trade
        const isParticipant = await Usertrade.findOne({
            where: {
                trade_id: message.trade_id,
                [Op.or]: [
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            }
        });

        if (!isParticipant) {
            req.flash('validationErrors', 'Você não tem permissão para excluir mensagens nesta trade.');
            return res.redirect('back');
        }

        // Verificar se é o dono da mensagem
        if (message.sender_id !== userId) {
            req.flash('validationErrors', 'Só é possível excluir suas próprias mensagens.');
            return res.redirect('back');
        }

        // Verificar limite de tempo (5 minutos)
        const cincoMinutos = 5 * 60 * 1000;
        if (new Date() - new Date(message.createdAt) > cincoMinutos) {
            req.flash('validationErrors', 'O prazo para excluir a mensagem expirou (5 minutos).');
            return res.redirect('back');
        }

        await message.destroy();

        res.redirect(`/trade/details/${message.trade_id}`);
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        res.status(500).send('Erro ao excluir mensagem');
    }
};


exports.confirmTrade = async (req, res) => {
    const tradeId = req.params.id;
    const userId = req.session.userId;

    try {
        const checkTrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Trade, as: 'trade' },
                { model: User, as: 'receiver' },
                { model: User, as: 'sender' },
                { model: Book, as: 'bookreceiver' },
                { model: Book, as: 'booksender' }
            ]
        });

        if (
            !checkTrade ||
            !checkTrade.trade ||
            !['progress', 'waiting'].includes(checkTrade.trade.status)
        ) {
            return res.status(404).send('Troca não encontrada ou já finalizada.');
        }

        // Verifica se o usuário é participante
        if (userId !== checkTrade.sender_id && userId !== checkTrade.receiver_id) {
            return res.status(403).send('Você não tem permissão para confirmar esta troca.');
        }

        // Verifica se o usuário já confirmou
        const isSender = userId === checkTrade.sender_id;
        const alreadyConfirmed = isSender
            ? checkTrade.trade.confirmed_by_sender
            : checkTrade.trade.confirmed_by_receiver;

        if (alreadyConfirmed) {
            req.flash('validationErrors', 'Você já confirmou esta troca. Aguarde o outro usuário.');
            return res.redirect('/trade/mytrades');
        }

        // Atualiza o campo correto
        if (isSender) {
            checkTrade.trade.confirmed_by_sender = true;
        } else {
            checkTrade.trade.confirmed_by_receiver = true;
        }

        const bothConfirmed =
            checkTrade.trade.confirmed_by_sender && checkTrade.trade.confirmed_by_receiver;

        if (bothConfirmed) {
            // Ambos confirmaram → completa a troca
            checkTrade.trade.status = 'completed';

            const bookSender = checkTrade.booksender;
            const bookReceiver = checkTrade.bookreceiver;

            bookSender.userId = checkTrade.receiver_id;
            bookReceiver.userId = checkTrade.sender_id;
            bookSender.status = 'available';
            bookReceiver.status = 'available';

            await bookSender.save();
            await bookReceiver.save();

            // Incrementa tradeCount e estrela dos dois usuários
            const senderUser = await User.findByPk(checkTrade.sender_id);
            const receiverUser = await User.findByPk(checkTrade.receiver_id);

            if (senderUser && receiverUser) {
                senderUser.tradeCount += 1;
                senderUser.estrela += 1;          // Incrementa estrela do sender
                receiverUser.tradeCount += 1;
                receiverUser.estrela += 1;        // Incrementa estrela do receiver

                await senderUser.save();
                await receiverUser.save();

                // Notificações de estrela recebida
                await Notification.create({
                    type: 'star_received',
                    message: `Você recebeu 1 estrela por completar uma troca!`,
                    isRead: false,
                    receiver_id: senderUser.id,
                    sender_id: receiverUser.id
                });

                await Notification.create({
                    type: 'star_received',
                    message: `Você recebeu 1 estrela por completar uma troca!`,
                    isRead: false,
                    receiver_id: receiverUser.id,
                    sender_id: senderUser.id
                });
            }

            // Notificações de troca concluída
            await Notification.create({
                type: 'trade_completed',
                message: `A troca foi concluída com sucesso!`,
                isRead: false,
                receiver_id: checkTrade.sender_id,
                sender_id: checkTrade.receiver_id
            });

            await Notification.create({
                type: 'trade_completed',
                message: `A troca foi concluída com sucesso!`,
                isRead: false,
                receiver_id: checkTrade.receiver_id,
                sender_id: checkTrade.sender_id
            });

            req.flash('validationErrors', 'Troca concluída com sucesso!');
        } else {
            // Só um confirmou ainda → status 'waiting'
            checkTrade.trade.status = 'waiting';

            const otherUserId = isSender ? checkTrade.receiver_id : checkTrade.sender_id;
            const currentUser = await User.findByPk(userId);

            await Notification.create({
                type: 'trade_waiting',
                message: `${currentUser.name} confirmou a troca. Aguardando o outro usuário.`,
                isRead: false,
                receiver_id: otherUserId,
                sender_id: userId
            });

            req.flash('validationErrors', 'Confirmação registrada. Agora é necessário que o outro usuário também confirme.');
        }

        await checkTrade.trade.save();
        res.redirect('/trade/mytrades');
    } catch (error) {
        console.error('Erro ao confirmar troca:', error);
        res.status(500).send('Erro ao confirmar troca');
    }
};

exports.cancelTrade = async (req, res) => {
    const tradeId = req.params.id;
    const userId = req.session.userId;

    try {
        const checkTrade = await Usertrade.findByPk(tradeId, {
            include: [
                { model: Trade, as: 'trade', where: { status: 'progress' } },
                { model: Book, as: 'bookreceiver' },
                { model: Book, as: 'booksender' },
                { model: User, as: 'receiver' },
                { model: User, as: 'sender' }
            ]
        });

        if (!checkTrade) {
            return res.status(404).send('Troca não encontrada ou não pode ser cancelada');
        }

        // Verifica se o usuário logado é um dos participantes
        if (checkTrade.sender_id !== userId && checkTrade.receiver_id !== userId) {
            return res.status(403).send('Você não tem permissão para cancelar esta troca');
        }

        // Atualiza status da troca
        checkTrade.trade.status = 'cancelled';
        await checkTrade.trade.save();

        // Libera os livros
        checkTrade.bookreceiver.status = 'available';
        await checkTrade.bookreceiver.save();

        checkTrade.booksender.status = 'available';
        await checkTrade.booksender.save();

        // Notifica o outro usuário
        const otherUserId = checkTrade.sender_id === userId ? checkTrade.receiver_id : checkTrade.sender_id;
        const currentUser = await User.findByPk(userId);
        await Notification.create({
            type: 'trade_cancelled',
            message: `A troca foi cancelada por ${currentUser.name}.`,
            isRead: false,
            receiver_id: otherUserId,
            sender_id: userId
        });

        res.redirect('/trade/mytrades');
    } catch (error) {
        console.error('Erro ao cancelar troca:', error);
        res.status(500).send('Erro ao cancelar troca');
    }
};

