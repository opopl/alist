// Import database
const db = require('./../db')

exports.authCount = async (req, res) => {

  const q = db.sql.select('COUNT(id) AS cnt').from('authors').toString()
  db.auth.get(q,(err,row) => {
     res.json(row)
  })
}

// Retrieve all auth
//@@ authAll
exports.authAll = async (req, res) => {
  // Get all auth from database
  const query = req.query
  const size = query.size || 10
  const page = query.page || 1

  const start_id = query.start_id || ''
  const offset = ( page > 0 ) ? (page-1)*size : 0

  var data = {}

  const q_cnt = db.sql.select('COUNT(id) AS cnt').from('authors').toString()
  const q_sel = db.sql.select(`*`)
                  .from('authors')
                  .where(db.sql(`search('^${start_id}',id)`))
                  .limit(size)
                  .offset(offset).toString()

  db.auth.get(q_cnt,(err,row) => {

    data['cnt'] = row.cnt
    if (size) {
        data['nPages'] = Math.trunc(data.cnt/size + 1)
    }

    db.auth.all(q_sel, (err, rows) => {

      if (err) {
        console.log(err)
        res.json({ message: `There was an error retrieving auth: ${err}` })
      } else {
        res.json(rows)
      }
    })
  })

}

// Update author
//@@ authUpdate
exports.authUpdate = async (req, res) => {
  const uid = req.body.uid
  if (!uid) { 
     console.log(`no uid!`);
     return 
  }

  const idu  = req.body.id
  const body = req.body

  const q = db.sql.select('uid')
              .from('authors')
              .where({ 'uid' : uid })
              .toParams({placeholder: '?%d'})

  const qu = db.sql.update('authors',req.body)
              .where({ uid : uid })
              .toParams({placeholder: '?%d'})

  db.auth.get(q.text, q.values, (err,row) => {
     if (err) {
       console.log(err);
     }

     if (row === undefined || row.uid == uid ) {
        db.auth.run(qu.text, qu.values, (err) => {
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
    
/*  knex('authors')*/
    //.insert({ // insert new author record
      //'id'   : id,
      //'url'  : req.body.url,
      //'name' : req.body.name,
      //'plain': req.body.plain,
      //'description': req.body.description
    //})
    //.onConflict('id')
    //.merge()
    //.then(() => {
      //// Send a success message in response
      //res.json({ message: `Author with id = \'${req.body.id}\' and name = ${req.body.name} created.` })
    //})
    //.catch(err => {
      //// Send a error message in response
      //res.json({ message: `There was an error creating ${req.body.id} author: ${err}` })
    /*})*/

// Remove specific author
//@@ authDelete
/*exports.authDelete = async (req, res) => {*/
  //// Find specific book in the database and remove it
  //knex('authors')
    //.where('id', req.body.id) // find correct record based on id
    //.del() // delete the record
    //.then(() => {
      //// Send a success message in response
      //res.json({ message: `Author ${req.body.id} deleted.` })
    //})
    //.catch(err => {
      //// Send a error message in response
      //res.json({ message: `There was an error deleting ${req.body.id} author: ${err}` })
    //})
//}

