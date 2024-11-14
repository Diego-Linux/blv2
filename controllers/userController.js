const {Op} = require('sequelize');
const Book = require('../models/book')
const User = require('../models/user')
const Trade = require('../models/trade')
const Notification = require('../models/notification')
const Usertrade = require('../models/usertrade')
const bcrypt = require('bcryptjs');

exports.homeScreen = (req, res) => {
    res.render("home", {
        isUser: req.session.userId,
        isAdmin: req.session.isAdmin,
        name: req.session.name,
        req: req,
        pageTitle: "Home"
    });
};

exports.loadNotifications = async (req, res, next) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Calcula a data de 7 dias atrás

        // Obter todas as notificações dos últimos 7 dias para o usuário atual
        const notifications = await Notification.findAll({
            where: {
                receiver_id: req.session.userId,  // Notificações recebidas
                createdAt: {
                    [Op.gte]: sevenDaysAgo // Notificações criadas nos últimos 7 dias
                }
            },
            order: [['createdAt', 'DESC']], // Ordenar notificações por data
        });

        // Contar apenas as notificações não lidas
        const unreadNotificationsCount = notifications.filter(notification => !notification.isRead).length;

        // Adicionar notificações à sessão
        req.session.notifications = notifications;
        req.session.notificationCount = unreadNotificationsCount; // Somente não lidas

        // Logando informações para depuração
        console.log('User ID:', req.session.userId);
        console.log('Notifications:', notifications);
        console.log('Unread Notifications Count:', unreadNotificationsCount);

        next(); // Passar para o próximo middleware ou rota
    } catch (error) {
        console.error('Erro ao obter notificações:', error);
        next(); // Chame o próximo middleware mesmo se houver erro
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id; // ID da notificação a ser marcada como lida
        
        // Atualizar a notificação para marcada como lida
        await Notification.update(
            { isRead: true },
            { where: { id: notificationId, receiver_id: req.session.userId } }
        );
        // Enviar resposta de sucesso
        res.redirect('/trade/reqlist')
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        res.status(500).json({ message: 'Erro ao marcar notificação como lida.' });
    }
};

exports.getUserProfileById = async (req, res, next) => {
    try {
        const userId = req.params.id; // ID do usuário a ser buscado
        const searchQuery = req.query.search; // Termo de pesquisa

        // Busca o usuário pelo ID
        const user = await User.findByPk(userId);

        // Verifica se o usuário foi encontrado
        if (!user) {
            return res.status(404).render("error", {
                message: "Usuário não encontrado.",
                req: req,
                error: { status: 404 }
            });
        }

        // Cria a condição de busca para os livros
        const whereClause = {
            userId: userId,
            status: 'available',
            approvalStatus: 'approved',
        };

        // Adiciona a condição de pesquisa por nome se um termo de pesquisa for especificado
        if (searchQuery) {
            whereClause.name = {
                [Op.like]: `%${searchQuery}%`
            };
        }
        // Busca os livros que pertencem a esse usuário
        const books = await Book.findAll({
            where: whereClause // Filtrar livros deste usuário
        });

        // Renderiza a página de perfil do usuário com os livros
        res.render("user-profile", {
            user: user,
            books: books, // Passa os livros para a view
            isUser: req.session.userId, // ID do usuário logado
            isAdmin: req.session.isAdmin, // Verifica se o usuário é um administrador
            req: req,
            pageTitle: `${user.name} - Perfil`,
            searchQuery: searchQuery // Passa o termo de pesquisa para a view
        });
    } catch (error) {
        console.error("Erro ao buscar o perfil do usuário:", error);
        res.status(500).send("Erro ao buscar o perfil do usuário");
    }
};

