const Sequelize = require('sequelize')
const Book = require('../models/book')
const User = require('../models/user')
const Title = require('../models/title');
const Trade = require('../models/trade')
const Notification = require('../models/notification')
const Usertrade = require('../models/usertrade')
const Comment = require('../models/comments');
const Rating = require('../models/Rating');
const axios = require('axios');
const validationResult = require('express-validator').validationResult;

exports.addBookScreen = async (req, res) => {
    // Obter as mensagens do flash (erro de autenticação, erro de validação e mensagem de sucesso)
    const authError = req.flash('authError')[0] || undefined;  // Pega a primeira mensagem ou undefined
    const validationErrors = req.flash('validationErrors') || [];  // Pega as mensagens de erro de validação, ou um array vazio
    const bookAdded = req.flash('added')[0] || undefined;  // Pega a primeira mensagem sobre livro adicionado ou undefined

    // Renderiza a página 'add' com os dados
    res.render('add', {
        authError: authError,  // Mensagem de erro de autenticação (se existir)
        validationErrors: validationErrors,  // Mensagens de erro de validação (se existirem)
        isUser: true,  // Indica que o usuário está logado
        isAdmin: req.session.isAdmin,  // Status de administrador
        bookAdded: bookAdded,  // Mensagem sobre o livro adicionado (se houver)
        req: req,
        pageTitle: "Adicionar Livro",  // Título da página
    });
};

exports.addBook = async (req, res) => {
    if (validationResult(req).isEmpty()) {
        try {
            await Book.create({
                name: req.body.name,
                description: req.body.description,
                category: req.body.category,
                author: req.body.author,
                image: req.file.path,
                userId: req.session.userId,
                approvalStatus: 'pending' // Status de aprovação pendente por padrão
            });
            req.flash('added', true)
            res.redirect('/books/add')
        } catch (err) {
            return res.status(400).json({ error: 'Erro: ' + err.message });
        }
    } else {
        req.flash('validationErrors', validationResult(req).array());
        res.redirect('/books/add');
    }
};
// Aprovar ou rejeitar um livro (apenas para o administrador)
exports.approveBook = async (req, res) => {
    if (req.session.isAdmin) {
        const bookId = req.params.id;
        try {
            const book = await Book.findByPk(bookId);
            if (!book) {
                return res.status(404).send('Livro não encontrado');
            }
            // Atualizar o status de aprovação do livro
            book.approvalStatus = 'approved';
            book.status = 'available';
            await book.save();

            res.redirect('/books/admin/book-request');
        } catch (error) {
            console.error('Erro ao aprovar livro:', error);
            res.status(500).send('Erro ao aprovar livro');
        }
    } else {
        res.status(403).send('Acesso não autorizado');
    }
};

exports.rejectBook = async (req, res) => {
    if (req.session.isAdmin) {
        const bookId = req.params.id;
        try {
            const book = await Book.findByPk(bookId);
            if (!book) {
                return res.status(404).send('Livro não encontrado');
            }
            // Atualizar o status de remoção do livro
            book.status = 'rejected';
            await book.save();

            res.redirect('/books/admin/book-request');
        } catch (error) {
            console.error('Erro ao rejeitar livro:', error);
            res.status(500).send('Erro ao rejeitar livro');
        }
    } else {
        res.status(403).send('Acesso não autorizado');
    }
};

