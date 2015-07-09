var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');
var timezone = require(define.path.lib + '/timezone');

module.exports.put = function(req, res, next){
    console.log(req.body);
    var user = new User( res.locals.user );
    user.language = req.body.language;
    user.timezone = req.body.timezone;
    user.updateSettings(function(err){
        if(err) return next(err);
        res.json( convertToJson(user) );
    });
}

//== private

function convertToJson( user ){
    return {
        userid: user.userid,
        timezone: {
            name: user.timezone,
            offset :timezone.getTimezoneOffset(user.timezone),
        },
        language: user.language
    };
}
