
const _ = require('lodash')
const { spawn, execSync } = require('child_process')



const picDataDir   = path.join(process.env.PIC_DATA)
const plgDir   = path.join(process.env.PLG)

// root directory for js files
const jsRoot = path.join(htmlOut,'ctl','js')
// root directory for css files
const cssRoot = path.join(htmlOut,'ctl','css')


const PrjClass = class {
  constructor(){
		 this.prjRoot  = path.join(process.env.P_SR)
		 this.htmlOut  = path.join(process.env.HTMLOUT)
		 this.pdfOut   = path.join(process.env.PDFOUT)
		 this.imgRoot  = path.join(process.env.IMG_ROOT)
		 this.docRoot  = path.join(process.env.DOC_ROOT)
	}

//@@ act
  async act (ref = {}) {
		 //const self = this

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
