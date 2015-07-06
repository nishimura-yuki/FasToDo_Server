var bcrypt = require('bcrypt');
var sprintf = require("sprintf-js").sprintf;
var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');

var USER_COOKIE_NAME = "_fastodo_usr_";
var USER_COOKIE_LONG = 1000 * 60 * 60 * 24 * 14; //2 weeks

var REG_USERID = /^[0-9]{1,10}$/;

module.exports.auth = function(req, res, next){
    console.log("auth!!");
    var userCookie = req.cookies[USER_COOKIE_NAME];
    //if(!userCookie) return redirectDefault(res);
    if(!userCookie){
        res.locals.user = {
            id:1,
            userid:"test@test.com",
            language:"en-US",
            timezone:"Australia/Sydney"
        }; 
        return next();
    }

    console.log( userCookie );
    var id = userCookie.id;
    var hash = userCookie.hash;
    var expired = userCookie.expired;
    var expired_date = null;
    console.log(id);
    if( !id || !String(id).match(REG_USERID) ){
        console.log("userid? " + id);
        redirectDefault(res);
        return;
    }
    if( !expired ){
        console.log("expired?");
        redirectDefault(res);
        return;
    }else{
        console.log(expired);
        expired_date = new Date(expired); 
        console.log(expired_date);
        if(Number.isNaN(expired_date.getTime())){
            redirectDefault(res);
            return;
        }
    }
    if( !hash ){
        console.log("hash?");
        redirectDefault(res);
        return;
    }
    
    if( expired <= new Date().getTime() ){
        console.log("real expired");
        redirectDefault(res);
        return;
    }
    
    var key = sprintf( "%s:%s:%s", USER_COOKIE_NAME , id, expired);
    User.getWithAuth( id, key, hash, function(err, user){
        if(err) return next(err);
        if(!user) return redirectDefault(res);
        module.exports.refresh(res, user, function(err){
            if(err) return next(err);
            res.locals.user = convertToUserJson(user); 
            next();
        });
    });

};

module.exports.refresh = function( res, user, fn ){
    console.log("user cookie set");
    var expired = new Date( new Date().getTime() + USER_COOKIE_LONG );
    console.log( expired );
    expired = expired.getTime();
    var key = sprintf( "%s:%s:%s", USER_COOKIE_NAME , user.id, expired);
    console.log(key);
    bcrypt.hash( key, user.salt, function(err, hash){
            if(err) return fn(err);
            res.cookie( USER_COOKIE_NAME , {
                id: user.id,
                hash: hash,
                expired: expired  
            });
            fn(null);
    }); 
};

//== private

function redirectDefault(res){
    res.clearCookie( USER_COOKIE_NAME );
    res.format({
        html:function(){
            res.redirect("/web/login");
        },
        json:function(){
            res.statusCode = 401;
            res.json({message: "Unauthorized" });
        }
    });
}

function convertToUserJson(user){
    return {
        id: user.id,
        userid: user.userid,
        timezone: user.timezone,
        language: user.language
    };
}
