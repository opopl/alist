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
    const self = this

    return async (req, res) => {

      const q_count = select('count(*) as cnt').from('imgs').toString()

      var data = await dbProc.get(self.dbc, q_count, [])
      res.json(data)
    }
  }

//@@ rawImg
  rawImg(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const inum = _.get(params,'inum')

      const q_file = select('img')
                  .from('imgs')
                  .where({ inum })
                  .toParams({placeholder: '?%d'})

      if (inum) {
         var rw = await dbProc.get(self.dbc, q_file.text, q_file.values)
         var img = _.get(rw,'img')
         var imgFile = path.join(self.imgRoot, img)
         if (fs.existsSync(imgFile)) {
            res.status(200).sendFile(imgFile)
         }else{
            res.status(500)
         }
      }
    }
  }

//@@ rawImgUrl
  rawImgUrl(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const urlEnc = _.get(params,'url')
      if (!urlEnc) {
         res.status(500).send({ 'msg' : 'no url!' })
      }

      const url = decodeURIComponent(urlEnc)

      const q_file = select('img')
                  .from('imgs')
                  .where({ url })
                  .toParams({placeholder: '?%d'})

      var rw = await dbProc.get(self.dbc, q_file.text, q_file.values)
      var img = _.get(rw,'img')
      var imgFile = path.join(self.imgRoot, img || '')

      if (img && fs.existsSync(imgFile)) {
         res.status(200).sendFile(imgFile)
      }else{
         res.status(404)
      }
    }
  }

//@@ jsonImgDataUrl
  jsonImgDataUrl(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const urlEnc = _.get(params,'url')
      if (!urlEnc) {
         res.status(404).send({ 'msg' : 'no url!' })
      }

      const url = decodeURIComponent(urlEnc)

      const q = select('*')
                  .from('imgs')
                  .where({ url })
                  .toParams({placeholder: '?%d'})

      var rw = await dbProc.get(self.dbc, q.text, q.values)
      if (rw) {
        res.send(rw)
      }else{
        res.status(404).send({ 'msg' : 'no img!' })
      }
    }
  }

//@@ jsonImgData
  jsonImgData(){
    const self = this

    return async (req, res) => {
      const params = req.params

      const inum = _.get(params,'inum')

      const q = select('*')
                  .from('imgs')
                  .where({ inum })
                  .toParams({placeholder: '?%d'})

      var rw = await dbProc.get(self.dbc, q.text, q.values)
      res.send(rw)
    }
  }

}


module.exports = { c_ImgClass }

