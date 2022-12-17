// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')


const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const { PrjClass } = require('./PrjClass')

const srvUtil = require('./../srv-util')
const md5file = require('md5-file')

const htmlparser2 = require("htmlparser2");
const parse5 = require("parse5");

const { spawn, execSync } = require('child_process')
const crass = require('crass')

const findit = require('findit')
const yaml = require('js-yaml')
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

// root directory for js files
const jsRoot = path.join(htmlOut,'ctl','js')
// root directory for css files
const cssRoot = path.join(htmlOut,'ctl','css')

const htmlBare = `<!DOCTYPE html>
    <html>
      <head> <title></title>
         <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      </head>
      <body></body>
    </html>`

const defaults = {
   rootid : 'p_sr',
   proj : 'letopis',
   target : ''
}

const prjj = new PrjClass()

//@@ config
const config = {
   proj : defaults.proj,
   rootid : defaults.rootid,
   bld : {
       cols : 'bid buuid plan duration target status'
   },
   ui : {}
}


const rootid = _.get(defaults, 'rootid')

//@@ dbImgStore
const dbImgStore = async ({ url }) => {
  const rw = await dbImgData({ url })
  if (rw) {
    console.log(rw);
    return
  }

  const inum = await dbImgInumFree()
  console.log({ inum });

/*  await srvUtil.fetchImg({ url, local })*/
       //.then((data) => {
             //if(fs.existsSync(local)){
                //var href = bLocal
                //console.log(`done : ${remote}, href: ${href}`);
                //icons_done[remote] = 1

                //$x.removeAttr('href')
                //$x.removeAttr('data-savepage-href')
                //$x.attr({ href })
             //}
        //})
        /*.catch((err) => { console.log(err) })*/


}

//@@ dbImgInum
const dbImgInum = async ({ url }) => {
  const rw = await dbImgData({ url })
  var inum
  if (rw) {
    inum = rw.inum
  }else{
    inum = await dbImgInumFree()
  }
  return inum
}

//@@ dbImgInumFree
const dbImgInumFree = async () => {

  const q_inum = select('max(inum) as max').from('imgs').toString()
  const { max } = await dbProc.get(db.img, q_inum)
  const inum = max ? max+1 : 1
  return inum
}

//@@ dbDocDnumFree
const dbDocDnumFree = async () => {

  const q_dnum = select('max(dnum) as max').from('docs').toString()
  const { max } = await dbProc.get(db.doc, q_dnum)
  const dnum = max ? max+1 : 1
  return dnum
}

//@@ dbDocData
const dbDocData = async ({ url }) => {
  const q_data = select('*')
              .from('docs')
              .where({ url })
              .toParams({placeholder: '?%d'})

  const rw = await dbProc.get(db.doc, q_data.text, q_data.values)
  return rw
}

//@@ dbImgData
const dbImgData = async ({ url }) => {
  const q_data = select('*')
              .from('imgs')
              .where({ url })
              .toParams({placeholder: '?%d'})

  const rw = await dbProc.get(db.img, q_data.text, q_data.values)
  return rw
}

//@@ reqJsonSecCount
const reqJsonSecCount = async (req, res) => {

  const q_count = select('COUNT(*) AS cnt').from('projs').toString()
  //var row = await db.prj.get(q,(err,row) => {} )
     //res.json(row)
  //})
        //
  var data = await dbProc.get(db.prj, q_count, [])
  res.json(data)
}

const dbSecSelect = async (ref={}) => {
  const sec = ref.sec || ''
}

//@@ dbBldData
const dbBldData = async (w={}) => {
  const q = select(`*`)
         .from('builds')
         .where(w)
         .toParams({placeholder: '?%d'})

  const builds = await dbProc.all(db.bld, q.text, q.values)
  return builds
}

//@@ dbAuth
const dbAuth = async ({ author_id, author_ids }) => {

   if (author_ids) {
     const q_auth = select(`*`)
            .from('authors')
            .where(db.sql.in('id', ...author_ids))
            .toParams({placeholder: '?%d'})

     const authors = await dbProc.all(db.auth, q_auth.text, q_auth.values)
     return { authors }

   }else if(author_id){
     const q_auth = select(`*`)
            .from('authors')
            .where({ id : author_id })
            .toParams({placeholder: '?%d'})

     const author = await dbProc.get(db.auth, q_auth.text, q_auth.values)
     return { author }
   }
}