exports.pendingBooks = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 10; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset

    try {
        let pendingBooks;
        const searchQuery = req.query.search; // Termo de pesquisa
        // Cria um objeto para armazenar as condições de pesquisa
        const whereClause = {};
        // Adiciona a condição de pesquisa por qualquer palavra no título, se um termo de pesquisa foi especificado
        if (searchQuery) {
            whereClause.name = {
                [Sequelize.Op.like]: `%${searchQuery}%`
            };
        }
        whereClause.status = 'pending';

        // Realiza a busca considerando as condições de pesquisa
        pendingBooks = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User, attributes: ['id', 'name'] }], // Inclui informações do usuário que adicionou o livro
            where: whereClause // Aplica as condições de pesquisa
        });
        // Conta o número total de livros pendentes para calcular o total de páginas
        const totalCount = await Book.count({ where: { status: 'pending' } });
        const totalPages = Math.ceil(totalCount / perPage);

        res.render('pendingbooks', {
            validationErrors: req.flash('validationErrors'),
            pendingBooks: pendingBooks,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery, // Enviar o termo de pesquisa para o frontend
        });
    } catch (error) {
        console.log(error)
        console.error('Erro ao buscar livros pendentes:', error);
        res.status(500).send('Erro ao buscar livros pendentes');
    }
};
;
exports.getBooks = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 20; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset
    // Array de categorias
    const categories = ['Educação', 'Ficção', 'Ação'];
    try {
        let books;
        const selectedCategory = req.query.category; // Categoria selecionada
        const searchQuery = req.query.search; // Termo de pesquisa
        // Cria um objeto para armazenar as condições de pesquisa
        const whereClause = {};
        // Adiciona a condição de categoria, se uma categoria válida foi especificada
        if (selectedCategory && categories.includes(selectedCategory)) {
            whereClause.category = selectedCategory;
        }
        // Adiciona a condição de pesquisa por qualquer palavra no título, se um termo de pesquisa foi especificado
        if (searchQuery) {
            whereClause.name = {
                [Sequelize.Op.like]: `%${searchQuery}%`
            };
        }
        whereClause.status = 'available';
        whereClause.approvalStatus = 'approved'; // Condição para exibir apenas livros aprovados

        // Realiza a busca considerando as condições de categoria, pesquisa e aprovação
        books = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User }],
            where: whereClause // Aplica as condições de pesquisa
        });
        // Conta o número total de livros aprovados para calcular o total de páginas
        const totalCount = await Book.count({ where: { approvalStatus: 'approved' } });
        const totalPages = Math.ceil(totalCount / perPage);
        res.render('books', {
            validationErrors: req.flash('validationErrors'),
            books: books,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: selectedCategory, // Enviar a categoria selecionada para o frontend
            categories: categories, // Enviar as categorias para o frontend
            bookAdded: req.flash('added')[0],
        });
        // return res.json(books)
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).send('Erro ao buscar livros');
    }
};

exports.getBookById = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const userId = req.session.userId;
        const isAdmin = req.session.isAdmin;

        const book = await Book.findByPk(bookId, { include: User });

        if (!book) {
            req.flash("validationErrors", "Livro não encontrado.");
            return res.redirect("/livros");
        }

        const myBooks = await Book.findAll({
            where: { userId: userId, status: 'available' }
        });

        if (book.userId !== userId) {
            const relatedTrades = await Usertrade.findAll({
                where: {
                    [Sequelize.Op.or]: [
                        { booksender_id: bookId },
                        { bookreceiver_id: bookId }
                    ],
                    [Sequelize.Op.and]: [
                        Sequelize.literal(`(sender_id = ${userId} OR receiver_id = ${userId})`)
                    ]
                }
            });

            if (relatedTrades.length > 0) {
                const senderBookId = relatedTrades[0].booksender_id;
                const receiverBookId = relatedTrades[0].bookreceiver_id;

                const senderBook = await Book.findByPk(senderBookId, { include: User });
                const receiverBook = await Book.findByPk(receiverBookId, { include: User });

                return res.render("book-details", {
                    book,
                    senderBook,
                    receiverBook,
                    isUser: userId,
                    isAdmin,
                    myBooks,
                    req,
                    pageTitle: book.name,
                    validationErrors: req.flash('validationErrors')
                });
            }

            if ((book.status === 'available' && book.approvalStatus === 'approved') || isAdmin) {
                return res.render("book-details", {
                    book,
                    isUser: userId,
                    isAdmin,
                    myBooks,
                    req,
                    pageTitle: book.name,
                    validationErrors: req.flash('validationErrors')
                });
            } else {
                req.flash("validationErrors", "Este livro não está mais disponível.");
                return res.redirect("/livros");
            }
        } else {
            // Aqui estava o erro antes, pois faltava validationErrors
            return res.render("book-details", {
                book,
                isUser: userId,
                isAdmin,
                req,
                pageTitle: book.name,
                validationErrors: req.flash('validationErrors')  // Corrigido
            });
        }
    } catch (error) {
        console.error("Erro ao buscar o livro:", error);
        req.flash("validationErrors", "Erro interno ao buscar o livro.");
        return res.redirect("/livros");
    }
};

