var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');
var auth = require('./../component/authenticator');
var InvalidException = require(define.path.lib + '/exceptions').InvalidException;

module.exports.get = function(req, res, next){
    res.render("signup");
};

module.exports.post = function(req, res, next){
    console.log(req.body);
    var u = new User({
        userid: req.body.userid,
        pass: req.body.password,
        timezone: req.body.timezone, 
        language: req.body.language
    });
    u.register( function(err){
        console.log(err);
        if(err) return next(err);
        //クッキーにログイン情報を付与
        auth.refresh( res, u, function(err){
            if(err) return next(err); 
             res.format({
                html: function(){
                    res.redirect('/web/app');
                },
                json: function(){
                    res.json( {redirect: '/web/app'} );
                }
            });                
        });
    });
};


