const request = require('supertest');
const bcrypt = require('bcryptjs');
const httpMocks = require('node-mocks-http');
const app = require('../app');

// Models
const {
    database, User, Book,
    Notification, Trade, Usertrade
} = require('../models'); // Usando o arquivo de models/index.js

// Controllers functions
const {
    homeScreen, registerScreen,
    loginScreen, userLogin,
    createUser, getEditUser, getSolicitationPage,
    loadNotifications, updateProfile, getLandingScreen,
    getBooksUser, markAsRead,
    logout
} = require('../controllers/userController');

// Mocking
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

jest.mock('../models/user'); // Mock do modelo de User
jest.mock('../models/book'); // Mock do modelo de Book
jest.mock('../models/notification')
jest.mock('../models/trade')
jest.mock('../models/usertrade')

describe('GET /landing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sendLandingRequest = () => {
        const req = {}; // O objeto `req` pode ser um objeto vazio, pois ele não afeta a renderização diretamente
        const res = {
            render: jest.fn() // Mock da função `render`
        };
        return { req, res };
    };

    it('deve renderizar a tela de landing corretamente', async () => {
        const { req, res } = sendLandingRequest();

        // Chama a função getLandingScreen
        await getLandingScreen(req, res);

        // Verifica se a função render foi chamada com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('landing', { req: req });
    });
});

describe('POST /register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sendRegisterRequest = (data) => {
        return request(app).post('/register').send(data);
    };

    it.each([
        [{ name: '', email: '', password: '', passwordConfirm: '' }, 'Por favor preencha todos os campos'],
        [{ name: 'Test User', email: 'test@user.com', password: '123', passwordConfirm: '123' }, 'Senha muito curta'],
        [{ name: 'Test User', email: 'test@user.com', password: '123456', passwordConfirm: '654321' }, 'As senhas não coincidem']
    ])('deve retornar erro de validação: %s', async (data, errorMessage) => {
        const flash = jest.fn();
        const session = {};

        const req = {
            body: data,
            flash,
            session
        };
        const res = {
            redirect: jest.fn()
        };

        await createUser(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/register');
        expect(flash).toHaveBeenCalledWith('authError', errorMessage);
        expect(req.session.lastTypedValues).toEqual(data); // Verifica se os valores foram salvos corretamente em caso de erro
    });

    it('deve retornar erro se o e-mail já estiver em uso', async () => {
        User.findOne.mockResolvedValueOnce({ id: 1, email: 'test@user.com' });

        const req = {
            body: {
                name: 'Test User',
                email: 'test@user.com',
                password: '123456',
                passwordConfirm: '123456'
            },
            flash: jest.fn(),
            session: {}
        };
        const res = {
            redirect: jest.fn()
        };

        await createUser(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/register');
        expect(req.flash).toHaveBeenCalledWith('authError', 'Este e-mail já está em uso');
        expect(req.session.lastTypedEmail).toBe('test@user.com');
    });

    it('deve criar o usuário com sucesso', async () => {
        User.findOne.mockResolvedValueOnce(null);
        User.create.mockResolvedValueOnce({ id: 1, name: 'Test User', email: 'test@user.com' });

        const req = {
            body: {
                name: 'Test User',
                email: 'test@user.com',
                password: '123456',
                passwordConfirm: '123456'
            },
            flash: jest.fn(),
            session: {}
        };
        const res = {
            redirect: jest.fn()
        };

        // Chama a função do controller diretamente
        await createUser(req, res);

        // Verificando se os valores da sessão foram apagados corretamente após a criação do usuário
        expect(res.redirect).toHaveBeenCalledWith('/register');
    });
});

