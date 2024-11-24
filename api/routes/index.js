const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const trackdayController = require('../controllers/trackdayController')

router.get('/', (req,res,next)=>res.sendStatus(200)) // Used to ping API and wake up FLY machines

// Users
router.post('/login', userController.login)
router.get('/verify/:userID/:trackdayID/:bikeID', userController.verify)
router.get('/verify/:QRID/:trackdayID', userController.verifyQR)


router.put('/password/:userID', userController.updatePassword)
router.put('/resetpassword/:userID/:token', userController.resetPassword)
router.post('/resetpassword', userController.requestPasswordResetLink)
router.post('/garage/:userID', userController.garage_post)
router.delete('/garage/:userID/:bikeID', userController.garage_delete)
router.post('/qrcode/:userID/:bikeID', userController.requestQRCode)
router.post('/QR', userController.generateQRs)
router.get('/QR', userController.getQR)
router.put('/QR/:QRID/:userID/:bikeID', userController.marryQR)
router.delete('/QR/:QRID', userController.deleteQR)
router.post('/waiver/:userID', userController.markWaiver)


router.get('/users/:userID', userController.user_get)
router.get('/users', userController.user_getALL)
router.post('/users', userController.user_post)
router.put('/users/:userID', userController.user_put)
router.delete('/users/:userID', userController.user_delete)

// Testing use only
if (process.env.NODE_ENV === 'test') router.post('/admin', userController.admin)
//router.post('/service', userController.service)

// Trackdays
router.post('/register/:userID/:trackdayID', trackdayController.register) 
router.delete('/register/:userID/:trackdayID', trackdayController.unregister)
router.put('/register/:userID/:trackdayID_OLD/:trackdayID_NEW', trackdayController.reschedule) 
router.post('/checkin/:userID/:trackdayID/:bikeID', trackdayController.checkin)
router.get('/presentTrackdays', trackdayController.presentTrackdays)
router.get('/presentTrackdays/:userID', trackdayController.presentTrackdaysForUser)
router.put('/paid/:userID/:trackdayID', trackdayController.updatePaid)
router.post('/walkons/:trackdayID', trackdayController.walkons)


router.get('/trackdays/:trackdayID', trackdayController.trackday_get)
router.get('/trackdays', trackdayController.trackday_getALL)
router.post('/trackdays', trackdayController.trackday_post) 
router.put('/trackdays/:trackdayID', trackdayController.trackday_put)
router.delete('/trackdays/:trackdayID', trackdayController.trackday_delete)

module.exports = router;