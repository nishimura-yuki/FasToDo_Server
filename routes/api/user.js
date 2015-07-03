var define = require('define-constant')(global.DEFINE)();
var models = define.path.models;
var User = require(models + '/user');

var condition_pattern = new RegExp("^.+\..+$");

module.exports.get = function(req, res, next){

    var conditions = [
        { field:"userid", operator:"equal", value:1 }
    ];
    
    var condParam = req.query.condition;
    if( condParam ){
        for(key in condParam){
            if(condition_pattern.test( key )){
                var param = key.split('.');
                if( Todo.allowedSearchField(param[0]) ){
                    console.log( param[0] + '  ' + param[1] );
                    conditions.push( { field:param[0], operator:param[1], value:condParam[key] } );
                }
            }
        }
    }
    
    Todo.get( conditions, 100,
        function(err, result){
            if(err) return next(err);
            res.json(result);
        }
    );

};
