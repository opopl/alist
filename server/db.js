
const path = require('path')
const sqlite3 = require('sqlite3')

const dbPathAuth = path.join(process.env.HTML_ROOT, 'h.db')
const dbPathImg  = path.join(process.env.IMG_ROOT, 'img.db')

const dbImg  = new sqlite3.Database(dbPathImg);
const dbAuth = new sqlite3.Database(dbPathAuth);

dbImg.loadExtension('./sqlite3-extras')
dbAuth.loadExtension('./sqlite3-extras')

const dirSqlPages = path.join(process.env.PLG, 'projs', 'web_scraping', 'py3', 'bs', 'sql')
const sqlAuth     = path.join(dirSqlPages, 'ct_authors.sql')

dbImg.all('select * from imgs limit 10', (error, rows) => {
  console.log(rows);
});

dbAuth.all('select * from authors limit 10', (error, rows) => {
  console.log(rows);
});

module.exports = { 
   auth : dbAuth,
   img  : dbImg,
}
