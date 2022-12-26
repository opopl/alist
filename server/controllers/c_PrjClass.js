
// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const srvUtil = require('./../srv-util')

const cheerio = require("cheerio")

const { PrjClass } = require('./PrjClass')

const { spawn, execSync } = require('child_process')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const select = db.sql.select
const distinct = db.sql.distinct
const insert = db.sql.insert
const update = db.sql.update

const _get = _.get

const c_PrjClass = class {
//@@ new
  constructor(ref={}){
    this.dbc = db.prj

    Object.assign(this, ref)

    this.prj = new PrjClass(ref)

  }

//@@ getConfig
  getConfig({ path } = {}){
    const self = this

    const config = self.config

    const cnf = {
       proj : self.proj,
       rootid : self.rootid,
       ...config
    }
    const val = path ? _.get(cnf, path) : cnf
    return val
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

      const stat = await self.prj.act({ act, proj, cnf, target })

      res.json(stat)
    }
  }

//@@ jsonAuthAll
  jsonAuthAll () {
    const self = this

    return async (req, res) => {
      const q = select('author_id')
              .distinct('author_id')
              .from('_info_projs_author_id')
              .orderBy('author_id')
              .toString()

      var data = await dbProc.all(self.dbc, q, [])
      data = data.map((x) => { return x.author_id })
      res.json(data)
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
    const self = this

    return async (req, res) => {
      const ref = req.body

      var data = await self.prj.dbSecList(ref)

      res.json({ data })

    }
  }

//@@ jsonSecData
  jsonSecData () {
    const self = this

    return async (req, res) => {
      const query = req.query

      var data = await self.prj.dbSecData(query)

      if (data) {
        res.json(data)
      }else{
        res.status(500).send({ 'msg' : 'no section data!' })
      }
    }
  }

//@@ jsonSecFsData
  jsonSecFsData () {
    const self = this

    return async (req, res) => {
      const query = req.query

      var data = self.prj._secFsData(query)

      if (data) {
        res.json(data)
      }else{
        res.status(404).send({ 'msg' : 'no section filesystem data!' })
      }
    }
  }

//@@ jsonSecFsNew
  jsonSecFsNew () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec = query.sec || ''
      const proj = query.proj || self.proj

      await self.prj.secFsNew({ sec, proj })

      const { exNew } = self.prj._secFsData({ sec, proj })
      if (exNew) {
         return res.status(200).send({ 'msg' : 'new' })
      }else{
         return res.status(404).send({ 'msg' : 'error: new' })
      }

    }
  }

//@@ jsonSecFsDone
  jsonSecFsDone () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec = query.sec || ''
      const proj = query.proj || self.proj

      await self.prj.secFsDone({ sec, proj })

      const { exDone } = self.prj._secFsData({ sec, proj })
      if (exDone) {
         return res.status(200).send({ 'msg' : 'done' })
      }else{
         return res.status(404).send({ 'msg' : 'error: done' })
      }
    }
  }

//@@ jsonSecPicData
// GET, POST
  jsonSecPicData () {
    const self = this

    return async (req, res) => {
      var ref
      if (req.method == 'GET'){
        ref = req.query
      }else{
        const data = req.body.data
        ref = JSON.parse(data)
      }

      var data = await self.prj.dbSecPicData(ref)

      if (data) {
        res.status(200).json(data)
      }else{
        res.status(500).send({ 'msg' : 'no pics data!' })
      }
    }
  }

//@@ jsonSecNew
//  POST
  jsonSecNew () {
    const self = this

    return async (req, res) => {
       const body = req.body

       const data = JSON.parse(body.data)
       const { sec, proj, url, title, date  } = srvUtil.dictGet(data,'sec proj')

       console.log(data);
       res.send({ sec, proj })
    }
  }

//@@ jsonSecSrc
  jsonSecSrc () {
    const self = this

    return async (req, res) => {
      const query = req.query
      const sec = query.sec || ''

      var txt = await self.prj.secTxt({ sec })

      res.send({ txt })

    }
  }

