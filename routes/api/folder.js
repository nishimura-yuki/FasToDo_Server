var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var Folder = require(models + '/folder');
var FolderOrder = require(models + '/folder_order');

module.exports.get = function(req, res, next){
  
    var user = res.locals.user;
    /* response json format
     * [
     *   { folderid: "folderid", name:"name", orderid: "orderid",
     *     ids: [ 
     *         { id: "taskid", orderid: "orderid" }
     *         ...
     *     ] 
     *   }
     *   ...
     * ]
     *
     */
    Folder.getList( user.id ,
        function(err, resultFolder){
            if(err) return next(err);
            var ids = [];
            var mapFolder = {};
            for(var i=0;i<resultFolder.length;i++){
                resultFolder[i].ids = [];
                var folderid = resultFolder[i].folderid;
                mapFolder[folderid] = resultFolder[i];
                ids.push( folderid );
            }
            if(ids.length > 0){
                FolderOrder.getList( user.id , ids, function(err, resultOrder){
                    if(err) return next(err);

                    for( var i=0;i<resultOrder.length; i++ ){
                        var order = resultOrder[i];
                        var f = mapFolder[ order.folderid ];
                        if(f){
                            f.ids.push( {
                                id: order.taskid,
                                orderid: order.orderid
                            });
                        }
                    } 
                    res.json( convertToJsonList( resultFolder ));
                });
            }else{
                res.json( [] );
            } 
        }
    );

};

module.exports.post = function(req, res, next){
    var user = res.locals.user;
    var folder = new Folder( {
        userid: user.id ,
        name: req.body.name
    });
    folder.insert(function(err, resultid){
        if(err) return next(err);
        folder.ids = [];
        res.json( convertToJson( folder ) );
    });
};

module.exports.put = function(req, res, next){
    console.log(req.body);
    console.log(req.params);

    var values = [];
    for(key in req.body){
        if( Todo.allowedUpdateField(key) ){
            console.log( key );
            values.push( { field:key , value:req.body[key] } );
        }
    }

    Todo.getById( req.params.id , function(err, result){
        if(err) return next(err);
        if(result.length <=0){
            //404 not found
            return next();
        }
        var fields = [];
        for( var i=0; i<values.length; i++ ){
            result[0][values[i].field] = values[i].value;
            fields.push( values[i].field );
        }
        result[0].update( fields , function(err, result){
            if(err) return next(err);
            res.json(result);
        });
    });

};

module.exports.del = function(req, res, next){
    
    Todo.getById( req.params.id, function(err, result){
        if(err) return next(err);
        if(result.length <= 0){
            //404 not found
            return next();
        }
        result[0].updateStatus('delete', function(err, result){
            if(err) return next(err);
            res.json({status: "ok"});
        });
    })
};

//== private

function convertToJsonList( folderList ){
    var res = [];
    for( var i=0; i<folderList.length; i++ ){
        res.push( convertToJson(folderList[i]) ); 
    }
    return res;
}

function convertToJson( folder ){
    return {
        folderid: folder.folderid,
        name: folder.name,
        orderid: folder.orderid ,
        ids: folder.ids
    }; 
}
