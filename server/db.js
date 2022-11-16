// Import path module
const path = require('path')

// Get the location of database.sqlite file
//const dbPath = path.resolve(__dirname, 'db/database.sqlite')
const dbPath = path.join(process.env.HTML_ROOT, 'h.db')

// Create connection to SQLite database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
})

// Create a table in the database called "authors"
knex.schema
  // Make sure no "authors" table exists
  // before trying to create new
  .hasTable('authors')
    .then((exists) => {
      if (!exists) {
        return knex.schema.createTable('authors', (table)  => {
          table.string('id').notNullable().unique()
          table.string('url')
          table.string('name')
          table.string('plain')
          table.string('description')
        })
        .then(() => {
          // Log success message
          console.log('Table \'Authors\' created')
        })
        .catch((error) => {
          console.error(`There was an error creating table: ${error}`)
        })
      }else{
          knex
              .table('authors')
              .innerJoin('auth_details', 'authors.id', '=', 'auth_details.id')
              .then(data => console.log('data:', data))
      }
    })
    .then(() => {
      // Log success message
      console.log('done')
    })
    .catch((error) => {
      console.error(`There was an error setting up the database: ${error}`)
    })

// Just for debugging purposes:
// Log all data in "authors" table
//knex.select('*').from('authors')
  //.then(data => console.log('data:', data))
  //.catch(err => console.log(err))

// Export the database
module.exports = knex
