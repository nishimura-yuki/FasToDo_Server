var define = require('define-constant')(global.DEFINE)();
var sprintf = require("sprintf-js").sprintf;
var mysql = require(define.path.lib + '/mysql');

module.exports = Folder;

function Folder(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
}

Folder.max = 50;

/*
Folder.get = function( userid, fn ){
    
    var folderList;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT folder.folderid, folder.name , folder.orderid , " +
                        "       order_folder.taskid, order_folder.orderid " +
                        "FROM order_folder LEFT JOIN folder " + 
                        "ON order_folder.folderid = folder.folderid " +
                        "AND order_folder.userid = folder.userid " +
                        "WHERE userid = ? " +
                        "ORDER BY folder.orderid,folder.folderid,order_folder.orderid",
                        [ userid ] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return
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
            fn(null, folderList );
        }
    );

}
*/

Folder.get = function(userid, folderid, fn){
    var folder = null;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT folderid, name, orderid FROM folder " +
                        " WHERE userid = ? and folderid = ?",
                        [ userid, folderid ] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return
                            }
                            console.log(result);
                            if(result.length > 0){
                                folder = new Folder( result[0] ); 
                            }
                            resolve(con); 
                        }
                    );
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, folder );
        }
    );
}

Folder.getList = function( userid, fn ){
    
    var folderList = [];
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT folderid, name, orderid FROM folder " +
                        " WHERE userid = ? order by orderid",
                        [ userid ] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return
                            }
                            console.log(result);
                            for(var i=0; i<result.length; i++){
                                console.log(result[i]);
                                folderList.push( new Folder( result[i] ) ); 
                            }
                            resolve(con); 
                        }
                    );
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, folderList );
        }
    );

}


Folder.prototype.insert = function( fn ){
   
    var _this = this;
    var orderid = 0;
    var insertid = 0;
    var folderid ="";
    var orderidFunc = function(){
        mysql.query( [
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query("SELECT MAX(orderid) FROM folder WHERE userid=?",
                                 [_this.userid],
                                 function(err, result){
                                    if(err) return reject(err);
                                    console.log(result);
                                    var max = result[0]["MAX(orderid)"];
                                    orderid = max==null? 0 : max+1;
                                    resolve(con);
                                 });
                    }); 
                }
            ],
            function(err){
                if(err) return fn(err);
                insertFunc();
            }
        );
    };
    
    var insertFunc = function(){
        mysql.queryWithTransaction(
            [
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query(
                            "INSERT INTO folder(userid, name, orderid, created_at) " +
                            "VALUE(?, ?, ?, now())" ,
                            [ _this.userid, _this.name, orderid ],
                            function( err, result ){
                                if(err){
                                    reject(err); 
                                    return;
                                } 
                                console.log(result);
                                insertid = result.insertId;
                                folderid = createFolderId(_this.userid, insertid);
                                resolve(con); 
                            }
                        );
                    });
                },
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query(
                            "UPDATE folder SET folderid=?  WHERE id=? and userid=?",
                            [folderid, insertid, _this.userid],
                            function(err, result){
                                if(err){
                                    reject(err);
                                    return;
                                }
                                resolve(con);
                            }
                        );
                    }); 
                }
            ],
            function(err){
                if(err) return fn(err);
                afterFunc();
            }
        ); 
    }

    var afterFunc = function(){
        isMax( this.userid, Folder.max + 1 , function(err, res){
            if(res || err){
                deleteFolder( _this.userid, insertid, function(e){
                    if(e) return fn(e);
                    if(err) return fn(err);
                    //いずれにせよ上限オーバーのエラー通知
                    fn();
                });
            }else{
                _this.id = insertid;
                _this.folderid = folderid;
                _this.orderid = orderid;
                fn();
            }
        });
    
    }

    isMax( this.userid, Folder.max, function(err, res){
        if(err) return fn(err);
        if(res){
            //データ上限通知
        }
        orderidFunc(); 
    });

}

Folder.prototype.update = function( fn ){


}

//======= private

function createFolderId(userid, tableid){
    return sprintf( 'U%08dF%012d', userid, tableid);
};

function deleteFolder( userid, tableid , fn ){
    mtsql.query(
         [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "DELETE FROM folder " +
                        " WHERE userid = ? and id = ?",
                        [ userid , tableid ] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return
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
            fn(null);
        }   
    );

}

function isMax( userid, max , fn ){
    var count = 0;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT count(id) FROM folder " +
                        " WHERE userid = ? limit ?",
                        [ userid , max ] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return
                            }
                            console.log(result);
                            count = result["count(id)"];
                            resolve(con); 
                        }
                    );
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, count >= max );
        }
    );
   
}
