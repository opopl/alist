
const path = require('path')
const sqlite3 = require('sqlite3')

const sql = require('sql-bricks-sqlite');

const dbPathAuth = path.join(process.env.HTML_ROOT, 'h.db')
const dbPathImg  = path.join(process.env.IMG_ROOT, 'img.db')
const dbPathPrj  = path.join(process.env.P_SR, 'projs.sqlite')

const dbImg  = new sqlite3.Database(dbPathImg);
const dbAuth = new sqlite3.Database(dbPathAuth);
const dbPrj  = new sqlite3.Database(dbPathPrj);

const ext = path.join(__dirname,'./sqlite3-extras')
dbImg.loadExtension(ext)
dbAuth.loadExtension(ext)
dbPrj.loadExtension(ext)

const dirSqlPages = path.join(process.env.PLG, 'projs', 'web_scraping', 'py3', 'bs', 'sql')
const sqlAuth     = path.join(dirSqlPages, 'ct_authors.sql')

module.exports = {
   auth : dbAuth,
   img  : dbImg,
   prj  : dbPrj,
   sql  : sql
}
