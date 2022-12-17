

const db = require('./../db')
const dbProc = require('./../dbproc')
const md5file = require('md5-file')

const select = db.sql.select

const ImgClass = class {

//@@ new
  constructor(){
    this.dbc = db.img
  }

//@@ dbImgData
  async dbImgData ({ url }) {
    const self = this

    const q_data = select('*')
                .from('imgs')
                .where({ url })
                .toParams({placeholder: '?%d'})

    const rw = await dbProc.get(self.dbc, q_data.text, q_data.values)
    return rw
  }

//@@ dbImgInum
	async dbImgInum ({ url }) {
    const self = this

	  const rw = await self.dbImgData({ url })
	  var inum
	  if (rw) {
	    inum = rw.inum
	  }else{
	    inum = await self.dbImgInumFree()
	  }
	  return inum
	}

//@@ dbImgInumFree
	async dbImgInumFree () {
    const self = this
	
	  const q_inum = select('max(inum) as max').from('imgs').toString()
	  const { max } = await dbProc.get(self.dbc, q_inum)
	  const inum = max ? max+1 : 1

	  return inum
	}

//@@ dbImgStore
	async dbImgStore ({ url }) {
	  const self = this
	
	  const rw = await self.dbImgData({ url })
	  if (rw) {
	    console.log(rw);
	    return
	  }
	
	  const inum = await self.dbImgInumFree()
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

}

module.exports = { ImgClass }
