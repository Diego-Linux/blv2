const { Op, Sequelize } = require('sequelize');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const httpMocks = require('node-mocks-http');
const app = require('../app');

// Models
const {
    database, User, Book,
    Notification, Trade, Usertrade
} = require('../models'); // Usando o arquivo de models/index.js

const { addBookScreen, addBook, approveBook,
    rejectBook, pendingBooks, getBooks } = require('../controllers/bookController');

// Mocking
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

jest.mock('../models/user'); // Mock do modelo de User
jest.mock('../models/book'); // Mock do modelo de Book
jest.mock('../models/notification')
jest.mock('../models/trade')
jest.mock('../models/usertrade')

describe('addBookScreen', () => {
    it('deve renderizar a página de adicionar livro com os dados corretos', () => {
        // Mock do req e res, sem erros de autenticação e validação
        const req = {
            flash: jest.fn().mockReturnValueOnce([]).mockReturnValueOnce([]).mockReturnValueOnce([]),  // Simulando que não há erros
            session: {
                isAdmin: false  // Usuário não é administrador
            }
        };
        const res = {
            render: jest.fn()  // Mock do método render da resposta
        };

        // Chama a função addBookScreen
        addBookScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('add', {
            authError: undefined,  // Nenhum erro de autenticação
            validationErrors: [],  // Nenhum erro de validação
            isUser: true,
            isAdmin: false,  // Usuário não é administrador
            bookAdded: undefined,  // Nenhuma mensagem de livro adicionado
            req: req,
            pageTitle: "Adicionar Livro"
        });
    });

    it('deve renderizar a página de adicionar livro sem erros, para usuário admin', () => {
        // Mock do req e res para um usuário administrador
        const req = {
            flash: jest.fn().mockReturnValueOnce([]).mockReturnValueOnce([]).mockReturnValueOnce([]),  // Simulando que não há erros
            session: {
                isAdmin: true  // Usuário é administrador
            }
        };

        const res = {
            render: jest.fn()  // Mock do método render da resposta
        };

        // Chama a função addBookScreen
        addBookScreen(req, res);

        // Verifica se o método render foi chamado com os parâmetros corretos
        expect(res.render).toHaveBeenCalledWith('add', {
            authError: undefined,  // Nenhum erro de autenticação
            validationErrors: [],  // Nenhum erro de validação
            isUser: true,
            isAdmin: true,  // Usuário é administrador
            bookAdded: undefined,  // Nenhuma mensagem de livro adicionado
            req: req,
            pageTitle: "Adicionar Livro"
        });
    });
});