exports.registerScreen = (req, res) => {
    const authError = req.flash('authError')[0];
    const validationErrors = req.flash('validationErrors');
    const lastTypedValues = req.session.lastTypedValues || {}; // Obtém os últimos valores digitados da sessão
    res.render('register', {
        authError,
        validationErrors,
        isUser: false,
        isAdmin: false,
        req: req,
        pageTitle: 'Crie uma conta',
        lastTypedValues // Passa os últimos valores digitados para o template EJS
    });
};

exports.createUser = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    // Verifica se os campos estão preenchidos
    if (!name || !email || !password || !passwordConfirm) {
        req.flash('authError', 'Por favor preencha todos os campos');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    // Verifica se a senha possui pelo menos 6 caracteres
    if (password.length < 6) {
        req.flash('authError', 'Senha muito curta');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    // Verifica se as senhas coincidem
    if (passwordConfirm !== password) {
        req.flash('authError', 'As senhas não coincidem');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            req.session.lastTypedEmail = email;
            throw new Error('Este e-mail já está em uso');
        }

        await User.create({
            name,
            email,
            image: 'user.png',
            password: await bcrypt.hash(password, 10)
        });

          // Supondo que o usuário tenha sido criado com sucesso, limpe os valores da sessão
          req.session.lastTypedValues = undefined;
          req.session.lastTypedEmail = undefined;
        return res.redirect('/login');
    } catch (err) {
        req.flash('authError', err.message || 'Erro desconhecido');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }
};

exports.loginScreen = (req, res) => {
    const authError = req.flash('authError')[0];
    const validationErrors = req.flash('validationErrors');
    const lastTypedEmail = req.session.lastTypedEmail || ''; // Verifica se o último e-mail está na sessão
    res.render('login', {
        authError,
        validationErrors,
        lastTypedEmail, // Passa o último e-mail para o template
        isUser: false,
        req,
        isAdmin: false,
        pageTitle: 'Login'
    });
};

exports.userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            req.flash('authError', 'Dados inválidos.');
            req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
            return res.redirect('/login');
        }
        const samePassword = await bcrypt.compare(password, user.password);
        if (!samePassword) {
            req.flash('authError', 'Dados inválidos.');
            req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
            return res.redirect('/login');
        }
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin;
        if (req.session.isAdmin) {
            await Book.findAll();
            const totalCount = await Book.count({ where: { status: 'pending' } });
            req.session.pending = totalCount;
        }
        req.session.name = user.name;
        return res.redirect('/books');
    } catch (err) {
        req.flash('authError', err.message || 'Erro desconhecido');
        req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
        return res.redirect('/login');
    }
};

exports.getEditUser = async (req, res) => {
    // Captura mensagens de erro e sucesso da sessão (se houver)
    const authError = req.flash('authError')[0];
    const validationErrors = req.flash('validationErrors');
    const success = req.flash('success')[0];

    // Verifica se o usuário está logado
    const userId = req.session.userId; // Obtém o ID do usuário da sessão

    try {
        // Busca as informações do usuário pelo ID
        const user = await User.findByPk(userId);
        if (!user) {
            req.flash('authError', 'Usuário não encontrado.');
            return res.redirect('/profile'); // Redireciona para o perfil se não encontrar o usuário
        }

        // Renderiza a tela de edição do perfil
        res.render('edit-profile', {
            authError,
            validationErrors,
            success, // Passa uma mensagem de sucesso, se houver
            user: {
                name: user.name,
                email: user.email,
                image: user.image // Passa a imagem atual do usuário
            },
            req,
            pageTitle: 'Editar Perfil'
        });
    } catch (err) {
        req.flash('authError', 'Erro ao carregar as informações do perfil.');
        res.redirect('/profile'); // Redireciona em caso de erro
    }
};

