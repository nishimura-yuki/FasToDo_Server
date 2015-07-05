

module.exports.InvalidException = InvalidException;
function InvalidException(cause){
    this.type = "invaliddata";
    this.cause = cause; 
}

module.exports.InvalidException.cause = {
    ALREADY_EXIST_USER: "ALREADY_EXIST_USER",
    INVALID_LOGIN_INFO: "INVALID_LOGIN_INFO",
    LIMIT_OVER_TASK: "LIMIT_OVER_TASK",
    LIMIT_OVER_TASK_IN_FOLDER: "LIMIT_OVER_TASK_IN_FOLDER",
    LIMIT_OVER_FOLDER: "LIMIT_OVER_FOLDER",
}
