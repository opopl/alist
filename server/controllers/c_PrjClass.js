
// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const srvUtil = require('./../srv-util')

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

//@@ config
  config(){
    return {
       proj : this.proj,
       rootid : this.rootid,
       bld : {
           cols : 'bid buuid plan duration target status'
       },
       ui : {}
    }
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

//@@ jsonSecList
// post /prj/sec/list
  jsonSecList () {
    return async (req, res) => {
      const ref = req.body

      var data = await prjj.dbSecList(ref)

      res.json({ data })

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
    const self = this

    return async (req, res) => {
      const query = req.query
      const path = req.path
      const w = {}

      const cols = _.get(self.config(),'bld.cols','').split(/\s+/)
      cols.forEach((col) => {
         if (!query.hasOwnProperty(col)) { return }
         w[col] = _.get(query,col)
         return
      })

      const bldData = await prjj.dbBldData(w)

      res.json({ data: bldData })

    }
  }

//@@ jsonConfig
// get /prj/config/get
  jsonConfig () {
    const self = this

    return async (req, res) => {
      res.send(self.config())
    }
  }

//@@ htmlAuthView
  htmlAuthView  ()  {
    const self = this

    return async (req, res) => {
      const query = req.query

      const author_id = _.get(query, 'id', '')
      const proj = _.get(query, 'proj', self.proj)

      const target = '_auth.' + author_id

      const html = await prjj.htmlTargetOutput({ proj, target })
      res.send(html)

      //res.redirect(`/prj/target/html?target=${target}`)
    }
  }

//@@ htmlSecSaved
  htmlSecSaved ()  {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec = _.get(query, 'sec', '')
      const use = _.get(query, 'use', 'orig')
      const proj = _.get(query, 'proj', self.proj)

      const { htmlFile, htmlFileEx } = await prjj.htmlFileSecSaved({ proj, sec })
      if(!htmlFileEx){
         //res.send(`<html><body>File not Found<body></html>`)
         res.send(`<html><body>Saved Html File not Found: ${htmlFile}<body></html>`)
         return
      }

      const htmlFileDir = path.dirname(htmlFile)
      process.chdir(htmlFileDir)

      const orig = path.basename(htmlFile)
      const useMap = {
         orig,
         view    : `p.${orig}`,
         unwrap  : `p.unwrap.${orig}`,
         parse   : `p.parse.${orig}`,
         content : `p.parse.content.${orig}`,
         article : `p.parse.article.${orig}`,
         comments : `p.parse.comments.${orig}`,
         cmttex : `p.parse.comments.${orig}.tex`,
      }
      const htmlFileUse = _.get(useMap, use, '')
      if(!fs.existsSync(htmlFileUse)){
         res.send(`<html><body>${use} Html File not Found: ${htmlFileUse}<body></html>`)
         return
      }

      const ext = path.extname(htmlFileUse)
      if (ext == 'tex') {
         //res.type('text')
         res.header("Content-Type", "text/plain");
         res.sendFile(htmlFileUse)
         return
      }

      const html = fs.readFileSync(htmlFileUse)
      const $ = cheerio.load(html)

      //const dom = htmlparser2.parseDocument(html);
      //const dom = parse5.parse(html);

      const icons_done = {}

      const els_css = $('link[rel="stylesheet"]').map( (i, x) => {
         return x
      }).toArray()

    //@a p_css
      const p_css = els_css.map( async (x,i) => {
         const $x = $(x)
         const href = $x.attr('href')
         if (!href) { return }
         var uriAsset = `/prj/sec/asset/${href}?sec=${sec}`
         $x.attr({ href : uriAsset })
      })
      await Promise.all(p_css)

      const els_img = $('img, image').map( (i, x) => {
         return x
      }).toArray()

    //@a p_img
      const tagMap = {
          img : 'src',
          image : 'href',
      }

      const p_img = els_img.map( async (x,i) => {
         const $x = $(x)
         const name = $x.get(0).tagName

         //var inum = bn.replace( /^(?<inum>\d+)\.\w+$/g,'$<inum>')

         const attrName = tagMap[name]
         const src = $x.attr(attrName)
         if (!src) {return}

         const m = /(?<inum>\d+)\.\w+$/g.exec(src)
         const inum = m ? m.groups.inum : null

         if (inum) {
            const dict = {}
            dict[attrName] = `/img/raw/${inum}`
            $x.attr(dict)
         }
      })

      await Promise.all(p_img)

      const htmlSend = $.html()
      res.send(htmlSend)

      return
    }
  }

//@@ secAsset
// get /prj/sec/asset/path
  secAsset () {
    const self = this

    return async (req, res) => {
      const asset = req.params[0]

      const query = req.query

      const sec = _.get(query, 'sec', '')
      const proj = _.get(query, 'proj', self.proj)

      const sub = 'html'
      const { secDirDone, secDirNew } = await prjj.secDirsSaved({ proj, sec, sub })

      var assetFile = ''
      const p_files = [ secDirDone, secDirNew ].map(async (dir) => {
        var ff = []
        const cb_file = ({ found }) => {
           const rel = path.relative(dir, found)

           if (rel != asset ) { return }
           assetFile = found
        }
        await srvUtil.fsFind({ dir, cb_file });
      })
      await Promise.all(p_files)

      if (assetFile) {
        res.sendFile(assetFile)
      }

      //const cssFile = path.join(cssRoot, file)
    }
  }

//@@ jsFile
// GET /prj/assets/js/(.*)
  jsFile () {
    const self = this

    return async (req, res) => {
      const file = req.params[0]

      const jsFile = path.join(prjj.jsRoot, file)

      if (fs.existsSync(jsFile)) {
        res.sendFile(jsFile)
      }

    }
  }

//@@ cssFileCtl
// get
  cssFileCtl ()  {
    return async (req, res) => {
      const file = req.params[0]

      const cssFile = path.join(prjj.cssRoot, file)

      if (fs.existsSync(cssFile)) {
        res.sendFile(cssFile)
      }
    }
  }

}

module.exports = { c_PrjClass }

