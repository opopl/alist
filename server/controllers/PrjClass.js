
const _ = require('lodash')
const { spawn, execSync } = require('child_process')

const path = require('path')
const util = require('util')
const fs = require('fs')
const fse = require('fs-extra')

const cheerio = require("cheerio")
const yaml = require('js-yaml')

const db = require('./../db')
const dbProc = require('./../dbproc')
const srvUtil = require('./../srv-util')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const fsMove = util.promisify(fse.move)
const fsMakePath = util.promisify(fs.mkdir)

const { AuthClass } = require('./AuthClass')
const { ImgClass } = require('./ImgClass')

const PrjClass = class {
//@@ new
  constructor(ref={}){
     this.dbc = db.prj
     this.dbc_bld = db.bld

     this.initDirs()

     this.imgman = new ImgClass()

     this.target = ''
     Object.assign(this, ref)

     //this.rootid = 'p_sr'
     //this.proj = 'letopis'
     console.log({ proj : this.proj });
     console.log({ rootid : this.rootid });

     this.auth = new AuthClass()

     this.htmlBare = `<!DOCTYPE html>
    <html>
      <head> <title></title>
         <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      </head>
      <body></body>
    </html>`
  }

//@@ initDirs
  initDirs () {
     this.prjRoot  = path.join(process.env.P_SR)

     this.htmlOut  = path.join(process.env.HTMLOUT)
     this.pdfOut   = path.join(process.env.PDFOUT)

     this.imgRoot  = path.join(process.env.IMG_ROOT)
     this.docRoot  = path.join(process.env.DOC_ROOT)

     this.jsRoot  = path.join(this.htmlOut,'ctl','js')
     this.cssRoot = path.join(this.htmlOut,'ctl','css')

     this.picDataDir = path.join(process.env.PIC_DATA)
     this.plgDir     = path.join(process.env.PLG)

     return this
  }

//@@ dbBldData
  async dbBldData (w={}) {
    const self = this

    const q = select(`*`)
           .from('builds')
           .where(w)
           .toParams({placeholder: '?%d'})

    const builds = await dbProc.all(self.dbc_bld, q.text, q.values)
    return builds
  }

//@@ secTxt
  async secTxt (ref={}) {
    const self = this

    //const sec = _.get(ref, 'sec', '')

    const sd = await self.dbSecData(ref)
    if (!sd) { return }

    const file = sd.file

    const file_path = path.join(self.prjRoot, file)

    var secTxt = await srvUtil.fsRead(file_path)
    return secTxt
  }

//@@ secDate
  secDate (ref = {})  {
    const self = this

    const sec =  _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)

    const m = /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/.exec(sec)
    if (!m) { return {} }

    let { day, month, year } = srvUtil.dictGet(m.groups,'day month year')
    //day = Number(day)
    day = day.replace(/^0/,'')
    month = month.replace(/^0/,'')

    return { day, month, year }
  }

//@@ dbSecList
  async dbSecList (ref={}) {
    const self = this

    const proj = _.get(ref, 'proj', self.proj)

    var list = []

    return list
  }

//@@ _secNewLines
  _secNewLines({
       seccmd, append, prepend,

       sec, parent, url, author_id, date,
       tags, title,
       keymap, ext
  }){
    const self = this

    append = append ? append : []
    prepend = prepend ? prepend : []

    const labelStr = `\\label{sec:${sec}}`
    const lines = []

    const head = self._secHead({
       sec, parent, url, author_id, date,
       tags, title,
       keymap, ext
    })
    lines.push(...head, ...prepend)

    if (seccmd && title) {
       lines.push('', `\\${seccmd}{${title}}`, labelStr, '')
    }

    lines.push(...append)

    return lines
  }


//@@ _secHead
  _secHead({
     sec, parent, url, author_id, date,
     tags, title,
     keymap, ext
  }){
    const self = this

    ext = ext ? ext : 'tex'

    const head = []
    if (ext == 'tex') {
       if (keymap) {
          head.push(`% vim: keymap=${keymap}`)
       }
       head.push('%%beginhead ')
       head.push(' ')
       head.push(`%%file ${sec || ''}`)
       head.push(`%%parent ${parent || ''}`)
       head.push(' ')
       head.push(`%%url ${url || ''}`)
       head.push(' ')
       head.push(`%%author_id ${author_id || ''}`)
       head.push(`%%date ${date || ''}`)
       head.push(' ')
       head.push(`%%tags ${tags || ''}`)
       head.push(`%%title ${title || ''}`)
       head.push(' ')
       head.push('%%endhead ')
    }

    return head

  }

