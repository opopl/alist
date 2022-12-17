
const db = require('./../db')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const c_AuthClass = class {
  constructor(){
    this.dbc = db.auth
  }

//@@ jsonCount
  jsonCount (){
    const dbc = this.dbc

    return async (req, res) => {
      const q = select('COUNT(id) AS cnt').from('authors').toString()
      dbc.get(q,(err,row) => {
         res.json(row)
      })
    }
  }

//@@ jsonAll
  jsonAll(){
    const dbc = this.dbc

    return async (req, res) => {
      const query = req.query
      const size = query.size || 10
      const page = query.page || 1

      const start_id = query.start_id || ''
      const offset = ( page > 0 ) ? (page-1)*size : 0

      var data = {}

      const q_cnt = select('COUNT(id) AS cnt').from('authors').toString()
      const q_sel = select(`*`)
                      .from('authors')
                      .where(db.sql(`search('^${start_id}',id)`))
                      .limit(size)
                      .offset(offset).toString()

      dbc.get(q_cnt,(err,row) => {

        data['cnt'] = row.cnt
        if (size) {
            data['nPages'] = Math.trunc(data.cnt/size + 1)
        }

        dbc.all(q_sel, (err, rows) => {

          if (err) {
            console.log(err)
            res.json({ message: `There was an error retrieving auth: ${err}` })
          } else {
            res.json(rows)
          }
        })
      })
    }
  }


//@@ jsonUpdate
  jsonUpdate(){
    const dbc = this.dbc

    return async (req, res) => {
      const uid = req.body.uid
      if (!uid) {
         console.log(`no uid!`);
         return
      }

      const idu  = req.body.id
      const body = req.body

      const q = select('uid')
                  .from('authors')
                  .where({ 'uid' : uid })
                  .toParams({placeholder: '?%d'})

      const qu = update('authors',req.body)
                  .where({ uid : uid })
                  .toParams({placeholder: '?%d'})

      dbc.get(q.text, q.values, (err,row) => {
         if (err) {
           console.log(err);
         }

         if (row === undefined || row.uid == uid ) {
            dbc.run(qu.text, qu.values, (err) => {
               if (err) {
                  res.json({ message: `Author with uid = ${req.body.uid} and name = ${req.body.name} updated.` })
               }else{
                  res.json({ message: `There was an error editing uid = ${req.body.uid} author: ${err}` })
               }
            })
         }else{
            console.log(JSON.stringify(`merge: uid => ${uid}, ${row.uid}`));
         }

      })
    }
  }

}

module.exports = {
    c_AuthClass
}

