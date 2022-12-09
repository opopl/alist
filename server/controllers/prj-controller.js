// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')
const util = require('./../util')

const childProcess = require('child_process')

const cheerio = require("cheerio");
const xregexp = require("xregexp");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const prjRoot  = path.join(process.env.P_SR)

const htmlOut  = path.join(process.env.HTMLOUT)
const pdfOut   = path.join(process.env.PDFOUT)

// root directory for js files
const jsRoot = path.join(htmlOut,'ctl','js')
// root directory for css files
const cssRoot = path.join(htmlOut,'ctl','css')

const reMap = {
   auth : /^_auth\.(?<author_id>\S+)$/g,
   date : /^_buf\.(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
   sec : /^_buf\.(?<sec>\S+)$/g
}


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

  const target = `_buf.${sec}`

  const htmlFile = await htmlFileTarget({ proj, target })
  const html_ex  = fs.existsSync(htmlFile) ? 1 : 0

  const pdfFile = await pdfFileTarget({ proj, target })
  const pdf_ex  = fs.existsSync(pdfFile) ? 1 : 0

  //var output = { html_ex, pdf_ex, htmlFile, pdfFile }
  var output = { html_ex, pdf_ex }
  secData = { ...secData, output }

  return secData

}

//@@ secTxt
const secTxt = async (ref={}) => {
  //const sec = _.get(ref, 'sec', '')

  const data = await dbSecData(ref)
  const file = data.file

  const file_path = path.join(prjRoot, file)

  var secTxt = await util.fsRead(file_path)
  return secTxt

}

//@@ reqJsonTargetData
// GET /prj/target/data
const reqJsonTargetData = async (req, res) => {
  const target = _.get(req, 'query.target', defaults.target)
  const proj = _.get(req, 'query.proj', defaults.proj)

  const htmlFile = await htmlFileTarget({ proj, target })
  const html_ex  = fs.existsSync(htmlFile) ? 1 : 0

  const pdfFile = await pdfFileTarget({ proj, target })
  const pdf_ex  = fs.existsSync(pdfFile) ? 1 : 0

  var data = { html_ex, pdf_ex }
  res.json(data)

}

//@@ reqJsonSecData
const reqJsonSecData = async (req, res) => {
  const query = req.query

  console.log(query);
  var data = await dbSecData(query)

  res.json(data)

}

//@@ reqJsonAct
// POST /prj/act
const reqJsonAct = async (req, res) => {
  const act = _.get(req, 'body.act', 'compile')
  const cnf = _.get(req, 'body.cnf', '')

  const target = _.get(req, 'body.target', '')
  const proj = _.get(req, 'body.proj', defaults.proj)

  const stat = await prjAct({ act, proj, cnf, target })
  console.log(stat);

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

   process.chdir(prjRoot)
   var code = 0, msg

   try {
     childProcess.execSync(cmd, { stdio: 'inherit' })
   } catch(e) {
     console.error(e)
     code = e.status
     msg  = e.message
   }

   const stat = { code, msg }

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

  var html = ''

  while (1) {
     if (!reKeys.length) { break }

     const key = reKeys.shift()
     const re = reMap[key]

     //const m = /^_auth\.(?<author_id>\S+)$/.exec(target)
     const m = re.exec(target)
     if(!m){ continue }

     if (key == 'auth') {
// html_auth
       const author_id = m.groups.author_id
       const q_sec = db.sql.select('sec, title')
           .from('projs')
           .innerJoin('_info_projs_author_id')
           .on({ 'projs.file' : '_info_projs_author_id.file' })
           .where({ '_info_projs_author_id.author_id' : author_id })
           .toParams({placeholder: '?%d'})

       const secData = await dbProc.all(db.prj, q_sec.text, q_sec.values)
       const secs = secData.map((x,i) => { return x.sec })

       //<link rel="stylesheet" type="text/css" href="/prj/assets/css/main/jnd_ht.css?target=${target}?proj=${proj}">

       const $ = cheerio.load(htmlBare)

       secData.map((sd) => {
          const sec = sd.sec
          const title = sd.title
          const href = `/prj/sec/html?sec=${sec}`
          $('body').append($(`<p><a href="${href}">${title}</a>`))
       })

       $('body').append('<script src="/prj/assets/js/dist/bundle.js"></script>')

       html = $.html()

     } else if (key == 'date') {
        const day = m.groups.day
        const month = m.groups.month
        const year = m.groups.year
// html_date
      const m_sec = reMap.sec.exec(target)
      if (!m_sec) { continue }

      const sec = m_sec.groups.sec
      const sd = await dbSecData({ proj, sec })
      if (!sd) { continue }

      const children = sd.children
      const $ = cheerio.load(htmlBare)

      $('body').append($(`<h1>${day}-${month}-${year}</h1>`))

      const promises = children.map(async (child) => {
        const q_sec = db.sql.select('sec, title')
             .from('projs')
             .where({ sec : child, proj })
             .toParams({placeholder: '?%d'})

        const cData = await dbProc.get(db.prj, q_sec.text, q_sec.values)
        const title = cData.title
        const href = `/prj/sec/html?sec=${child}`

        $('body').append($(`<p><a href="${href}">${title}</a>`))
        return true;
      })

      await Promise.all(promises)

      $('body').append('<script src="/prj/assets/js/dist/bundle.js"></script>')

      html = $.html()
     }
  }

  if (!html.length) {
     if (!fs.existsSync(htmlFile)) {
       const act = 'compile'
       const cnf = 'htx'

       console.log('shell');
       const { code, msg } = await prjAct({ act, proj, cnf, target })
       if (code) { return '' }
     }

     if (fs.existsSync(htmlFile)) {
       html = await util.fsRead(htmlFile)
     }
  }

  if (!html.length) { return }

  const $ = cheerio.load(html)

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

    const { code, msg } = await prjAct({ act, proj, cnf, target })
    if (code) { return res.status(404).send({ msg }) }
  }

  res.sendFile(pdfFile)

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
    reqJsonSecSrc,
    reqJsonAct,

    reqJsonTargetData
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
    reqHtmlAuthView,
    reqHtmlTargetView
}

module.exports = {
    ...jsonHandlers,
    ...fsHandlers,
    ...htmlHandlers,
    ...pdfHandlers
}