//@@ _secFilePath
  _secFilePath ({ file }){
     const self = this

     return path.join(self.prjRoot, file)
  }

//@@ _secFile
  _secFile ({ sec, proj, rootid }){
     const self = this

     proj = proj ? proj : self.proj
     rootid = rootid ? rootid : self.rootid
     if (!sec || !proj) { return self }

     const fileA = self._secFileA({ sec, proj, rootid })
     const file = path.join(...fileA)

     return file
  }

//@@ _secFileA
  _secFileA({ sec, proj, rootid }){
     const self = this

     proj = proj ? proj : self.proj
     rootid = rootid ? rootid : self.rootid

     if (!sec || !proj) { return [] }

     const fileA = []

    //my $run_ext = $^O eq 'MSWin32' ? 'bat' : 'sh';
          //
     const extss = 'vim pl zlan sql yml'
     const exts = extss.split(/\s+/)

     var do_break, m
     while(1){

       if (sec == '_main_') {
          fileA.push(`${proj}.tex`)
          break
       }

       if (sec == '_main_htlatex_') {
          fileA.push(`${proj}.main_htlatex.tex`)
          break
       }

       if (sec == '_bib_') {
          fileA.push(`${proj}.refs.bib`)
          break
       }

       exts.forEach((ext) => {
           const extSec = `_${ext}_`
           if (sec == extSec) {
              fileA.push(`${proj}.${ext}`)
              do_break = true
           }
       })
       if (do_break) { break }

       m = /^_bld\.(?<target>.*)$/.exec(sec)
       if (m) {
          fileA.push(`${proj}.bld.${m.groups.target}.yml`)
          break
       }

       m = /^_perl\.(?<sec_pl>.*)$/.exec(sec)
       if (m) {
          fileA.push(`${proj}.${m.groups.sec_pl}.pl`)
          break
       }

       m = /^_pm\.(?<sec_pm>.*)$/.exec(sec)
       if (m) {
          fileA.push('perl', 'lib', 'projs')
          fileA.push(rootid, proj)
          fileA.push(`${m.groups.sec_pm}.pm`)
          break
       }

       fileA.push(`${proj}.${sec}.tex`)
       break
     }

     return fileA
  }


//@@ secNew
  async secNew ({
          sec, parent, rw, append, prepend,
          seccmd, title, url,
          author_id, tags
    }){

    const self = this

    const { proj, rootid } = srvUtil.dictGet(self,'proj rootid')

    const sd = await self.dbSecData({ proj, sec })

    var file, filePath, fileEx
    if (sd) {
      file = _.get(sd,'file')
      filePath = path.join(self.prjRoot, file)
      fileEx = fs.existsSync(filePath)
      if (!rw && fileEx) { return self }
    }

    file = self._secFile({ sec })
    filePath = self._secFilePath({ file })

    const lines = self._secNewLines({
        sec, parent, append, prepend,
    })
    srvUtil.fsWrite(filePath, lines)

    //todo git add

    if (!sd) {
        const ins = {
          sec, file, proj, rootid,
          parent, title, tags, author_id
        }

        const q_ins = insert('projs',ins)
               .toParams({placeholder: '?%d'})

        await dbProc.run(self.dbc, q_ins.text, q_ins.values)
    }

    return self
  }

//@@ dbSecSelect
  async dbSecSelect (ref={})  {
    const self = this
    const sec = ref.sec || ''
  }

//@@ dbSecPicData
  async dbSecPicData ({ proj, sec, where })  {
    const self = this

    if (!proj) { proj = self.proj }

    var picData = []

    const sd = await self.dbSecData({ sec, proj })
    if (!sd) { return }

    const w_tags = where ? _.get(where,'tags',[]) : []

    var child, children
    var iiList = [ sec ]
    while(iiList.length){
       child = iiList.shift()
       const sdc = await self.dbSecData({ proj, sec: child })
       if (!sdc) { continue }

       const q = select('sec, url').from('imgs')
                .where({ proj, sec: child })
                .orderBy('inum')
                .toParams({placeholder: '?%d'})

       const rows = await dbProc.all(self.imgman.dbc, q.text, q.values)
       for(let rw of rows){
          const url = rw.url
          const q_tags = select('tag').from('_info_imgs_tags')
                  .where({ url })
                  .toParams({placeholder: '?%d'})
          const tags_r = await dbProc.all(self.imgman.dbc, q_tags.text, q_tags.values)
          const tags = tags_r.map((x) => { return x.tag })

          var ok = true
          w_tags.map((x) => { ok = ok && tags.includes(x) })
          if (!ok) { continue }

          rw = { ...rw, tags }
          picData.push(rw)
       }

       children = sdc.children
       iiList.push(...children)
    }

    return picData;
  }

