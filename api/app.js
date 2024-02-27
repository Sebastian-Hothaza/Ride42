const express = require('express');
const morgan = require('morgan');

const app = express();

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

// ROUTER
const indexRouter = require('./routes/index');
app.use('/', indexRouter);


// catch 404 and forward to error handler
const createError = require('http-errors');
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
