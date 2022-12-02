// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')
const util = require('./../util')

const cheerio = require("cheerio");

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const prjRoot  = path.join(process.env.P_SR)
const htmlOut  = path.join(process.env.HTMLOUT)

const defaults = {
   rootid : 'p_sr',
   proj : 'letopis'
}

const rootid = _.get(defaults, 'rootid')

//@@ jsonSecCount
const jsonSecCount = async (req, res) => {

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
  const proj = ref.proj || ''

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

//@@ jsonSecData
const jsonSecData = async (req, res) => {
  const query = req.query

  console.log(query);
  var data = await dbSecData(query)
  res.json(data)

}

//@@ jsonSecSrc
const jsonSecSrc = async (req, res) => {
  const query = req.query
  const sec = query.sec || ''

  var txt = await secTxt({ sec })

  res.send({ txt })

}

//@@ jsonSecHtml
const jsonSecHtml = async (req, res) => {
  const query = req.query

  const sec = _.get(query, 'sec', '')
  const proj = _.get(query, 'proj', defaults.proj)

  const target = '_buf.' + sec

  const htmlDir = path.join(htmlOut, rootid, proj, target)
  const htmlFile = path.join(htmlDir, 'jnd_ht.html')

  var html = ''
  if (!fs.existsSync(htmlFile)) {
     process.chdir(prjRoot)

     var act = 'compile'
     var cnf = 'htx'
     var trg = `_buf.${sec}`
     var bldFile = `${proj}.bld.pl`

     var cmd = `${bldFile} ${act} -c ${cnf} -t ${trg}`

  }else{
     html = await util.fsRead(htmlFile)
     const $ = cheerio.load(html)

     //console.log(html)

     const imgs = $('img')
     imgs.each((i, elem) => {
       var src = $(elem).attr('src')
       if (src) {
          var bn = path.basename(src)
          var inum = bn.replace( /^(\d+)\.\w+$/g,'$1')
          $(elem).attr('src',`/img/raw/${inum}`)
          console.log(inum);
       }
       //console.log($(elem).wrap($('<div></div>')).html())
       //console.log($(elem).wrap('<div></div>').html())
       //console.log($(elem).tagName)
     })

     console.log($('<div><a></a></div>').html())
     //await util.fsWrite(htmlFile, $.html() )

     res.send($.html())
     //html = await util.fsRead(htmlFile)
     //console.log({ proj, sec, htmlFile });
     //console.log({ html });
  }

}


module.exports = { 
    jsonSecCount,
    jsonSecData,
    jsonSecSrc,
    jsonSecHtml
}