//@@ secFsNew
  async secFsNew ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const {
      exNew, exDone,
      secDirNew, secDirDone
    } = self._secFsData({ sec, proj })

    if (exNew) { return self }

    if (!exDone) {
      await fsMakePath(secDirNew,{ recursive : true })

    }else if(!exNew){
      await fsMakePath( path.dirname(secDirNew),{ recursive : true }).then(async() => {
         await fsMove( secDirDone, secDirNew )
      })
    }

    return self
  }

//@@ secFsDone
  async secFsDone ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const {
      exNew, exDone,
      secDirNew, secDirDone
    } = self._secFsData({ sec, proj })

    if (exDone) { return self }

    if (!exNew) {
      await self.secFsNew({ sec, proj })
    }

    await fsMove( secDirNew, secDirDone )

    return self
  }

//@@ _secFsData
  _secFsData ({ sec, proj })  {
    const self = this
    proj = proj ? proj : self.proj

    const { secDirNew, secDirDone } = self.secDirsSaved({ sec, proj })

    const exNew = fs.existsSync(secDirNew)
    const exDone = fs.existsSync(secDirDone)

    return {
      exNew, exDone,
      secDirNew, secDirDone
    }
  }

//@@ dbSecData
  async dbSecData (ref={})  {
    const self = this

    const sec = ref.sec || ''
    const proj = ref.proj || self.proj

    const q_sec = select('*')
                .from('projs')
                .where({ 'sec' : sec })
                .toParams({placeholder: '?%d'})

    var secData = await dbProc.get(self.dbc, q_sec.text, q_sec.values)
    if (!secData) { return }

    var sec_file = secData.file

    const q_ch = select('sec')
        .from('projs')
        .innerJoin('tree_children')
        .on({ 'projs.file' : 'tree_children.file_child' })
        .where({ 'tree_children.file_parent' : sec_file })
        .toParams({placeholder: '?%d'})

    var rows_ch =  await dbProc.all(self.dbc, q_ch.text, q_ch.values)
    var children = []
    rows_ch.map((rw) => { children.push(rw.sec) })

    secData['children'] = children

    const b2info = { tags : 'tag' }
    const bcols = ['author_id','tags']

    const p_info = bcols.map(async (bcol) => {
       const icol = _.get(b2info, bcol, bcol)
       const t_info = `_info_projs_${bcol}`

       const q_info = select(`${t_info}.${icol}`)
                .from('projs')
                .innerJoin(`${t_info}`)
                .on({ 'projs.file' : `${t_info}.file` })
                .where({ 'projs.sec' : sec })
                .toParams({placeholder: '?%d'})

       const rows_info =  await dbProc.all(self.dbc, q_info.text, q_info.values)
       secData[bcol] = rows_info.map((x) => { return x[bcol] })
    })
    await Promise.all(p_info)

    const target = `_buf.${sec}`

    const htmlFile = self.htmlFileTarget({ proj, target })
    const html  = fs.existsSync(htmlFile) ? 1 : 0

    const pdfFile = self.pdfFileTarget({ proj, target })
    const pdf  = fs.existsSync(pdfFile) ? 1 : 0

    var output = { pdf, html }
    secData = { ...secData, output }

    return secData
  }

