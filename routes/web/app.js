
module.exports.main = function(req, res, next){
    res.render('app', 
               {
                "pageTitle": "FasToDo", 
                "app_env":{
                    "timezone": { 
                        "name": "Australia/Sydney",
                        "offset": 600 
                    }
                }
            }
    );
};

