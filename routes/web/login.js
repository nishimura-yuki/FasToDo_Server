var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');
var auth = require('./../component/authenticator');
var InvalidException = require(define.path.lib + '/exceptions').InvalidException;

module.exports.get = function(req, res, next){
    res.render("login");
};

module.exports.post = function(req, res, next){
    console.log(req.body);
    User.get( req.body.userid, req.body.password, function(err, user){
        if(err) return next(err);
        if(!user){
            return next(new InvalidException( InvalidException.cause.INVALID_LOGIN_INFO )); 
        }
        auth.refresh( res, user, function(err){
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

}
