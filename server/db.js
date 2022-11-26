
const path = require('path')
const sqlite3 = require('sqlite3')

const sql = require('sql-bricks-sqlite');

const dbPathAuth = path.join(process.env.HTML_ROOT, 'h.db')
const dbPathImg  = path.join(process.env.IMG_ROOT, 'img.db')

const dbImg  = new sqlite3.Database(dbPathImg);
const dbAuth = new sqlite3.Database(dbPathAuth);

const ext = path.join(__dirname,'./sqlite3-extras')
dbImg.loadExtension(ext)
dbAuth.loadExtension(ext)

const dirSqlPages = path.join(process.env.PLG, 'projs', 'web_scraping', 'py3', 'bs', 'sql')
const sqlAuth     = path.join(dirSqlPages, 'ct_authors.sql')

//dbImg.all('select * from imgs limit 10', (error, rows) => {
  //console.log(rows);
//});

/*dbAuth.all(`*/
        //SELECT 
          //sub('^(\\w+)_(\\w+)',"$1 $2",id) as sub 
        //FROM 
          //authors 
        //WHERE
          //search('^b',id)
        //LIMIT 10`, [], (error, rows) => {
  //if (error) {
    //console.log(error)
  //} else {
    //console.log(rows)
  //}
/*});*/

module.exports = { 
   auth : dbAuth,
   img  : dbImg,
   sql  : sql
}
