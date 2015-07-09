var define = require('define-constant')(global.DEFINE)();
var bcrypt = require('bcrypt');
var mysql = require(define.path.lib + '/mysql');
var InvalidException = require(define.path.lib + '/exceptions').InvalidException;

module.exports = User;

function User(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
}

User.get = function( userid, password, fn ){
    
    var callback1 = function( err, res ){
        if(err) return fn(err);
        //User not found
        if(!res) return fn(null, null);

        bcrypt.hash( password, res.salt, function(err, hash){
            if(err) return fn(err);
            if(hash == res.password){
                return fn(null, res); 
            }
            //Password wrong
            fn( null, null);
        }); 
    };
    
    getUserById( userid, callback1 );

}

User.getWithAuth = function(id, key, hash, fn){
    
    var callback = function(err, res){
        if(err) return fn(err);
        if(!res) return fn(null, null);
        bcrypt.hash( key, res.salt, function(err, _hash){
            if(err) return fn(err);
            if(_hash == hash){
                return fn(null, res); 
            }
            fn( null, null);
        }); 
    }
    getUserByTableid( id, callback );

}

User.prototype.register = function( fn ){
   
    var _this = this;
    var insertid = 0;
    var callback1 = function( err, res ){
        if(err) return fn(err);
        
        //Userid already registered
        if(res) return fn( new InvalidException( InvalidException.cause.ALREADY_EXIST_USER ));

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
                            "INSERT INTO user(userid, salt, password, timezone, language, created_at) " +
                            "VALUE(?, ?, ?, ?, ?, now())" ,
                            [ _this.userid, _this.salt, _this.password, _this.timezone, _this.language ],
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

User.prototype.updateSettings = function( fn ){
    var res = null;
    var _this = this;
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                            "UPDATE user SET " +
                            "timezone=?, language=? " +
                            "WHERE id=? " ,
                            [_this.timezone, _this.language, _this.id],
                            function(err, result){
                                if(err) return reject(err);
                                console.log(result);
                                if(result.affectedRows <= 0){
                                
                                }
                                resolve(con);
                            }
                    );
                });
            } 
        ],
        function(err){
            if(err) return fn(err);
            fn(null);
        }
   );


}

//======= private

function getUserById( userid, fn ){
    var res = null;
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                            "SELECT id,userid,salt,password,timezone,language " +
                            "FROM user WHERE " +
                            "userid=? ",
                            [userid],
                            function(err, result){
                                if(err) return reject(err);
                                console.log(result);
                                if(result.length > 0){
                                    res = new User(result[0]);
                                }
                                resolve(con);
                            }
                    );
                });
            } 
        ],
        function(err){
            if(err) return fn(err);
            fn(null, res);
        }
   );
}

function getUserByTableid( id, fn ){
    var res = null;
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                            "SELECT id,userid,salt,password,timezone,language " +
                            "FROM user WHERE " +
                            "id=? ",
                            [id],
                            function(err, result){
                                if(err) return reject(err);
                                console.log(result);
                                if(result.length > 0){
                                    res = new User(result[0]);
                                }
                                resolve(con);
                            }
                    );
                });
            } 
        ],
        function(err){
            if(err) return fn(err);
            fn(null, res);
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