//@@ htmlSecPicData
  htmlSecPicData () {
    const self = this

    return async (req, res) => {
      const query = req.query

      var data = await self.prj.dbSecPicData(query)

      if (data) {
        var urls = data.urls
        console.log(data);

        const $ = cheerio.load(self.prj.htmlBare)

        data.forEach((x) => {
           const url = x.url

           const urlEnc = encodeURIComponent(url)
           const $img = $(`<p><img src="/img/raw/url/${urlEnc}" /img>`)

           $('body').append($img)
        })

        res.send($.html())
      }else{
        res.status(500).send({ 'msg' : 'no pics data!' })
      }
    }
  }

//@@ htmlSecNew
// GET /prj/sec/new/html
  htmlSecNew () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const proj = _.get(query, 'proj', self.proj)

      const forms = self.getConfig({ path : `templates.forms.sec_new` })

      const title = 'New'
      return res.render('sec/new', { title, forms })
    }
  }

//@@ htmlSecView
  htmlSecView () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec = _.get(query, 'sec', '')
      const proj = _.get(query, 'proj', self.proj)

      let m = /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/.exec(sec)
      if (m) {
         const sd = await self.prj.dbSecData({ proj, sec })
         const secRows = []

         const { day, month, year } = srvUtil.dictGet(m.groups,'day month year')
         const pageTitle = `${day}-${month}-${year}`

         const cols = self.getConfig({ path : 'methods.htmlSecView.cols' }) || []
         const header = self.getConfig({ path : 'methods.htmlSecView.header' }) || {}

         if (sd) {
           const children = sd.children

           for(let child of children){
             const row = await self.prj.dbSecData({ sec : child, proj })
             await self.prj.secRowUpdate({ row })
             secRows.push(row)
           }
         }
         return res.render('sec/date.html',{ secRows, header, cols, pageTitle, _get })
      }

      const target = `_buf.${sec}`
      const html = await self.prj.htmlTargetOutput({ proj, target })
      return res.send(html)

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

      const html = await self.prj.htmlTargetOutput({ proj, target })
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

      const htmlFile = await self.prj.htmlFileTarget({ target, proj })
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

      if (!self.prj.dReMapTarget({ key : 'datePost' }).exec(target)) {
         var msg = 'not a datePost target'
         return res.status(404).send({ msg })
      }

      const pdfFile = self.prj.pdfFileTarget({ proj, target })

      const pdfFileEx = fs.existsSync(pdfFile)

      if (!pdfFileEx) {
        const act = 'compile'
        const cnf = ''

        const { code, msg, stdout } = await self.prj.act({ act, proj, cnf, target })
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

      const htmlFile = self.prj.htmlFileTarget({ proj, target })
      const html  = fs.existsSync(htmlFile) ? 1 : 0

      const pdfFile = self.prj.pdfFileTarget({ proj, target })
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

      const cols = _.get(self.getConfig(),'bld.cols','').split(/\s+/)
      cols.forEach((col) => {
         if (!query.hasOwnProperty(col)) { return }
         w[col] = _.get(query,col)
         return
      })

      const bldData = await self.prj.dbBldData(w)

      res.json({ data: bldData })

    }
  }

//@@ jsonConfig
// get /prj/config/get
  jsonConfig () {
    const self = this

    return async (req, res) => {
      const asset = req.params[0]
      const path = asset ? asset.split('/') : ''
      res.send(self.getConfig({ path }))
    }
  }

//@@ htmlTagSecs
// GET /prj/tag/html
  htmlTagSecs ()  {
    const self = this

    return async (req, res) => {
      const query = req.query

      const cols_db = self.getConfig({ path : 'methods.htmlTagSecs.cols.db' }) || []
      const cols = self.getConfig({ path : 'methods.htmlTagSecs.cols.html' }) || []
      const header = self.getConfig({ path : 'methods.htmlTagSecs.header' }) || {}

      const tag = _.get(query, 'tag', '')
      const proj = _.get(query, 'proj', self.proj)

      const p_cols = cols_db.map((x) => { return `p.${x}` }).join(',')
      const q = ` SELECT ${p_cols} FROM _info_projs_tags AS it
                   INNER JOIN projs AS p
                   ON it.file = p.file
                   WHERE it.tag = ? AND proj = ?
                 `
      const p = [ tag, proj ]
      const secRows = await dbProc.all(self.dbc, q, p)
      for(let row of secRows){
        await self.prj.secRowUpdate({ row })
      }

      return res.render('tag_secs.html',{ secRows, header, cols, tag, _get })
    }
  }

