// Import path module
const path = require('path')
const knex = require('knex')

/*knex.QueryBuilder.extend('someFn', function (arg) {*/
  //console.log('Do Smth', arg)
  //return this
//})

/*console.log(JSON.stringify(Object.keys(knex)))*/

// Get the location of database.sqlite file
//const dbPath = path.resolve(__dirname, 'db/database.sqlite')
const dbPath = path.join(process.env.HTML_ROOT, 'h.db')

// Create connection to SQLite database
const knex_auth = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
})

// Create a table in the database called "authors"
knex_auth.schema
  // Make sure no "authors" table exists
  // before trying to create new
  .hasTable('authors')
    .then((exists) => {
      if (!exists) {
        return knex_auth.schema.createTable('authors', (table)  => {
          table.string('uid').notNullable().defaultTo(1).unique()
          table.string('id').notNullable().unique()
          table.string('url')
          table.string('name')
          table.string('plain')
          table.string('description')

          table.primary('uid')
        })
        .then(() => {
          // Log success message
          console.log('Table \'Authors\' created')
        })
        .catch((error) => {
          console.error(`There was an error creating table: ${error}`)
        })
      }else{
      /*    knex*/
              //.table('authors')
              //.innerJoin('auth_details', 'authors.id', '=', 'auth_details.id')
              //.limit(10)
              /*.then(data => console.log('data:', data))*/
      }
    })
    .then(() => {
      // Log success message
      console.log('done')

      knex_auth.raw("PRAGMA foreign_keys = ON;").then(() => {
          console.log("Foreign Key Check activated.");
      });
    })
    .catch((error) => {
      console.error(`There was an error setting up the database: ${error}`)
    })

//console.log(JSON.stringify(Object.keys(knex_auth).sort()));
// Just for debugging purposes:
// Log all data in "authors" table
//knex_auth.select('someFn(*)').from('authors')
/*knex_auth.select('id')*/
  //.from('authors')
  //.limit(2)
  //.someFn()
  //.then(data => console.log('data:', data))
  /*.catch(err => console.log(err))*/

// Export the database
module.exports = knex_auth
