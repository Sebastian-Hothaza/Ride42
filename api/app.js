const express = require('express');
require("./mongoConfig")
const logger = require('./logger');



const app = express();

// Simulate slow network
const simulateSlowNetwork = false;
const delay = 2000;
if (simulateSlowNetwork) {
  logger.warn({ message: 'SLOW SERVER SIMULATION' });
  const sleep = (ms) => new Promise(
    resolve => setTimeout(resolve, ms));
  app.use(async (req, res, next) => {
    logger.warn({message: 'server delayed by ' + delay + ' ms'})
    await sleep(delay)
    next();
  })
}

// cors setup
const cors = require('cors')

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? "https://ride42.ca" : "http://localhost:5173", credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

// ROUTER
const router = require('./routes/index');
app.use('/', router);


// catch 404 and forward to error handler
const createError = require('http-errors');
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') !== 'production' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ msg: ['BAD REQUEST'] });
});

module.exports = app;