//@@ dbSecList
const dbSecList = async (ref={}) => {
  const proj = _.get(ref, 'proj', defaults.proj)

  var list = []

  return list
}

//@@ dbSecData
const dbSecData = async (ref={}) => {
  const sec = ref.sec || ''
  const proj = ref.proj || defaults.proj

  const q_sec = select('*')
              .from('projs')
              .where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  var secData = await dbProc.get(db.prj, q_sec.text, q_sec.values)
  if (!secData) { return }

  var sec_file = secData.file

  const q_ch = select('sec')
      .from('projs')
      .innerJoin('tree_children')
      .on({ 'projs.file' : 'tree_children.file_child' })
      .where({ 'tree_children.file_parent' : sec_file })
      .toParams({placeholder: '?%d'})

  var rows_ch =  await dbProc.all(db.prj, q_ch.text, q_ch.values)
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

     const rows_info =  await dbProc.all(db.prj, q_info.text, q_info.values)
     secData[bcol] = rows_info.map((x) => { return x[bcol] })
  })
  await Promise.all(p_info)

  const target = `_buf.${sec}`

  const htmlFile = await htmlFileTarget({ proj, target })
  const html  = fs.existsSync(htmlFile) ? 1 : 0

  const pdfFile = await pdfFileTarget({ proj, target })
  const pdf  = fs.existsSync(pdfFile) ? 1 : 0

  var output = { pdf, html }
  secData = { ...secData, output }

  return secData

}

//@@ secTxt
const secTxt = async (ref={}) => {
  //const sec = _.get(ref, 'sec', '')

  const sd = await dbSecData(ref)
  if (!sd) { return }

  const file = sd.file

  const file_path = path.join(prjRoot, file)

  var secTxt = await srvUtil.fsRead(file_path)
  return secTxt

}

//@@ reqJsonTargetData
// GET /prj/target/data
const reqJsonTargetData = async (req, res) => {
  const target = _.get(req, 'query.target', defaults.target)
  const proj = _.get(req, 'query.proj', defaults.proj)

  const htmlFile = await htmlFileTarget({ proj, target })
  const html  = fs.existsSync(htmlFile) ? 1 : 0

  const pdfFile = await pdfFileTarget({ proj, target })
  const pdf  = fs.existsSync(pdfFile) ? 1 : 0

  var output = { html, pdf }
  res.json({ output })

}

//@@ reqJsonSecData
const reqJsonSecData = async (req, res) => {
  const query = req.query

  var data = await prjj.dbSecData(query)

  res.json(data)

}

//@@ reqJsonSecList
// post /prj/sec/list
const reqJsonSecList = async (req, res) => {
  const ref = req.body

  var data = await dbSecList(ref)

  res.json({ data })

}

//@@ reqJsonConfig
// get /prj/config/get
const reqJsonConfig = async (req, res) => {

  res.send(config)
}

//@@ reqJsonBldData
// get /prj/bld/data
const reqJsonBldData = async (req, res) => {
  const query = req.query
  const path = req.path
  const w = {}

  const cols = _.get(config,'bld.cols','').split(/\s+/)
  cols.forEach((col) => {
     if (!query.hasOwnProperty(col)) { return }
     w[col] = _.get(query,col)
     return
  })

  const bldData = await dbBldData(w)

  res.json({ data: bldData })

}

//@@ reqJsonAct
// POST /prj/act
const reqJsonAct = async (req, res) => {
  const act = _.get(req, 'body.act', 'compile')
  const cnf = _.get(req, 'body.cnf', '')

  const target = _.get(req, 'body.target', '')
  const proj = _.get(req, 'body.proj', defaults.proj)

  const stat = await prjAct({ act, proj, cnf, target })

  res.json(stat)

}

//@@ reqJsonSecSrc
const reqJsonSecSrc = async (req, res) => {
  const query = req.query
  const sec = query.sec || ''

  var txt = await secTxt({ sec })

  res.send({ txt })

}