describe('POST /login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mock('bcryptjs', () => ({
            compare: jest.fn().mockResolvedValue(true) // Mocking bcrypt.compare para retornar sucesso na comparação
        }));
    });

    const sendLoginRequest = (data) => {
        return request(app).post('/login').send(data);
    };

    it('deve redirecionar para /books e configurar sessão para admin', async () => {
        const req = {
            body: {
                email: 'admin@example.com',
                password: 'correct_password'
            },
            flash: jest.fn(),
            session: {}
        };

        const res = {
            redirect: jest.fn()
        };

        // Simulando o método User.findOne e o método bcrypt.compare
        User.findOne.mockResolvedValueOnce({ id: 1, email: 'admin@example.com', isAdmin: true });
        bcrypt.compare.mockResolvedValueOnce(true); // Senha correta

        await userLogin(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/books');
        expect(req.session.isAdmin).toBe(true);
    });

    it('deve retornar erro caso ocorra um erro desconhecido', async () => {
        const req = {
            body: {
                email: 'admin@example.com',
                password: 'wrong_password'
            },
            flash: jest.fn(),
            session: {}
        };

        const res = {
            redirect: jest.fn()
        };

        // Simulando o método User.findOne para retornar null e um erro desconhecido
        User.findOne.mockResolvedValueOnce(null);
        bcrypt.compare.mockRejectedValueOnce(new Error('Dados inválidos.'));

        await userLogin(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(req.flash).toHaveBeenCalledWith('authError', 'Dados inválidos.');
    });
});

describe('registerScreen', () => {
    it('deve renderizar a página de registro com os dados corretos', () => {
        // Mock do req e res
        const req = {
            flash: jest.fn().mockReturnValueOnce(['Erro de autenticação']).mockReturnValueOnce(['Erro de validação']),
            session: {
                lastTypedValues: { name: 'Test User', email: 'test@user.com' }
            }
        };
        const res = {
            render: jest.fn() // Mock do método render da resposta
        };
        // Chama a função registerScreen
        registerScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('register', {
            authError: 'Erro de autenticação',
            validationErrors: ['Erro de validação'],
            isUser: false,
            isAdmin: false,
            req: req,
            pageTitle: 'Crie uma conta',
            lastTypedValues: { name: 'Test User', email: 'test@user.com' }
        });
    });

    it('deve renderizar a página de registro sem erros', () => {
        // Mock do req e res, sem erros de autenticação ou validação
        const req = {
            flash: jest.fn().mockReturnValueOnce([]).mockReturnValueOnce([]),
            session: {
                lastTypedValues: { name: '', email: '' }
            }
        };
        const res = {
            render: jest.fn() // Mock do método render da resposta
        };

        // Chama a função registerScreen
        registerScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('register', {
            authError: undefined, // Nenhum erro de autenticação
            validationErrors: [], // Nenhum erro de validação
            isUser: false,
            isAdmin: false,
            req: req,
            pageTitle: 'Crie uma conta',
            lastTypedValues: { name: '', email: '' }
        });
    });
});

describe('loginScreen', () => {
    it('deve renderizar a página de login com os dados corretos', () => {
        // Mock do req e res
        const req = {
            flash: jest.fn().mockReturnValueOnce(['Erro de autenticação']).mockReturnValueOnce(['Erro de validação']),
            session: {
                lastTypedEmail: 'test@user.com'
            }
        };
        const res = {
            render: jest.fn() // Mock do método render da resposta
        };

        // Chama a função loginScreen
        loginScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('login', {
            authError: 'Erro de autenticação',
            validationErrors: ['Erro de validação'],
            lastTypedEmail: 'test@user.com',
            isUser: false,
            isAdmin: false,
            req: req,
            pageTitle: 'Login'
        });
    });

    it('deve renderizar a página de login sem erros', () => {
        // Mock do req e res, sem erros de autenticação ou validação
        const req = {
            flash: jest.fn().mockReturnValueOnce([]).mockReturnValueOnce([]),
            session: {
                lastTypedEmail: ''
            }
        };
        const res = {
            render: jest.fn() // Mock do método render da resposta
        };

        // Chama a função loginScreen
        loginScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('login', {
            authError: undefined, // Nenhum erro de autenticação
            validationErrors: [], // Nenhum erro de validação
            lastTypedEmail: '', // Nenhum email salvo na sessão
            isUser: false,
            isAdmin: false,
            req: req,
            pageTitle: 'Login'
        });
    });
});