describe('addBook', () => {
    it('deve criar um livro e redirecionar para a página de adicionar livro', async () => {
        const req = {
            body: {
                name: 'Livro de Teste',
                description: 'Descrição do livro de teste',
                category: 'Categoria de Teste',
                author: 'Autor de Teste',
                image: 'imagem.jpg',
            },
            file: { filename: 'imagem.jpg' },
            session: { userId: 1 },
            flash: jest.fn(),  // Mock para verificar chamadas de flash
        };
        const res = {
            redirect: jest.fn(),
        };

        Book.create = jest.fn().mockResolvedValue(true);

        await addBook(req, res);

        expect(Book.create).toHaveBeenCalledWith({
            name: 'Livro de Teste',
            description: 'Descrição do livro de teste',
            category: 'Categoria de Teste',
            author: 'Autor de Teste',
            image: 'imagem.jpg',
            userId: 1,
            approvalStatus: 'pending',
        });

        expect(res.redirect).toHaveBeenCalledWith('/books/add');
        expect(req.flash).toHaveBeenCalledWith('added', true);
    });

    it('deve lidar com erros de validação e redirecionar com os erros', async () => {
        const req = {
            body: {
                name: '',  // Nome vazio simula um erro de validação
                description: 'Descrição inválida',
                category: 'Categoria',
                author: 'Autor',
                image: 'imagem.jpg',
            },
            file: { filename: 'imagem.jpg' },
            session: { userId: 1 },
            flash: jest.fn(),
        };
        const res = {
            redirect: jest.fn(),
        };

        validationResult = jest.fn().mockReturnValueOnce({
            isEmpty: () => false,  // Simula falha de validação
            // array: () => [{ msg: 'Nome é obrigatório' }]  // Simula erro de validação
        });

        await addBook(req, res);

        // Verifica se o flash foi chamado com os erros de validação
        // expect(req.flash).toHaveBeenCalledWith('validationErrors', [{ msg: 'Nome é obrigatório' }]);
        expect(res.redirect).toHaveBeenCalledWith('/books/add');
    });

    it('deve lidar com erros de criação de livro e retornar erro 400', async () => {
        const req = {
            body: {
                name: 'Livro de Teste',
                description: 'Descrição do livro de teste',
                category: 'Categoria de Teste',
                author: 'Autor de Teste',
                image: 'imagem.jpg',
            },
            file: { filename: 'imagem.jpg' },
            session: { userId: 1 },
            flash: jest.fn(),
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        Book.create = jest.fn().mockRejectedValue(new Error('Erro ao criar livro'));

        await addBook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro: Erro ao criar livro' });
    });
});

describe('approveBook', () => {
    let originalConsoleError;

    beforeAll(() => {
        // Salva a função console.error original para restaurá-la depois dos testes
        originalConsoleError = console.error;
        console.error = jest.fn(); // Silencia console.error
    });

    afterAll(() => {
        // Restaura o console.error original
        console.error = originalConsoleError;
    });

    it('deve aprovar um livro se o usuário for administrador', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: true },
        };
        const res = {
            redirect: jest.fn(),
        };

        Book.findByPk = jest.fn().mockResolvedValue({
            id: 1,
            approvalStatus: 'pending',
            status: 'pending',
            save: jest.fn().mockResolvedValue(true),
        });

        await approveBook(req, res);

        expect(Book.findByPk).toHaveBeenCalledWith(1);
        expect(res.redirect).toHaveBeenCalledWith('/books/admin/book-request');
    });

    it('deve retornar 404 se o livro não for encontrado', async () => {
        const req = {
            params: { id: 999 },
            session: { isAdmin: true },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findByPk = jest.fn().mockResolvedValue(null);

        await approveBook(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Livro não encontrado');
    });

    it('deve retornar 403 se o usuário não for administrador', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: false },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await approveBook(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Acesso não autorizado');
    });

    it('deve retornar erro 500 ao ocorrer um erro durante a aprovação', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: true },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findByPk = jest.fn().mockRejectedValue(new Error('Erro ao acessar banco de dados'));

        await approveBook(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao aprovar livro');
    });
});

describe('rejectBook', () => {
    // Simula a função de console.error para não exibir erros no terminal
    beforeAll(() => {
        console.error = jest.fn();
    });

    it('deve rejeitar o livro e redirecionar para a página de requisições de livro', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: true },
        };
        const res = {
            redirect: jest.fn(),
        };

        const book = {
            id: 1,
            status: 'pending',
            save: jest.fn().mockResolvedValue(true),
        };

        Book.findByPk = jest.fn().mockResolvedValue(book);

        await rejectBook(req, res);

        expect(Book.findByPk).toHaveBeenCalledWith(1);
        expect(book.status).toBe('rejected');
        expect(book.save).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/book/admin/book-request');
    });

    it('deve retornar erro 404 se o livro não for encontrado', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: true },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findByPk = jest.fn().mockResolvedValue(null);

        await rejectBook(req, res);

        expect(Book.findByPk).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Livro não encontrado');
    });

    it('deve retornar erro 500 em caso de falha ao rejeitar o livro', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: true },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findByPk = jest.fn().mockRejectedValue(new Error('Erro ao acessar banco de dados'));

        await rejectBook(req, res);

        expect(Book.findByPk).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao rejeitar livro');
    });

    it('deve retornar erro 403 se o usuário não for administrador', async () => {
        const req = {
            params: { id: 1 },
            session: { isAdmin: false },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await rejectBook(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Acesso não autorizado');
    });
});

