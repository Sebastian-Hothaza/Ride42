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
router.post('/login/:userID', userController.login)
router.get('/users/:userID/trackdays', userController.getTrackdays)
router.get('/verify/:userID', userController.verify)

router.get('/users/:userID', userController.user_get)
router.post('/users/:userID', userController.user_post)
router.put('/users/:userID', userController.user_put)
router.delete('/users/:userID', userController.user_delete)

// Trackdays

router.post('/trackdays/:trackdayID/:userID', trackdayController.register)
router.delete('/trackdays/:trackdayID/:userID', trackdayController.unregister)
router.post('/trackdays/reschedule/:userID', trackdayController.reschedule)
router.get('/trackdays/:trackdayID/checkin/:userID', trackdayController.checkin)

router.get('/trackdays/:trackdayID', trackdayController.trackday_get)
router.post('/trackdays/:trackdayID', trackdayController.trackday_post)
router.put('/trackdays/:trackdayID', trackdayController.trackday_put)
router.delete('/trackdays/:trackdayID', trackdayController.trackday_delete)

module.exports = router;