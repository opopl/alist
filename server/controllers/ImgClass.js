

const db = require('./../db')
const dbProc = require('./../dbproc')

const path = require('path')
const fs = require('fs')
const srvUtil = require('./../srv-util')

const md5file = require('md5-file')

const exifReader = require('exifreader')
const imageinfo = require('imageinfo')

const imageDataURI = require('image-data-uri')

const strftime = require('strftime')

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

//@@ _uriData2buf
  _uriData2buf({ uri }){
    const self = this

    if (!uri) { return }

    let buf
    if (Array.isArray(uri)) {
      for(let u of uri){
        const b = self._uriData2buf({ uri : u })
        if (b) {
          buf = buf ? buf : []
          buf.push(b)
        }
      }
    }else{
      try {
        const decode = imageDataURI.decode(uri)
        buf = decode.dataBuffer

      } catch(e) {
        console.error(e)
      }
    }

    return buf
  }

//@@ dbImgData
  async dbImgData (whr={}) {
    const self = this

    const q_data = select('*')
                .from('imgs')
                .where(whr)
                .toParams({placeholder: '?%d'})

    const rw = await dbProc.get(self.dbc, q_data.text, q_data.values)
    if (rw) {
      if (rw.url) { rw.md5_url = srvUtil.md5hex(rw.url) }
    }

    return rw
  }

//@@ dbImgDataAll
  async dbImgDataAll ({ whr, sql }) {
    const self = this

    let q, p = []

    if (!sql) {
      const q_data = select('*')
                  .from('imgs')
                  .where(whr)
                  .toParams({placeholder: '?%d'})
      q = q_data.text
      p = q_data.values
    }else{
      q = sql
    }

    const rows = await dbProc.all(self.dbc, q, p)
    if (rows) {
      //if (rw.url) { rw.md5_url = srvUtil.md5hex(rw.url) }
    }

    return rows
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
  async dbImgStore ({ iUrl, iFile, iBuf,  ...ref } = {}){
    const self = this

    while (1) {
      if (iUrl) {
        await self.dbImgStoreUrl({ iUrl, ...ref })
        break
      }

      if (iFile) {
        await self.dbImgStoreFile({ iFile, ...ref })
        break
      }

      if (iBuf) {
        await self.dbImgStoreBuf({ iBuf, ...ref })
        break
      }

      break
    }

    return self
  }

//@@ dbImgStoreBuf
  async dbImgStoreBuf ({ iBuf, inum, url, ...idb }){
    const self = this

    if(Array.isArray(iBuf)){
      for(let b of iBuf){
         self.dbImgStoreBuf({ iBuf: b, ...idb })
      }
      return self
    }

    const info = imageinfo(iBuf)
    if (!info) { return self }

    inum = inum ? inum : await self.dbImgInumFree()

    const md5 = srvUtil.md5hex(iBuf)

    if (!url) {
      const rw = await self.dbImgData({ md5 })
      if (rw) { return self }
    }

    const mtimeJs = Date.now()
    const mtime = Math.trunc(mtimeJs/1000)
    const mtimeStr = strftime('%d_%m_%y.%H.%M.%S', new Date(mtimeJs))

    url = url ? url : `tm://${mtimeStr}@${md5}`

    const mimeType = info.mimeType
    const format   = info.format

    const ext = format.toLowerCase()

    const { width, height } = srvUtil.dictGet(info,'width height')

    const img =`${inum}.${ext}`
    const local = path.join(self.imgRoot, img)

    const writer = fs.createWriteStream(local)
    writer.write(iBuf)

    //const e = exifReader.load(buf,{expanded: true, includeUnknown: true})

    const size = iBuf.length

    const ins = {
      ...idb,
      url,
      inum, img, ext, width, height,
      md5, size, mtime
    }
    const q = insert('imgs',ins)
                .toParams({placeholder: '?%d'})

    await dbProc.run(self.dbc, q.text, q.values)

    const { tags } = srvUtil.dictGet(idb,'tags')

    if (tags) {
      const tagList = tags.split(',')
                  .filter(x => x.length)
                  .map(tag => { return { tag, url } })

      const qt = insert('_info_imgs_tags', tagList)
                .toParams({placeholder: '?%d'})
      await dbProc.run(self.dbc, qt.text, qt.values)
    }

    return self
  }

//@@ dbImgStoreFile
  async dbImgStoreFile ({ iFile, ...idb }){
    const self = this

    if(Array.isArray(iFile)){
      for(let f of iFile){
         self.dbImgStoreFile({ iFile: f, ...idb })
      }
      return self
    }

    if(!fs.existsSync(iFile)){ return self }

    const iBuf = fs.readFileSync(iFile)
    const name = path.basename(iFile)

    await self.dbImgStoreBuf({ iBuf, name, ...idb })

    return self
  }

//@@ dbImgStoreUrl
  async dbImgStoreUrl ({ iUrl, ...idb }) {
    const self = this

    const rw = await self.dbImgData({ url : iUrl })
    if (rw) { console.log(`[Img] Image already stored: ${iUrl}`); return self }

    const { buf, info, headers } = await srvUtil.fetchImg({ url : iUrl })
    if (!info) { return self }

    await self.dbImgStoreBuf({ iBuf: buf, url: iUrl, ...idb })

    return self
  }

}

module.exports = { ImgClass }