exports.removeBook = async (req, res) => {
    const { id } = req.params;
    try {
        // Verifique se o livro existe e se o usuário logado é o proprietário
        const book = await Book.findOne({ where: { id: id, userId: req.session.userId } });
        if (!book) {
            return res.status(404).send('Livro não encontrado ou você não tem permissão para cancelar este livro.');
        }
        // Encontra as trades associadas a esse livro na tabela intermediária Usertrade
        const Usertrades = await Usertrade.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { booksender_id: id },
                    { bookreceiver_id: id }
                ]
            },
            include: [
                {
                    model: Trade, as: 'trade', where: {
                        status: {
                            [Sequelize.Op.or]: ['pending', 'progress']
                        }
                    }
                }
            ]
        });
        // Atualiza o status das trades associadas para "canceled"
        await Promise.all(Usertrades.map(async (Usertrade) => {
            const trade = Usertrade.trade;
            if (trade) {
                await trade.update({ status: 'canceled' });
            }
        }));
        // Remove o livro após cancelar as trades associadas
        await book.update({ status: 'canceled' });

        res.redirect('/mybooks'); // Redireciona para a página de livros após a atualização do status e remoção do livro
    } catch (error) {
        console.error('Erro ao cancelar livro e suas trades:', error);
        res.status(500).send('Erro ao cancelar livro e suas trades.');
    }
};

exports.getBooksByTitle = async (req, res) => {
    const { title } = req.query;
    // Verifica se um título foi fornecido
    if (!title) {
        return res.render('book-api', {
            books: [],
            title: '',
            req
        });
    }
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);

        if (response.data.items && response.data.items.length > 0) {
            res.render('book-api', {
                books: response.data.items,
                title: title,
                req
            });
        } else {
            res.render('book-api', {
                books: [],
                title: title,
                req
            });
        }
    } catch (error) {
        console.error('Erro na busca dos livros:', error);
        res.status(500).send('Erro ao buscar livros.');
    }
};

exports.addTitleScreen = (req, res) => {
    const authError = req.flash('authError')[0] || undefined;
    const validationErrors = req.flash('validationErrors') || [];
    const titleAdded = req.flash('added')[0] || undefined;

    res.render('add-title', {  // renderize a view que você criou para adicionar título
        authError,
        validationErrors,
        isAdmin: req.session.isAdmin,
        titleAdded,
        pageTitle: "Adicionar Título",
        req
    });
};

exports.addTitleScreen = (req, res) => {
    const authError = req.flash('authError')[0] || undefined;
    const validationErrors = req.flash('validationErrors') || [];
    const titleAdded = req.flash('added')[0] || undefined;

    res.render('add-title', {
        authError,
        validationErrors,
        isUser: true,
        isAdmin: req.session.isAdmin,
        titleAdded,
        req,
        pageTitle: "Adicionar Título"
    });
};

exports.addTitle = async (req, res) => {
    if (validationResult(req).isEmpty()) {
        try {
            await Title.create({
                name: req.body.name,
                description: req.body.description,
                author: req.body.author,
                image: req.file.path,
            });
            req.flash('added', true);
            res.redirect('/books/titles/add');
        } catch (err) {
            return res.status(400).json({ error: 'Erro: ' + err.message });
        }
    } else {
        req.flash('validationErrors', validationResult(req).array());
        res.redirect('/books/titles/add');
    }
};