//@@ secRowUpdate
  async secRowUpdate ({ row, proj }) {
     const self = this

     const sec  = row.sec
     const file = row.file

     proj = proj ? proj : self.proj

     const target = `_buf.${sec}`
     const htmlFile = self.htmlFileTarget({ proj, target })
     const htmlEx  = fs.existsSync(htmlFile) ? 1 : 0
     const pdfFile = self.pdfFileTarget({ proj, target })
     const pdfEx  = fs.existsSync(pdfFile) ? 1 : 0

     row._pdf = {
         href : `/prj/sec/html?sec=${sec}&tab=pdf`,
         target_ext : 'pdf',
         output_ex : pdfEx,
     }
     row._html = {
         href : `/prj/sec/html?sec=${sec}`,
         target_ext : 'html',
         output_ex : htmlEx,
     }

     const qt = ` SELECT tag FROM _info_projs_tags AS it
                  WHERE it.file = ?`

     const qa = ` SELECT author_id FROM _info_projs_author_id AS ia
                  WHERE ia.file = ?`

     const pf = [ row.file ]

     const tags = (await dbProc.all(self.dbc, qt, pf)).map((x) => { return x.tag })
     row.tags = tags || []

     const author_id = (await dbProc.all(self.dbc, qa, pf)).map((x) => { return x.author_id })
     row.author_id = author_id || []

     return self
  }


//@@ act
  async act (ref = {}) {
     const self = this

     const act = _.get(ref,'act')
     const cnf = _.get(ref,'cnf','')
     const target = _.get(ref,'target','')

     const cnfa = cnf.split(',')
     const do_htlatex = cnfa.includes('htx')

     const proj = _.get(ref, 'proj', self.proj)

     const sCnf = cnf ? `-c ${cnf}` : ''
     const sTarget = target ? `-t ${target}` : ''

     const bldCmd = `prj-bld ${proj}`

     const target_ext = do_htlatex ? 'html' : 'pdf'
     const m = /^_(buf|auth)\.(.*)$/.exec(target)
     const trg = m ? [ m[1], m[2] ].join('.') : target
     const pln = [ act, target_ext, trg ].join('.')

     const bldData = await self.dbBldData({ plan : pln, status : 'running' })
     if (bldData.length) {
        var msg = `build is already running: ${pln}`
        console.log({ msg });
        return {}
     }

     const cmd = `${bldCmd} ${act} ${sCnf} ${sTarget}`

     const cmda = cmd.split(/\s+/)
     const exe =  cmda.shift()
     const args = cmda

     process.chdir(this.prjRoot)

     //try {
       ////childProcess.execSync(cmd, { stdio: 'inherit' })
     const opts = {
          //detached : true
     }

     const ff = () =>  {
        return new Promise(async (resolve, reject) => {
          const spawned = spawn(exe, args, opts)
          var stdout = []

          spawned.on('exit', (code) => {
            resolve({ code, stdout })
          })

          for await (const data of spawned.stdout) {
            console.log(`${data}`);
            const a = `${data}`.split('\n')
            a.map((x) => { stdout.push(x) })
          }
        })

       }

     const { code, stdout } = await ff()

     //} catch(e) {
       //console.error(e)
       //code = e.status
       //msg  = e.message
     //}

     const stat = { cmd, code, stdout }

     console.log({ cmd, code });

     return stat
  }

//@@ htmlFileTarget
  htmlFileTarget  (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', self.target)
    const proj   = _.get(ref, 'proj', self.proj)

    const htmlDir  = path.join(self.htmlOut, self.rootid, proj, target)
    const htmlFile = path.join(htmlDir, 'jnd_ht.html')

    return htmlFile
  }

//@@ pdfFileTarget
  pdfFileTarget (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', '')
    const proj   = _.get(ref, 'proj', self.proj)

    const pdfDir  = path.join(self.pdfOut, self.rootid, proj )
    const pdfFile = path.join(pdfDir, `${proj}.${target}.pdf`)

    return pdfFile
  }

