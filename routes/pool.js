
var mysql = require('mysql2')

const pool = mysql.createPool({

  host : 'db-mysql-blr1-86728-do-user-16935862-0.c.db.ondigitalocean.com',
  user: 'doadmin',
  password: 'AVNS_KosX5wqBesuNqHnZWao',
    database: 'wordcreation',
    port:'25060' ,
    multipleStatements: true,



  })



module.exports = pool;




