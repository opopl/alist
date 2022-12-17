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


const jsonHandlers = {
    reqJsonSecList
}

const fsHandlers = {
    reqJsFile,
    reqCssFileCtl,
}


module.exports = {
    ...jsonHandlers,
    ...fsHandlers
}

