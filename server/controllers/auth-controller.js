// Import database
const db = require('./../db')

exports.authCount = async (req, res) => {

  const q = 'SELECT COUNT(id) AS cnt FROM authors'
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

  const match = query.match || ''

  const rw_cnt = await knex('authors').count('id',{ as: 'cnt' }).first()
  const cnt = rw_cnt

  const nPages = Math.trunc(cnt/size + 1)
  const offset = ( page > 0 ) ? (page-1)*size : 0

  knex
    .select('*') // select all records
    .from('authors') // from 'authors' table
    .limit(size)
    .offset(offset)
    .then(userData => {
      // Send auth extracted from database in response
      res.json(userData)
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error retrieving auth: ${err}` })
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
  console.log(`request => ${JSON.stringify(body)}`);

  knex('authors')
     .where({ 'id' : idu })
     .select('uid')
     .first()
     .then((row) => {
        if (row === undefined || row.uid == uid ) {

           knex('authors')
             .where({ 'uid' : uid })
             .update(req.body)
             .then(() => {
                res.json({ message: `Author with uid = ${req.body.uid} and name = ${req.body.name} updated.` })
             })
             .catch(err => {
                res.json({ message: `There was an error editing uid = ${req.body.uid} author: ${err}` })
             })
        // merge
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
exports.authDelete = async (req, res) => {
  // Find specific book in the database and remove it
  knex('authors')
    .where('id', req.body.id) // find correct record based on id
    .del() // delete the record
    .then(() => {
      // Send a success message in response
      res.json({ message: `Author ${req.body.id} deleted.` })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error deleting ${req.body.id} author: ${err}` })
    })
}

