var router = require('express').Router();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var auth = require('./../component/authenticator');

// routes
var app = require('./app');
var signup = require('./signup');
var login = require('./login');
var logout = require('./logout');

var routes = [
    
    {method: "use", path: '/*', func: bodyParser.urlencoded({extended: false}) },
    {method: "use", path: '/*', func: cookieParser() },

    {method: "use"  , path: '/app*' , func: auth.auth },
    {method: 'get'  , path: '/app' , func: app.main } ,
    {method: 'get'  , path: '/signup' , func: signup.get } ,
    {method: 'post' , path: '/signup' , func: signup.post } ,
    {method: 'get'  , path: '/login' , func: login.get } ,
    {method: 'post' , path: '/login' , func: login.post },
    {method: 'get'  , path: '/logout' , func: logout.get } 
    
]; 

for (var i=0; i<routes.length; i++ ) {
    console.log("web route setting: " + routes[i].method + ' ' + routes[i].path );
    router[routes[i].method]( routes[i].path , routes[i].func );       
}

module.exports = router;
