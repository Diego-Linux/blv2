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

module.exports = router