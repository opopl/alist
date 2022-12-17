
const _ = require('lodash')
const { spawn, execSync } = require('child_process')

const path = require('path')
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

const { AuthClass } = require('./AuthClass')

const PrjClass = class {
//@@ new
  constructor(ref={}){
     this.dbc = db.prj
     this.dbc_bld = db.bld

     this.initDirs()

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


//@@ dbSecSelect
  async dbSecSelect (ref={})  {
    const self = this
    const sec = ref.sec || ''
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
  async htmlTargetOutput (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', '')
    const proj   = _.get(ref, 'proj', self.proj)

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
         $('body').append($(`<h1>${author.plain}</h1>`))

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

    //const $pane = $('<div></div>')
    //$pane.append($('<input type="text" />'))
    //$('body').prepend($pane)

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

    const $script = $('script')
    $script.each((i, elem) => {
      var src = $(elem).attr('src')
      if (!src) { return }

      var fpath = path.resolve(htmlFileDir,src)
      var rel = path.relative(self.jsRoot, fpath)
      var jsUrl = `/prj/assets/js/${rel}`
      $(elem).attr({ src : jsUrl })
    })

    const $imgs = $('img')
    $imgs.each((i, elem) => {
      var src = $(elem).attr('src')
      if (src) {
         var bn = path.basename(src)
         var inum = bn.replace( /^(?<inum>\d+)\.\w+$/g,'$<inum>')
         $(elem).attr({ 'src' : `/img/raw/${inum}` })
      }
    })

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
