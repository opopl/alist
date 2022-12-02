// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')
const util = require('./../util')

const cheerio = require("cheerio");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const prjRoot  = path.join(process.env.P_SR)
const imgRoot  = path.join(process.env.IMG_ROOT)
const htmlOut  = path.join(process.env.HTMLOUT)

//@@ jsonImgCount
const jsonImgCount = async (req, res) => {

  const q_count = db.sql.select('COUNT(*) AS cnt').from('imgs').toString()

  var data = await dbProc.get(db.img, q_count, [])
  res.json(data)
}

//@@ rawImg
const rawImg = async (req, res) => {
  const params = req.params

  const inum = _.get(params,'inum')

  const q_file = db.sql.select('img')
              .from('imgs')
              .where({ inum })
              .toParams({placeholder: '?%d'})

  if (inum) {
     var rw = await dbProc.get(db.img, q_file.text, q_file.values)
     var img = _.get(rw,'img')
     var imgFile = path.join(imgRoot, img)
     if (fs.existsSync(imgFile)) {
        res.sendFile(imgFile)
     }else{
        res.status(500)
     }
     console.log(rw);
  }
}

module.exports = {
  jsonImgCount,
  rawImg
}