//@@ htmlTargetOutput
  async htmlTargetOutput ({ target, proj }) {
    const self = this

    proj = proj ? proj : self.proj

    const htmlDir  = path.join(self.htmlOut, self.rootid, proj, target)

    const htmlFile = self.htmlFileTarget({ target, proj })
    const htmlFileDir = path.dirname(htmlFile)

    const reKeys = ['auth','date']
    const reMap = {
       auth : /^_auth\.(?<author_id>\S+)$/g,
       date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
       sec : /^_buf\.(?<sec>\S+)$/g
    }

    var html, sec, colss, tableHeader

    let $ = cheerio.load(self.htmlBare)

    var override = true

    while (1) {
       if (!reKeys.length) { break }

       const key = reKeys.shift()
       const re = reMap[key]

       //const m = /^_auth\.(?<author_id>\S+)$/.exec(target)
       const m = re.exec(target)
       if(!m){ continue }

       const tableData = []

       const $table = $('<table class="prj-link-table" />')
       const $thead = $('<thead />')
       const $tbody = $('<tbody />')

       $table.append($thead)
       $table.append($tbody)

       if (key == 'auth') {
         tableHeader = 'Num Html Pdf Date Title'
         colss = 'href hrefPdf htmlEx pdfEx title date'

  //@a html_auth
         const author_id = m.groups.author_id
         const q_sec = select('sec, title')
             .from('projs')
             .innerJoin('_info_projs_author_id')
             .on({ 'projs.file' : '_info_projs_author_id.file' })
             .where({ '_info_projs_author_id.author_id' : author_id })
             .toParams({placeholder: '?%d'})

         const secList = await dbProc.all(self.dbc, q_sec.text, q_sec.values)
         const secs = secList.map((x,i) => { return x.sec })

         const { author } = await self.auth.dbAuth({ author_id })

         //<link rel="stylesheet" type="text/css" href="/prj/assets/css/main/jnd_ht.css?target=${target}?proj=${proj}">

  //@a fill_auth
         const p_auth = secList.map(async (rw) => {
            const ii_sec = rw.sec
            const title = rw.title

            const sd = await self.dbSecData({ proj, sec : ii_sec })
            const href = `/prj/sec/html?sec=${ii_sec}`
            const hrefPdf = `/prj/sec/html?sec=${ii_sec}&tab=pdf`
            const pdfEx = sd.output.pdf
            const htmlEx = sd.output.html

            const m = self.dReMapTarget({ key : 'datePost' }).exec(`_buf.${ii_sec}`)
            const date = m ? [ m.groups.day, m.groups.month, m.groups.year ].join('_') : ''

            const row = { sec : ii_sec, date, title, href, hrefPdf, pdfEx, htmlEx }
            tableData.push(row)
         })

         await Promise.all(p_auth)

         $('body').append($(`<h1>${author.plain}</h1>`))

       } else if (key == 'date') {
         tableHeader = 'Num Html Pdf Author Title'
         colss = 'href hrefPdf title authors htmlEx pdfEx'

         const { day, month, year } = srvUtil.dictGet(m.groups,'day month year')

  //@a html_date
         //const day = m.groups.day
         //const month = m.groups.month
         //const year = m.groups.year

         const m_sec = reMap.sec.exec(target)
         if (!m_sec) { continue }

         sec = m_sec.groups.sec
         const sd = await self.dbSecData({ proj, sec })

  //@a html_date_children
         if (sd) {
           const children = sd.children

  //@a fill_date
           const p_date = children.map(async (child) => {
             const chData = await self.dbSecData({ sec : child, proj })

             const title = chData.title
             const author_ids = _.get(chData,'author_id',[])

             const href = `/prj/sec/html?sec=${child}`
             const hrefPdf = `/prj/sec/pdf?sec=${child}`
             const pdfEx = chData.output.pdf
             const htmlEx = chData.output.html

             const { authors } = await self.auth.dbAuth({ author_ids })
             //const authors = rAuth.map((x) => { return x.plain })

             const row = { authors, title, href, hrefPdf, htmlEx, pdfEx }
             tableData.push(row)

             return true;
           })

           await Promise.all(p_date)

           $('body').append($(`<h1>${day}-${month}-${year}</h1>`))
         }

       }else{
         override = false
       }

       if (override) {
         tableHeader.split(/\s+/).map((x) => {
            $thead.append($(`<th>${x}</th>`))
         })

         self.domSecTable({
            $, $tbody, tableData,
            colss,
         })

         $('body').append($table)

         $('body').append('<script src="/prj/assets/js/dist/bundle.js"></script>')
         html = $.html()
       }

    }

    if (!html || !html.length) {
       if (!fs.existsSync(htmlFile)) {
         const act = 'compile'
         const cnf = 'htx'

         const { code, msg, stdout } = await self.act({ act, proj, cnf, target })
         if (code) { return '' }
       }

       if (fs.existsSync(htmlFile)) {
         html = await srvUtil.fsRead(htmlFile)
       }
    }

    if (!html || !html.length) { return }

    $ = cheerio.load(html)

    self.$ = $

    self.domImg()
        .domCss({ htmlFileDir, target, proj })
        .domScript({ htmlFileDir })
        .domLinks()

    html = $.html()
    return html

  }

