var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

// routes
var api = require('./api');
var apiTask   = require('./api/task');
var apiFolder = require('./api/folder');

var webApp = require('./web/app');
var webRegister = require('./web/register');

// routing table
var routes = [
    {method: 'use' , path: '/api/*' , func: bodyParser.json() },
    {method: 'use' , path: '/api/*' , func: api.base },

    {method: 'get'   , path: '/api/task' , func: apiTask.get } ,
    {method: 'post'  , path: '/api/task' , func: apiTask.post} ,
    {method: 'put'   , path: '/api/task/:id' , func: apiTask.put},
    {method: 'put'   , path: '/api/task/done/:id' , func: apiTask.done},
    {method: 'put'   , path: '/api/task/active/:id' , func: apiTask.active},
    {method: 'delete', path: '/api/task/:id' , func: apiTask.del},
    
    {method: 'get'   , path: '/api/folder' , func: apiFolder.get } ,
    {method: 'post'  , path: '/api/folder' , func: apiFolder.post} ,
    {method: 'put'   , path: '/api/folder/:id' , func: apiFolder.put},
    {method: 'delete', path: '/api/folder/:id' , func: apiFolder.del},

    {method: 'get'  , path: '/app' , func: webApp.main } ,
    {method: 'get'  , path: '/user/register' , func: webRegister.get } ,
    {method: 'post'  , path: '/user/register' , func: webRegister.post }
];

for (var i=0; i<routes.length; i++ ) {
    console.log("route setting: " + routes[i].method + ' ' + routes[i].path );
    router[routes[i].method]( routes[i].path , routes[i].func );       
}

//404 not found
router.use( function(req, res){
    res.status(404).format({
        json: function(){
            res.send({ message: 'Resource not found' });
        }
    });
});

//error
router.use( function(err, req, res, next){
    console.log(err.stack);
    var msg;
    switch(err.type){
        case 'badrequest':
            msg = 'Bad Request';
            res.statusCode = 400;
            break;
        default:
            msg = 'Internal Server Error';
            res.statusCode = 500;
    }

    res.format({
        json: function(){
            res.send({error: msg});
        }
    });

});

module.exports = router;
