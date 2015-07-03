var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var Task = require(models + '/task');
var Folder = require(models + '/folder');
var FolderOrder = require(models + '/folder_order');

var condition_pattern = new RegExp("^.+\..+$");

module.exports.get = function(req, res, next){

    var conditions = [
        { field:"userid", operator:"equal", value:1 } ,
        { field:"status", operator:"notequal", value:Task.status.delete }
    ];
    
    var condParam = req.query.condition;
    if( condParam ){
        console.log(condParam);
        for(key in condParam){
            if(condition_pattern.test( key )){
                var param = key.split('.');
                if( Task.allowedSearchField(param[0]) ){
                    console.log( param[0] + '  ' + param[1] );
                    var value = condParam[key];
                    if( Array.isArray( condParam[key] )){
                        for(var i=0;i<value.length;i++){
                            conditions.push( { field:param[0], operator:param[1], value:value[i] } );
                        }    
                    }else{
                        conditions.push( { field:param[0], operator:param[1], value:value } );
                    } 
                }
            }
        }
    }
    
    Task.get( conditions, 2000,
        function(err, result){
            if(err) return next(err);
            res.json( convertToJsonList(result) );
        }
    );

};

module.exports.post = function(req, res, next){
    console.log(req.body);
    var userid = 1;
    var task = new Task( {
        userid: userid ,
        title: req.body.title,
        schedule: req.body.schedule,
        status: Task.status.active
    });
    var folderid = req.body.folderid;
    task.insert(function(err){
        if(err) return next(err);
        console.log( task );
        if(folderid){
            Folder.get( userid, folderid, function(err, folder){
                if(err) return next(err);
                if(!folder) return next(null);
                var order = new FolderOrder({
                    userid: userid,
                    folderid: folderid,
                    taskid: task.taskid
                });
                order.insert(function(err){
                    if(err) return next(err); 
                    res.json( { task: convertToJson(task), folderorderid: order.orderid } );
                });
            }); 
        }else{
            console.log(convertToJson(task));
            res.json( {task: convertToJson(task) });
        }
    });

};

module.exports.done = function(req, res, next){
    console.log(req.body);
    var userid = 1;
    var task = new Task( {
        userid: userid ,
        title: req.body.title,
        schedule: req.body.schedule,
        status: Task.status.active
    });
    var folderid = req.body.folderid;
    task.insert(function(err){
        if(err) return next(err);
        console.log( task );
        if(folderid){
            Folder.get( userid, folderid, function(err, folder){
                if(err) return next(err);
                if(!folder) return next(null);
                var order = new FolderOrder({
                    userid: userid,
                    folderid: folderid,
                    taskid: task.taskid
                });
                order.insert(function(err){
                    if(err) return next(err); 
                    res.json( { task: convertToJson(task), folderorderid: order.orderid } );
                });
            }); 
        }else{
            console.log(convertToJson(task));
            res.json( {task: convertToJson(task) });
        }
    });
};

module.exports.active = function(req, res, next){
    console.log(req.body);
    var userid = 1;
    var task = new Task( {
        userid: userid ,
        title: req.body.title,
        schedule: req.body.schedule,
        status: Task.status.active
    });
    var folderid = req.body.folderid;
    task.insert(function(err){
        if(err) return next(err);
        console.log( task );
        if(folderid){
            Folder.get( userid, folderid, function(err, folder){
                if(err) return next(err);
                if(!folder) return next(null);
                insertFolderOrder(userid, folderid, task.taskid, function(err, order){
                    if(err) return next(err); 
                    res.json( { task: convertToJson(task), folderorderid: order.orderid } );
                });
            }); 
        }else{
            console.log(convertToJson(task));
            res.json( {task: convertToJson(task) });
        }
    });
};


