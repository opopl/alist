
// Import database

const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const srvUtil = require('./../srv-util')

const cheerio = require("cheerio")

const cyr2trans = require('cyrillic-to-translit-js')

const { PrjClass } = require('./PrjClass')

const { spawn, execSync } = require('child_process')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const findit = require('findit')

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

//@@ jsonAuthAllDetail
  jsonAuthAllDetail () {
    const self = this

    return async (req, res) => {
 /*     const q = select('author_id')*/
              //.distinct('author_id')
              //.from('_info_projs_author_id')
              //.orderBy('author_id')
              //.toString()

      //var data = await dbProc.all(self.dbc, q, [])
      //const author_ids = data.map((x) => { return x.author_id })
      //const authors = []
      //for(let author_id of author_ids){
        //const qa = `SELECT
                        //a.id id, a.plain plain, a.name name,
                        //ad.fb_id fb_id,
                        //ad.fb_url fb_url
                    //FROM
                        //authors a
                    //INNER JOIN auth_details ad
                    //ON
                        //a.id = ad.id
                    //WHERE a.id = ?
                    //`
        //const author = await dbProc.get(db.auth, qa, [ author_id ])
        //if (author) { authors.push(author) }
      /*}*/

      const q = `SELECT ad.id id,
                        group_concat(ad2.fb_id) fb_id,
                        ad.fb_url fb_url
                 FROM _info_projs_author_id info

                 INNER JOIN auth_details ad
                 ON info.author_id = ad.id

                 INNER JOIN auth_details ad2
                 ON info.author_id = ad2.id

                 ORDER BY id
                 LIMIT 100
                `

                 // a.plain plain, 
                        //a.name name,
                 //INNER JOIN authors a
                 //ON info.author_id = a.id

      const authors = await dbProc.all(self.dbc, q, [])
      res.json(authors)
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

//@@ jsonAuthNew
  jsonAuthNew () {
    const self = this

    return async (req, res) => {
       const body = req.body
       const data = JSON.parse(body.data)
       console.log({ data })
       return res.send({ data })
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

//@@ jsonSecFsLoadScrn
  jsonSecFsLoadScrn () {
    const self = this

    return async (req, res) => {
      const body = req.body
      const sec = body.sec
      const proj = body.proj || self.proj

      const rootid = self.rootid
      const sd = await self.prj.dbSecData({ sec, proj })
      const url_parent = sd.url

      const force = body.force

      const { exNew, exDone, secDirNew, secDirDone } = self.prj._secFsData({ sec, proj })

      const idb = { sec, proj, rootid, url_parent }

      const xMap = {
        orig : [ 'scrn', 'orig.post' ],
        cmt : [ 'scrn', 'orig.cmt' ],
      }
      const xKeys = [ 'orig', 'cmt' ]

      for(let dir of [ secDirDone, secDirNew ]){
        for(let x of xKeys){
          const tagList = _.get(xMap,x,[])
          const tags = tagList.join(',')

          const xDir = path.join(dir, x)
          if(!fs.existsSync(xDir)){ continue }

          const finder = findit(xDir);
          const ff = new Promise((resolve, reject) => {
            const found = []
            finder.on('file', function(file, stat){
              if (! /\.(png|jpg|jpeg)$/g.test(file)) { return }

              found.push(file)
            })

            finder.on('end', () => { resolve(found) })
          })
          const found = await ff

          let i = 0
          for(let iFile of found){
            const bn = path.basename(iFile)

            i+=1
            //if (i == 5) { break}

            console.log(`[jsonSecFsLoadScrn] Processing file: ${bn}`)

            const name_orig = bn.replace(/\.(\w+)$/g,'','g')

            const stats = fs.statSync(iFile)
            const mtime = Math.trunc(stats.mtimeMs/1000)

            await self.prj.imgman.dbImgStoreFile({ iFile, force, name_orig, mtime, tags, ...idb })
          }
        }
      }

      return res.send({ exNew, exDone });
    }
  }

//@@ jsonSecData
  jsonSecData () {
    const self = this

    return async (req, res) => {
      const query = req.query

      let whr, row
      if (req.method == 'GET') {
        whr = req.query
      } else if (req.method == 'POST') {
        whr = JSON.parse(req.body.data)
      }

      row = await self.prj.dbSecData(whr)

      if (row) {
        await self.prj.secRowUpdate({ row })
        res.json(row)
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

//@@ jsonSecFsNewList
  jsonSecFsNewList () {
    const self = this

    return async (req, res) => {
      const list = await self.prj.getSecFsNewList()
      return res.send(list)
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
        console.log({ data });
        res.status(200).json(data)
      }else{
        res.status(500).send({ 'msg' : 'no pics data!' })
      }
    }
  }

//@@ jsonTagList
  jsonTagList () {
    const self = this

    return async (req, res) => {
      const query = req.query
      const { regex, exclude } = srvUtil.dictGet(query,'regex exclude')

      const condList = []
      if (regex) { condList.push( `SEARCH("${regex}",tag)` ) }
      if (exclude) {
        const excludeList =  exclude.split(',').map(x => `"${x}"`)
        condList.push( `tag NOT IN (${excludeList.join(',')})` )
      }

      const cond = (condList.length) ? `WHERE ${condList.join(' AND ')}` : ''
      console.log({ cond });

      const q = `SELECT DISTINCT tag FROM _info_projs_tags ${cond} ORDER BY tag ASC`

      const p = []
      const tagList = (await dbProc.all(self.dbc, q, p)).map(x => x.tag)
      res.send(tagList)
    }
  }

//@@ jsonSecNew
//  POST
  jsonSecNew () {
    const self = this

    return async (req, res) => {
       const body = req.body
       const data = JSON.parse(body.data)

       const ct = new cyr2trans()

       const { proj, url, title, date, tags } = srvUtil.dictGet(data,'proj url title date tags')

       const { authId, authName, authPlain, prefii } = await self.prj.iiDataFromUrl({ url })

       const secII = ct.transform(title, '_')
                       .toLowerCase()
                       .replace(/[\.,\-]+/g,'_')
                       .substring(0,20)
                       .replace(/[^a-zA-Z0-9_]+/g,'_')

       const secPref = `${date}.${prefii}.${authId}`
       const secPrefRe = secPref.replace(/\./g,'\\.')
       const regex = `^${secPrefRe}\\.(\\d+)\\.(\\S+)$`

       const q = `  SELECT MAX(s) max FROM (
                      SELECT SUB("${regex}",'$1',sec) s FROM projs WHERE SEARCH("${regex}",sec)
                    )
                 `
       const rw = await dbProc.get(self.dbc,q,[])
       const maxStr = rw.max || '0'
       const max = parseInt(maxStr) + 1
       const secFull = `${secPref}.${max}.${secII}`
       const sec = secFull

       const seccmd = 'subsection'
       const parent = date

       await self.prj.secNew({
            sec,

            url, date, tags,
            author_id : authId,
            seccmd, parent, title
       })

       await self.prj.secFsNew({ sec })

       res.send({ sec })
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

//@@ htmlImgSearch
// GET /prj/img/search/html
  htmlImgSearch () {
    const self = this
    return async (req, res) => {
      const forms = self.getConfig({ path : `templates.forms` })
      const formId = 'form_img_search'
      return res.render('img/search', { formId, forms })
    }
  }

//@@ htmlSecNew
// GET /prj/sec/new/html
  htmlSecNew () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const proj = _.get(query, 'proj', self.proj)

      const forms = self.getConfig({ path : `templates.forms` })
      const cnf = self.getConfig({ path : `methods.htmlSecNew` })
      const inputList = _.get(cnf,'inputList',[])

      const title = 'New'
      return res.render('sec/new', { title, forms, inputList })
    }
  }

//@@ htmlCodePiece
  htmlCodePiece () {
    const self = this

    return async (req, res) => {
      const piece = req.params.piece
      return res.render(`include/piece/${piece}`, {})
    }

  }

//@@ htmlCodeTab
  htmlCodeTab () {
    const self = this

    return async (req, res) => {

      const tabId = req.params.tabId
      const forms = self.getConfig({ path : `templates.forms` })
      const tmplEnv = self.tmplEnv

      let html, args = {}, formId
      if (tabId == 'tab_pics_tabs') {
        formId = 'form_pics_upload'
        args = { forms, formId }
      }
      else if (tabId == 'tab_fs') {
        const secFsNewList = await self.prj.getSecFsNewList()
        const secFsNewRows = []
        for(let sec of secFsNewList){
          const row = await self.prj.dbSecData({ sec })
          await self.prj.secRowUpdate({ row })
          secFsNewRows.push(row)
        }
        args = { secFsNewRows }
      }

      html = tmplEnv.render(`include/tab/${tabId}.html`, args)
      return res.status(200).send(html)
    }
  }

//@@ htmlCodeMenu
  htmlCodeMenu () {
    const self = this

    return async (req, res) => {
      const menuId = req.params.menuId

      return res.render(`include/menu/${menuId}`)
    }
  }

//@@ htmlCodeForm
  htmlCodeForm () {
    const self = this

    return async (req, res) => {
      const formId = req.params.formId
      const forms = self.getConfig({ path : `templates.forms` })

      const form = _.get(forms, formId, {})
      const formCols = _.get(form,'cols',[])
      const formRows = _.get(form,'rows',[])

      const formT = `
          {%- import "import/form.html" as form -%}
          {{ form.formRaw(formId, formRows, formCols) }}
      `
      const html = self.tmplEnv.renderString(formT, { formCols, formRows, formId })
      return res.send(html)
    }
  }

//@@ htmlSecView
  htmlSecView () {
    const self = this

    return async (req, res) => {
      const query = req.query

      const sec  = _.get(query, 'sec', '')
      const proj = _.get(query, 'proj', self.proj)

      let m = /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/.exec(sec)
      const sd = await self.prj.dbSecData({ proj, sec })
      if (sd) { await self.prj.secRowUpdate({ row: sd, proj }) }

      if (m) {
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
         return res.render('sec/date.html',{ secRows, header, cols, pageTitle })
      }

      const target = `_buf.${sec}`
      const html = await self.prj.htmlTargetOutput({ proj, target })
      const tmplData = { noScript: true }
      if (html) {
        const $ = cheerio.load(html)
        const htmlBody = $('body').html()
        Object.assign(tmplData, { htmlBody })
      }else{
        Object.assign(tmplData, { noScript: false, secData: sd })
        console.log({ sd })
      }

      return res.render('sec/sec', tmplData)
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
       const rootid = self.rootid

       if (!pics || !pics.length) {
          return res.status(400).send({ 'msg' : 'no input pics!'});
       }

       process.chdir(self.prj.prjRoot)

       var ok = true

       const cbi = function({ code, stdout }){
          if (code) { ok = false }
       }

       for(let pic of pics){
         const url  = _.get(pic, 'url')
         if (!url) { return }

         console.log({ pic });

         await self.prj.secPicImport({ pic, sec, proj, rootid, cbi })
       }

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

