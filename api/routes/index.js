const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const trackdayController = require('../controllers/trackdayController')

// Users
router.post('/login', userController.login)
router.get('/users/:userID/trackdays', userController.getTrackdays)
router.get('/verify/:userID/:trackdayID', userController.verify)
router.put('/password/:userID', userController.updatePassword)
router.post('/garage/:userID', userController.garage_post)
router.delete('/garage/:userID', userController.garage_delete)


router.get('/users/:userID', userController.user_get)
router.get('/users', userController.user_getALL)
router.post('/users', userController.user_post)
router.put('/users/:userID', userController.user_put)
router.delete('/users/:userID', userController.user_delete)

// Testing use only
if (process.env.NODE_ENV === 'test') router.post('/admin', userController.admin)

// Trackdays

router.post('/register/:userID/:trackdayID', trackdayController.register) 
router.delete('/register/:userID/:trackdayID', trackdayController.unregister)
router.put('/register/:userID/:trackdayID_OLD/:trackdayID_NEW', trackdayController.reschedule) 
router.post('/checkin/:userID/:trackdayID', trackdayController.checkin)

router.get('/trackdays/:trackdayID', trackdayController.trackday_get)
router.get('/trackdays', trackdayController.trackday_getALL)
router.post('/trackdays', trackdayController.trackday_post) 
router.put('/trackdays/:trackdayID', trackdayController.trackday_put)
router.delete('/trackdays/:trackdayID', trackdayController.trackday_delete)

function myMiddlewarefn(req,res,next){
    console.log(req.body.email);
    next();
}


module.exports = {router, myMiddlewarefn};