var define = require('define-constant')(global.DEFINE)();
var timezone = require(define.path.lib + '/timezone');

module.exports.main = function(req, res, next){
    console.log(res.locals);
    var user = res.locals.user;
    res.render('app', 
               {
                "app_env":{
                    "user":{
                        "userid": user.userid,
                        "timezone":{
                            "offset" :timezone.getTimezoneOffset(user.timezone),
                            "name"   :user.timezone
                        },
                        "language": user.language
                    }
                }
            }
    );
};