exports.updateProfile = async (req, res) => {
    const { name, email } = req.body; // Captura o novo nome e email do corpo da requisição
    const userId = req.session.userId; // Obtém o ID do usuário da sessão
    const userImage = req.file ? req.file.path : null; // Captura a nova imagem se houver

    try {
        // Busca o usuário pelo ID
        const user = await User.findByPk(userId);
        if (!user) {
            req.flash('authError', 'Usuário não encontrado.');
            return res.redirect('/edit-profile'); // Redireciona se o usuário não for encontrado
        }

        // Verifica se o nome ou email inseridos são diferentes dos atuais
        let hasChanges = false;

        if (user.name !== name) {
            user.name = name; // Atualiza o nome se houver mudança
            hasChanges = true; // Indica que houve uma alteração
        }

        if (user.email !== email) {
            user.email = email; // Atualiza o email se houver mudança
            hasChanges = true; // Indica que houve uma alteração
        }

        if (userImage) {
            user.image = req.body.image = req.file.filename; // Atualiza a imagem se houver uma nova
            hasChanges = true; // Indica que houve uma alteração
        }

        // Se não houve alterações
        if (!hasChanges) {
            req.flash('authError', 'Nenhuma alteração detectada.'); // Mensagem de erro se não houver mudança
            return res.redirect('/edit-profile'); // Redireciona para a página de edição
        }

        // Salva as alterações
        await user.save();

        req.flash('success', 'Perfil atualizado com sucesso.'); // Mensagem de sucesso
        res.redirect('/edit-profile'); // Redireciona para a página de edição do perfil
    } catch (err) {
        req.flash('authError', 'Erro ao atualizar o perfil.');
        res.redirect('/edit-profile'); // Redireciona em caso de erro
    }
};

exports.getBooksUser = async (req, res) => {
    const userId = req.session.userId; // ID do usuário logado
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 10; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset
    const categories = ['Educação', 'Ficção'];

    try {
        // Busca os dados do usuário
        const user = await User.findByPk(userId);

        let books;
        const selectedCategory = req.query.category || null; // Categoria selecionada, padrão é null
        const searchQuery = req.query.search || ''; // Termo de pesquisa, padrão é uma string vazia

        // Cria um objeto para armazenar as condições de pesquisa
        const whereClause = { userId: userId };

        // Adiciona a condição de categoria, se uma categoria válida foi especificada
        if (selectedCategory && categories.includes(selectedCategory)) {
            whereClause.category = selectedCategory;
        }

        // Adiciona a condição de pesquisa por qualquer palavra no título, se um termo de pesquisa foi especificado
        if (searchQuery) {
            whereClause.name = {
                [Op.like]: `%${searchQuery}%`
            };
        }

        whereClause.status = {
            [Op.notIn]: ['pending', 'rejected', 'canceled']
        };

        books = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User }],
            where: whereClause
        });

        const totalCount = await Book.count({ where: whereClause });
        const totalPages = Math.ceil(totalCount / perPage);

        res.render('mybooks', {
            validationErrors: req.flash('validationErrors'),
            books: books,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: selectedCategory,
            categories: categories,
            bookAdded: req.flash('added')[0],
            searchQuery: searchQuery, // Certifique-se de passar essa variável
            user: user,
            currentUser: { id: userId } // Passa o ID do usuário logado
        });
    } catch (error) {
        console.error('Erro ao buscar livros do usuário:', error);
        res.status(500).send('Erro ao buscar livros do usuário');
    }
};

exports.getSolicitationPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const tradeBookId = req.params.id;
        const tradeBook = await Book.findByPk(tradeBookId, { include: User });

        // Livros disponíveis do usuário
        const myBooks = await Book.findAll({
            where: { userId: userId, status: 'available' }
        });
        res.render('solicitation', {
            validationErrors: req.flash('validationErrors'),
            myBooks: myBooks,
            tradeBook: tradeBook,
            req: req,
            pageTitle:'Solicitação de Troca'
        });
    } catch (error) {
        console.error('Erro ao carregar página de solicitação:', error);
        res.status(500).send('Erro ao carregar página de solicitação');
    }
};

exports.getLandingScreen = async (req, res) => {
    res.render('landing', {
        req: req,
    })
}

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};
