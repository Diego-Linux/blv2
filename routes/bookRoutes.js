const router = require('express').Router();
const bookCtrl = require('../controllers/bookController');
const userMiddleware = require('../middlewares/middleware');
const multer = require('multer');
const { check } = require('express-validator');
const { storage } = require('../config/cloudinary'); // importa o storage do Cloudinary

const upload = multer({ storage });

// Rotas fixas (sem parâmetro dinâmico) devem vir primeiro:
router.get('/', userMiddleware.isUser, bookCtrl.getBooks);

router.get('/add', userMiddleware.isUser, bookCtrl.addBookScreen);

router.post('/add',
    userMiddleware.isUser,
    upload.single("image"), // agora usa upload no Cloudinary
    check("name").not().isEmpty().withMessage("Nome é obrigatório !"),
    check("description").not().isEmpty().withMessage("Descrição é obrigatório !"),
    check("category").not().isEmpty().withMessage("Defina uma categoria !"),
    check("image").custom((value, { req }) => {
        if (req.file) return true;
        throw "Adicione uma imagem !";
    }),
    bookCtrl.addBook
);

router.get('/titles', userMiddleware.isUser, bookCtrl.getTitles);

router.get('/titles/add', userMiddleware.isAdmin, bookCtrl.addTitleScreen);

router.post('/titles/add',
    userMiddleware.isAdmin,
    upload.single("image"), // Cloudinary upload
    check("name").not().isEmpty().withMessage("Nome é obrigatório!"),
    check("description").not().isEmpty().withMessage("Descrição é obrigatória!"),
    check("author").not().isEmpty().withMessage("Autor é obrigatório!"),
    check("image").custom((value, { req }) => {
        if (req.file) return true;
        throw "Adicione uma imagem!";
    }),
    bookCtrl.addTitle
);

router.get('/titles/:id', userMiddleware.isUser, bookCtrl.getTitleById);

router.get('/book-details', userMiddleware.isUser, bookCtrl.getBooksByTitle);

router.post('/remove/:id', userMiddleware.isUser, bookCtrl.removeBook);

router.get('/admin/book-request', userMiddleware.isAdmin, bookCtrl.pendingBooks);

router.post('/admin/accept-book/:id', userMiddleware.isAdmin, bookCtrl.approveBook);

router.post('/admin/reject-book/:id', userMiddleware.isAdmin, bookCtrl.rejectBook);

router.get('/:id', userMiddleware.isUser, bookCtrl.getBookById);

router.post('/titles/:id/comments', userMiddleware.isUser, bookCtrl.createComment);

router.post('/titles/:titleId/comments/:commentId/delete', userMiddleware.isUser, bookCtrl.deleteComment);

router.post('/titles/:id/rate', userMiddleware.isUser, bookCtrl.postRating);

module.exports = router;
