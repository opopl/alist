// Import database
const db = require('./../db')
const dbProc = require('./../dbproc')
const _ = require('lodash')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const { PrjClass } = require('./PrjClass')
const { AuthClass } = require('./AuthClass')

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
const authj = new AuthClass()




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



const dbSecSelect = async (ref={}) => {
  const sec = ref.sec || ''
}



//@@ dbSecList
const dbSecList = async (ref={}) => {
  const proj = _.get(ref, 'proj', defaults.proj)

  var list = []

  return list
}







//@@ reqJsonSecList
// post /prj/sec/list
const reqJsonSecList = async (req, res) => {
  const ref = req.body

  var data = await dbSecList(ref)

  res.json({ data })

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




//@@ reqJsFile
// GET /prj/assets/js/(.*)
const reqJsFile = async (req, res) => {
  const file = req.params[0]

  const jsFile = path.join(jsRoot, file)

  if (fs.existsSync(jsFile)) {
    res.sendFile(jsFile)
  }

}



//@@ dReMapSec
const dReMapSec = ({ key }) => {
  const map = {
     date : /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)$/g,
     datePost : /^(?<day>\d+)_(?<month>\d+)_(?<year>\d+)\.(\S+)$/g,
  }
  return _.get(map,key)
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

  const { day, month, year } = prjj.secDate({ proj, sec })

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

  const { day, month, year } = prjj.secDate({ proj, sec })

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





const jsonHandlers = {
    reqJsonSecList
}

const fsHandlers = {
    reqJsFile,

    reqCssFileCtl,

    reqSecAsset
}

const htmlHandlers = {
    reqHtmlSecSaved,
}

module.exports = {
    ...jsonHandlers,
    ...fsHandlers,
    ...htmlHandlers
}

