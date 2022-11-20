// Import database
const knex = require('./../db')

// Retrieve all auth
//@@ authAll
exports.authAll = async (req, res) => {
  // Get all auth from database
  knex
    .select('*') // select all records
    .from('authors') // from 'authors' table
    .limit(10)
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
  const id = req.body.id
  const uid = req.body.uid

  console.log(`request => ${req}`);

  knex('authors')
    .where({ 'id' : id })
    .select('*')
    .first()
    .then(row => {
        console.log(JSON.stringify(row))
        res.json(row)
    })
    .catch(err => {
      res.json({ message: `There was an error editing ${req.body.id} author: ${err}` })
    })

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
}

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

