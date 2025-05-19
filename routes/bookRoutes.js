const router = require('express').Router();
const bookCtrl = require('../controllers/bookController');
const userMiddleware = require('../middlewares/middleware');
const multer = require('multer');
const { check } = require('express-validator');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "images/");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    })
});
// Rotas fixas (sem parâmetro dinâmico) devem vir primeiro:
router.get('/', userMiddleware.isUser, bookCtrl.getBooks);

router.get('/add', userMiddleware.isUser, bookCtrl.addBookScreen);

router.post('/add',
    userMiddleware.isUser,
    upload.single("image"),
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
    userMiddleware.isAdmin, // Somente admins podem adicionar títulos
    upload.single("image"), // Middleware do multer (mesmo que usado em /add)
    check("name").not().isEmpty().withMessage("Nome é obrigatório!"),
    check("description").not().isEmpty().withMessage("Descrição é obrigatória!"),
    check("author").not().isEmpty().withMessage("Autor é obrigatório!"),
    check("image").custom((value, { req }) => {
        if (req.file) return true;
        throw "Adicione uma imagem!";
    }),
    bookCtrl.addTitle
);
router.get('/titles/:id', userMiddleware.isUser,bookCtrl.getTitleById);

router.get('/book-details', userMiddleware.isUser, bookCtrl.getBooksByTitle);

router.post('/remove/:id', userMiddleware.isUser, bookCtrl.removeBook);

router.get('/admin/book-request', userMiddleware.isAdmin, bookCtrl.pendingBooks);

router.post('/admin/accept-book/:id', userMiddleware.isAdmin, bookCtrl.approveBook);

router.post('/admin/reject-book/:id', userMiddleware.isAdmin, bookCtrl.rejectBook);

router.get('/:id', userMiddleware.isUser, bookCtrl.getBookById);

module.exports = router;