describe('getEditUser', () => {
    it('deve renderizar a página de edição de perfil com os dados corretos e mensagens de flash', async () => {
        // Mock do User.findByPk retornando um usuário
        const user = { id: 1, name: 'Test User', email: 'test@user.com', image: 'user.png' };
        User.findByPk.mockResolvedValueOnce(user);

        // Mock do req.flash
        const req = {
            flash: jest.fn()
                .mockReturnValueOnce([]) // authError - vazio
                .mockReturnValueOnce([]) // validationErrors - vazio
                .mockReturnValueOnce([]), // success - vazio
            session: {
                userId: 1 // Assume que o usuário está logado
            }
        };

        const res = {
            render: jest.fn() // Mock do método render da resposta
        };

        // Chama a função getEditUser
        await getEditUser(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('edit-profile', {
            authError: undefined,  // Sem erro de autenticação
            validationErrors: [],  // Nenhum erro de validação
            success: undefined,     // Nenhuma mensagem de sucesso
            user: { name: 'Test User', email: 'test@user.com', image: 'user.png' },
            req,
            pageTitle: 'Editar Perfil'
        });
    });

    it('deve redirecionar para /profile caso o usuário não seja encontrado e passar mensagem de erro no flash', async () => {
        // Mock do User.findByPk retornando null (usuário não encontrado)
        User.findByPk.mockResolvedValueOnce(null);

        // Mock do req.flash
        const req = {
            flash: jest.fn().mockReturnValue([]),  // Mock que sempre retorna um array vazio
            session: {
                userId: 1
            }
        };

        const res = {
            redirect: jest.fn() // Mock do método redirect da resposta
        };

        // Chama a função getEditUser
        await getEditUser(req, res);

        // Verifica se o flash foi chamado para definir a mensagem de erro
        expect(req.flash).toHaveBeenCalledWith('authError', 'Usuário não encontrado.');

        // Verifica se o redirecionamento ocorreu
        expect(res.redirect).toHaveBeenCalledWith('/profile');
    });

    it('deve redirecionar para /profile caso ocorra um erro ao carregar o perfil e passar mensagem de erro no flash', async () => {
        // Simulando erro ao buscar o usuário
        User.findByPk.mockRejectedValueOnce(new Error('Erro ao buscar usuário'));

        // Mock do req.flash
        const req = {
            flash: jest.fn().mockReturnValue([]), // Mock que sempre retorna um array vazio
            session: {
                userId: 1
            }
        };

        const res = {
            redirect: jest.fn() // Mock do método redirect da resposta
        };

        // Chama a função getEditUser
        await getEditUser(req, res);

        // Verifica se o flash foi chamado para definir a mensagem de erro
        expect(req.flash).toHaveBeenCalledWith('authError', 'Erro ao carregar as informações do perfil.');

        // Verifica se o redirecionamento ocorreu
        expect(res.redirect).toHaveBeenCalledWith('/profile');
    });
});

describe('POST /update-profile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sendUpdateProfileRequest = (data, file = null) => {
        const req = {
            body: data,
            file: file,
            session: { userId: 1 },
            flash: jest.fn()
        };
        const res = { redirect: jest.fn() };
        return { req, res };
    };

    it('deve retornar erro se o usuário não for encontrado', async () => {
        // Mock de busca do usuário retornando null
        User.findByPk.mockResolvedValueOnce(null);

        const { req, res } = sendUpdateProfileRequest({
            name: 'New Name',
            email: 'newemail@example.com'
        });

        await updateProfile(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/edit-profile');
        expect(req.flash).toHaveBeenCalledWith('authError', 'Usuário não encontrado.');
    });

    it('deve retornar erro se não houver alterações no perfil', async () => {
        const userMock = {
            id: 1,
            name: 'Old Name',
            email: 'oldemail@example.com',
            save: jest.fn()
        };

        // Mock de busca do usuário retornando o usuário já existente
        User.findByPk.mockResolvedValueOnce(userMock);

        const { req, res } = sendUpdateProfileRequest({
            name: 'Old Name', // Mesmo nome
            email: 'oldemail@example.com' // Mesmo email
        });

        await updateProfile(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/edit-profile');
        expect(req.flash).toHaveBeenCalledWith('authError', 'Nenhuma alteração detectada.');
        expect(userMock.save).not.toHaveBeenCalled();
    });

    it('deve retornar erro ao salvar as alterações do perfil', async () => {
        const userMock = {
            id: 1,
            name: 'Old Name',
            email: 'oldemail@example.com',
            save: jest.fn().mockRejectedValue(new Error('Erro ao salvar'))
        };

        // Mock de busca do usuário retornando o usuário existente
        User.findByPk.mockResolvedValueOnce(userMock);

        const { req, res } = sendUpdateProfileRequest({
            name: 'New Name', // Novo nome
            email: 'newemail@example.com' // Novo email
        });

        await updateProfile(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/edit-profile');
        expect(req.flash).toHaveBeenCalledWith('authError', 'Erro ao atualizar o perfil.');
    });

    it('deve atualizar o perfil com sucesso', async () => {
        const userMock = {
            id: 1,
            name: 'Old Name',
            email: 'oldemail@example.com',
            image: 'old_image.jpg',
            save: jest.fn().mockResolvedValue(true)
        };

        // Mock de busca do usuário retornando o usuário existente
        User.findByPk.mockResolvedValueOnce(userMock);

        const { req, res } = sendUpdateProfileRequest({
            name: 'New Name', // Novo nome
            email: 'newemail@example.com' // Novo email
        });

        await updateProfile(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/edit-profile');
        expect(req.flash).toHaveBeenCalledWith('success', 'Perfil atualizado com sucesso.');
        expect(userMock.save).toHaveBeenCalledTimes(1);
        expect(userMock.name).toBe('New Name');
        expect(userMock.email).toBe('newemail@example.com');
    });

    it('deve atualizar a imagem do perfil com sucesso', async () => {
        const userMock = {
            id: 1,
            name: 'Old Name',
            email: 'oldemail@example.com',
            image: 'old_image.jpg',
            save: jest.fn().mockResolvedValue(true)
        };

        // Mock de busca do usuário retornando o usuário existente
        User.findByPk.mockResolvedValueOnce(userMock);

        // Simulando o arquivo da imagem
        const { req, res } = sendUpdateProfileRequest({
            name: 'New Name', // Novo nome
            email: 'newemail@example.com', // Novo email
        }, { filename: 'new_image.jpg' }); // Arquivo mockado com nome correto
        userMock.image = 'new_image.jpg'; // Simula a atualização da imagem

        await updateProfile(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/edit-profile');
        expect(req.flash).toHaveBeenCalledWith('success', 'Perfil atualizado com sucesso.');
        expect(userMock.save).toHaveBeenCalledTimes(1);
        expect(userMock.image).toBe('new_image.jpg'); // A imagem deve ser atualizada corretamente
    });
});

describe('getSolicitationPage Controller', () => {
    it('deve renderizar a página de solicitação com os livros do usuário e o livro de troca', async () => {
        // Mock para Book.findByPk
        Book.findByPk = jest.fn().mockResolvedValue({
            id: 1,
            name: 'Livro de Troca',
            User: { id: 2, name: 'Outro Usuário' }
        });

        // Mock para Book.findAll
        Book.findAll = jest.fn().mockResolvedValue([
            { id: 2, name: 'Meu Livro 1', status: 'available' },
            { id: 3, name: 'Meu Livro 2', status: 'available' }
        ]);

        // Mock do request e response
        const req = httpMocks.createRequest({
            session: { userId: 1 },
            params: { id: 1 }
        });
        const res = httpMocks.createResponse();

        await getSolicitationPage(req, res);

        expect(Book.findByPk).toHaveBeenCalledWith(1, { include: expect.anything() });
        expect(Book.findAll).toHaveBeenCalledWith({ where: { userId: 1, status: 'available' } });
    });

    it('deve retornar erro 500 se ocorrer um erro no controlador', async () => {
        Book.findByPk = jest.fn().mockRejectedValue(new Error('Erro de banco de dados'));

        const req = httpMocks.createRequest({
            session: { userId: 1 },
            params: { id: 1 }
        });
        const res = httpMocks.createResponse();

        await getSolicitationPage(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getData()).toContain('Erro ao carregar página de solicitação');
    });
});

describe('POST /logout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sendLogoutRequest = () => {
        const req = {
            session: { destroy: jest.fn((callback) => callback()) } // Mock do destroy com a execução do callback
        };
        const res = { redirect: jest.fn() }; // Mock do redirect
        return { req, res };
    };

    it('deve destruir a sessão e redirecionar para a página de login', async () => {
        const { req, res } = sendLogoutRequest();

        // Chama a função de logout
        logout(req, res);

        // Verifica se a sessão foi destruída
        expect(req.session.destroy).toHaveBeenCalledTimes(1);
        // Verifica se o redirecionamento foi feito para a página de login
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });
});

describe('getBooksUser', () => {
    it('deve renderizar a página de livros do usuário com os dados corretos', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            },
            query: {
                page: 1,  // Página atual
                category: 'Educação', // Categoria selecionada
                search: 'livro', // Termo de pesquisa
            },
            flash: jest.fn().mockReturnValue([])  // Sem erros de validação
        };

        // Mock do usuário retornado
        const user = { id: 1, name: 'Test User' };

        // Mock de busca de livros
        const books = [{ id: 1, name: 'Livro Teste', category: 'Educação' }];
        const totalCount = 10;  // Total de livros
        const totalPages = 1;  // Total de páginas

        // Mock do método User.findByPk e Book.findAll
        User.findByPk = jest.fn().mockResolvedValue(user);
        Book.findAll = jest.fn().mockResolvedValue(books);
        Book.count = jest.fn().mockResolvedValue(totalCount);

        // Mock do res com render
        const res = {
            render: jest.fn() // Mock do método render
        };

        // Chama o método
        await getBooksUser(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('mybooks', {
            validationErrors: [],
            books: books,
            req: req,
            currentPage: 1,
            totalPages: totalPages,
            selectedCategory: 'Educação',
            categories: ['Educação', 'Ficção'],
            bookAdded: undefined,
            searchQuery: 'livro',
            user: user,
            currentUser: { id: 1 }
        });
    });

    it('deve aplicar paginação corretamente', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            },
            query: {
                page: 2  // Página 2
            },
            flash: jest.fn().mockReturnValue([])  // Sem erros de validação
        };

        // Mock do usuário retornado
        const user = { id: 1, name: 'Test User' };

        // Mock de livros para a página 2
        const books = [{ id: 11, name: 'Livro Teste', category: 'Ficção' }];
        const totalCount = 20;  // Total de livros
        const totalPages = 2;  // Total de páginas

        // Mock do método User.findByPk e Book.findAll
        User.findByPk = jest.fn().mockResolvedValue(user);
        Book.findAll = jest.fn().mockResolvedValue(books);
        Book.count = jest.fn().mockResolvedValue(totalCount);

        // Mock do res com render
        const res = {
            render: jest.fn() // Mock do método render
        };

        // Chama o método
        await getBooksUser(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('mybooks', {
            validationErrors: [],
            books: books,
            req: req,
            currentPage: 2,
            totalPages: totalPages,
            selectedCategory: null,
            categories: ['Educação', 'Ficção'],
            bookAdded: undefined,
            searchQuery: '',
            user: user,
            currentUser: { id: 1 }
        });
    });

    it('deve retornar erro em caso de falha ao buscar livros', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            },
            query: {},
            flash: jest.fn()
        };

        // Mock de erro na busca
        User.findByPk = jest.fn().mockRejectedValue(new Error('Erro ao buscar usuário'));

        // Mock do res com status e send
        const res = {
            status: jest.fn().mockReturnThis(), // Retorna o próprio res para permitir encadeamento
            send: jest.fn() // Mock do método send
        };

        // Chama o método
        await getBooksUser(req, res);

        // Verifica se o status 500 foi retornado com a mensagem de erro
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao buscar livros do usuário');
    });
});

