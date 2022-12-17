
const _ = require('lodash')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const db = require('./../db')
const dbProc = require('./../dbproc')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const AuthClass = class {
  constructor(){
     this.dbc = db.auth
  }

//@@ dbAuth
  async dbAuth ({ author_id, author_ids }) {
     const self = this

     if (author_ids) {
       const q_auth = select(`*`)
              .from('authors')
              .where(db.sql.in('id', ...author_ids))
              .toParams({placeholder: '?%d'})

       const authors = await dbProc.all(self.dbc, q_auth.text, q_auth.values)
       return { authors }

     }else if(author_id){
       const q_auth = select(`*`)
              .from('authors')
              .where({ id : author_id })
              .toParams({placeholder: '?%d'})

       const author = await dbProc.get(self.dbc, q_auth.text, q_auth.values)
       return { author }
     }
  }

}

module.exports = { AuthClass }
