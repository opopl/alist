
// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const srvUtil = require('./../srv-util')

const cheerio = require("cheerio")

//const { LogClass } = require('./LogClass')

const { spawn, execSync } = require('child_process')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const select = db.sql.select
const distinct = db.sql.distinct
const insert = db.sql.insert
const update = db.sql.update

const _get = _.get

const c_LogClass = class {
//@@ new
  constructor(ref={}){
    this.dbc = db.log

    Object.assign(this, ref)
  }

}

module.exports = { c_LogClass }

