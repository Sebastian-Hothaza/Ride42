const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (process.env.NODE_ENV == 'development'){
    res.send("dev");
  }else{
    res.send("prod");
  }
 
});

module.exports = router;