//@@ dReMapTarget
  dReMapTarget ({ key }) {
    const map = {
       auth : /^_auth\.(?<author_id>\S+)$/g,
       date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
       datePost : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/g,
       sec : /^_buf\.(?<sec>\S+)$/g
    }
    return _.get(map,key)
  }

//@@ domCss
  domCss ({ $, htmlFileDir, target, proj }) {
    const self = this

    $ = $ ? $ : self.$
    proj = proj ? proj : self.proj

    const $css = $('link[type="text/css"]')
    $css.each((i, elem) => {
      var urlCssFs = $(elem).attr('href')

      var fpath = path.resolve(htmlFileDir, urlCssFs)
      if (fs.existsSync(fpath)) {
        var query = `target=${target}&proj=${proj}`
        var urlCss = `/prj/assets/css/main/${urlCssFs}?${query}`
        $(elem).attr({ href : urlCss })
      }
    })

    return self
  }

//@@ domScript
  domScript ({ $, htmlFileDir }) {
    const self = this

    $ = $ ? $ : self.$

    const $script = $('script')
    $script.each((i, elem) => {
      var src = $(elem).attr('src')
      if (!src) { return }

      var fpath = path.resolve(htmlFileDir,src)
      var rel = path.relative(self.jsRoot, fpath)
      var jsUrl = `/prj/assets/js/${rel}`
      $(elem).attr({ src : jsUrl })
    })

    return self
  }


//@@ domImg
  domImg ({ $ } = {}) {
    const self = this

    $ = $ ? $ : self.$

    const $imgs = $('img')
    $imgs.each((i, elem) => {
      const src = $(elem).attr('src')
      const url = $(elem).attr('url')
      if (src) {
         const bn = path.basename(src)
         const inum = bn.replace( /^(?<inum>\d+)\.\w+$/g,'$<inum>')
         if (url) {
            const urlEnc = encodeURIComponent(url)
            $(elem).attr({ 'src' : `/img/raw/url/${urlEnc}` })
         }else{
            $(elem).attr({ 'src' : `/img/raw/${inum}` })
         }
      }
    })

    return self
  }

//@@ domLinks
  domLinks ({ $ } = {}) {
    const self = this

    $ = $ ? $ : self.$

    const $a = $('a')
    $a.each((i, elem) => {
      var href = $(elem).attr('href')
      if (!href) { return }

      const re = /(?<target>[^/\s\t]+)\/jnd_ht\.html$/g
      const m = re.exec(href)
      const target = m ? m.groups.target : ''

      if (!target) { return }

      const re_buf = /^\_buf\.(?<sec>\S+)$/g
      const re_auth = /^\_auth\.(?<auth>\S+)$/g

      const m_buf  = re_buf.exec(target)
      const m_auth = re_auth.exec(target)

      const sec = m_buf ? m_buf.groups.sec : ''
      const author_id = m_auth ? m_auth.groups.auth : ''

      if (sec) {
         $(elem).attr({ 'href' : `/prj/sec/html?sec=${sec}` })

      } else if (author_id){
         $(elem).attr({ 'href' : `/prj/auth/html?id=${author_id}` })
      }

    })

    return self
  }