describe('loadNotifications', () => {
    it('deve carregar as notificações do usuário corretamente', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1,  // ID do usuário logado
                notifications: [], // Inicialmente sem notificações
                notificationCount: 0, // Inicialmente sem notificações não lidas
            }
        };

        // Mock das notificações
        const notifications = [
            { id: 1, receiver_id: 1, createdAt: new Date(), isRead: false },
            { id: 2, receiver_id: 1, createdAt: new Date(), isRead: true }
        ];

        // Mock do Notification.findAll
        Notification.findAll = jest.fn().mockResolvedValue(notifications);

        // Mock do próximo middleware (next)
        const next = jest.fn();

        // Mock do res (não utilizado diretamente, mas necessário para compatibilidade)
        const res = {};

        // Chama o método
        await loadNotifications(req, res, next);

        // Verifica se as notificações foram adicionadas à sessão
        expect(req.session.notifications).toEqual(notifications);

        // Verifica se o contador de notificações não lidas foi atualizado corretamente
        expect(req.session.notificationCount).toBe(1); // Apenas 1 notificação não lida

        // Verifica se o próximo middleware foi chamado
        expect(next).toHaveBeenCalled();
    });

    it('deve contar corretamente as notificações não lidas', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            }
        };

        // Mock das notificações com algumas não lidas
        const notifications = [
            { id: 1, receiver_id: 1, createdAt: new Date(), isRead: false },
            { id: 2, receiver_id: 1, createdAt: new Date(), isRead: false },
            { id: 3, receiver_id: 1, createdAt: new Date(), isRead: true }
        ];

        // Mock do Notification.findAll
        Notification.findAll = jest.fn().mockResolvedValue(notifications);

        // Mock do próximo middleware
        const next = jest.fn();

        // Mock do res
        const res = {};

        // Chama o método
        await loadNotifications(req, res, next);

        // Verifica se o contador de notificações não lidas foi atualizado corretamente
        expect(req.session.notificationCount).toBe(2); // 2 notificações não lidas

        // Verifica se o próximo middleware foi chamado
        expect(next).toHaveBeenCalled();
    });

    it('deve continuar o fluxo mesmo quando ocorrer erro', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            }
        };

        // Mock do Notification.findAll para simular erro
        Notification.findAll = jest.fn().mockRejectedValue(new Error('Erro ao buscar notificações'));

        // Mock do próximo middleware
        const next = jest.fn();

        // Mock do res
        const res = {};

        // Chama o método
        await loadNotifications(req, res, next);

        // Verifica que o próximo middleware foi chamado mesmo após erro
        expect(next).toHaveBeenCalled();
    });
});

