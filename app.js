/**
 * Module dependencies.
 */
global.DEFINE = {};
var express = require('express');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var define = require('define-constant')(global.DEFINE);
var static = require('serve-static');
var favicon = require('serve-favicon');

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
         lib:  path.join(__dirname, 'lib') , 
         public:  path.join(__dirname, 'public')  
       });

// all environments
app.use(logger('dev'));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(static(path.join(__dirname, 'public')));
   
// Application Router Setting
var routes = require('./routes');
app.use(routes);

module.exports = app;
