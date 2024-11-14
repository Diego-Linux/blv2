const router = require('express').Router()
const userCtrl = require('../controllers/userController')
const Middleware = require('../middlewares/middleware')

const multer = require('multer');

// Middleware para carregar notificações
router.use(userCtrl.loadNotifications);

router.post('/notifications/read/:id', userCtrl.markAsRead);

router.get('/', userCtrl.getLandingScreen)

router.get('/register', Middleware.notUser, userCtrl.registerScreen)

router.get('/register', Middleware.isUser, userCtrl.registerScreen)

router.post('/register', Middleware.notUser, userCtrl.createUser)

router.get('/login', Middleware.notUser, userCtrl.loginScreen)

router.post('/login', Middleware.notUser, userCtrl.userLogin)

router.get('/mybooks', Middleware.isUser, userCtrl.getBooksUser)

router.get('/edit-profile', Middleware.isUser, userCtrl.getEditUser)

router.post('/update-profile',  multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "images/");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    })
}).single("image"), Middleware.isUser, userCtrl.updateProfile);

router.get('/user/:id', Middleware.isUser, userCtrl.getUserProfileById)

router.get('/req/:id', Middleware.isUser, userCtrl.getSolicitationPage)

router.all('/logout', Middleware.isUser, userCtrl.logout);

module.exports = router;