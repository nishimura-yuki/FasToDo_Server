var define = require('define-constant')(global.DEFINE)();
var auth = require('./../component/authenticator');

module.exports.get = function(req, res, next){
    auth.logout(res);
    res.redirect("/web/login");
};