//@@ htmlAuthSecs
// GET /prj/auth/html
  htmlAuthSecs ()  {
    const self = this

    return async (req, res) => {
      const query = req.query

      const author_id = _.get(query, 'id', '')
      const proj = _.get(query, 'proj', self.proj)

      const q = `
        SELECT * FROM projs AS p
        INNER JOIN _info_projs_author_id AS ia
        ON p.file = ia.file
        WHERE ia.author_id = ? AND p.proj = ?
      `
      const p = [ author_id, proj ]

      const { author } = await self.prj.auth.dbAuth({ author_id })

      const secRows = await dbProc.all(self.dbc, q, p)
      const cols = self.getConfig({ path : 'methods.htmlAuthSecs.cols' }) || []
      const header = self.getConfig({ path : 'methods.htmlAuthSecs.header' }) || {}

      for(let row of secRows ){
        await self.prj.secRowUpdate({ row })
      }

      return res.render('auth_secs.html',{ secRows, header, cols, author, _get })
    }
  }

//@@ tmplAuthInfo
  tmplAuthInfo ()  {
    const self = this

    return async (req, res) => {
    }
  }

//@@ uploadSecPicUrl
// post /prj/sec/pic/upload/url
  uploadSecPicUrl ()  {
    const self = this

    return async (req, res) => {
       const body = req.body

       const data = JSON.parse(body.data)
       const { sec, proj, pics } = srvUtil.dictGet(data,'sec proj pics')

       if (!pics || !pics.length) {
          return res.status(400).send({ 'msg' : 'no input pics!'});
       }

       process.chdir(self.prj.prjRoot)

       var ok = true

       const cbi = function({ code, stdout }){
          if (code) { ok = false }
       }

       const p_pics = pics.map(async (pic) => {
         const url  = _.get(pic, 'url')
         if (!url) { return }

         await self.prj.secPicImport({ sec, proj, pic, cbi })
       })

       await Promise.all(p_pics)

       if (ok) {
          const msg = `pic fetch ok`
          res.status(200).send({ msg })
       }else{
          const msg = `fail to fetch pics`
          res.status(404).send({ msg })
       }
       return
    }
  }

//@@ uploadSecSaved
  uploadSecSaved ()  {
    const self = this

    return async (req, res) => {
      if (!req.files) {
        return res.status(400).send("No files were uploaded.");
      }

      const query = req.query
      const sec = _.get(query, 'sec', '')
      const proj = _.get(query, 'proj', self.proj)

      const { secDirDone, secDirNew } = await self.prj.secDirsSaved({ proj, sec, sub : 'html' })

      var pathSaved
      [ secDirDone, secDirNew ].forEach((dir) => {
          if(pathSaved){ return }

          if(fs.existsSync(dir)){ pathSaved = path.join(dir,'we.html') }
      })

      const file = req.files.file;

      file.mv(pathSaved, (err) => {
        if (err) {
          return res.status(500).send(err);
        }
        return res.send({ status: "success", path: pathSaved });
      });
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

      const { htmlFile, htmlFileEx } = await self.prj.htmlFileSecSaved({ proj, sec })
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
      const { secDirDone, secDirNew } = await self.prj.secDirsSaved({ proj, sec, sub })

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

      const jsFile = path.join(self.prj.jsRoot, file)

      if (fs.existsSync(jsFile)) {
        res.sendFile(jsFile)
      }

    }
  }

//@@ cssFileCtl
// get
  cssFileCtl ()  {
    const self = this

    return async (req, res) => {
      const file = req.params[0]

      const cssFile = path.join(self.prj.cssRoot, file)

      if (fs.existsSync(cssFile)) {
        res.sendFile(cssFile)
      }
    }
  }

}

module.exports = { c_PrjClass }