//@@ domSecTable
  async domSecTable ({ tableData, $, $tbody, colss }) {
    tableData.map((row,i) => {
       const {
           href, hrefPdf,
           date, title, authors,
           htmlEx, pdfEx
       } = srvUtil.dictGet(row, colss)

       const $row = $('<tr/>')

       $row.append($(`<td>${i}</td>`))

       if ((href != undefined) && ( htmlEx != undefined)) {
          var $btn = $(`<button/>`)
              .addClass('prj-link')
              .attr({ output_ex : htmlEx, href })
              .text('HTML')
          $row.append($(`<td/>`).append($btn))
       }

       if (( pdfEx != undefined) && ( hrefPdf != undefined )) {
          var $btn = $(`<button/>`)
              .addClass('prj-link')
              .attr({ output_ex : pdfEx, href : hrefPdf })
              .text('PDF')
          $row.append($(`<td/>`).append($btn))
       }

       if (date != undefined) {
         var $a = $(`<a/>`)
                .addClass('prj-link')
                .attr({ href : `/prj/sec/html?sec=${date}` })
                .text(date)
         $row.append($(`<td/>`).append($a))
       }

       if (authors != undefined) {
         const $cellAuth = $('<td/>')
         if(! authors.length){
         }else if (authors.length == 1) {
            const author = authors.shift()
            const hrefAuthor = `/prj/auth/html?id=${author.id}`
            $cellAuth.append($(`<a href="${hrefAuthor}">${author.plain}</a>`))
         }else{
            const $select = $('<select/>').addClass('prj-link-select')
            while(authors.length){
              const author = authors.shift()
              const hrefAuthor = `/prj/auth/html?id=${author.id}`
              //$select.append($(`<option value="${author.id}">${author.plain}</option>`))
              $select.append($(`
                    <option class="prj-link" full="${author.plain}" value="${author.id}" href=${hrefAuthor}>
                        ${author.plain}
                    </option>`))
            }

            $cellAuth.append($select)
         }

         $row.append($cellAuth)
       }

       $row.append($(`<td><a href="${href}">${title}</a></td>`))

       //const $cell = $('<td/>')
       //$row.append($cell)

       $tbody.append($row)
     })

  }

//@@ htmlFileSecSaved
  async htmlFileSecSaved (ref = {})  {
    const self = this

    const sec = _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)

    console.log('[htmlFileSecSaved] start');

    const dirNew = path.join(self.picDataDir, self.rootid, proj, 'new')
    const dirDone = path.join(self.picDataDir, self.rootid, proj, 'done')

    const secDirNew  = path.join(dirNew, sec)

    const { day, month, year } = self.secDate({ proj, sec })

    //let yfile = base#qw#catpath('plg','projs data yaml months.yaml')
    //let map_months = base#yaml#parse_fs({ 'file' : yfile })
    const yFile = path.join(self.plgDir, 'projs', 'data', 'yaml', 'months.yaml')
    const yFileEx = fs.existsSync(yFile)
    const mapMonths = yFileEx ? yaml.load(fs.readFileSync(yFile)) : {}
    const monthName = _.get(mapMonths,`en.short.${month}`,month)

    var secDirDone = path.join(dirDone, 'secs', sec)
    if (day && monthName && year){
      secDirDone = path.join(dirDone, year, monthName, `${day}`, sec )
    }

    const secDirDoneEx = fs.existsSync(secDirDone)
    const secDirNewEx = fs.existsSync(secDirNew)

    var htmlFile = ''
    const p_files = [ secDirDone, secDirNew ].map(async (dir) => {
      var ff = []
      const cb_file = ({ found }) => {
         const bn = path.basename(found)
         if (bn != 'we.html') { return }
         htmlFile = found
      }
      await srvUtil.fsFind({ dir, cb_file });
    })
    await Promise.all(p_files)

    const htmlFileEx = fs.existsSync(htmlFile)

    console.log('[htmlFileSecSaved] end');

    return { htmlFile, htmlFileEx }
  }

//@@ secDirsSaved
  secDirsSaved (ref={}) {
    const self = this

    const sec = _.get(ref, 'sec', '')
    const proj = _.get(ref, 'proj', self.proj)
    const sub = _.get(ref, 'sub', '')

    const dirNew = path.join(self.picDataDir, self.rootid, proj, 'new')
    const dirDone = path.join(self.picDataDir, self.rootid, proj, 'done')

    var secDirNew  = path.join(dirNew, sec)
    if (sub) { secDirNew = path.join(secDirNew, sub) }

    const { day, month, year } = self.secDate({ proj, sec })

    //let yfile = base#qw#catpath('plg','projs data yaml months.yaml')
    //let map_months = base#yaml#parse_fs({ 'file' : yfile })
    const yFile = path.join(self.plgDir, 'projs', 'data', 'yaml', 'months.yaml')
    const yFileEx = fs.existsSync(yFile)
    const mapMonths = yFileEx ? yaml.load(fs.readFileSync(yFile)) : {}
    const monthName = _.get(mapMonths,`en.short.${month}`,month)

    var secDirDone = path.join(dirDone, 'secs', sec)
    if (day && monthName && year){
      secDirDone = path.join(dirDone, year, monthName, day, sec )
    }

    if (sub) { secDirDone = path.join(secDirDone, sub) }

    return { secDirNew, secDirDone }

  }


}

module.exports = { PrjClass }
