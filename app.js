
require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose=require('mongoose')
const connectDB= require('./db/config');
const ejs = require('ejs')
const expressLayout = require('express-ejs-layouts')
const session = require('express-session')
const bodyParser= require('body-parser')


var app = express();

connectDB();



//code for no-cache 
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


//session config
app.use(session
  ({secret:process.env.COOKIE_SECRET,
 resave: false,
 saveUninitialized: true,
 cookie:{maxAge:1000 * 60 * 60 * 24} //24 hours
}));


//set the router path
var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');




// app.use(expressLayout);
// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.set('layout','./layouts/layout')






// view engine setup
// app.set('views', path.join(__dirname, 'views'));


// view engine setup, this is help for layout and partials
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout','./layout/layout')
app.use(expressLayout)




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//set the routers
app.use('/', userRouter);
app.use('/admin', adminRouter);


app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())





// catch 404 and forward to error handler
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