//@@ reqCssFileCtl
// get
const reqCssFileCtl = async (req, res) => {
  const file = req.params[0]

  const cssFile = path.join(cssRoot, file)

  if (fs.existsSync(cssFile)) {
    res.sendFile(cssFile)
  }
}

//@@ reqSecAsset
// get /prj/sec/asset/path
const reqSecAsset = async (req, res) => {
  const asset = req.params[0]

  const query = req.query

  const sec = _.get(query, 'sec', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const sub = 'html'
  const { secDirDone, secDirNew } = await secDirsSaved({ proj, sec, sub })

  var assetFile = ''
  const p_files = [ secDirDone, secDirNew ].map(async (dir) => {
    var ff = []
    const cb_file = ({ found }) => {
       const rel = path.relative(dir, found)

       if (rel != asset ) { return }
       assetFile = found
    }
    await fsFind({ dir, cb_file });
  })
  await Promise.all(p_files)

  if (assetFile) {
    res.sendFile(assetFile)
  }

  //const cssFile = path.join(cssRoot, file)
}

//@@ reqCssFile
// get
const reqCssFile = async (req, res) => {
  const file = req.params[0]

  const target = _.get(req,'query.target',defaults.target)
  const proj   = _.get(req,'query.proj',defaults.proj)

  const htmlFile = await htmlFileTarget({ target, proj })
  const htmlFileDir = path.dirname(htmlFile)

  const cssFile = path.join(htmlFileDir, file)

  if (fs.existsSync(cssFile)) {
    res.sendFile(cssFile)
  }
}


//@@ reqJsFile
// GET /prj/assets/js/(.*)
const reqJsFile = async (req, res) => {
  const file = req.params[0]

  const jsFile = path.join(jsRoot, file)

  if (fs.existsSync(jsFile)) {
    res.sendFile(jsFile)
  }

}

//@@ pdfFileTarget
const pdfFileTarget = async (ref = {}) => {
  const target = _.get(ref, 'target', '')
  const proj   = _.get(ref, 'proj', defaults.proj)

  const pdfDir  = path.join(pdfOut, rootid, proj )
  const pdfFile = path.join(pdfDir, `${proj}.${target}.pdf`)

  return pdfFile
}

//@@ htmlFileTarget
const htmlFileTarget = async (ref = {}) => {
  const target = _.get(ref, 'target', defaults.target)
  const proj   = _.get(ref, 'proj', defaults.proj)

  const htmlDir  = path.join(htmlOut, rootid, proj, target)
  const htmlFile = path.join(htmlDir, 'jnd_ht.html')

  return htmlFile
}

//@@ prjAct
const prjAct = async (ref = {}) => {
   const act = _.get(ref,'act')
   const cnf = _.get(ref,'cnf','')
   const target = _.get(ref,'target','')

   const cnfa = cnf.split(',')
   const do_htlatex = cnfa.includes('htx')

   const proj = _.get(ref,'proj',defaults.proj)

   const sCnf = cnf ? `-c ${cnf}` : ''
   const sTarget = target ? `-t ${target}` : ''

   const bldCmd = `prj-bld ${proj}`

   const target_ext = do_htlatex ? 'html' : 'pdf'
   const m = /^_(buf|auth)\.(.*)$/.exec(target)
   const trg = m ? [ m[1], m[2] ].join('.') : target
   const pln = [ act, target_ext, trg ].join('.')

   const bldData = await dbBldData({ plan : pln, status : 'running' })
   if (bldData.length) {
      var msg = `build is already running: ${pln}`
      console.log({ msg });
      return {}
   }

   const cmd = `${bldCmd} ${act} ${sCnf} ${sTarget}`

   const cmda = cmd.split(/\s+/)
   const exe =  cmda.shift()
   const args = cmda

   process.chdir(prjRoot)

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

//@@ dReMapTarget
const dReMapTarget = ({ key }) => {
  const map = {
     auth : /^_auth\.(?<author_id>\S+)$/g,
     date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
     datePost : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/g,
     sec : /^_buf\.(?<sec>\S+)$/g
  }
  return _.get(map,key)
}

//@@ dReMapSec
const dReMapSec = ({ key }) => {
  const map = {
     date : /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
     datePost : /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/g,
  }
  return _.get(map,key)
}

//@@ domSecTable
const domSecTable = async ({ tableData, $, $tbody, colss }) => {
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

//@@ htmlTargetOutput
const htmlTargetOutput = async (ref = {}) => {
  const target = _.get(ref, 'target', '')
  const proj   = _.get(ref, 'proj', defaults.proj)

  const htmlDir  = path.join(htmlOut, rootid, proj, target)

  const htmlFile = await htmlFileTarget({ target, proj })
  const htmlFileDir = path.dirname(htmlFile)

  const reKeys = ['auth','date']
  const reMap = {
     auth : /^_auth\.(?<author_id>\S+)$/g,
     date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
     sec : /^_buf\.(?<sec>\S+)$/g
  }

  var html, sec, colss, tableHeader

  let $ = cheerio.load(htmlBare)

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

       const secList = await dbProc.all(db.prj, q_sec.text, q_sec.values)
       const secs = secList.map((x,i) => { return x.sec })

       const { author } = await dbAuth({ author_id })
       $('body').append($(`<h1>${author.plain}</h1>`))

       //<link rel="stylesheet" type="text/css" href="/prj/assets/css/main/jnd_ht.css?target=${target}?proj=${proj}">

//@a fill_auth
       const p_auth = secList.map(async (rw) => {
          const ii_sec = rw.sec
          const title = rw.title

          const sd = await dbSecData({ proj, sec : ii_sec })
          const href = `/prj/sec/html?sec=${ii_sec}`
          const hrefPdf = `/prj/sec/html?sec=${ii_sec}&tab=pdf`
          const pdfEx = sd.output.pdf
          const htmlEx = sd.output.html

          const m = dReMapTarget({ key : 'datePost' }).exec(`_buf.${ii_sec}`)
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
       const sd = await dbSecData({ proj, sec })

//@a html_date_children
       if (sd) {
         const children = sd.children

//@a fill_date
         const p_date = children.map(async (child) => {
           const chData = await dbSecData({ sec : child, proj })

           const title = chData.title
           const author_ids = _.get(chData,'author_id',[])

           const href = `/prj/sec/html?sec=${child}`
           const hrefPdf = `/prj/sec/pdf?sec=${child}`
           const pdfEx = chData.output.pdf
           const htmlEx = chData.output.html

           const { authors } = await dbAuth({ author_ids })
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

       domSecTable({
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

       const { code, msg, stdout } = await prjAct({ act, proj, cnf, target })
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
    var rel = path.relative(jsRoot, fpath)
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

//@@ reqHtmlTargetView
const reqHtmlTargetView = async (req, res) => {
  const query = req.query

  const target = _.get(query, 'target', '')
  const proj   = _.get(query, 'proj', defaults.proj)

  const action = _.get(query, 'action', 'render')

  const html = await htmlTargetOutput({ proj, target })
  res.send(html)

}

//@@ reqPdfSecView
const reqPdfSecView = async (req, res) => {
  const query = req.query

  const sec = _.get(query, 'sec', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const target = '_buf.' + sec

  if (!dReMapTarget({ key : 'datePost' }).exec(target)) {
     var msg = 'not a datePost target'
     return res.status(404).send({ msg })
  }

  const pdfFile = await pdfFileTarget({ proj, target })

  const pdfFileEx = fs.existsSync(pdfFile)

  if (!pdfFileEx) {
    const act = 'compile'
    const cnf = ''

    const { code, msg, stdout } = await prjAct({ act, proj, cnf, target })
    if (code) { return res.status(404).send({ msg }) }
  }

  res.sendFile(pdfFile)
}

//@@ prjSecDate
const prjSecDate = async (ref = {}) => {
  const sec =  _.get(ref, 'sec', '')
  const proj = _.get(ref, 'proj', defaults.proj)

  const m = /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/.exec(sec)
  if (!m) { return {} }

  let { day, month, year } = srvUtil.dictGet(m.groups,'day month year')
  //day = Number(day)
  day = day.replace(/^0/,'')
  month = month.replace(/^0/,'')

  return { day, month, year }

}

//@@ fsFind
const fsFind = async ({ dir, cb_file, cb_dir }) => {

  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(dir)) {
       resolve({ msg : `no dir: ${dir}` })
       return
    }

    const finder = findit(dir);

    if (cb_dir) {
      finder.on('directory', function (found, stat, stop) {
        cb_dir({ found, stat, stop })
      })
    }

    if (cb_file) {
      finder.on('file', function (found, stat) {
        cb_file({ found, stat })
      })
    }

    finder.on('end', () => { resolve({}) })
  });
 
}

//@@ secDirsSaved
const secDirsSaved = async (ref={}) => {
  const sec = _.get(ref, 'sec', '')
  const proj = _.get(ref, 'proj', defaults.proj)
  const sub = _.get(ref, 'sub', '')

  const dirNew = path.join(picDataDir, rootid, proj, 'new')
  const dirDone = path.join(picDataDir, rootid, proj, 'done')

  var secDirNew  = path.join(dirNew, sec)
  if (sub) { secDirNew = path.join(secDirNew, sub) }

  const { day, month, year } = await prjSecDate({ proj, sec })

  //let yfile = base#qw#catpath('plg','projs data yaml months.yaml')
  //let map_months = base#yaml#parse_fs({ 'file' : yfile })
  const yFile = path.join(plgDir, 'projs', 'data', 'yaml', 'months.yaml')
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

//@@ htmlFileSecSaved
const htmlFileSecSaved = async (ref = {}) => {
  const sec = _.get(ref, 'sec', '')
  const proj = _.get(ref, 'proj', defaults.proj)

  console.log('[htmlFileSecSaved] start');

  const dirNew = path.join(picDataDir, rootid, proj, 'new')
  const dirDone = path.join(picDataDir, rootid, proj, 'done')

  const secDirNew  = path.join(dirNew, sec)

  const { day, month, year } = await prjSecDate({ proj, sec })

  //let yfile = base#qw#catpath('plg','projs data yaml months.yaml')
  //let map_months = base#yaml#parse_fs({ 'file' : yfile })
  const yFile = path.join(plgDir, 'projs', 'data', 'yaml', 'months.yaml')
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
    await fsFind({ dir, cb_file });
  })
  await Promise.all(p_files)

  const htmlFileEx = fs.existsSync(htmlFile)

  console.log('[htmlFileSecSaved] end');

  return { htmlFile, htmlFileEx }
}


//@@ reqHtmlSecSaved
const reqHtmlSecSaved = async (req, res) => {
  const query = req.query

  const sec = _.get(query, 'sec', '')
  const use = _.get(query, 'use', 'orig')
  const proj = _.get(query, 'proj', defaults.proj)

  const { htmlFile, htmlFileEx } = await htmlFileSecSaved({ proj, sec })
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

//@@ reqHtmlSecView
const reqHtmlSecView = async (req, res) => {
  const query = req.query

  const sec = _.get(query, 'sec', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const target = '_buf.' + sec

  const html = await htmlTargetOutput({ proj, target })
  res.send(html)

  //res.redirect(`/prj/target/html?target=${target}`)
}

//@@ reqHtmlAuthView
const reqHtmlAuthView = async (req, res) => {
  const query = req.query

  const author_id = _.get(query, 'id', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const target = '_auth.' + author_id

  const html = await htmlTargetOutput({ proj, target })
  res.send(html)

  //res.redirect(`/prj/target/html?target=${target}`)
}

const jsonHandlers = {
    reqJsonSecCount,
    reqJsonSecData,
    reqJsonSecList,
    reqJsonSecSrc,
    reqJsonAct,

    reqJsonTargetData,
    reqJsonBldData,
    reqJsonConfig
}

const fsHandlers = {
    reqJsFile,

    reqCssFileCtl,
    reqCssFile,

    reqSecAsset
}

const pdfHandlers = {
    reqPdfSecView
}

const htmlHandlers = {
    reqHtmlSecView,
    reqHtmlSecSaved,
    reqHtmlAuthView,
    reqHtmlTargetView
}

module.exports = {
    ...jsonHandlers,
    ...fsHandlers,
    ...htmlHandlers,
    ...pdfHandlers
}

