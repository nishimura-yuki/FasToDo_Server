var define = require('define-constant')(global.DEFINE)();
var sprintf = require("sprintf-js").sprintf;
var mysql = require(define.path.lib + '/mysql');
var converter = mysql.conditionConverter;

module.exports = Task;
function Task(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
}

Task.status = {
    active: "active",
    done:   "done",
    delete: "delete" 
};
Task.max = 100;


var allowedSearchFields = [
    "title" , "schedule" , "status" 
];
var allowedUpdateFields = [
    "title", "schedule", "status"
];
Task.allowedSearchField = function( field ){
    return allowedSearchFields.indexOf( field ) >= 0;    
};
Task.allowedUpdateField = function( field ){
    return allowedUpdateFields.indexOf( field ) >= 0;
};


Task.prototype.insert = function(fn){

    var _this = this;
    var orderid = 0;
    var orderidFunc = function(){
        mysql.query( [
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query("SELECT MAX(orderid) from task WHERE userid=? and schedule=?",
                            [_this.userid, _this.schedule] ,
                            function(err, result){
                                if(err){
                                     reject(err);
                                     return;
                                }
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
                insertFunc();
            }
        );    
    };

    var insertid = 0;
    var taskid="";
    var insertFunc = function(){
        mysql.queryWithTransaction( [
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query("INSERT INTO task(userid,title,schedule,status,orderid,created_at) " +
                                  "VALUE(?,?,?,?,?,now())",
                                  [_this.userid, _this.title, _this.schedule, Task.status.active, orderid ],
                                  function(err, result){
                                    console.log("insert func 1 callback");
                                    if(err){
                                        reject(err); 
                                        return;
                                    } 
                                    console.log(result);
                                    insertid = result.insertId;
                                    taskid = createTaskId( _this.userid, insertid ); 
                                    resolve(con);
                                  }
                        );
                    });
                },
                function(con){
                    return new Promise(function(resolve, reject){
                        con.query("UPDATE task SET taskid=? WHERE userid=? and id=?",
                                  [taskid, _this.userid, insertid] ,
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
    };

    var afterFunc = function(){
        isMax(_this.userid, _this.schedule, Task.max+1 , function(err, res){
            if(res || err){
                deleteTask( _this.userid, insertid, function(e){
                    if(e) return fn(e);
                    if(err) return fn(err);
                    //上限通知エラー
                    fn(null);        
                });
            }else{
                _this.id = insertid;
                _this.taskid = taskid;
                _this.orderid = orderid;
                fn(null); 
            }
        });   
    };
    
    isMax(this.userid, this.schedule, Task.max, function(err, res){
        if(err) return fn(err);
        if(res){
            //データ上限通知 
        }
        orderidFunc();
    });
};

Task.get = function(conditions, limit, fn){
   var where = converter( conditions );
   var res = [];
   mysql.query([
        function(con){
            return new Promise(function(resolve, reject){ 
                con.query("SELECT id,userid, taskid, title, schedule, status, orderid FROM task " +
                        "WHERE " +
                        where.clause +
                        "ORDER BY schedule " +
                        "LIMIT " + limit , 
                        where.values ,
                        function(err, result){
                            if(err){
                                reject(err);
                                return;
                            }
                            for( var i=0; i<result.length; i++ ){
                                res.push( new Task(result[i]) );
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
   });
};

Task.getById = function(userid, taskid, fn){
    Task.get( [
        { field:"userid", operator:"equal", value:userid },
        { field:"taskid", operator:"equal", value:taskid }], 1, fn );
};

Task.prototype.update = function(fields, fn){

    var clause = '';
    var values = [];
    if(!fields){
        for(var i=0;i<allowedUpdateFields.length; i++ ){
            values.push(this[allowedUpdateFields[i]]);
            clause += allowedUpdateFields[i] + " = ?, ";
        }
    }else{
        for(var i=0;i<fields.length; i++ ){
            values.push(this[fields[i]]);
            clause += fields[i] + " = ?, ";            
        }
    }
    
    clause = clause.substr( 0, clause.length - 2 );
    
    values.push( this.userid );
    values.push( this.taskid );

    mysql.query([
            function(con){
                return new Promise(function(resolve, reject){ 
                    con.query(
                        "UPDATE task SET " +
                        clause +
                        " WHERE userid=? and taskid=?",
                        values,
                        function(err, result){
                            console.log(err);
                            if(err) return reject(err);
                            console.log(result);
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

};

Task.prototype.upadteStatusWithRemoveFromFolder = function( status, fn ){

    console.log(this);
    var _this = this;
    mysql.queryWithTransaction( [
        function(con){
            return new Promise(function(resolve, reject){
                con.query("UPDATE task SET status= ? " +
                          "WHERE userid = ? and taskid = ?" ,
                          [status, _this.userid, _this.taskid],
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
                con.query("DELETE FROM order_folder " + 
                          "WHERE userid=? and taskid=?",
                          [_this.userid, _this.taskid] ,
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
        _this.status = status;
        fn(null);
       }
   );

};

Task.prototype.softDelete = function( fn ){
    this.upadteStatusWithRemoveFromFolder( Task.status.delete ,fn );
};

Task.prototype.done = function( fn ){
    this.upadteStatusWithRemoveFromFolder( Task.status.done ,fn );
};

Task.prototype.active = function(fn){
    this.status = Task.status.active;
    this.update(["status"], fn);
};


//== private

function createTaskId(userid, tableid){
    return sprintf( 'U%08dT%012d', userid, tableid);
};

function isMax(userid, date, max, fn){

    var count = 0;
    mysql.query( [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                            "SELECT count(id) FROM task WHERE " +
                            "userid=? and schedule=? and status != ? LIMIT ?",
                            [userid, date, Task.status.delete, max ],
                            function(err, result){
                                if(err){
                                    reject(err);
                                    return;
                                }
                                console.log(result);
                                count = result[0]["count(id)"]; 
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
};

function deleteTask( userid, tableid ){
    mtsql.query(
         [
            function(con){
                return new Promise(function(resolve, reject){
                    con.query(
                        "DELETE FROM task " +
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
