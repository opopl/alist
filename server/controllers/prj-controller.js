// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const select = db.sql.select
const insert = db.sql.insert

const srvUtil = require('./../srv-util')
const md5file = require('md5-file')

const htmlparser2 = require("htmlparser2");
const parse5 = require("parse5");

const { spawn, childProcess } = require('child_process')
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

  const q_count = db.sql.select('COUNT(*) AS cnt').from('projs').toString()
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

//@@ dbAuth
const dbAuth = async ({ author_id, author_ids }) => {

   if (author_ids) {
     const q_auth = db.sql.select(`*`)
            .from('authors')
            .where(db.sql.in('id', ...author_ids))
            .toParams({placeholder: '?%d'})

     const authors = await dbProc.all(db.auth, q_auth.text, q_auth.values)
     return { authors }

   }else if(author_id){
     const q_auth = db.sql.select(`*`)
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

  const q_sec = db.sql.select('*')
              .from('projs')
              .where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  var secData = await dbProc.get(db.prj, q_sec.text, q_sec.values)
  if (!secData) { return }

  var sec_file = secData.file

  const q_ch = db.sql.select('sec')
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

     const q_info = db.sql.select(`${t_info}.${icol}`)
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

  var data = await dbSecData(query)

  res.json(data)

}

//@@ reqJsonSecList
// post /prj/sec/list
const reqJsonSecList = async (req, res) => {
  const ref = req.body

  var data = await dbSecList(ref)

  res.json({ data })

}

//@@ reqJsonBuildData
const reqJsonBuildData = async (req, res) => {
  const query = req.query

  const q_bld = db.sql.select('*')
              .from('builds')
              //.where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  var bldData = await dbProc.all(db.bld, q_bld.text, q_bld.values)

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

   const proj = _.get(ref,'proj',defaults.proj)

   const sCnf = cnf ? `-c ${cnf}` : ''
   const sTarget = target ? `-t ${target}` : ''

   const bldCmd = `prj-bld ${proj}`

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

  var html, sec

  let $ = cheerio.load(htmlBare)

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

//@a html_auth
       const author_id = m.groups.author_id
       const q_sec = db.sql.select('sec, title')
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

       secList.map((sd) => {
          const sec = sd.sec
          const title = sd.title
          const href = `/prj/sec/html?sec=${sec}`
          $('body').append($(`<p><a href="${href}">${title}</a>`))

          const row = { sec, title, href }
          tableData.push(row)
       })

       $('body').append('<script src="/prj/assets/js/dist/bundle.js"></script>')

       html = $.html()

     } else if (key == 'date') {
       const { day, month, year } = srvUtil.dictGet(m.groups,'day month year')

//@a html_date_table_header
       $thead.append($(`<th>Num</th>`))
       $thead.append($(`<th>Html</th>`))
       $thead.append($(`<th>Pdf</th>`))
       $thead.append($(`<th>Author</th>`))
       $thead.append($(`<th>Title</th>`))

//@a html_date
       //const day = m.groups.day
       //const month = m.groups.month
       //const year = m.groups.year

       const m_sec = reMap.sec.exec(target)
       if (!m_sec) { continue }

       sec = m_sec.groups.sec
       const sd = await dbSecData({ proj, sec })

       $('body').append($(`<h1>${day}-${month}-${year}</h1>`))

//@a html_date_children
       if (sd) {
         const children = sd.children

         const promises = children.map(async (child) => {
           const chData = await dbSecData({ sec : child, proj })

           const title = chData.title
           const author_ids = _.get(chData,'author_id',[])

           const href = `/prj/sec/html?sec=${child}`
           const hrefPdf = `/prj/sec/pdf?sec=${child}`

           const { authors } = await dbAuth({ author_ids })
           //const authors = rAuth.map((x) => { return x.plain })

           const pdfEx = chData.output.pdf
           const htmlEx = chData.output.html

           const row = { authors, title, href, hrefPdf, htmlEx, pdfEx }
           tableData.push(row)

           return true;
         })

         await Promise.all(promises)
//@a html_date_table
         tableData.map((row,i) => {
           const {
               href, hrefPdf,
               title, authors,
               htmlEx, pdfEx
           } = srvUtil.dictGet(row,'href hrefPdf title authors htmlEx pdfEx')

           const $row = $('<tr/>')

           $row.append($(`<td>${i}</td>`))
           $row.append($(`<td><button class="prj-link" output_ex="${htmlEx}" href="${href}">HTML</button></td>`))
           $row.append($(`<td><button class="prj-link" output_ex="${pdfEx}" href="${hrefPdf}">PDF</button></td>`))

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
           $row.append($(`<td><a href="${href}">${title}</a></td>`))

           //const $cell = $('<td/>')
           //$row.append($cell)

           $tbody.append($row)
         })

         $('body').append($table)

       }

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

  const pdfFile = await pdfFileTarget({ proj, target })

  if (!fs.existsSync(pdfFile)) {
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

  const { day, month, year } = srvUtil.dictGet(m.groups,'day month year')

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

//@@ htmlFileSecSaved
const htmlFileSecSaved = async (ref = {}) => {
  const sec = _.get(ref, 'sec', '')
  const proj = _.get(ref, 'proj', defaults.proj)

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
    secDirDone = path.join(dirDone, year, monthName, day, sec )
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

  return { htmlFile, htmlFileEx }
}


//@@ reqHtmlSecSaved
const reqHtmlSecSaved = async (req, res) => {
  const query = req.query

  const sec = _.get(query, 'sec', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const { htmlFile, htmlFileEx } = await htmlFileSecSaved({ proj, sec })
  if(!htmlFileEx){
     res.send('<html><body>File not Found<body></html>')
     return
  }

  const htmlFileDir = path.dirname(htmlFile)

  const html = fs.readFileSync(htmlFile)
  const $ = cheerio.load(html)

  //const dom = htmlparser2.parseDocument(html);
  //const dom = parse5.parse(html);

  //res.type('html')

  $('script').remove()
  $('meta').remove()

  const icons_done = {}

  //const els = $('link[rel="icon"]').map( (i, x) => {
  const els = $('link[rel="icon"], link[rel="shortcut icon"]').map( (i, x) => {
     return x
  }).toArray()

//@a p_icons
  const p_icons = els.map( async (x,i) => {
     const $x = $(x)
     const url = $x.attr('data-savepage-href')
     const local = path.join(htmlFileDir, `${i}.ico`)

     if (!url) {return}

     var inum
     const rw = await dbImgData({ url })
     if (rw) {
        inum = rw.inum
        href = `/img/raw/${inum}`

        $x.removeAttr('data-savepage-href')
        $x.attr({ href })
     }else{
     }
  })

  await Promise.all(p_icons)

  const els_style = $('style').map( (i, x) => {
     return x
  }).toArray()

//@a p_style
  const p_style = els_style.map( async (x,i) => {
     const $x = $(x)
     const url = $x.attr('data-savepage-href')

     if (!url) {
        var txt = $x.text()
     }

     var dnum, ext, doc, docFile
     const rw = await dbDocData({ url })
     if (rw) {
        dnum = rw.dnum
        ext = rw.ext
        href = `/doc/raw/${dnum}`

        doc = `${dnum}.${ext}`
        docFile = path.join(docRoot, doc)

        //$x.removeAttr('data-savepage-href')
        $x.text('')
        $x.attr({ src : href })
        return
     }

     dnum = await dbDocDnumFree()
     ext = 'css'
     doc = `${dnum}.${ext}`
     docFile = path.join(docRoot, doc)

     await srvUtil.fetchFile({ url, local : docFile })
       .then(async(data) => {
          if(!fs.existsSync(docFile)){ return }

          console.log(`fetch OK: ${docFile}`);
          const stat = fs.statSync(docFile)
          const size = stat.size
          const mtime = Math.trunc(stat.mtimeMs)
          const md5 = md5file.sync(docFile)

//@a current
          const ins = { dnum, url, ext, size, mtime, md5 }
          const q_i = insert('docs',ins).toParams({placeholder: '?%d'})

          await dbProc.run(db.doc, q_i.text, q_i.values)

        })
        .catch((err) => { console.log(err) })

  })

  await Promise.all(p_style)

  const htmlSend = $.html()
  const htmlFileSend = path.join(htmlFileDir, 'send.html')
  fs.writeFileSync(htmlFileSend, htmlSend)
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
    reqJsonBuildData
}

const fsHandlers = {
    reqJsFile,

    reqCssFileCtl,
    reqCssFile
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

