// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const { PrjClass } = require('./PrjClass')
const { AuthClass } = require('./AuthClass')

const srvUtil = require('./../srv-util')
const md5file = require('md5-file')

const htmlparser2 = require("htmlparser2");
const parse5 = require("parse5");

const { spawn, execSync } = require('child_process')
const crass = require('crass')

const axios = require('axios')

const cheerio = require("cheerio");
const xregexp = require("xregexp");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const prjRoot  = path.join(process.env.P_SR)
const imgRoot  = path.join(process.env.IMG_ROOT)
const docRoot  = path.join(process.env.DOC_ROOT)




module.exports = {}

