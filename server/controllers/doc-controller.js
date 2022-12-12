
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')
const srvUtil = require('./../srv-util')

const select = db.sql.select

const axios = require('axios')

const cheerio = require("cheerio");
const xregexp = require("xregexp");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const prjRoot  = path.join(process.env.P_SR)
const imgRoot  = path.join(process.env.IMG_ROOT)
const docRoot  = path.join(process.env.DOC_ROOT)

const htmlOut  = path.join(process.env.HTMLOUT)
const pdfOut   = path.join(process.env.PDFOUT)

const picDataDir   = path.join(process.env.PIC_DATA)
const plgDir   = path.join(process.env.PLG)

//@@ dbDocData
const dbDocData = async ({ url }) => {
  const q_data = select('*')
              .from('docs')
              .where({ url })
              .toParams({placeholder: '?%d'})

  const rw = await dbProc.get(db.doc, q_data.text, q_data.values)
  return rw
}

//@@ jsonDocData
const jsonDocData = async (req, res) => {
}


module.exports = {
    dbDocData,
    jsonDocData,
}

