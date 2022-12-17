
// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const util = require('./../srv-util')

const cheerio = require("cheerio")

const { PrjClass } = require('./PrjClass')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const prjj = new PrjClass()

const c_PrjClass = class {
//@@ new
  constructor(){
    this.dbc = db.prj

    this.proj = 'letopis'
  }

//@@ jsonAct
// POST /prj/act
  jsonAct () {
    const self = this

    return async (req, res) => {
      const act = _.get(req, 'body.act', 'compile')
      const cnf = _.get(req, 'body.cnf', '')

      const target = _.get(req, 'body.target', '')
      const proj = _.get(req, 'body.proj', self.proj)

      const stat = await prjj.act({ act, proj, cnf, target })

      res.json(stat)
    }
  }

//@@ jsonSecCount
  jsonSecCount () {
    const self = this

    return async (req, res) => {

      const q_count = select('COUNT(*) AS cnt').from('projs').toString()
      //var row = await db.prj.get(q,(err,row) => {} )
         //res.json(row)
      //})
            //
      var data = await dbProc.get(self.dbc, q_count, [])
      res.json(data)
    }
}

//@@ jsonSecData
  jsonSecData () {
    return async (req, res) => {
      const query = req.query

      var data = await prjj.dbSecData(query)

      res.json(data)
    }
  }

//@@ jsonSecSrc
  jsonSecSrc () {
    return async (req, res) => {
      const query = req.query
      const sec = query.sec || ''

      var txt = await prjj.secTxt({ sec })

      res.send({ txt })

    }
  }

}

module.exports = { c_PrjClass }