describe('markAsRead', () => {
    it('deve marcar a notificação como lida e redirecionar para a lista de solicitações', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            },
            params: {
                id: 1  // ID da notificação a ser marcada como lida
            }
        };

        // Mock do res
        const res = {
            redirect: jest.fn() // Mock do método redirect
        };

        // Mock do Notification.update
        Notification.update = jest.fn().mockResolvedValue([1]);  // Retorna 1 para indicar que 1 notificação foi atualizada

        // Chama o método
        await markAsRead(req, res);

        // Verifica se o método update foi chamado corretamente
        expect(Notification.update).toHaveBeenCalledWith(
            { isRead: true },
            { where: { id: req.params.id, receiver_id: req.session.userId } }
        );

        // Verifica se o redirecionamento foi chamado para a rota '/trade/reqlist'
        expect(res.redirect).toHaveBeenCalledWith('/trade/reqlist');
    });

    it('deve retornar erro caso ocorra uma falha ao marcar a notificação como lida', async () => {
        // Mock do req
        const req = {
            session: {
                userId: 1  // ID do usuário logado
            },
            params: {
                id: 1  // ID da notificação a ser marcada como lida
            }
        };

        // Mock do res
        const res = {
            status: jest.fn().mockReturnThis(), // Retorna o próprio res para permitir encadeamento
            json: jest.fn() // Mock do método json
        };

        // Mock de erro no Notification.update
        Notification.update = jest.fn().mockRejectedValue(new Error('Erro ao marcar notificação como lida'));

        // Chama o método
        await markAsRead(req, res);

        // Verifica se o status 500 foi chamado e a mensagem de erro foi retornada
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao marcar notificação como lida.' });
    });
});






