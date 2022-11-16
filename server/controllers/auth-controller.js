// Import database
const knex = require('./../db')

// Retrieve all auth
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

// Create new author
exports.authCreate = async (req, res) => {
  // Add new book to database
  knex('authors')
    .insert({ // insert new record, a book
      'id'   : req.body.id,
      'url'  : req.body.url,
      'name' : req.body.name,
      'plain': req.body.plain,
      'description': req.body.description
    })
    .then(() => {
      // Send a success message in response
      res.json({ message: `Author with id = \'${req.body.id}\' and name = ${req.body.name} created.` })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error creating ${req.body.title} book: ${err}` })
    })
}

// Remove specific author
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

