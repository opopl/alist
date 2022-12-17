// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const util = require('./../srv-util')

const cheerio = require("cheerio");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const c_ImgClass = class {
  constructor(){
    this.dbc = db.img
    this.imgRoot = path.join(process.env.IMG_ROOT)
  }

//@@ jsonCount
  jsonCount(){
    const dbc = this.dbc

    return async (req, res) => {

      const q_count = select('count(*) as cnt').from('imgs').toString()

      var data = await dbProc.get(dbc, q_count, [])
      res.json(data)
    }
  }

//@@ rawImg
  rawImg(){
    const dbc = this.dbc
    const imgRoot = this.imgRoot

    return async (req, res) => {
      const params = req.params

      const inum = _.get(params,'inum')

      const q_file = select('img')
                  .from('imgs')
                  .where({ inum })
                  .toParams({placeholder: '?%d'})

      if (inum) {
         var rw = await dbProc.get(dbc, q_file.text, q_file.values)
         var img = _.get(rw,'img')
         var imgFile = path.join(imgRoot, img)
         if (fs.existsSync(imgFile)) {
            res.sendFile(imgFile)
         }else{
            res.status(500)
         }
         //console.log(rw);
      }
    }
  }
}


module.exports = { c_ImgClass }
