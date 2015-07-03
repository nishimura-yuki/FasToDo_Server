/**
 * Module dependencies.
 */
global.DEFINE = {};
var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var static = require('serve-static');
var define = require('define-constant')(global.DEFINE);

var app = express();

//Set Application Config
if( !app.get('env') ){
    console.log('env empty');
    app.set('env', 'development');
}
var config = require('./config');
config.load( app.get('env') );

// view engine setup
app.set('view engine', 'ejs');

// define
define("path", 
       { config: path.join(__dirname, 'config') ,
         models: path.join(__dirname, 'models') ,
         lib:  path.join(__dirname, 'lib')  
       });
console.log(define());

// all environments
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(static(path.join(__dirname, 'public')));

// Application Router Setting
var routes = require('./routes');
app.use(routes);
//app.use(routes.notfound);
//app.use(routes.error);

// Error Handling
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
