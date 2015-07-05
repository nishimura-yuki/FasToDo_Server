
var timezone_offset = {
    "Australia/Sydney":600,
    "Asia/Tokyo":540 
};

module.exports.getTimezoneOffset = function(timezone){
    var tmp = timezone_offset[timezone];
    if(!tmp) tmp = 0;
    return tmp;
}
