// Import database
const knex = require('./../db')

// Retrieve all auth
exports.authAll = async (req, res) => {
  // Get all auth from database
  knex
    .select('*') // select all records
    .from('auth') // from 'auth' table
    .then(userData => {
      // Send auth extracted from database in response
      res.json(userData)
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error retrieving auth: ${err}` })
    })
}

// Create new book
exports.authCreate = async (req, res) => {
  // Add new book to database
  knex('authors')
    .insert({ // insert new record, a book
      'author': req.body.author,
      'title': req.body.title,
      'pubDate': req.body.pubDate,
      'rating': req.body.rating
    })
    .then(() => {
      // Send a success message in response
      res.json({ message: `Book \'${req.body.title}\' by ${req.body.author} created.` })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error creating ${req.body.title} book: ${err}` })
    })
}

// Remove specific book
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
      res.json({ message: `There was an error deleting ${req.body.id} book: ${err}` })
    })
}

// Remove all auth on the list
exports.authReset = async (req, res) => {
  // Remove all auth from database
  knex
    .select('*') // select all records
    .from('auth') // from 'auth' table
    .truncate() // remove the selection
    .then(() => {
      // Send a success message in response
      res.json({ message: 'Book list cleared.' })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error resetting book list: ${err}.` })
    })
}