describe('pendingBooks', () => {
    // Silencia qualquer erro no console
    beforeAll(() => {
        console.error = jest.fn();
    });

    it('deve renderizar a página de livros pendentes com a lista de livros', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn(),
        };
        const res = {
            render: jest.fn(),
        };

        const pendingBooksMock = [
            { id: 1, name: 'Livro 1', User: { id: 1, name: 'Autor 1' } },
            { id: 2, name: 'Livro 2', User: { id: 2, name: 'Autor 2' } },
        ];

        Book.findAll = jest.fn().mockResolvedValue(pendingBooksMock);
        Book.count = jest.fn().mockResolvedValue(20); // Exemplo de 20 livros pendentes no total

        await pendingBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User, attributes: ['id', 'name'] }],
            where: { status: 'pending' },
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { status: 'pending' } });
        expect(res.render).toHaveBeenCalledWith('pendingbooks', {
            validationErrors: req.flash('validationErrors'),
            pendingBooks: pendingBooksMock,
            req: req,
            currentPage: 1,
            totalPages: 2, // Total de páginas com 20 livros e 10 por página
            searchQuery: undefined, // Nenhum termo de pesquisa foi fornecido
        });
    });

    it('deve renderizar a página de livros pendentes com o termo de pesquisa', async () => {
        const req = {
            query: { page: 1, search: 'Livro' },
            flash: jest.fn(),
        };
        const res = {
            render: jest.fn(),
        };

        const pendingBooksMock = [
            { id: 1, name: 'Livro 1', User: { id: 1, name: 'Autor 1' } },
        ];

        Book.findAll = jest.fn().mockResolvedValue(pendingBooksMock);
        Book.count = jest.fn().mockResolvedValue(10); // Exemplo de 10 livros pendentes no total

        await pendingBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User, attributes: ['id', 'name'] }],
            where: {
                status: 'pending',
                name: { [Sequelize.Op.like]: '%Livro%' },
            },
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { status: 'pending' } });
        expect(res.render).toHaveBeenCalledWith('pendingbooks', {
            validationErrors: req.flash('validationErrors'),
            pendingBooks: pendingBooksMock,
            req: req,
            currentPage: 1,
            totalPages: 1, // Apenas 1 página de livros pendentes
            searchQuery: 'Livro', // Termo de pesquisa fornecido
        });
    });

    it('deve retornar erro 500 se ocorrer um erro ao buscar livros pendentes', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn(),
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findAll = jest.fn().mockRejectedValue(new Error('Erro ao acessar banco de dados'));

        await pendingBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User, attributes: ['id', 'name'] }],
            where: { status: 'pending' },
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao buscar livros pendentes');
    });

    it('deve retornar erro 500 se ocorrer um erro ao contar o total de livros pendentes', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn(),
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findAll = jest.fn().mockResolvedValue([{ id: 1, name: 'Livro 1', User: { id: 1, name: 'Autor 1' } }]);
        Book.count = jest.fn().mockRejectedValue(new Error('Erro ao contar livros'));

        await pendingBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User, attributes: ['id', 'name'] }],
            where: { status: 'pending' },
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { status: 'pending' } });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao buscar livros pendentes');
    });
});

