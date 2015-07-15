
//for ClearDB logic
//this url will be 
// mysql://"user":"password"@"host"/"database"?reconnect=true
var db_url = process.env.CLEARDB_DATABASE_URL;
var mysql={};
var tmp=db_url.split("//")[1].split(":");
mysql.user=tmp[0];
tmp=tmp[1].split("@");
mysql.password=tmp[0];
tmp=tmp[1].split("/");
mysql.host=tmp[0];
tmp=tmp[1].split("?");
mysql.database=tmp[0];

module.exports = {
    mysql_connection: mysql
};
