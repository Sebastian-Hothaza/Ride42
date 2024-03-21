const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const trackdayController = require('../controllers/trackdayController')

/* GET home page. */
router.get('/', function(req, res, next) {
  if (process.env.NODE_ENV == 'development'){
    res.send("dev");
  }else{
    res.send("prod");
  }
});

// Users
router.post('/login', userController.login)
router.get('/users/:userID/trackdays', userController.getTrackdays)
router.get('/verify/:userID', userController.verify)
router.get('/updatedPassword/:userID', userController.updatePassword)
router.post('/garage/:userID', userController.garage_post)
router.delete('/garage/:userID', userController.garage_delete)



router.get('/users/:userID', userController.user_get)
router.get('/users', userController.user_getALL)
router.post('/users', userController.user_post)
router.put('/users/:userID', userController.user_put)
router.delete('/users/:userID', userController.user_delete)

// Trackdays

router.post('/register/:trackdayID/:userID', trackdayController.register) 
router.delete('/register/:trackdayID/:userID', trackdayController.unregister)
router.put('/register/:trackdayID/:userID', trackdayController.reschedule) 
router.get('/trackdays/:trackdayID/checkin/:userID', trackdayController.checkin)

router.get('/trackdays/:trackdayID', trackdayController.trackday_get)
router.get('/trackdays', trackdayController.trackday_getALL)
router.post('/trackdays ', trackdayController.trackday_post) 
router.put('/trackdays/:trackdayID', trackdayController.trackday_put)
router.delete('/trackdays/:trackdayID', trackdayController.trackday_delete)

module.exports = router;