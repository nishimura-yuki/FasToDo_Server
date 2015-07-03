var define = require('define-constant')(global.DEFINE)();
var config = require(define.path.config);
var mysql = require('mysql');

var poolConfig = JSON.parse( JSON.stringify(config.mysql_connection) );
poolConfig.connectionLimit = 10;
var pool = mysql.createPool( poolConfig );

// Table Create
tables = [
    "CREATE TABLE IF NOT EXISTS task("
    + "id INT(12) NOT NULL AUTO_INCREMENT , "
    + "userid INT(10) NOT NULL , "
    + "taskid CHAR(80) , "
    + "title CHAR(255) NOT NULL , "
    + "schedule DATE , "
    + "orderid INT(8) NOT NULL DEFAULT 0, "
    + "status CHAR(80) NOT NULL , "
    + "donedate DATE , "
    + "CREATED_AT datetime , "
    + "UPDATED_AT timestamp default current_timestamp on update current_timestamp , " 
    + "PRIMARY KEY(id) , "
    + "UNIQUE (taskid) , "
    + "INDEX (userid,taskid)) " 
    + "ENGINE=InnoDB" ,

    "CREATE TABLE IF NOT EXISTS folder("
    + "id INT(12) NOT NULL AUTO_INCREMENT , "
    + "userid INT(10) NOT NULL , "
    + "folderid CHAR(80) , "
    + "name CHAR(255) NOT NULL , "
    + "orderid INT(8) NOT NULL DEFAULT 0, "
    + "CREATED_AT datetime , "
    + "UPDATED_AT timestamp default current_timestamp on update current_timestamp , " 
    + "PRIMARY KEY(id) , "
    + "UNIQUE (folderid) , "
    + "INDEX (userid,folderid)) " 
    + "ENGINE=InnoDB" ,
    
    "CREATE TABLE IF NOT EXISTS order_folder("
    + "id INT(12) NOT NULL AUTO_INCREMENT , "
    + "userid INT(10) NOT NULL , "
    + "taskid CHAR(80) NOT NULL ,"
    + "folderid CHAR(80) NOT NULL , "
    + "orderid INT(10) NOT NULL , "
    + "uniqueid CHAR(80) NOT NULL, "
    + "CREATED_AT datetime , "
    + "UPDATED_AT timestamp default current_timestamp on update current_timestamp , " 
    + "PRIMARY KEY(id) , "
    + "UNIQUE (uniqueid) , " 
    + "INDEX (userid,folderid) , "
    + "CONSTRAINT fk_01 FOREIGN KEY (folderid) REFERENCES folder (folderid) ON DELETE CASCADE ) "
    + "ENGINE=InnoDB" ,

    "CREATE TABLE IF NOT EXISTS user("
    + "id INT(10) NOT NULL AUTO_INCREMENT , "
    + "userid CHAR(255) NOT NULL , "
    + "salt CHAR(255) NOT NULL, "
    + "password CHAR(255) NOT NULL, "
    + "timezone CHAR(80) NOT NULL, "
    + "CREATED_AT datetime , "
    + "UPDATED_AT timestamp default current_timestamp on update current_timestamp , "
    + "PRIMARY KEY(id) , "
    + "UNIQUE (userid) , " 
    + "INDEX (userid)) " 
    + "ENGINE=InnoDB" ,
];

var db = mysql.createConnection( config.mysql_connection );
var tableCount = tables.length;
var afterCreate = function(err){
    if(err) throw err;
    tableCount--;
    if(tableCount <= 0){
        console.log("finish create all tables");
        db.end(); 
    }
}

for( var i=0;i<tables.length; i++ ){
    db.query(
        tables[i],
        afterCreate
    );
}

module.exports.conditionConverter = function( conditions ){
    var operators = {
        equal: "=",
        notequal: "!=",
        greaterthan: ">",
        lessthan: "<" ,
        greaterequal: ">=" ,
        lessequal: "<=" 
    };

    var clause = '';
    var values = [];
    for( var i=0; i<conditions.length; i++ ){
        var operator = operators[conditions[i].operator];
        if(!operator){
            //例外スロー
        }
        clause += conditions[i].field + " " + operator + " ? and ";
        values.push(conditions[i].value);
    }
    if(clause.length > 0) clause = clause.substr( 0 , (clause.length-4) );
    return { clause: clause, values: values };
};

module.exports.query = function( chains, callback ){

    var _con = null;
    var piped = new Promise(function(resolve, reject){
            pool.getConnection( function(err, con){ 
                if(err){
                    reject(err); 
                    return;
                }
                _con = con;
                resolve(con);
            });
        });     
  
    for (i = 0; i < chains.length; i += 1) {
        piped = piped.then( chains[i] );
    }
    piped.then( function(){
        if(_con != null){
            _con.release();
        }
        callback(null);
    }).catch( function(err){
        if(_con != null){
            _con.release();
        }
        callback(err); 
    });

};

module.exports.queryWithTransaction = function( chains , callback ){

    var con = mysql.createConnection( config.mysql_connection );
    var piped = new Promise(function(resolve, reject){
            con.beginTransaction( function(err){ 
                if(err){
                    reject(err); 
                    return;
                }
                resolve(con);
            });
        });
  
    for (i = 0; i < chains.length; i += 1) {
        var f = chains[i];
        piped = piped.then( f );
    }
    piped.then( function(){
        con.commit(function(err){
            con.end();
            if(err) {
                reject(err);
                return;
            } 
            callback(null);
        }); 
    }).catch( function(err){
        con.rollback(function(){
            con.end();
            callback(err); 
        }); 
    }); 

};

