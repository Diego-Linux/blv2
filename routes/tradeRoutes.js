const router = require('express').Router()
const TradeCtrl = require('../controllers/tradeController')
const Middleware = require('../middlewares/middleware')

router.post('/new', Middleware.isUser, TradeCtrl.requestTrade)

router.post('/accept-trade/:id', Middleware.isUser, TradeCtrl.acceptTrade)

router.post('/reject-trade/:id', Middleware.isUser, TradeCtrl.rejectTrade)

router.get('/reqlist', TradeCtrl.requestsList)

router.get('/mytrades', Middleware.isUser, TradeCtrl.myTrades)

router.post('/cancel/:id', Middleware.isUser, TradeCtrl.cancelTrade);

router.post('/confirm/:id', Middleware.isUser, TradeCtrl.confirmTrade);

router.get('/myrequests', Middleware.isUser, TradeCtrl.myRequests);

router.post('/cancel-request/:id', Middleware.isUser, TradeCtrl.cancelRequest);

// Ver detalhes da trade + chat
router.get('/details/:id', Middleware.isUser, TradeCtrl.tradeDetails);

// Enviar mensagem no chat da trade
router.post('/send-message', Middleware.isUser, TradeCtrl.sendMessage);

// Editar recado (mensagem) - aqui o corpo da requisição deve conter messageId e content
router.post('/edit-message/:id', Middleware.isUser, TradeCtrl.editMessage);

// Remover recado (mensagem) - usa id da mensagem na URL
router.post('/delete-message/:id', Middleware.isUser, TradeCtrl.deleteMessage);

module.exports = router