var app = require('express');
var router = app.Router();

// routes
var api = require('./api');
var web = require('./web');

router.use( '/api', api );
router.use( '/web', web );

//404 not found
router.use( function(req, res){
    res.status(404).format({
        json: function(){
            res.send({ message: 'Resource not found' });
        },
        plain: function(){
            res.render('Resource not found');
        },
        html: function(){
            res.render('404_notfound');
        },
        default: function() {
            res.status(406).send('Not Acceptable');
        }
    });
});

//error
router.use( function(err, req, res, next){
    console.log(err.stack);
    var msg;
    var cause;
    switch(err.type){
        case 'badrequest':
            msg = 'Bad Request';
            res.statusCode = 400;
            break;
        case 'invaliddata':
            cause = err.cause;
            mag = "Invalid Data";
            res.statusCode = 400;
            break;
        default:
            msg = 'Internal Server Error';
            res.statusCode = 500;
            break;
    }

    res.format({
        json: function(){
            res.send({error: msg, cause: cause});
        },
        plain: function(){
            res.send( msg ); 
        },
        html: function(){
            res.render('error', {
                message: null,
                error: null
            });
        }, 
        default: function() {
            res.status(406).send('Not Acceptable');
        }       
    });

});

module.exports = router;
