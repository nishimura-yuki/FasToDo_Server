var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');

module.exports.get = function(req, res, next){
    res.render("register");
};

module.exports.post = function(req, res, next){
    console.log(req.body);
    var u = new User({
        userid: req.body.userid,
        pass: req.body.password,
        timezone: User.timezones.Japan
    });
    u.register( function(err){
        if(err) return next(err);
        res.end('post!!');
    });
};


