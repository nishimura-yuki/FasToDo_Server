var define = require('define-constant')(global.DEFINE)();
var bcrypt = require('bcrypt');
var mysql = require(define.path.lib + '/mysql');

module.exports = User;

function User(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
}

User.timezones = {
    "Japan": "Asia/Tokyo",
    "Australia/Sydney":"Australia/ACT"
};


User.get = function( userid, password, fn ){
    
    var callback1 = function( err, res ){
        if(err) return fn(err);
        
        //この時点でユーザが存在しなければ終了
        
        bcrypt.hash( password, res.salt, function(err, hash){
            if(err) return fn(err);
            if(hash == res.password){
                return fn(null, res); 
            }
            //パスワード間違い
            fn();
        }); 
    };
    
    getUserById( this.userid, callback1 );

}

User.prototype.register = function( fn ){
   
    var _this = this;
    var insertid = 0;
    var callback1 = function( err, res ){
        if(err) return fn(err);
        
        //ユーザが既に存在している場合はその旨を通知
        
        hashPassword( _this.pass, callback2 );
    };

    var callback2 = function(err, salt, password){
        _this.salt = salt;
        _this.password = password;
        mysql.queryWithTransaction(
            [
                function(con){
                    return new Promise(function(resolve, reject){
                        console.log("insert new data "+ _this.password);
                        con.query(
                            "INSERT INTO user(userid, salt, password, timezone, created_at) " +
                            "VALUE(?, ?, ?, ?, now())" ,
                            [ _this.userid, _this.salt, _this.password, _this.timezone ],
                            function( err, result ){
                                if(err){
                                    reject(err); 
                                    return;
                                } 
                                console.log(result);
                                insertid = result.insertId;
                                resolve(con); 
                            }
                        );
                    });
                }
            ],
            function(err){
                if(err) return fn(err);
                _this.id = insertid;
                fn();
            }
        ); 
    }

    getUserById( this.userid, callback1 );

}

User.prototype.update = function( fn ){

}

//======= private

function getUserById( userid, fn ){
    var res = {};
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                            "SELECT id,userid,salt,password,timezone" +
                            " FROM user WHERE " +
                            "userid=? ",
                            [userid],
                            function(err, result){
                                if(err){
                                    reject(err);
                                    return;
                                }
                                console.log(result);
                                resolve(con);
                            }
                    );
                });
            } 
        ],
        function(err){
            if(err) return fn(err);
            fn(null, new User(res) );
        }
   );
}

function hashPassword( password, fn ){
   var _salt = "";
   bcrypt.genSalt(12, function(err, salt){
        if(err) return fn(err);
        _salt = salt;
        bcrypt.hash(password, salt, function(err, hash){
            if(err) return fn(err);
            fn(null, _salt, hash);
        });
   }); 
}

