

const db = require('./../db')
const dbProc = require('./../dbproc')

const path = require('path')
const fs = require('fs')
const srvUtil = require('./../srv-util')

const md5file = require('md5-file')
const exifReader = require('exifreader')

const select = db.sql.select
const insert = db.sql.insert
const update = db.sql.update

const ImgClass = class {

//@@ new
  constructor(ref={}){

    this.dbc = db.img
    this.imgRoot  = path.join(process.env.IMG_ROOT)

    Object.assign(this,ref)
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
  async dbImgStore ({
    url,
    url_parent, tags, caption, name,
    proj, sec, rootid,
  }) {
    const self = this

    const rw = await self.dbImgData({ url })
    if (rw) {
      console.log(rw);
      return self
    }

    const inum = await self.dbImgInumFree()

    const { buf, info, headers } = await srvUtil.fetchImg({ url })
    if (!info) { return self }

    const mimeType = info.mimeType
    const format = info.format
    const ext = format.toLowerCase()

    const { width, height } = srvUtil.dictGet(info,'width height')

    const img =`${inum}.${ext}`
    const local = path.join(self.imgRoot, img)

    const writer = fs.createWriteStream(local)
    writer.write(buf)

    //const e = exifReader.load(buf,{expanded: true, includeUnknown: true})

    const md5 = srvUtil.md5hex(buf)
    const size = buf.length
    const mtime = Math.trunc(Date.now()/1000)

    const ins = {
      url, url_parent, tags, caption, name,
      proj, sec, rootid,
      inum, img, ext, width, height,
      md5, size, mtime
    }
    const q = insert('imgs',ins)
                .toParams({placeholder: '?%d'})

    console.log({ ins });

    /*     .then((data) => {*/
             //if(!fs.existsSync(local)){ return }

             //var href = bLocal
          //})
          /*.catch((err) => { console.log(err) })*/

    return self
  }

}

module.exports = { ImgClass }