exports.getTitles = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const offset = (page - 1) * perPage;
  const searchQuery = req.query.search;

  const whereClause = {};

  if (searchQuery) {
    whereClause.name = {
      [Sequelize.Op.like]: `%${searchQuery}%`
    };
  }

  try {
    const { count, rows: titles } = await Title.findAndCountAll({
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [['name', 'ASC']]
    });

    // Para cada título, buscar avaliações e calcular média
    const titlesWithRatings = await Promise.all(
      titles.map(async (title) => {
        const ratings = await Rating.findAll({ where: { titleId: title.id } });

        const totalRatings = ratings.length;
        let sumRatings = 0;
        ratings.forEach(r => sumRatings += r.rating);
        const averageRating = totalRatings ? sumRatings / totalRatings : null;

        return {
          ...title.toJSON(),
          averageRating,
          ratingsCount: totalRatings
        };
      })
    );

    const totalPages = Math.ceil(count / perPage);

    res.render('list-titles', {
      titles: titlesWithRatings,
      pageTitle: 'Lista de Títulos',
      isUser: req.session.userId,
      req,
      currentPage: page,
      totalPages,
      searchQuery
    });
  } catch (err) {
    console.error('Erro ao buscar títulos: ' + err);
    res.status(500).send('Erro ao buscar títulos');
  }
};


exports.getTitleById = async (req, res) => {
    try {
        const titleId = req.params.id;

        // Buscar o título com comentários e avaliações agregadas
        const title = await Title.findByPk(titleId, {
            include: [
                { model: Comment, include: [User] }
            ]
        });

        if (!title) {
            return res.status(404).render('error', { message: 'Resenha não encontrada', req, error: { status: 404 } });
        }

        // Buscar avaliações individuais para este título
        const ratings = await Rating.findAll({
            where: { titleId }
        });

        // Calcular média e distribuição
        const totalRatings = ratings.length;
        let sumRatings = 0;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        ratings.forEach(r => {
            sumRatings += r.rating;
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        const averageRating = totalRatings ? sumRatings / totalRatings : null;

        // Calcular porcentagem para cada nota
        const distributionPercent = {};
        for (let i = 1; i <= 5; i++) {
            distributionPercent[i] = totalRatings ? ((distribution[i] / totalRatings) * 100).toFixed(1) : 0;
        }

        res.render('title-details', {
            title: {
                ...title.toJSON(),
                averageRating,
                ratingsCount: totalRatings,
                distributionPercent
            },
            pageTitle: title.name,
            isUser: !!req.session.userId,
            isAdmin: req.session.isAdmin,
            req
        });

    } catch (error) {
        console.error('Erro ao buscar a resenha:', error);
        res.status(500).send('Erro ao buscar a resenha');
    }
};

exports.postRating = async (req, res) => {
    const { rating } = req.body;
    const titleId = req.params.id;
    const userId = req.session.userId;

    const parsedRating = parseFloat(rating);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).send('A nota deve ser um número entre 1 e 5.');
    }

    try {
        const title = await Title.findByPk(titleId);
        if (!title) {
            return res.status(404).send('Livro não encontrado.');
        }

        // Verifica se o usuário já avaliou este título
        let userRating = await Rating.findOne({
            where: { userId, titleId }
        });

        if (userRating) {
            userRating.rating = parsedRating;
            await userRating.save();
        } else {
            await Rating.create({ userId, titleId, rating: parsedRating });
        }

        // Recalcula a média
        const ratings = await Rating.findAll({ where: { titleId } });
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        const avg = ratings.length > 0 ? total / ratings.length : null;

        // Atualiza a média no título
        title.rating = avg;
        await title.save();

        res.redirect(`/books/titles/${titleId}`);
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        res.status(500).send('Erro ao salvar avaliação.');
    }
};

exports.createComment = async (req, res) => {
    const { text } = req.body;
    const titleId = req.params.id;

    if (!req.session.userId) {
        return res.status(401).send('Você precisa estar logado para comentar.');
    }

    try {
        await Comment.create({
            text,
            titleId,
            userId: req.session.userId
        });

        res.redirect('/books/titles/' + titleId);
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).send('Erro ao criar comentário.');
    }
};

exports.deleteComment = async (req, res) => {
    const commentId = req.params.commentId;
    const titleId = req.params.titleId;

    try {
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).send('Comentário não encontrado.');
        }

        // Verificar se o usuário é dono do comentário ou admin
        if (comment.userId !== req.session.userId && !req.session.isAdmin) {
            return res.status(403).send('Você não tem permissão para deletar este comentário.');
        }

        await comment.destroy();

        res.redirect('/books/titles/' + titleId);
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        res.status(500).send('Erro ao deletar comentário.');
    }
};












