var router = require('express').Router();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var auth = require('./../component/authenticator');

var base = function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control");
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }else{
        next();
    }
};

// routes
var task   = require('./task');
var folder = require('./folder');

// routing table
var routes = [
    {method: 'use' , path: '/*' , func: bodyParser.json() },
    {method: "use" , path: '/*', func: cookieParser() },
    {method: 'use' , path: '/*' , func: base },
    {method: "use"  , path: '/*' , func: auth.auth },

    {method: 'get'   , path: '/task' , func: task.get } ,
    {method: 'post'  , path: '/task' , func: task.post} ,
    {method: 'put'   , path: '/task/:id' , func: task.put},
    {method: 'put'   , path: '/task/done/:id' , func: task.done},
    {method: 'put'   , path: '/task/active/:id' , func: task.active},
    {method: 'delete', path: '/task/:id' , func: task.del},
    
    {method: 'get'   , path: '/folder' , func: folder.get } ,
    {method: 'post'  , path: '/folder' , func: folder.post} ,
    {method: 'put'   , path: '/folder/:id' , func: folder.put},
    {method: 'delete', path: '/folder/:id' , func: folder.del}

];

for (var i=0; i<routes.length; i++ ) {
    console.log("api route setting: " + routes[i].method + ' ' + routes[i].path );
    router[routes[i].method]( routes[i].path , routes[i].func );       
}

module.exports = router;
