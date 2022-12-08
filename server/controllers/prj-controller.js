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

//@@ dbSecData
const dbSecData = async (ref={}) => {
  const sec = ref.sec || ''
  const proj = ref.proj || defaults.proj

  const q_sec = db.sql.select('*')
              .from('projs')
              .where({ 'sec' : sec })
              .toParams({placeholder: '?%d'})

  var secData = await dbProc.get(db.prj, q_sec.text, q_sec.values)
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

  res.status(200)
}

//@@ reqJsonSecSrc
const reqJsonSecSrc = async (req, res) => {
  const query = req.query
  const sec = query.sec || ''

  var txt = await secTxt({ sec })

  res.send({ txt })

}

//@@ reqCssFile
const reqCssFile = async (req, res) => {
  const file = req.params[0]
}

//@@ reqJsFile
// /prj/assets/js/(.*)
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
  const target = _.get(ref, 'target', '')
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
   childProcess.execSync(cmd, { stdio: 'inherit' })

   const stat = {}

   return stat
}


//@@ htmlTargetOutput
const htmlTargetOutput = async (ref = {}) => {
  const target = _.get(ref, 'target', '')
  const proj   = _.get(ref, 'proj', defaults.proj)

  const htmlDir  = path.join(htmlOut, rootid, proj, target)

  const htmlFile = await htmlFileTarget({ target, proj })
  const htmlFileDir = path.dirname(htmlFile)

  var html = ''
  if (!fs.existsSync(htmlFile)) {

     const act = 'compile'
     const cnf = 'htx'

     await prjAct({ act, proj, cnf, target })

  }

  html = await util.fsRead(htmlFile)
  const $ = cheerio.load(html)

  //console.log(html)
        //
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
    reqCssFile
}

const htmlHandlers = {
    reqHtmlSecView,
    reqHtmlAuthView,
    reqHtmlTargetView
}

module.exports = {
    ...jsonHandlers,
    ...fsHandlers,
    ...htmlHandlers
}

