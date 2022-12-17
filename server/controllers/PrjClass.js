
const _ = require('lodash')
const { spawn, execSync } = require('child_process')

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const db = require('./../db')
const dbProc = require('./../dbproc')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const PrjClass = class {
//@@ new
  constructor(){
     this.dbc = db.prj

     this.initDirs()

     this.rootid = 'p_sr'
     this.proj = 'letopis'
     this.target = ''
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

    const builds = await dbProc.all(self.dbc, q.text, q.values)
    return builds
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

    var secData = await dbProc.get(this.dbc, q_sec.text, q_sec.values)
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

    const htmlFile = await self.htmlFileTarget({ proj, target })
    const html  = fs.existsSync(htmlFile) ? 1 : 0

    const pdfFile = await self.pdfFileTarget({ proj, target })
    const pdf  = fs.existsSync(pdfFile) ? 1 : 0

    var output = { pdf, html }
    secData = { ...secData, output }

    return secData
  }

//@@ pdfFileTarget
  async pdfFileTarget (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', '')
    const proj   = _.get(ref, 'proj', self.proj)

    const pdfDir  = path.join(self.pdfOut, self.rootid, proj )
    const pdfFile = path.join(pdfDir, `${proj}.${target}.pdf`)

    return pdfFile
  }

//@@ htmlFileTarget
  async htmlFileTarget (ref = {}) {
    const self = this

    const target = _.get(ref, 'target', self.target)
    const proj   = _.get(ref, 'proj', self.proj)

    const htmlDir  = path.join(self.htmlOut, self.rootid, proj, target)
    const htmlFile = path.join(htmlDir, 'jnd_ht.html')

    return htmlFile
  }

//@@ act
  async act (ref = {}) {
     //const self = this

     const act = _.get(ref,'act')
     const cnf = _.get(ref,'cnf','')
     const target = _.get(ref,'target','')

     const cnfa = cnf.split(',')
     const do_htlatex = cnfa.includes('htx')

     const proj = _.get(ref,'proj',this.proj)

     const sCnf = cnf ? `-c ${cnf}` : ''
     const sTarget = target ? `-t ${target}` : ''

     const bldCmd = `prj-bld ${proj}`

     const target_ext = do_htlatex ? 'html' : 'pdf'
     const m = /^_(buf|auth)\.(.*)$/.exec(target)
     const trg = m ? [ m[1], m[2] ].join('.') : target
     const pln = [ act, target_ext, trg ].join('.')

     const bldData = await this.dbBldData({ plan : pln, status : 'running' })
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
}

module.exports = { PrjClass }