module.exports.put = function(req, res, next){
    console.log("task put??");
    console.log(req.body);
    console.log(req.params);

    var userid = 1;
    var taskValue = req.body.task;
    var folderValue = req.body.folder;
    var values = [];
    var task = null;
    if(taskValue){
        for(key in taskValue){
            if( Task.allowedUpdateField(key) ){
                console.log( key );
                values.push( { field:key , value:taskValue[key] } );
            }
        }
    }

    var folderUpdateFunc = function(){
        console.log("update folder");
        if(!folderValue) return res.json( {task: convertToJson(task)} ); 
        FolderOrder.getByTaskid( userid, task.taskid, function(err, result){
            if(err) return next(err);

            if(!result){
                if(!folderValue.folderid){
                    res.json( { task: convertToJson(task) } );
                    return;
                }
                console.log("insert??");
                insertFolderOrder(userid, folderValue.folderid, task.taskid, function(err, order){
                    if(err) return next(err); 
                    res.json( { task: convertToJson(task), folderorderid: order.orderid } );
                });
            }else{
                if(result.folderid == folderValue.folderid){
                    res.json( { task: convertToJson(task),  folderorderid: result.orderid } );
                    return
                }
                if(!folderValue.folderid){
                    result.del( function(err){
                        if(err) return next(err); 
                        res.json( { task: convertToJson(task) } );
                    });
                }else{
                    result.moveFolder( folderValue.folderid, function(err){
                        if(err) return next(err); 
                        res.json( { task: convertToJson(task), folderorderid: result.orderid } );
                    });
                }
            }                   
        });
    };
    
    Task.getById( userid, req.params.id , function(err, result){
        if(err) return next(err);
        if(result.length <= 0){
            //404 not found
            return next();
        }
        task = result[0];
        if(values.length <= 0){
            folderUpdateFunc(); 
            return;
        }
        var fields = [];
        for( var i=0; i<values.length; i++ ){
            task[values[i].field] = values[i].value;
            fields.push( values[i].field );
        }
        console.log( task );
        task.update( fields , function(err){
            if(err) return next(err);
            folderUpdateFunc();
        });
    });

};

module.exports.del = function(req, res, next){
    console.log( req.params.id );
    Task.getById( 1, req.params.id, function(err, result){
        if(err) return next(err);
        console.log(result);
        if(result.length <= 0){
            //404 not found
            return next();
        }
        console.log( result[0] );
        result[0].softDelete(function(err){
            if(err) return next(err);
            res.json({status: "ok"});
        });
    });
};

module.exports.done = function(req, res, next){
    console.log( req.params.id );
    Task.getById( 1, req.params.id, function(err, result){
        if(err) return next(err);
        console.log(result);
        if(result.length <= 0){
            //404 not found
            return next();
        }
        console.log( result[0] );
        result[0].done(function(err){
            if(err) return next(err);
            res.json( convertToJson( result[0] ) );
        });
    });
};

module.exports.active = function(req, res, next){
    console.log( req.params.id );
    Task.getById( 1, req.params.id, function(err, result){
        if(err) return next(err);
        console.log(result);
        if(result.length <= 0){
            //404 not found
            return next();
        }
        result[0].active(function(err){
            if(err) return next(err);
            res.json( convertToJson( result[0] ) );
        });
    });
};

//== private

function convertToJsonList( taskList ){
    var res = [];
    for( var i=0; i<taskList.length; i++ ){
        res.push( convertToJson(taskList[i]) ); 
    }
    return res;
}

function convertToJson( task ){
    var date = null;
    if(task.schedule != null){
        var localDate = new Date(task.schedule);
        var utcDate = new Date( localDate.getTime() + localDate.getTimezoneOffset() * 60000 ); 
        date = utcDate.getFullYear() + "/" + 
               ("00" + (utcDate.getMonth()+1)).substr(-2) + "/" + 
               ("00" + utcDate.getDate()).substr(-2); 
    }
    return {
        taskid: task.taskid,
        title: task.title,
        status: task.status,
        orderid: task.orderid,
        date: date 
    }; 
}

function insertFolderOrder(userid, folderid, taskid, fn){
    var order = new FolderOrder({
        userid: userid,
        folderid: folderid,
        taskid: taskid
    });
    order.insert(function(err){
        if(err) return fn(err); 
        fn(null, order);
    });
}
