
var mysql = require('mysql2')

const pool = mysql.createPool({

  host : '147.79.66.57',
  user: 'wordcreation',
  password: 'w@rdCreaTiOn@25',
    database: 'wordcreation',
    port:'3306' ,
    multipleStatements: true,
  })



module.exports = pool;




