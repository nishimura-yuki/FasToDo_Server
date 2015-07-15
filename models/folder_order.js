var define = require('define-constant')(global.DEFINE)();
var sprintf = require("sprintf-js").sprintf;
var mysql = require(define.path.lib + '/mysql');

module.exports = FolderOrder;

function FolderOrder(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
}

FolderOrder.max = 100;

FolderOrder.getList = function( userid, folderids , fn ){
    
    var orderList = [];
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT userid, id, folderid, taskid, orderid FROM order_folder " +
                        " WHERE userid = ? and folderid in (?) order by folderid,orderid",
                        [ userid, folderids ] ,
                        function(err, result){
                            if(err) return reject(err);
                            console.log(result);
                            for(var i=0;i<result.length;i++){
                                orderList.push( new FolderOrder(result[i]) ); 
                            }
                            resolve(con); 
                        }
                    );
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, orderList );
        }
    );

}


FolderOrder.get = function( userid, folderid, fn ){
    
    var orderList;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT userid, id, folderid, taskid, orderid FROM order_folder " +
                        " WHERE userid = ? and folderid=? order by orderid",
                        [ userid, folderid ] ,
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
            fn(null, orderList );
        }
    );

}

FolderOrder.getByTaskid = function(userid, taskid, fn){
    var order = null;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT userid, id, folderid, taskid, orderid FROM order_folder " +
                        " WHERE userid = ? and taskid = ?",
                        [ userid, taskid ] ,
                        function(err, result){
                            if(err) return reject(err);
                            console.log(result);
                            if(result.length > 0){
                                order = new FolderOrder( result[0] ); 
                            }
                            resolve(con); 
                        }
                    );
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, order );
        }
    );
}

FolderOrder.prototype.insert = function(fn){

    var _this = this;
    var orderid = 0;
    var uniqueid = createUniqueId( this.userid, this.taskid );
    var orderidFunc = function(){
        getMaxOrderid( _this.userid, _this.folderid, function(err, id){
            if(err) fn(err);
            orderid = id;
            insertFunc(); 
        });
    };

    var insertid = 0;
    var insertFunc = function(){
        mysql.queryWithTransaction( [
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query("INSERT INTO order_folder(userid,folderid,taskid,orderid,uniqueid,created_at) " +
                                  "VALUE(?,?,?,?,?,now())",
                                  [_this.userid, _this.folderid, _this.taskid, orderid, uniqueid ],
                                  function(err, result){
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
                afterFunc();
            }
        );
    };

    var afterFunc = function(){
        isMax(_this.userid, _this.folderid, FolderOrder.max+1, function(err, res){   
            if(err || res){
                //データ上限通知 
                deleteRecord( _this.userid, insertid, function(e){
                    if(err) return fn(err);
                    if(e) return fn(e);
                    fn();
                }); 
            }else{
                _this.id = insertid;
                _this.orderid = orderid;
                _this.uniqueid = uniqueid;
                fn(null);
            }
        });

    };

    isMax(this.userid, this.folderid, FolderOrder.max, function(err, res){   
        if(err) return fn(err);
        if(res){
            //データ上限通知 
        }
        isAlreadyExist( _this.userid, _this.taskid, function(err, res){
            if(err) return fn(err);
            if(res){
                //すでに同じタスクがフォルダに存在する 
            }       
            orderidFunc();
        });
    });
};

FolderOrder.prototype.moveFolder = function( folderid, fn ){

    var orderid = 0;
    var _this = this;
    isMax( this.userid, folderid, FolderOrder.max , function(err, res){
        if(err) return fn(err);
        if(res){
            //データ上限通知 
        }
        getMaxOrderid( _this.userid, folderid, function(err, id){
            if(err) fn(err);
            orderid = id;
            mysql.query([
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query(
                            "UPDATE order_folder SET folderid=?, orderid=? " +
                            "WHERE userid=? and id=? ",
                            [folderid, orderid, _this.userid, _this.id],
                            function(err,result){
                                if(err) return reject(err);
                                console.log(result); 
                                _this.orderid = orderid;
                                resolve(con);
                            }); 
                    });
                } 
                ],
                function(err){
                    if(err) return fn(err); 
                    fn(null);
                }
            );
        });   
    });

}

FolderOrder.prototype.updateOrder = function( orderid, fn ){

    var _this = this;
    mysql.queryWithTransaction( [
        function(con){
            return new Promise(function(resolve, reject){
                con.query("UPDATE order_folder SET orderid = orderid+1 " +
                          "WHERE userid = ? and folderid = ? and orderid >= ?" ,
                          [_this.userid, _this.folderid , orderid],
                          function(err, result){
                            if(err) return reject(err);
                            console.log(result);
                            resolve(con);
                          }
                        );
            });
        },
        function(con){
            return new Promise(function(resolve, reject){
                con.query("UPDATE order_folder SET orderid = ? " + 
                          "WHERE userid=? and id=?",
                          [orderid, _this.userid, _this.id] ,
                          function(err, result){
                            if(err) return reject(err);
                            console.log(result);
                            resolve(con);
                          }  
                        );
            });
        }
       ],  
       function(err){
        if(err) return fn(err);
        _this.orderid = orderid;
        fn(null);
       }
   );


}

FolderOrder.prototype.del = function(fn){
    deleteRecord( this.userid, this.id, function(err){
        if(err) return fn(err);
        fn(null);
    });
};

//======= private

function createUniqueId( userid, taskid ){
    return sprintf( 'U%08d_%s', userid, taskid);
};


function deleteRecord( userid, tableid , fn ){
    mysql.query(
         [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "DELETE FROM order_folder " +
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

function getMaxOrderid( userid, folderid, fn ){
    var orderid = 0;
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query("SELECT MAX(orderid) from order_folder WHERE userid=? and folderid=?",
                        [userid, folderid] ,
                        function(err, result){
                            if(err) return reject(err);
                            console.log(result);
                            var maxOrder = result[0]["MAX(orderid)"];
                            orderid = maxOrder==null ? 0 : maxOrder+1;
                            resolve(con);
                        }
                    );
                });
            }
        ] ,
        function(err){
            if(err) return fn(err);
            fn(null, orderid);
        }
    );    
}

function isAlreadyExist( userid, taskid, fn ){
    var count = 0;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT count(id) FROM order_folder WHERE userid=? and taskid=?",
                        [userid,  taskid] ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return;
                            }
                            console.log(result);
                            var count= result[0]["count(id)"];
                            resolve(con);
                        }
                    ); 
                });
            }
        ],
        function(err){
            if(err) return fn(err);
            fn(null, count > 0 );       
        }
    );
}

function isMax( userid, folderid, max , fn ){
    var count = 0;
    mysql.query(
        [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "SELECT count(id) FROM order_folder " +
                        "WHERE userid = ? and folderid = ? LIMIT ?",
                        [ userid , folderid, max ] ,
                        function(err, result){
                            if(err) return reject(err);
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
