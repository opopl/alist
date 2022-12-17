
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
    this.target = ''
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

//@@ htmlSecView
  htmlSecView () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec = _.get(query, 'sec', '')
      const proj = _.get(query, 'proj', self.proj)

      const target = '_buf.' + sec

      const html = await prjj.htmlTargetOutput({ proj, target })
      res.send(html)

      //res.redirect(`/prj/target/html?target=${target}`)
    }
  }

//@@ htmlTargetView
  htmlTargetView () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const target = _.get(query, 'target', '')
      const proj   = _.get(query, 'proj', self.proj)
    
      const action = _.get(query, 'action', 'render')
    
      const html = await prjj.htmlTargetOutput({ proj, target })
      res.send(html)
    
    }
  }

//@@ cssFile
	cssFile () {
    const self = this

		return async (req, res) => {
		  const file = req.params[0]
		
		  const target = _.get(req,'query.target',self.target)
		  const proj   = _.get(req,'query.proj',self.proj)
		
		  const htmlFile = await prjj.htmlFileTarget({ target, proj })
		  const htmlFileDir = path.dirname(htmlFile)
		
		  const cssFile = path.join(htmlFileDir, file)
		
		  if (fs.existsSync(cssFile)) {
		    res.sendFile(cssFile)
		  }
		}
	}

//@@ pdfSecView
	pdfSecView () {
    const self = this

		return async (req, res) => {
		  const query = req.query
		
		  const sec = _.get(query, 'sec', '')
		  const proj = _.get(query, 'proj', self.proj)
		
		  const target = '_buf.' + sec
		
		  if (!prjj.dReMapTarget({ key : 'datePost' }).exec(target)) {
		     var msg = 'not a datePost target'
		     return res.status(404).send({ msg })
		  }
		
		  const pdfFile = prjj.pdfFileTarget({ proj, target })
		
		  const pdfFileEx = fs.existsSync(pdfFile)
		
		  if (!pdfFileEx) {
		    const act = 'compile'
		    const cnf = ''
		
		    const { code, msg, stdout } = await prjj.act({ act, proj, cnf, target })
		    if (code) { return res.status(404).send({ msg }) }
		  }
		
		  res.sendFile(pdfFile)
		}
	}

//@@ jsonTargetData
// GET /prj/target/data
	jsonTargetData () {
    const self = this

		return async (req, res) => {
		  const target = _.get(req, 'query.target', self.target)
		  const proj = _.get(req, 'query.proj', self.proj)
		
		  const htmlFile = prjj.htmlFileTarget({ proj, target })
		  const html  = fs.existsSync(htmlFile) ? 1 : 0
		
		  const pdfFile = prjj.pdfFileTarget({ proj, target })
		  const pdf  = fs.existsSync(pdfFile) ? 1 : 0
		
		  var output = { html, pdf }
		  res.json({ output })
		
		}
	}

//@@ jsonBldData
// get /prj/bld/data
	jsonBldData () {
		return async (req, res) => {
		  const query = req.query
		  const path = req.path
		  const w = {}
		
		  const cols = _.get(config,'bld.cols','').split(/\s+/)
		  cols.forEach((col) => {
		     if (!query.hasOwnProperty(col)) { return }
		     w[col] = _.get(query,col)
		     return
		  })
		
		  const bldData = await prjj.dbBldData(w)
		
		  res.json({ data: bldData })
		
		}
	}

}

module.exports = { c_PrjClass }