describe('getBooks', () => {
    // Silencia qualquer erro no console
    beforeAll(() => {
        console.error = jest.fn();
        console.log = jest.fn();  // Adicionando silenciamento para o console.log também
    });

    it('deve renderizar a página de livros com a lista de livros aprovados', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn().mockReturnValue([]),
        };

        const res = {
            render: jest.fn(),
        };

        const booksMock = [
            { id: 1, name: 'Livro 1', category: 'Educação', User: { id: 1, name: 'Autor 1' } },
            { id: 2, name: 'Livro 2', category: 'Ficção', User: { id: 2, name: 'Autor 2' } },
        ];

        Book.findAll = jest.fn().mockResolvedValue(booksMock);
        Book.count = jest.fn().mockResolvedValue(20); // Exemplo de 20 livros aprovados no total

        await getBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User }],
            where: { status: 'available', approvalStatus: 'approved' },
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { approvalStatus: 'approved' } });
        expect(res.render).toHaveBeenCalledWith('books', {
            validationErrors: req.flash('validationErrors'),
            books: booksMock,
            req: req,
            currentPage: 1,
            totalPages: 2, // Total de páginas com 20 livros e 10 por página
            selectedCategory: undefined, // Nenhuma categoria foi selecionada
            categories: ['Educação', 'Ficção', 'Política'],
            bookAdded: req.flash('added')[0],
        });
    });

    it('deve renderizar a página de livros com a pesquisa por título', async () => {
        const req = {
            query: { page: 1, search: 'Livro' },
            flash: jest.fn().mockReturnValue([]),
        };

        const res = {
            render: jest.fn(),
        };

        const booksMock = [
            { id: 1, name: 'Livro 1', category: 'Educação', User: { id: 1, name: 'Autor 1' } },
        ];

        Book.findAll = jest.fn().mockResolvedValue(booksMock);
        Book.count = jest.fn().mockResolvedValue(10); // Exemplo de 10 livros aprovados no total

        await getBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User }],
            where: {
                status: 'available',
                approvalStatus: 'approved',
                name: { [Sequelize.Op.like]: '%Livro%' },
            }
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { approvalStatus: 'approved' } });
        expect(res.render).toHaveBeenCalledWith('books', {
            validationErrors: req.flash('validationErrors'),
            books: booksMock,
            req: req,
            currentPage: 1,
            totalPages: 1, // Apenas 1 página de livros aprovados
            selectedCategory: undefined, // Nenhuma categoria foi selecionada
            categories: ['Educação', 'Ficção', 'Política'],
            bookAdded: req.flash('added')[0],
        });
    });

    it('deve renderizar a página de livros com a categoria selecionada', async () => {
        const req = {
            query: { page: 1, category: 'Educação' },
            flash: jest.fn().mockReturnValue([]),
        };

        const res = {
            render: jest.fn(),
        };

        const booksMock = [
            { id: 1, name: 'Livro 1', category: 'Educação', User: { id: 1, name: 'Autor 1' } },
        ];

        Book.findAll = jest.fn().mockResolvedValue(booksMock);
        Book.count = jest.fn().mockResolvedValue(10); // Exemplo de 10 livros aprovados no total

        await getBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User }],
            where: {
                status: 'available',
                approvalStatus: 'approved',
                category: 'Educação',
            }
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { approvalStatus: 'approved' } });
        expect(res.render).toHaveBeenCalledWith('books', {
            validationErrors: req.flash('validationErrors'),
            books: booksMock,
            req: req,
            currentPage: 1,
            totalPages: 1, // Apenas 1 página de livros aprovados
            selectedCategory: 'Educação', // Categoria selecionada
            categories: ['Educação', 'Ficção', 'Política'],
            bookAdded: req.flash('added')[0],
        });
    });

    it('deve retornar erro 500 se ocorrer um erro ao buscar livros', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn().mockReturnValue([]),
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findAll = jest.fn().mockRejectedValue(new Error('Erro ao acessar banco de dados'));

        await getBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User }],
            where: { status: 'available', approvalStatus: 'approved' },
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao buscar livros');
    });

    it('deve retornar erro 500 se ocorrer um erro ao contar o total de livros', async () => {
        const req = {
            query: { page: 1 },
            flash: jest.fn().mockReturnValue([]),
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        Book.findAll = jest.fn().mockResolvedValue([{ id: 1, name: 'Livro 1', User: { id: 1, name: 'Autor 1' } }]);
        Book.count = jest.fn().mockRejectedValue(new Error('Erro ao contar livros'));

        await getBooks(req, res);

        expect(Book.findAll).toHaveBeenCalledWith({
            limit: 10,
            offset: 0,
            include: [{ model: User }],
            where: { status: 'available', approvalStatus: 'approved' },
        });
        expect(Book.count).toHaveBeenCalledWith({ where: { approvalStatus: 'approved' } });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Erro ao buscar livros');
    });
});








